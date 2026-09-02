import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  makeCacheableSignalKeyStore,
  WASocket
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { handleIncomingMessages } from './handlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DIR = path.resolve(__dirname, '../../auth_info');

let reconnectTimeout: NodeJS.Timeout | null = null;
let currentSocket: WASocket | null = null;

export function getWhatsAppSocket(): WASocket | null {
  return currentSocket;
}

export async function startWhatsAppBot(): Promise<WASocket> {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  let version: [number, number, number] = [2, 3000, 1043857760];
  try {
    const fetched = await fetchLatestBaileysVersion();
    if (fetched?.version) version = fetched.version;
  } catch (e) {}

  const logger = pino({ level: 'silent' });
  const sock = makeWASocket({
    version,
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    browser: Browsers.ubuntu('Chrome'),
    printQRInTerminal: false,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 30000,
  });

  currentSocket = sock;

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('\n===========================================================');
      console.log('       SCAN QR CODE DI BAWAH INI DENGAN WHATSAPP           ');
      console.log('===========================================================\n');
      qrcode.generate(qr, { small: true });
      console.log('\n[PETUNJUK] Buka WhatsApp di HP > Perangkat Tertaut > Tautkan Perangkat.\n');
    }

    if (connection === 'open') {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
      console.log('\n' + '='.repeat(59));
      console.log(' [OK] BOT WHATSAPP SAPA BPS KAB. BANGKA AKTIF & TERHUBUNG! ');
      console.log('='.repeat(59));
      console.log(' [STATUS] Siap menerima dan membalas pesan secara otomatis.');
      console.log(' [TIPS] Coba kirim pesan "halo" atau "menu" ke nomor bot ini.\n');
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error instanceof Boom)
        ? lastDisconnect.error.output.statusCode
        : ((lastDisconnect?.error as any)?.output?.statusCode || (lastDisconnect?.error as any)?.statusCode || 0);

      console.log(`[INFO] Status Koneksi WhatsApp: ${statusCode}. Menyambungkan ulang...`);

      if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
        console.log('[INFO] Sesi login telah keluar. Mereset auth_info...');
        try {
          if (fs.existsSync(AUTH_DIR)) {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          }
        } catch (err) {}
      }

      if (!reconnectTimeout) {
        reconnectTimeout = setTimeout(() => {
          reconnectTimeout = null;
          startWhatsAppBot();
        }, 2500);
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    await handleIncomingMessages(sock, messages);
  });

  return sock;
}
