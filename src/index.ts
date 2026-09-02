import dotenv from 'dotenv';
import { createWebServer } from './web/server.js';
import { startWhatsAppBot } from './bot/whatsapp.js';
import { loadFAQData } from './data/csvLoader.js';

dotenv.config();
const INITIAL_PORT = parseInt(process.env.PORT || '8000', 10);

async function bootstrap() {
  console.clear();
  console.log('===========================================================');
  console.log('    SAPA BPS KAB. BANGKA - UNIFIED TYPESCRIPT BOT & WEB    ');
  console.log('===========================================================\n');

  // 1. Load Data Statistik dari CSV
  const initialData = loadFAQData();
  console.log(`[INFO] Berhasil memuat ${Object.keys(initialData).length} topik data statistik resmi BPS Kab. Bangka.`);

  // 2. Jalankan Express Web Admin & REST API Server dengan port fallback otomatis
  const app = createWebServer();

  function startServer(port: number) {
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`[INFO] Web Admin Control Panel : http://localhost:${port}/admin`);
      console.log(`[INFO] REST API Endpoint       : http://localhost:${port}/api/faqs`);
      console.log(`[INFO] Server aktif di port ${port}...\n`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[WARN] Port ${port} sedang dipakai oleh proses lain. Beralih ke port ${port + 1}...`);
        startServer(port + 1);
      } else {
        console.error('[ERROR SERVER]', err);
      }
    });
  }

  startServer(INITIAL_PORT);

  // 3. Jalankan WhatsApp Baileys Bot
  console.log('[INFO] Memulai konektor WhatsApp Multi-Device...');
  await startWhatsAppBot();
}

bootstrap().catch(err => {
  console.error('[FATAL BOOTSTRAP ERROR]', err);
});
