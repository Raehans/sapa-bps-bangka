import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import { loadFAQData, saveFAQData, CSV_FILE_PATH } from '../data/csvLoader.js';
import { renderAdminHTML } from './adminView.js';
import { processUserMessage } from '../nlp/matcher.js';

export function createWebServer(): express.Express {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 1. Web Admin Dashboard UI
  app.get('/admin', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(renderAdminHTML());
  });

  // 2. REST API: Get All FAQs
  app.get('/api/faqs', (req: Request, res: Response) => {
    const data = loadFAQData();
    const list = Object.entries(data).map(([pertanyaan, jawaban]) => ({
      pertanyaan,
      jawaban
    }));
    res.json(list);
  });

  // 3. REST API: Save / Add / Update FAQ
  app.post('/api/faqs/save', (req: Request, res: Response) => {
    const { pertanyaan, jawaban, old_pertanyaan } = req.body;
    if (!pertanyaan || !jawaban) {
      res.status(400).json({ status: 'error', message: 'Pertanyaan dan jawaban wajib diisi' });
      return;
    }

    const currentData = { ...loadFAQData() };

    if (old_pertanyaan && old_pertanyaan !== pertanyaan && currentData[old_pertanyaan]) {
      delete currentData[old_pertanyaan];
    }

    currentData[pertanyaan.trim()] = jawaban.trim();
    const success = saveFAQData(currentData);

    if (success) {
      res.json({ status: 'success', message: 'Data statistik berhasil disimpan!' });
    } else {
      res.status(500).json({ status: 'error', message: 'Gagal menyimpan ke file data_faq.csv' });
    }
  });

  // 4. REST API: Delete FAQ
  app.post('/api/faqs/delete', (req: Request, res: Response) => {
    const { pertanyaan } = req.body;
    if (!pertanyaan) {
      res.status(400).json({ status: 'error', message: 'Parameter pertanyaan wajib diisi' });
      return;
    }

    const currentData = { ...loadFAQData() };
    if (currentData[pertanyaan]) {
      delete currentData[pertanyaan];
      const success = saveFAQData(currentData);
      if (success) {
        res.json({ status: 'success', message: 'Data berhasil dihapus!' });
        return;
      }
    }
    res.status(404).json({ status: 'error', message: 'Data tidak ditemukan' });
  });

  // 5. REST API: Download data_faq.csv
  app.get('/api/download-csv', (req: Request, res: Response) => {
    if (fs.existsSync(CSV_FILE_PATH)) {
      res.download(CSV_FILE_PATH, 'data_faq_bps_bangka.csv');
    } else {
      res.status(404).json({ status: 'error', message: 'File CSV belum tersedia' });
    }
  });

  // 6. Webhook / Chat API (untuk integrasi external)
  app.post('/chat', async (req: Request, res: Response) => {
    const message = req.body.message || '';
    const reply = await processUserMessage(message);
    res.json({ response: reply });
  });

  app.post('/webhook/whatsapp', async (req: Request, res: Response) => {
    const message = req.body.message || '';
    const reply = await processUserMessage(message);
    res.json({ status: 'success', response: reply });
  });

  // Root redirect to /admin
  app.get('/', (req: Request, res: Response) => {
    res.redirect('/admin');
  });

  return app;
}
