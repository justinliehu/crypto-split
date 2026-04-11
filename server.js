import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, 'dist');
const PORT = process.env.PORT || 8000;

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

createServer((req, res) => {
  const rawPath = req.url.split('?')[0];
  let filePath = join(DIST, rawPath === '/' ? 'index.html' : rawPath);

  // Only apply SPA fallback for navigation requests (HTML), not for assets
  if (!existsSync(filePath) || !filePath.startsWith(DIST)) {
    const ext = extname(rawPath);
    if (ext && ext !== '.html') {
      // Missing asset (JS/CSS/etc.) — return 404 so browser doesn't parse HTML as JS
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    filePath = join(DIST, 'index.html'); // SPA fallback only for routes
  }

  try {
    const content = readFileSync(filePath);
    const ext = extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
}).listen(PORT, () => console.log(`Serving on :${PORT}`));
