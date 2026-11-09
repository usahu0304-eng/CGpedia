const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg'
};

const COMPRESSIBLE_EXTS = new Set(['.html', '.css', '.js', '.json', '.webmanifest', '.svg']);
const STATIC_ASSET_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.css', '.js', '.woff2', '.ttf', '.mp3', '.wav', '.ogg', '.webmanifest']);

// In-memory cache of raw + gzipped buffers keyed by filePath -> { mtimeMs, raw, gzip, etag }
const responseCache = new Map();

function getCachedFileEntry(filePath, stat) {
  const mtimeMs = stat.mtimeMs;
  const cached = responseCache.get(filePath);
  if (cached && cached.mtimeMs === mtimeMs && cached.size === stat.size) {
    return cached;
  }
  const raw = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const gzip = COMPRESSIBLE_EXTS.has(ext) && raw.length > 256
    ? zlib.gzipSync(raw, { level: zlib.constants.Z_BEST_SPEED })
    : null;
  const etag = `W/"${stat.size.toString(16)}-${Math.floor(mtimeMs).toString(16)}"`;
  const entry = { mtimeMs, size: stat.size, raw, gzip, etag, ext };
  responseCache.set(filePath, entry);
  return entry;
}

function resolveCandidateFilePath(safeRelPath) {
  const candidateRoots = [
    __dirname,
    path.join(__dirname, 'dist'),
    path.join(__dirname, 'public')
  ];
  for (const rootDir of candidateRoots) {
    const candidate = path.join(rootDir, safeRelPath);
    if (!candidate.startsWith(rootDir)) continue;
    try {
      if (fs.existsSync(candidate)) {
        const st = fs.statSync(candidate);
        if (st.isFile()) {
          return { filePath: candidate, stat: st };
        }
      }
    } catch (_) {}
  }
  return null;
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);
  const hasVersionQuery = parsedUrl.searchParams.has('v');

  // Serve the compiled Android APK directly for one-click download
  if (
    pathname === '/CGpedia.apk' ||
    pathname === '/CGpedia-v7.0.apk' ||
    pathname === '/download/CGpedia.apk' ||
    pathname === '/apk' ||
    pathname === '/download-apk'
  ) {
    const apkCandidates = [
      path.join(__dirname, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
      path.join(__dirname, 'CGpedia.apk'),
      path.join(__dirname, 'public', 'CGpedia.apk'),
      path.join(__dirname, 'dist', 'CGpedia.apk')
    ];
    const foundApk = apkCandidates.find((p) => {
      try {
        return fs.existsSync(p) && fs.statSync(p).isFile();
      } catch (_) {
        return false;
      }
    });
    if (foundApk) {
      const stat = fs.statSync(foundApk);
      res.writeHead(200, {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="CGpedia-v7.0.apk"',
        'Content-Length': stat.size,
        'Cache-Control': 'no-cache'
      });
      fs.createReadStream(foundApk).pipe(res);
      return;
    }
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  }

  // Health & status check endpoint
  if (pathname === '/api/status') {
    const body = JSON.stringify({
      app: 'CGpedia Multi-Exam Test Series & CBT Platform',
      version: '6.7.0',
      mode: 'Web & PWA Platform (Compressed + Cached)',
      status: 'online'
    });
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    res.end(body);
    return;
  }

  let relPath = pathname === '/' ? '/index.html' : pathname;
  const safeRelPath = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '').replace(/^[/\\]+/, '');
  const reqExt = path.extname(safeRelPath).toLowerCase();

  let resolved = resolveCandidateFilePath(safeRelPath);

  // SPA fallback ONLY for non-asset navigation routes
  if (!resolved && !STATIC_ASSET_EXTS.has(reqExt)) {
    resolved = resolveCandidateFilePath('index.html');
  }

  if (!resolved) {
    res.writeHead(404, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache'
    });
    res.end('404 Not Found');
    return;
  }

  try {
    const entry = getCachedFileEntry(resolved.filePath, resolved.stat);
    const contentType = MIME_TYPES[entry.ext] || 'application/octet-stream';
    const isHtmlOrSw = entry.ext === '.html' || safeRelPath === 'sw.js';

    const cacheControl = isHtmlOrSw
      ? 'no-cache, must-revalidate'
      : (hasVersionQuery || entry.ext === '.png' || entry.ext === '.jpg' || entry.ext === '.svg' || entry.ext === '.ico' || entry.ext === '.woff2')
        ? 'public, max-age=86400, stale-while-revalidate=604800'
        : 'public, max-age=3600, stale-while-revalidate=86400';

    if (req.headers['if-none-match'] === entry.etag) {
      res.writeHead(304, {
        'ETag': entry.etag,
        'Cache-Control': cacheControl
      });
      res.end();
      return;
    }

    const acceptEncoding = String(req.headers['accept-encoding'] || '');
    const useGzip = Boolean(entry.gzip && acceptEncoding.includes('gzip'));
    const payload = useGzip ? entry.gzip : entry.raw;

    const headers = {
      'Content-Type': contentType,
      'Content-Length': payload.length,
      'Cache-Control': cacheControl,
      'ETag': entry.etag,
      'Vary': 'Accept-Encoding'
    };
    if (useGzip) {
      headers['Content-Encoding'] = 'gzip';
    }

    res.writeHead(200, headers);
    if (req.method === 'HEAD') {
      res.end();
    } else {
      res.end(payload);
    }
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Internal Server Error');
  }
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is already active; CGpedia Web Server is running.`);
    process.exit(0);
  } else {
    console.error('Server error:', err);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`CGpedia Multi-Exam Web Server active on port ${PORT}`);
  console.log(`Web Portal URL : http://localhost:${PORT}/`);
  console.log(`====================================================`);
});
