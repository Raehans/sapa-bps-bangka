import makeWASocket, { 
  useMultiFileAuthState, 
  DisconnectReason, 
  fetchLatestBaileysVersion,
  Browsers,
  makeCacheableSignalKeyStore 
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import axios from 'axios';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const AUTH_DIR = join(__dirname, 'auth_info');

const NLP_URL = process.env.NLP_URL || 'http://127.0.0.1:8000/webhook/whatsapp';
let isConnected = false;
let reconnectTimeout = null;

async function getAIResponse(sender, message, botNumber) {
  try {
    const res = await axios.post(NLP_URL, {
      sender: sender,
      message: message,
      bot_number: botNumber
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    let answer = res.data.response || 'Maaf, saya tidak bisa menjawab.';
    answer = answer.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '');
    return answer;
  } catch (e) {
    console.error('Error AI:', e.message);
    return 'Maaf, sistem sedang tidak tersedia. Coba lagi nanti.';
  }
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  
  let version = [2, 3000, 1043857760];
  try {
    const fetched = await fetchLatestBaileysVersion();
    if (fetched?.version) version = fetched.version;
  } catch (e) {
  }

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

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.clear();
      console.log('============================================');
      console.log('     BOT WHATSAPP SAPA BPS KAB. BANGKA     ');
      console.log('============================================');
      console.log('  Silakan Scan QR Code ini dengan WhatsApp: ');
      console.log('============================================\n');
      qrcode.generate(qr, { small: true });
    }
    
    if (connection === 'open') {
      isConnected = true;
      if (reconnectTimeout) { clearTimeout(reconnectTimeout); reconnectTimeout = null; }
      console.log('\n[OK] Bot WhatsApp berhasil terhubung! Siap menerima & membalas pesan...\n');
    }
    
    if (connection === 'close') {
      isConnected = false;
      const statusCode = (lastDisconnect?.error instanceof Boom)
        ? lastDisconnect.error.output.statusCode : 0;
      
      console.log(`[INFO] Koneksi terputus (Status: ${statusCode}). Mencoba menghubungkan kembali...`);

      if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
        try {
          if (fs.existsSync(AUTH_DIR)) {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          }
        } catch (err) {}
      }

      if (!reconnectTimeout) {
        reconnectTimeout = setTimeout(() => {
          reconnectTimeout = null;
          startBot();
        }, 3000);
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      if (msg.key.remoteJid === 'status@broadcast') continue;
      const jid = msg.key.remoteJid;
      if (!jid) continue;
      const num = jid.replace('@s.whatsapp.net', '').replace('@g.us', '');
      const text = msg.message?.conversation
        || msg.message?.extendedTextMessage?.text || '';
      if (!text.trim()) continue;
      console.log(`[PESAN MASUK] Dari: ${num} | Pesan: "${text}"`);
      try {
        await sock.sendPresenceUpdate('composing', jid);
        const botNumber = sock.user?.id ? sock.user.id.split(':')[0].replace(/\D/g, '') : '';
        const reply = await getAIResponse(num, text, botNumber);
        await sock.sendMessage(jid, { text: reply }, { quoted: msg });
        console.log(`[BALASAN TERKIRIM] -> "${reply.substring(0, 80)}..."`);
      } catch (err) {
        console.error('[ERROR] Gagal membalas pesan:', err.message);
      }
    }
  });
}

startBot().catch(err => {
  console.error('[FATAL]', err);
  setTimeout(startBot, 5000);
});
