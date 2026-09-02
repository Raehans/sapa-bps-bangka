export function getFriendlyGreeting(): string {
  const greetings = [
    "Halo! Selamat datang di layanan informasi BPS Kabupaten Bangka 😊 Ada data atau informasi yang bisa saya bantu carikan hari ini?\n\n💡 _Ketik *menu* untuk melihat topik data, atau ketik *petugas* untuk layanan konsultasi langsung._",
    "Halo, Sobat Data! Senang bisa menyapa Anda. Silakan sampaikan apa yang ingin Anda tanyakan seputar data BPS Kabupaten Bangka.\n\n💡 _Ketik *menu* untuk daftar topik data resmi._",
    "Hai! Selamat datang di asisten virtual BPS Kab. Bangka. Ada yang bisa kami bantu terkait data statistik daerah?\n\n💡 _Ketik *menu* untuk pilihan data, atau ketik *petugas* untuk konsultasi._"
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

export function generateDynamicMenu(faqData?: Record<string, string>): string {
  return (
    `📋 *PILIHAN TOPIK DATA BPS KAB. BANGKA*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Berikut beberapa topik informasi yang dapat Anda tanyakan:\n\n` +
    `1️⃣ *Jumlah Penduduk*\n` +
    `2️⃣ *Data Kemiskinan*\n` +
    `3️⃣ *Pertumbuhan Ekonomi*\n` +
    `4️⃣ *Indeks Pembangunan Manusia (IPM)*\n` +
    `5️⃣ *Tenaga Kerja*\n` +
    `6️⃣ *Produk Domestik Regional Bruto (PDRB)*\n` +
    `7️⃣ *Indeks Pembangunan Gender (IPG)*\n` +
    `8️⃣ *Dimensi Pendidikan (RLS & HLS)*\n` +
    `9️⃣ *Apa saja layanan BPS?*\n` +
    `🔟 *Hubungi Petugas PST BPS*\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `💡 _Silakan balas dengan mengetik *Nomor* (misal: *8*), ketik pertanyaan langsung, atau ketik *petugas* untuk layanan PST._`
  );
}

export function formatPrettyResponse(topic: string, content: string): string {
  const cleanContent = content.replace(/<br\s*\/?>/gi, '\n');
  return (
    `📌 *${topic}*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `${cleanContent}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `💡 _Ketik *menu* untuk melihat topik data lainnya, atau ketik *petugas* jika butuh data lanjutan._`
  );
}

export function getFAQByIndex(indexNum: number, faqData: Record<string, string>): { topic: string; answer: string } | null {
  const orderedTopics = [
    "Jumlah Penduduk",
    "Data Kemiskinan",
    "Pertumbuhan Ekonomi",
    "Indeks Pembangunan Manusia (IPM)",
    "Tenaga Kerja",
    "Produk Domestik Regional Bruto (PDRB)",
    "Indeks Pembangunan Gender (IPG)",
    "Dimensi Pendidikan (RLS & HLS)",
    "Apa saja layanan BPS?",
    "Hubungi Petugas PST BPS"
  ];

  if (indexNum >= 1 && indexNum <= orderedTopics.length) {
    const topic = orderedTopics[indexNum - 1];
    if (faqData[topic]) {
      return { topic, answer: faqData[topic] };
    }
  }

  const keys = Object.keys(faqData);
  if (indexNum >= 1 && indexNum <= keys.length) {
    const topic = keys[indexNum - 1];
    return { topic, answer: faqData[topic] };
  }

  return null;
}
