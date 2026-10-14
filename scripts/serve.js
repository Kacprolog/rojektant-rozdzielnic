// Minimalny serwer statyczny bez zależności: `node scripts/serve.js [port]`. Słucha tylko na 127.0.0.1.
const http = require('http'),
  fs = require('fs'),
  path = require('path');
const root = path.resolve(__dirname, '..');
const port = +(process.argv[2] || process.env.PORT || 4173);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
};
http
  .createServer((req, res) => {
    let p;
    try {
      p = decodeURIComponent(req.url.split('?')[0]);
    } catch (e) {
      res.writeHead(400);
      return res.end('400');
    } // błędne kodowanie % nie może wywrócić serwera
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(root, p);
    if (file !== root && !file.startsWith(root + path.sep)) {
      res.writeHead(403);
      return res.end();
    } // z separatorem: katalog o tym samym początku nazwy nie przechodzi
    fs.readFile(file, (err, buf) => {
      if (err) {
        res.writeHead(404);
        return res.end('404');
      }
      res.writeHead(200, {
        'Content-Type': types[path.extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      res.end(buf);
    });
  })
  .listen(port, '127.0.0.1', () => console.log(`Projektant Rozdzielnic: http://localhost:${port}`));
