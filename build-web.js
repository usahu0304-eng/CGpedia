const fs = require('fs');
const path = require('path');

const rootAssetsDir = path.join(__dirname, 'assets');
const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(__dirname, 'public');
const androidAssetsDir = path.join(__dirname, 'app', 'src', 'main', 'assets');

[
  rootAssetsDir,
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

// Clean up any old APK or unused backup image artifacts if present
[
  'CGpedia.apk',
  'download/CGpedia.apk',
  'public/CGpedia.apk',
  'dist/CGpedia.apk',
  'dist/assets/cgpedia-logo-original-backup.jpg',
  'dist/assets/cgpedia-logo-clean.jpg',
  'app/src/main/assets/assets/cgpedia-logo-original-backup.jpg',
  'app/src/main/assets/assets/cgpedia-logo-clean.jpg'
].forEach((rel) => {
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

// Copy favicon.png to root, dist/, and android assets
const faviconSrc = path.join(publicDir, 'favicon.png');
if (fs.existsSync(faviconSrc)) {
  fs.copyFileSync(faviconSrc, path.join(__dirname, 'favicon.png'));
  fs.copyFileSync(faviconSrc, path.join(distDir, 'favicon.png'));
  fs.copyFileSync(faviconSrc, path.join(androidAssetsDir, 'favicon.png'));
}

// Copy active optimized PNG logo and icon assets into assets/, dist/assets/ and app/src/main/assets/assets/
const publicAssetsDir = path.join(publicDir, 'assets');
const activeAssetFiles = ['cgpedia-logo-clean.png', 'icon-192.png', 'icon-512.png'];
if (fs.existsSync(publicAssetsDir)) {
  for (const fileName of activeAssetFiles) {
    const srcFile = path.join(publicAssetsDir, fileName);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, path.join(rootAssetsDir, fileName));
      fs.copyFileSync(srcFile, path.join(distDir, 'assets', fileName));
      fs.copyFileSync(srcFile, path.join(androidAssetsDir, 'assets', fileName));
      console.log(`Synced optimized asset/${fileName} -> assets/, dist/assets/ and app/src/main/assets/assets/`);
    }
  }
}

console.log('CGpedia Multi-Exam Platform v6.7 optimized build completed cleanly.');
