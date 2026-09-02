import dotenv from 'dotenv';
import { createWebServer } from './web/server.js';
import { loadFAQData } from './data/csvLoader.js';

dotenv.config();
const INITIAL_PORT = parseInt(process.env.PORT || '8000', 10);

console.clear();
console.log('===========================================================');
console.log('   SAPA BPS KAB. BANGKA - [1] SERVER NLP & WEB ADMIN       ');
console.log('===========================================================\n');

const data = loadFAQData();
console.log(`[OK] Mesin NLP aktif dengan ${Object.keys(data).length} topik data statistik resmi.`);

const app = createWebServer();

function startServer(port: number) {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`[INFO] Web Admin Control Panel : http://localhost:${port}/admin`);
    console.log(`[INFO] REST API Endpoint       : http://localhost:${port}/api/faqs`);
    console.log(`[INFO] Status NLP & API        : AKTIF & SIAP MENERIMA REQUEST (Port ${port})\n`);
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
