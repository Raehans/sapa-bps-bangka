import { WASocket, proto, downloadMediaMessage } from '@whiskeysockets/baileys';
import fs from 'fs';
import { CSV_FILE_PATH, INFLASI_REDIRECT_CARD } from '../data/csvLoader.js';
import { processUserMessage } from '../nlp/matcher.js';

export async function handleIncomingMessages(sock: WASocket, messages: any[]) {
  for (const msg of messages) {
    if (!msg.key || msg.key.fromMe) continue;
    if (msg.key.remoteJid === 'status@broadcast') continue;
    const jid = msg.key.remoteJid;
    if (!jid) continue;

    const senderNumber = jid.replace('@s.whatsapp.net', '').replace('@g.us', '');
    const text = msg.message?.conversation
      || msg.message?.extendedTextMessage?.text
      || msg.message?.imageMessage?.caption
      || '';

    const isImage = !!msg.message?.imageMessage;
    let imageBase64: string | undefined = undefined;

    if (isImage) {
      try {
        const buffer = await downloadMediaMessage(msg, 'buffer', {});
        imageBase64 = buffer.toString('base64');
        console.log(`[GAMBAR DITERIMA] Dari: ${senderNumber} | Mengirim ke Qwen2-VL untuk analisis...`);
      } catch (err: any) {
        console.warn('[WARN DOWNLOAD MEDIA]', err?.message);
      }
    }

    if (!text.trim() && !isImage) continue;
    const cleanMsg = text.trim().toLowerCase();

    console.log(`\n[WHATSAPP MASUK] Dari: ${senderNumber} | Pesan: "${text}" ${isImage ? '[Ada Gambar]' : ''}`);

    // 1. Proteksi Mutlak Data Inflasi: Jangan sampai AI berhalusinasi / mengarang data
    const INFLASI_TRIGGERS = ['infla', 'inflasi', 'inflansi', 'ihk', 'indeks harga konsumen', 'laju inflasi', 'defla', 'deflasi'];
    if (INFLASI_TRIGGERS.some(k => cleanMsg.includes(k))) {
      try {
        await sock.sendPresenceUpdate('composing', jid);
        await sock.sendMessage(jid, { text: INFLASI_REDIRECT_CARD }, { quoted: msg });
        console.log(`[INFLASI DIALIHKAN LANGSUNG] -> Mengarahkan ${senderNumber} ke BPS Kota Pangkalpinang.`);
        continue;
      } catch (err: any) {
        console.error('[ERROR KIRIM PESAN INFLASI]', err?.message);
      }
    }

    // 2. Trigger Kirim File CSV Dokumen
    const CSV_TRIGGERS = ['kirim csv', 'file csv', 'download csv', 'unduh csv', 'minta csv', 'csv', 'kirim file', 'download data'];
    if (CSV_TRIGGERS.includes(cleanMsg) && !isImage) {
      try {
        await sock.sendPresenceUpdate('composing', jid);
        if (fs.existsSync(CSV_FILE_PATH)) {
          await sock.sendMessage(jid, {
            document: fs.readFileSync(CSV_FILE_PATH),
            mimetype: 'text/csv',
            fileName: 'data_statistik_bps_bangka.csv',
            caption: '📊 *Berikut File Data Statistik BPS Kab. Bangka (Live CSV).*'
          }, { quoted: msg });
          console.log(`[FILE CSV TERKIRIM] -> Ke: ${senderNumber}`);
          continue;
        }
      } catch (err: any) {
        console.error('[ERROR KIRIM FILE CSV]', err?.message);
      }
    }

    // 3. Balasan Teks / Analisis Gambar Cerdas (Qwen2-VL & NLP)
    try {
      await sock.sendPresenceUpdate('composing', jid);
      const reply = await processUserMessage(text, imageBase64);
      await sock.sendMessage(jid, { text: reply }, { quoted: msg });
      console.log(`[BALASAN TERKIRIM] -> "${reply.substring(0, 80).replace(/\n/g, ' ')}..."`);
    } catch (err: any) {
      console.error('[ERROR KIRIM PESAN]', err?.message);
    }
  }
}


