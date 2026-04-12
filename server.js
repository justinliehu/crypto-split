import { createServer } from 'http';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, 'dist');
const INVITES_DIR = join(__dirname, 'data', 'invites');
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

// File-based invite store, auto-expire after 24h
mkdirSync(INVITES_DIR, { recursive: true });
const INVITE_TTL = 24 * 60 * 60 * 1000;

function saveInvite(id, data) {
  const filePath = join(INVITES_DIR, `${id}.json`);
  writeFileSync(filePath, JSON.stringify({ ...data, _createdAt: Date.now() }));
}

function loadInvite(id) {
  const filePath = join(INVITES_DIR, `${id}.json`);
  if (!existsSync(filePath)) return null;
  try {
    const inv = JSON.parse(readFileSync(filePath, 'utf8'));
    if (Date.now() - inv._createdAt > INVITE_TTL) {
      unlinkSync(filePath);
      return null;
    }
    return inv;
  } catch { return null; }
}

function cleanExpiredInvites() {
  try {
    for (const file of readdirSync(INVITES_DIR)) {
      const filePath = join(INVITES_DIR, file);
      try {
        const inv = JSON.parse(readFileSync(filePath, 'utf8'));
        if (Date.now() - inv._createdAt > INVITE_TTL) unlinkSync(filePath);
      } catch { unlinkSync(filePath); }
    }
  } catch {}
}
setInterval(cleanExpiredInvites, 60 * 60 * 1000);

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); } catch { resolve(null); }
    });
  });
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

createServer(async (req, res) => {
  const rawPath = req.url.split('?')[0];
  cors(res);

  // --- API: store invite ---
  if (rawPath === '/api/invite' && req.method === 'POST') {
    const data = await parseBody(req);
    if (!data || !data.id) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'missing id' }));
      return;
    }
    saveInvite(data.id, data);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // --- API: get invite ---
  if (rawPath.startsWith('/api/invite/') && req.method === 'GET') {
    const id = rawPath.slice('/api/invite/'.length);
    const inv = loadInvite(id);
    if (!inv) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'not found' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(inv));
    return;
  }

  // --- OPTIONS preflight ---
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // --- Static files ---
  let filePath = join(DIST, rawPath === '/' ? 'index.html' : rawPath);

  if (!existsSync(filePath) || !filePath.startsWith(DIST)) {
    const ext = extname(rawPath);
    if (ext && ext !== '.html') {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    filePath = join(DIST, 'index.html');
  }

  try {
    const content = readFileSync(filePath);
    const ext = extname(filePath);
    const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream' };
    // HTML and SW files: never cache — always fetch latest
    if (ext === '.html' || filePath.endsWith('sw.js')) {
      headers['Cache-Control'] = 'no-store, no-cache, must-revalidate';
    }
    res.writeHead(200, headers);
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
}).listen(PORT, () => console.log(`Serving on :${PORT}`));
