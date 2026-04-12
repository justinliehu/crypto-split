import { createServer } from 'http';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, 'dist');
const DATA_DIR = join(__dirname, 'data');
const INVITES_DIR = join(DATA_DIR, 'invites');
const SYNC_DIR = join(DATA_DIR, 'sync');
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
  '.apk': 'application/vnd.android.package-archive',
};

mkdirSync(INVITES_DIR, { recursive: true });
mkdirSync(SYNC_DIR, { recursive: true });
const DATA_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Invite helpers ──────────────────────────────────────────────────────────

function saveInvite(id, data) {
  const filePath = join(INVITES_DIR, `${id}.json`);
  const existing = loadInvite(id);
  if (existing && existing.members && data.members) {
    const addrSet = new Set(existing.members.map((m) => (m.address || '').toLowerCase()));
    const merged = [...existing.members];
    for (const m of data.members) {
      if (!addrSet.has((m.address || '').toLowerCase())) {
        merged.push(m);
        addrSet.add((m.address || '').toLowerCase());
      }
    }
    data = { ...data, members: merged };
  }
  writeFileSync(filePath, JSON.stringify({ ...data, _ts: Date.now() }));
}

function loadInvite(id) {
  const filePath = join(INVITES_DIR, `${id}.json`);
  if (!existsSync(filePath)) return null;
  try {
    const inv = JSON.parse(readFileSync(filePath, 'utf8'));
    if (Date.now() - inv._ts > DATA_TTL) { unlinkSync(filePath); return null; }
    return inv;
  } catch { return null; }
}

// ─── Group sync helpers (members + expenses) ────────────────────────────────

function loadSync(groupId) {
  const filePath = join(SYNC_DIR, `${groupId}.json`);
  if (!existsSync(filePath)) return null;
  try {
    const d = JSON.parse(readFileSync(filePath, 'utf8'));
    if (Date.now() - d._ts > DATA_TTL) { unlinkSync(filePath); return null; }
    return d;
  } catch { return null; }
}

function mergeSync(groupId, incoming) {
  const existing = loadSync(groupId) || { members: [], expenses: [] };

  // Merge members by address
  const addrSet = new Set((existing.members || []).map((m) => (m.address || '').toLowerCase()));
  const members = [...(existing.members || [])];
  for (const m of (incoming.members || [])) {
    const addr = (m.address || '').toLowerCase();
    if (addr && !addrSet.has(addr)) {
      members.push(m);
      addrSet.add(addr);
    }
  }

  // Merge expenses by id
  const expIds = new Set((existing.expenses || []).map((e) => e.id));
  const expenses = [...(existing.expenses || [])];
  for (const e of (incoming.expenses || [])) {
    if (e.id && !expIds.has(e.id)) {
      expenses.push(e);
      expIds.add(e.id);
    }
  }

  const merged = {
    id: groupId,
    name: incoming.name || existing.name || '',
    createdBy: incoming.createdBy || existing.createdBy || '',
    members,
    expenses,
    _ts: Date.now(),
  };
  writeFileSync(join(SYNC_DIR, `${groupId}.json`), JSON.stringify(merged));
  return merged;
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────

function cleanExpired() {
  for (const dir of [INVITES_DIR, SYNC_DIR]) {
    try {
      for (const file of readdirSync(dir)) {
        const fp = join(dir, file);
        try {
          const d = JSON.parse(readFileSync(fp, 'utf8'));
          if (Date.now() - d._ts > DATA_TTL) unlinkSync(fp);
        } catch { try { unlinkSync(fp); } catch {} }
      }
    } catch {}
  }
}
setInterval(cleanExpired, 60 * 60 * 1000);

// ─── HTTP helpers ────────────────────────────────────────────────────────────

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

function json(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// ─── Server ──────────────────────────────────────────────────────────────────

createServer(async (req, res) => {
  const rawPath = req.url.split('?')[0];
  cors(res);

  // --- OPTIONS preflight ---
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // --- Debug: list all sync data ---
  if (rawPath === '/api/debug') {
    try {
      const syncFiles = existsSync(SYNC_DIR) ? readdirSync(SYNC_DIR) : [];
      const inviteFiles = existsSync(INVITES_DIR) ? readdirSync(INVITES_DIR) : [];
      const syncData = syncFiles.map((f) => {
        try { return JSON.parse(readFileSync(join(SYNC_DIR, f), 'utf8')); } catch { return null; }
      }).filter(Boolean);
      return json(res, 200, { syncCount: syncFiles.length, inviteCount: inviteFiles.length, syncData });
    } catch (e) { return json(res, 500, { error: String(e) }); }
  }

  // --- API: store invite ---
  if (rawPath === '/api/invite' && req.method === 'POST') {
    const data = await parseBody(req);
    if (!data || !data.id) return json(res, 400, { error: 'missing id' });
    saveInvite(data.id, data);
    return json(res, 200, { ok: true });
  }

  // --- API: get invite ---
  if (rawPath.startsWith('/api/invite/') && req.method === 'GET') {
    const id = rawPath.slice('/api/invite/'.length);
    const inv = loadInvite(id);
    if (!inv) return json(res, 404, { error: 'not found' });
    return json(res, 200, inv);
  }

  // --- API: sync group (POST = push & merge, GET = pull) ---
  if (rawPath.startsWith('/api/sync/')) {
    const groupId = rawPath.slice('/api/sync/'.length);
    if (req.method === 'POST') {
      const data = await parseBody(req);
      if (!data) return json(res, 400, { error: 'invalid body' });
      const merged = mergeSync(groupId, data);
      return json(res, 200, merged);
    }
    if (req.method === 'GET') {
      const data = loadSync(groupId);
      if (!data) return json(res, 404, { error: 'not found' });
      return json(res, 200, data);
    }
  }

  // --- Diagnostic page ---
  if (rawPath === '/diag') {
    res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' });
    res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Diag</title>
<style>body{font-family:monospace;padding:16px;background:#111;color:#eee;font-size:14px}pre{background:#222;padding:12px;border-radius:8px;overflow-x:auto;white-space:pre-wrap}h3{color:#6366f1}.ok{color:#22c55e}.err{color:#ef4444}button{background:#6366f1;color:#fff;border:none;padding:8px 16px;border-radius:6px;margin:4px;cursor:pointer;font-size:14px}</style></head><body>
<h2>CryptoSplit Diagnostics</h2>
<div id="log"></div>
<button onclick="runTest()">Run Full Test</button>
<button onclick="checkLocal()">Check LocalStorage</button>
<button onclick="location.href='/clear'">Clear All</button>
<script>
var L=document.getElementById('log');
function log(msg,cls){L.innerHTML+='<div class="'+(cls||'')+'">'+msg+'</div>';}
function checkLocal(){
  L.innerHTML='';
  var g=JSON.parse(localStorage.getItem('cryptosplit_groups')||'[]');
  log('<h3>LocalStorage Groups ('+g.length+')</h3>');
  g.forEach(function(gr){
    log('<pre>'+JSON.stringify(gr,null,2)+'</pre>');
  });
  var e=JSON.parse(localStorage.getItem('cryptosplit_expenses')||'[]');
  log('<h3>Expenses ('+e.length+')</h3>');
  if(e.length>0)log('<pre>'+JSON.stringify(e,null,2)+'</pre>');
  log('<h3>Service Workers</h3>');
  if('serviceWorker' in navigator){
    navigator.serviceWorker.getRegistrations().then(function(r){
      log(r.length===0?'<span class="ok">None (good)</span>':'<span class="err">'+r.length+' registered!</span>');
    });
  }else{log('Not supported');}
  log('<h3>JS Version</h3>');
  var scripts=document.querySelectorAll('script[src]');
  log('Diag page (no app JS loaded)');
  fetch('/').then(r=>r.text()).then(function(html){
    var m=html.match(/index-[^"]+\\.js/);
    log('Server serves: '+(m?m[0]:'unknown'));
  });
}
async function runTest(){
  L.innerHTML='';
  log('<h3>1. Testing /api/sync POST...</h3>');
  try{
    var r=await fetch('/api/sync/diag-test-'+Date.now(),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'DiagTest',members:[{address:'0xDIAG',nickname:'Diag'}],expenses:[]})});
    var d=await r.json();
    log('<span class="ok">POST OK: '+JSON.stringify(d.members)+'</span>');
  }catch(e){log('<span class="err">POST FAILED: '+e.message+'</span>');}

  log('<h3>2. Testing /api/debug...</h3>');
  try{
    var r2=await fetch('/api/debug');
    var d2=await r2.json();
    log('<span class="ok">syncCount='+d2.syncCount+', inviteCount='+d2.inviteCount+'</span>');
    d2.syncData.forEach(function(s){
      log('<pre>Group: '+s.name+' | Members: '+s.members.map(function(m){return m.nickname||m.address}).join(', ')+'</pre>');
    });
  }catch(e){log('<span class="err">DEBUG FAILED: '+e.message+'</span>');}

  log('<h3>3. Checking localStorage...</h3>');
  checkLocal();
}
</script></body></html>`);
    return;
  }

  // --- Cache-busting page: visiting this clears everything ---
  if (rawPath === '/clear') {
    res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' });
    res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Clearing...</title></head><body>
<script>
(async function(){
  if('serviceWorker' in navigator){
    var regs=await navigator.serviceWorker.getRegistrations();
    for(var r of regs) await r.unregister();
  }
  var names=await caches.keys();
  for(var n of names) await caches.delete(n);
  localStorage.clear();
  document.body.innerHTML='<h2 style="text-align:center;margin-top:40vh;font-family:sans-serif">Cache cleared! Redirecting...</h2>';
  setTimeout(function(){location.href='/';},1500);
})();
</script></body></html>`);
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
    // Never cache HTML, SW, or manifest
    if (ext === '.html' || filePath.endsWith('sw.js') || ext === '.webmanifest') {
      headers['Cache-Control'] = 'no-store, no-cache, must-revalidate';
    }
    res.writeHead(200, headers);
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
}).listen(PORT, () => console.log(`Serving on :${PORT}`));
