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

// In-memory invite store (groupId -> group data), auto-expire after 24h
const invites = new Map();
const INVITE_TTL = 24 * 60 * 60 * 1000;

function cleanExpiredInvites() {
  const now = Date.now();
  for (const [id, inv] of invites) {
    if (now - inv._createdAt > INVITE_TTL) invites.delete(id);
  }
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
    invites.set(data.id, { ...data, _createdAt: Date.now() });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // --- API: get invite ---
  if (rawPath.startsWith('/api/invite/') && req.method === 'GET') {
    const id = rawPath.slice('/api/invite/'.length);
    const inv = invites.get(id);
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
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
}).listen(PORT, () => console.log(`Serving on :${PORT}`));
