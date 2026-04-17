const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const KEY = '6253414071f3108b28ac5e888a0ddd15';
const PORT = process.env.PORT || 3001;

http.createServer((req, res) => {
  // Servi il file HTML se richiesto
  if (req.url === '/' || req.url === '/index.html') {
    const filePath = path.join(__dirname, 'sistema-scommesse.html');
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  // Proxy API Football
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

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
  console.log('✅ SERVER OK — porta ' + PORT);
});