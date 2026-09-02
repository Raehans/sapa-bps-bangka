import Fuse from 'fuse.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadFAQData, PST_CONTACT_CARD, INFLASI_REDIRECT_CARD } from '../data/csvLoader.js';
import { getFriendlyGreeting, generateDynamicMenu, formatPrettyResponse, getFAQByIndex } from './menu.js';
import { queryQwenAI } from './llmFallback.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KB_JSON_PATH = path.resolve(__dirname, '../data/kb_bps_bangka_2025.json');

let kbData: any = null;
function loadKBJson(): any {
  if (kbData) return kbData;
  try {
    if (fs.existsSync(KB_JSON_PATH)) {
      kbData = JSON.parse(fs.readFileSync(KB_JSON_PATH, 'utf-8'));
      return kbData;
    }
  } catch (e) {}
  return null;
}

function fmtNum(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(Number(val))) return '-';
  const rounded = Number(val).toFixed(2).replace(/\.00$/, '').replace(/(\.[0-9])0$/, '$1');
  return rounded.replace('.', ',');
}

const LOKASI_ORDERED = [
  { term: "bangka barat", name: "Bangka Barat" },
  { term: "bangka selatan", name: "Bangka Selatan" },
  { term: "bangka tengah", name: "Bangka Tengah" },
  { term: "pangkal pinang", name: "Pangkal Pinang" },
  { term: "pangkalpinang", name: "Pangkal Pinang" },
  { term: "belitung timur", name: "Belitung Timur" },
  { term: "belitung", name: "Belitung" },
  { term: "bangka", name: "Bangka" }
];

function extractLocations(text: string): string[] {
  let remaining = text;
  const result: string[] = [];
  for (const loc of LOKASI_ORDERED) {
    if (remaining.includes(loc.term)) {
      if (!result.includes(loc.name)) {
        result.push(loc.name);
      }
      remaining = remaining.replace(new RegExp(loc.term, 'gi'), ' ');
    }
  }
  return result;
}

function extractYears(text: string): string[] {
  const yearsSet = new Set<string>();
  const rangeMatch = text.match(/\b(202[0-5])\s*(?:sampai|hingga|s\/d|-|to)\s*(202[0-5])\b/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);
    const [minY, maxY] = start <= end ? [start, end] : [end, start];
    for (let y = minY; y <= maxY; y++) {
      yearsSet.add(y.toString());
    }
  }

  const allMatches = text.matchAll(/\b(202[0-5])\b/g);
  for (const m of allMatches) {
    yearsSet.add(m[1]);
  }

  return Array.from(yearsSet).sort();
}

// EKSTRAKSI PRESISI DARI DATABASE RESMI BPS (ZERO HALLUCINATION & TIDAK MELENCENG)
function tryExtractGranularKB(rawMessage: string): string | null {
  const kb = loadKBJson();
  if (!kb) return null;

  const msgLower = rawMessage.toLowerCase();
  const years = extractYears(msgLower);
  const matchedLocations = extractLocations(msgLower);

  // 1. IPG (Indeks Pembangunan Gender)
  if (msgLower.includes('ipg') || msgLower.includes('gender') || msgLower.includes('pembangunan gender')) {
    const ipgData = kb["7"]?.per_tahun;
    if (ipgData) {
      const targetYears = years.length > 0 ? years : ["2020", "2021", "2022", "2023", "2024", "2025"];
      const lines: string[] = [];
      for (const y of targetYears) {
        if (ipgData[y] !== undefined) {
          lines.push(`• *Tahun ${y}:* *${fmtNum(ipgData[y])}*`);
        }
      }
      if (lines.length > 0) {
        let diffNote = '';
        if (targetYears.includes('2024') && targetYears.includes('2025') && ipgData['2024'] && ipgData['2025']) {
          const diff = ipgData['2025'] - ipgData['2024'];
          diffNote = `\n\n💡 *Analisis:* IPG Kab. Bangka tahun 2025 mengalami kenaikan sebesar *${fmtNum(diff)} poin* dibanding tahun 2024.`;
        }
        return formatPrettyResponse(
          `Indeks Pembangunan Gender (IPG) Kab. Bangka (${targetYears.join(' & ')})`,
          `⚖️ *Rincian Data IPG Resmi BPS:*\n\n${lines.join('\n')}${diffNote}\n\n💡 _Catatan: IPG mengukur kesetaraan pencapaian antara perempuan dan laki-laki (skala mendekati 100 menunjukkan kesetaraan gender yang semakin baik)._`
        );
      }
    }
  }

  // 2. IPM (Indeks Pembangunan Manusia)
  if (msgLower.includes('ipm') || msgLower.includes('pembangunan manusia')) {
    const ipmData = kb["4"]?.per_tahun;
    if (ipmData && years.length > 0) {
      const lines: string[] = [];
      for (const y of years) {
        if (ipmData[y]) {
          const uhhVal = ipmData[y].uhh ?? ipmData[y].uhh_tahun;
          const rlsVal = ipmData[y].rls ?? ipmData[y].rls_tahun;
          const hlsVal = ipmData[y].hls ?? ipmData[y].hls_tahun;
          const pengeluaranVal = ipmData[y].pengeluaran_ribu_rp ? (ipmData[y].pengeluaran_ribu_rp * 1000).toLocaleString('id-ID') : '-';

          lines.push(
            `📅 *Tahun ${y}:*\n` +
            `  - Skor IPM: *${fmtNum(ipmData[y].ipm)}*\n` +
            `  - Umur Harapan Hidup (UHH): *${fmtNum(uhhVal)} tahun*\n` +
            `  - Rata-Rata Lama Sekolah (RLS): *${fmtNum(rlsVal)} tahun*\n` +
            `  - Harapan Lama Sekolah (HLS): *${fmtNum(hlsVal)} tahun*\n` +
            `  - Pengeluaran per Kapita: *Rp${pengeluaranVal},- / tahun*`
          );
        }
      }
      if (lines.length > 0) {
        return formatPrettyResponse(
          `Indeks Pembangunan Manusia (IPM) Kab. Bangka (${years.join(' & ')})`,
          `📊 *Rincian Perkembangan IPM:*\n\n${lines.join('\n\n')}`
        );
      }
    }
  }

  // 3. Dimensi Pendidikan (RLS & HLS)
  if (msgLower.includes('pendidikan') || msgLower.includes('sekolah') || msgLower.includes('rls') || msgLower.includes('hls')) {
    const pendData = kb["8"]?.per_tahun;
    if (pendData && years.length > 0) {
      const lines: string[] = [];
      for (const y of years) {
        if (pendData[y]) {
          lines.push(`• *Tahun ${y}:* HLS *${fmtNum(pendData[y].hls_tahun)} tahun* | RLS *${fmtNum(pendData[y].rls_tahun)} tahun*`);
        }
      }
      if (lines.length > 0) {
        return formatPrettyResponse(
          `Dimensi Pendidikan Kab. Bangka (${years.join(' & ')})`,
          `📚 *Rincian Indikator Pendidikan (HLS & RLS):*\n\n${lines.join('\n')}\n\n💡 _RLS = Rata-Rata Lama Sekolah | HLS = Harapan Lama Sekolah._`
        );
      }
    }
  }

  // 4. Ketenagakerjaan (TPT & TPAK)
  if (msgLower.includes('kerja') || msgLower.includes('tenaga') || msgLower.includes('pengangguran') || msgLower.includes('tpt') || msgLower.includes('tpak')) {
    const rawData = kb["5"]?.per_tahun;
    if (rawData && years.length > 0) {
      const isSpecificTPT = msgLower.includes('tpt') || msgLower.includes('pengangguran') || msgLower.includes('nganggur');
      const isSpecificTPAK = msgLower.includes('tpak') || msgLower.includes('angkatan kerja');

      const lines: string[] = [];
      for (const y of years) {
        if (rawData[y]) {
          if (isSpecificTPT && !isSpecificTPAK) {
            lines.push(`• *Tahun ${y}:* TPT *${fmtNum(rawData[y].tpt_persen)}%* (TPAK: ${fmtNum(rawData[y].tpak_persen)}%)`);
          } else if (isSpecificTPAK && !isSpecificTPT) {
            lines.push(`• *Tahun ${y}:* TPAK *${fmtNum(rawData[y].tpak_persen)}%* (TPT: ${fmtNum(rawData[y].tpt_persen)}%)`);
          } else {
            lines.push(`📅 *Tahun ${y}:*\n  - TPAK: *${fmtNum(rawData[y].tpak_persen)}%*\n  - TPT: *${fmtNum(rawData[y].tpt_persen)}%*`);
          }
        }
      }

      if (lines.length > 0) {
        let title = `Data Ketenagakerjaan Kab. Bangka (${years.join(' & ')})`;
        if (isSpecificTPT && !isSpecificTPAK) title = `Tren Tingkat Pengangguran Terbuka (TPT) Kab. Bangka (${years.join(' & ')})`;
        if (isSpecificTPAK && !isSpecificTPT) title = `Tren Tingkat Partisipasi Angkatan Kerja (TPAK) Kab. Bangka (${years.join(' & ')})`;

        let comparisonNote = '';
        if (years.length >= 2 && isSpecificTPT) {
          const firstY = years[0];
          const lastY = years[years.length - 1];
          if (rawData[firstY] && rawData[lastY]) {
            const diff = rawData[lastY].tpt_persen - rawData[firstY].tpt_persen;
            const status = diff < 0 ? `turun sebesar *${fmtNum(Math.abs(diff))}%*` : `naik sebesar *${fmtNum(diff)}%*`;
            comparisonNote = `\n\n💡 *Analisis Tren:* Tingkat Pengangguran Terbuka (TPT) dari tahun ${firstY} ke ${lastY} mengalami ${status}.`;
          }
        }

        return formatPrettyResponse(title, `📊 *Rincian Data yang Anda Minta:*\n\n${lines.join('\n\n')}${comparisonNote}`);
      }
    }
  }

  // 5. Kemiskinan
  if (msgLower.includes('miskin') || msgLower.includes('kemiskinan') || msgLower.includes('garis kemiskinan') || msgLower.includes('p1') || msgLower.includes('p2')) {
    const rawData = kb["2"]?.per_tahun;
    const lokasiData = kb["2"]?.per_lokasi_2025;

    if (matchedLocations.length > 0 && lokasiData) {
      const lines: string[] = [];
      for (const loc of matchedLocations) {
        if (lokasiData[loc] !== undefined) {
          lines.push(`• *${loc}:* *${fmtNum(lokasiData[loc])}%*`);
        }
      }
      if (lines.length > 0) {
        return formatPrettyResponse(
          `Persentase Penduduk Miskin Se-Babel (2025)`,
          `📍 *Data Wilayah yang Anda Minta (Tahun 2025):*\n\n${lines.join('\n')}\n\n💡 _Rata-rata Kab. Bangka berada di angka *4,71%*._`
        );
      }
    }

    if (years.length > 0 && rawData) {
      const lines: string[] = [];
      for (const y of years) {
        if (rawData[y]) {
          lines.push(
            `📅 *Tahun ${y}:*\n` +
            `  - Penduduk Miskin: *${fmtNum(rawData[y].jumlah_ribu_jiwa)} ribu jiwa* (${fmtNum(rawData[y].persentase)}%)\n` +
            `  - Garis Kemiskinan: *Rp${rawData[y].garis_kemiskinan_rp?.toLocaleString('id-ID')}/kapita/bulan*\n` +
            `  - Indeks P1: *${fmtNum(rawData[y].p1)}* | P2: *${fmtNum(rawData[y].p2)}*`
          );
        }
      }
      if (lines.length > 0) {
        return formatPrettyResponse(
          `Data Kemiskinan Kab. Bangka (${years.join(' & ')})`,
          `📊 *Rincian Data Kemiskinan:*\n\n${lines.join('\n\n')}`
        );
      }
    }
  }

  // 6. Pertumbuhan Ekonomi
  if (msgLower.includes('pertumbuhan ekonomi') || msgLower.includes('laju pertumbuhan') || (msgLower.includes('ekonomi') && (years.length > 0 || msgLower.includes('triwulan')))) {
    const rawEko = kb["3"]?.per_tahun;
    const rawTW = kb["3"]?.triwulan_2025;
    const lines: string[] = [];

    if (years.length > 0 && rawEko) {
      for (const y of years) {
        if (rawEko[y] !== undefined) {
          const val = rawEko[y]?.laju_persen !== undefined ? rawEko[y].laju_persen : rawEko[y];
          const ket = rawEko[y]?.keterangan ? ` _(${rawEko[y].keterangan})_` : '';
          lines.push(`• *Tahun ${y}:* *${fmtNum(val)}%*${ket}`);
        }
      }
    }
    if (msgLower.includes('triwulan') || msgLower.includes('tw')) {
      if (rawTW) {
        lines.push(`• *Triwulan I 2025:* *${fmtNum(rawTW["Triwulan I"]?.pertumbuhan_y_on_y_persen)}%*`);
        lines.push(`• *Triwulan II 2025:* *${fmtNum(rawTW["Triwulan II"]?.pertumbuhan_y_on_y_persen)}%*`);
        lines.push(`• *Triwulan III 2025:* *${fmtNum(rawTW["Triwulan III"]?.pertumbuhan_y_on_y_persen)}%*`);
      }
    }
    if (lines.length > 0) {
      return formatPrettyResponse(
        `Laju Pertumbuhan Ekonomi Kab. Bangka`,
        `📈 *Data Pertumbuhan Ekonomi Resmi BPS:*\n\n${lines.join('\n')}\n\n🏭 _Sektor Tertinggi 2024: Informasi & Komunikasi (10,64%), Jasa Pendidikan (10,56%), Jasa Lainnya (8,39%)._`
      );
    }
  }

  // 7. Jumlah Penduduk
  if (msgLower.includes('jumlah penduduk') || msgLower.includes('populasi') || msgLower.includes('total penduduk') || msgLower.includes('banyak penduduk')) {
    const pend = kb["1"];
    if (pend) {
      return formatPrettyResponse(
        `Jumlah Penduduk Kabupaten Bangka`,
        `👥 *Jumlah Penduduk Kabupaten Bangka (Proyeksi 2025):*\n\n• Tercatat sebanyak: *346.069 jiwa*.\n\n📊 *Sumber:* Proyeksi Penduduk 2020-2035 Hasil SP2020 BPS.`
      );
    }
  }

  return null;
}

export function findExactFAQMatch(userMessage: string, faqData: Record<string, string>): string | null {
  const origLower = userMessage.trim().toLowerCase();
  for (const key of Object.keys(faqData)) {
    if (origLower === key.toLowerCase()) {
      return key;
    }
  }
  return null;
}

export async function processUserMessage(rawMessage: string, imageBase64?: string): Promise<string> {
  const message = rawMessage.trim();

  // 1. Gambar / Foto dari WhatsApp -> Ditangani langsung oleh Qwen2-VL Multimodal
  if (imageBase64) {
    const aiVision = await queryQwenAI(message || 'Jelaskan gambar/dokumen ini terkait statistik BPS', imageBase64);
    if (aiVision) {
      return formatPrettyResponse('Analisis Gambar / Dokumen BPS', aiVision);
    }
    return 'Maaf, model AI belum dapat memproses gambar ini. Silakan hubungi petugas PST BPS.';
  }

  if (!message) return 'Mohon sampaikan pertanyaan Anda seputar data statistik BPS.';

  const msgClean = message.toLowerCase();
  const faqData = loadFAQData();

  // 2. PROTEKSI DATA INFLASI / IHK: Dilarang keras halusinasi/mengarang data
  const INFLASI_KEYWORDS = ["infla", "inflasi", "inflansi", "ihk", "indeks harga konsumen", "laju inflasi", "defla", "deflasi"];
  if (INFLASI_KEYWORDS.some(k => msgClean.includes(k))) {
    console.log(`[INFO BLOCKED] Pertanyaan Inflasi terdeteksi: "${message}". Mengalihkan resmi ke BPS Kota Pangkalpinang.`);
    return INFLASI_REDIRECT_CARD;
  }

  // 3. Trigger Kontak Petugas PST Langsung
  const PST_TRIGGERS = ["petugas", "admin", "konsultasi", "pst", "skripsi", "penelitian", "kontak", "kantor", "cs", "telepon", "hubungi", "10"];
  if (PST_TRIGGERS.some(pt => msgClean === pt || msgClean.split(' ').includes(pt))) {
    return PST_CONTACT_CARD;
  }

  // 4. Sapaan Ramah Singkat (Greetings)
  const GREETINGS = ["halo", "hai", "hello", "helo", "hallo", "hay", "p", "assalamualaikum", "selamat pagi", "selamat siang", "selamat sore", "selamat malam", "hi", "tes", "test"];
  if (GREETINGS.includes(msgClean)) {
    return getFriendlyGreeting();
  }

  // 5. Menu Utama
  const MENU_TRIGGERS = ["menu", "bantuan", "help", "info", "daftar", "pilihan", "list", "topik"];
  if (MENU_TRIGGERS.includes(msgClean)) {
    return generateDynamicMenu(faqData);
  }

  // 6. Input Pilihan Nomor Menu (1 - 10)
  if (/^\d+$/.test(msgClean)) {
    const num = parseInt(msgClean, 10);
    const item = getFAQByIndex(num, faqData);
    if (item) {
      return formatPrettyResponse(item.topic, item.answer);
    }
    return `Maaf, pilihan nomor *${num}* belum tersedia.\n\n${generateDynamicMenu(faqData)}`;
  }

  // 7. EKSTRAKSI PRESISI DATABASE UTAMA (ZERO HALLUCINATION & ANTI-MELENCENG UNTUK DATA ANGKA)
  const granularDbResult = tryExtractGranularKB(message);
  if (granularDbResult) {
    console.log(`[DATABASE EXACT MATCH] Mengembalikan data presisi resmi untuk: "${message}"`);
    return granularDbResult;
  }

  // 8. Pencocokan Topik FAQ Langsung
  const exactTopic = findExactFAQMatch(message, faqData);
  if (exactTopic && faqData[exactTopic]) {
    return formatPrettyResponse(exactTopic, faqData[exactTopic]);
  }

  // 9. PERANGKAI KATA AI (QWEN2-VL BIONIC) UNTUK PERTANYAAN RAMAH & PERCAKAPAN UMUM
  console.log(`[AI LANGUAGE POLISHER] Meminta Qwen2-VL merangkai kalimat ramah untuk: "${message}"`);
  const qwenAnswer = await queryQwenAI(message);
  if (qwenAnswer && qwenAnswer.length > 5) {
    if (qwenAnswer.includes('📌') || qwenAnswer.includes('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')) {
      return qwenAnswer;
    }
    return formatPrettyResponse('Informasi Data BPS Kab. Bangka', qwenAnswer);
  }

  return (
    `Mohon maaf, saat ini data untuk pertanyaan *"${message}"* belum dapat ditemukan di sistem kami.\n\n` +
    `💡 _Ketik *menu* untuk melihat daftar topik resmi, atau ketik *petugas* untuk berkonsultasi langsung dengan petugas PST BPS Kab. Bangka._`
  );
}

