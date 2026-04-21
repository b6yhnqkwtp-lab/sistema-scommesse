const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const KEY = '6253414071f3108b28ac5e888a0ddd15';
const PORT = process.env.PORT || 3001;
const STORICO_FILE = path.join(__dirname, 'storico.json');

// Leggi storico da file
function leggiStorico() {
  try {
    if (fs.existsSync(STORICO_FILE)) {
      return JSON.parse(fs.readFileSync(STORICO_FILE, 'utf8'));
    }
  } catch(e) { console.log('Errore lettura storico:', e.message); }
  return [];
}

// Scrivi storico su file
function scriviStorico(data) {
  try {
    fs.writeFileSync(STORICO_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch(e) { console.log('Errore scrittura storico:', e.message); return false; }
}

// Leggi body dalla request
function leggiBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch(e) { resolve({}); } });
    req.on('error', reject);
  });
}

http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  const url = req.url.split('?')[0];

  // ── STORICO API ──
  if (url === '/storico' && req.method === 'GET') {
    const s = leggiStorico();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(s));
    return;
  }

  if (url === '/storico' && req.method === 'POST') {
    const body = await leggiBody(req);
    const s = leggiStorico();
    s.unshift(body);
    scriviStorico(s);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (url.startsWith('/storico/') && req.method === 'DELETE') {
    const id = +url.split('/storico/')[1];
    let s = leggiStorico();
    s = s.filter(g => g.id !== id);
    scriviStorico(s);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (url.startsWith('/storico/') && req.method === 'POST') {
    const id = +url.split('/storico/')[1];
    const body = await leggiBody(req);
    let s = leggiStorico();
    s = s.map(g => g.id === id ? Object.assign({}, g, body) : g);
    scriviStorico(s);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // ── SERVE HTML ──
  if (url === '/' || url === '/index.html') {
    const filePath = path.join(__dirname, 'sistema-scommesse.html');
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  // ── PROXY API FOOTBALL ──
  const options = {
    hostname: 'v3.football.api-sports.io',
    path: req.url,
    method: 'GET',
    headers: { 'x-apisports-key': KEY }
  };

  https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
    proxyRes.pipe(res);
  }).on('error', (e) => {
    res.writeHead(500);
    res.end(JSON.stringify({ error: e.message }));
  }).end();

}).listen(PORT, () => {
  console.log('✅ Win System SERVER OK — porta ' + PORT);
});