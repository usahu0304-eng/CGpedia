const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(__dirname, 'public');
const androidAssetsDir = path.join(__dirname, 'app', 'src', 'main', 'assets');

[
  distDir,
  path.join(distDir, 'assets'),
  publicDir,
  path.join(publicDir, 'assets'),
  androidAssetsDir,
  path.join(androidAssetsDir, 'assets')
].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Clean up any old APK artifacts if present
['CGpedia.apk', 'download/CGpedia.apk', 'public/CGpedia.apk', 'dist/CGpedia.apk'].forEach((rel) => {
  const target = path.join(__dirname, rel);
  if (fs.existsSync(target)) {
    try { fs.unlinkSync(target); } catch (_) {}
  }
});

const webFiles = [
  'index.html',
  'styles.css',
  'firebase-sync.js',
  'exam-engine.js',
  'admin-console.js',
  'app.js',
  'sw.js',
  'manifest.webmanifest'
];

for (const file of webFiles) {
  const src = path.join(__dirname, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(distDir, file));
    fs.copyFileSync(src, path.join(androidAssetsDir, file));
    if (file !== 'index.html') {
      fs.copyFileSync(src, path.join(publicDir, file));
    }
    console.log(`Synced ${file} -> dist/ and app/src/main/assets/`);
  }
}

// Copy favicon.png
const faviconSrc = path.join(publicDir, 'favicon.png');
if (fs.existsSync(faviconSrc)) {
  fs.copyFileSync(faviconSrc, path.join(distDir, 'favicon.png'));
  fs.copyFileSync(faviconSrc, path.join(androidAssetsDir, 'favicon.png'));
}

// Copy all cleaned logo and icon assets into dist/assets/ and app/src/main/assets/assets/
const publicAssetsDir = path.join(publicDir, 'assets');
if (fs.existsSync(publicAssetsDir)) {
  const entries = fs.readdirSync(publicAssetsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile()) {
      const srcFile = path.join(publicAssetsDir, entry.name);
      fs.copyFileSync(srcFile, path.join(distDir, 'assets', entry.name));
      fs.copyFileSync(srcFile, path.join(androidAssetsDir, 'assets', entry.name));
      console.log(`Synced asset/${entry.name} -> dist/assets/ and app/src/main/assets/assets/`);
    }
  }
}

console.log('CGpedia Multi-Exam Platform v4.0 build completed cleanly.');
