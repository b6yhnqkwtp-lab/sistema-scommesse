const http = require('http');
const https = require('https');
const KEY = '6253414071f3108b28ac5e888a0ddd15';

http.createServer((req, res) => {
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

}).listen(3001, () => {
  console.log('✅ SERVER OK — http://localhost:3001');
  console.log('   Lascia questa finestra aperta e usa l app nel browser');
});