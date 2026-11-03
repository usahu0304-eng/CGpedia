const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(__dirname, 'public');
const androidAssetsDir = path.join(__dirname, 'app', 'src', 'main', 'assets');

[distDir, publicDir, androidAssetsDir].forEach((dir) => {
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

console.log('CGpedia PWA v3.0 build completed cleanly.');
