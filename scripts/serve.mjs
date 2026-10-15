import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const config=JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
const securityHeaders=Object.fromEntries(config.headers[0].headers.map(header=>[header.key,header.value]));
const root = resolve(process.env.SERVE_DIST ? 'dist' : '.');
const types = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.mjs':'text/javascript', '.woff2':'font/woff2', '.svg':'image/svg+xml', '.jpg':'image/jpeg', '.txt':'text/plain' };
createServer(async (req, res) => {
  try {
    const path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if ((!path.startsWith(root + sep) && path !== root) || path.slice(root.length).split(sep).some(part => part.startsWith('.'))) { res.writeHead(403); return res.end(); }
    const file = path === root ? resolve(root, 'index.html') : path;
    const data = await readFile(file);
    res.writeHead(200, { ...securityHeaders, 'Content-Type': types[extname(file)] || 'application/octet-stream' }); res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(3000, '127.0.0.1', () => console.log('Local: http://127.0.0.1:3000'));
