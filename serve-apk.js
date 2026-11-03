const http = require('http');
const fs = require('fs');
const path = require('path');

const APK_PATHS = [
  path.join(__dirname, 'CGpedia.apk'),
  path.join(__dirname, 'public/CGpedia.apk'),
  path.join(__dirname, 'app/build/outputs/apk/debug/app-debug.apk'),
  path.join(__dirname, '.build-outputs/app-debug.apk')
];

function findApkPath() {
  for (const p of APK_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.apk': 'application/vnd.android.package-archive'
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const apkPath = findApkPath();

  // Direct APK Download Routes
  if (
    urlPath === '/CGpedia.apk' ||
    urlPath === '/download/CGpedia.apk' ||
    urlPath === '/public/CGpedia.apk' ||
    urlPath === '/app-debug.apk' ||
    urlPath === '/download'
  ) {
    if (!apkPath) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('APK file not found');
      return;
    }
    const stat = fs.statSync(apkPath);
    res.writeHead(200, {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Length': stat.size,
      'Content-Disposition': 'attachment; filename="CGpedia.apk"',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    fs.createReadStream(apkPath).pipe(res);
    return;
  }

  // Serve root static files (styles.css, app.js, manifest.webmanifest, vercel.json, index.html)
  const safeRelPath = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const candidatePath = path.join(__dirname, safeRelPath);

  if (
    candidatePath.startsWith(__dirname) &&
    fs.existsSync(candidatePath) &&
    fs.statSync(candidatePath).isFile()
  ) {
    const ext = path.extname(candidatePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
    fs.createReadStream(candidatePath).pipe(res);
    return;
  }

  // SPA Fallback to root /index.html (prevents 404 on any route)
  const indexHtmlPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
    fs.createReadStream(indexHtmlPath).pipe(res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
});

server.listen(3000, '0.0.0.0', () => {
  console.log('CGpedia Web & APK server listening on port 3000');
});
