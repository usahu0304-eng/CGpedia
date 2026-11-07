const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);

  // Gemini AI JSON proxy for Web Browser clients
  if (req.method === 'POST' && urlPath === '/api/gemini-generate') {
    let rawBody = '';
    req.on('data', (chunk) => {
      if (rawBody.length < 15 * 1024 * 1024) rawBody += chunk;
    });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(rawBody || '{}');
        const promptText = String(payload.promptText || '').trim();
        const base64Image = String(payload.base64Image || '').trim();
        const apiKey = String(process.env.GEMINI_API_KEY || '').trim();
        if (!apiKey || !promptText) {
          res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: 'GEMINI_API_KEY not configured on server' }));
          return;
        }
        const parts = [];
        if (base64Image) {
          const cleanB64 = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;
          const mimeMatch = base64Image.match(/^data:([^;]+);base64,/);
          parts.push({
            inlineData: {
              mimeType: (mimeMatch && mimeMatch[1]) || 'image/jpeg',
              data: cleanB64
            }
          });
        }
        parts.push({ text: promptText });

        const models = ['gemini-2.5-flash', 'gemini-2.0-flash'];
        for (const model of models) {
          try {
            const apiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts }],
                  generationConfig: {
                    responseMimeType: 'application/json',
                    temperature: Number(payload.temperature || 0.65)
                  }
                })
              }
            );
            if (apiRes.ok) {
              const data = await apiRes.json();
              const textOut =
                data &&
                data.candidates &&
                data.candidates[0] &&
                data.candidates[0].content &&
                data.candidates[0].content.parts &&
                data.candidates[0].content.parts[0] &&
                data.candidates[0].content.parts[0].text;
              if (textOut) {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ ok: true, text: textOut }));
                return;
              }
            }
          } catch (_) {}
        }
        res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'Gemini upstream unavailable' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: err.message || 'Bad request' }));
      }
    });
    return;
  }

  const safeRelPath = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const candidatePath = path.join(__dirname, safeRelPath);

  if (
    candidatePath.startsWith(__dirname) &&
    fs.existsSync(candidatePath) &&
    fs.statSync(candidatePath).isFile()
  ) {
    const ext = path.extname(candidatePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    fs.createReadStream(candidatePath).pipe(res);
    return;
  }

  // SPA Fallback to root /index.html
  const indexHtmlPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    fs.createReadStream(indexHtmlPath).pipe(res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
});

server.listen(3000, '0.0.0.0', () => {
  console.log('CGpedia PWA server listening on port 3000');
});
