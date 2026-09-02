import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ADMIN_HTML_PATH = path.resolve(__dirname, 'admin.html');

export function renderAdminHTML(): string {
  try {
    if (fs.existsSync(ADMIN_HTML_PATH)) {
      return fs.readFileSync(ADMIN_HTML_PATH, 'utf-8');
    }
  } catch (err) {
    console.error('[ERROR READ ADMIN HTML]', err);
  }
  return '<h1>Admin HTML Not Found</h1>';
}
