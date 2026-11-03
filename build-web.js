const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const filesToCopy = [
  'index.html',
  'styles.css',
  'app.js',
  'manifest.webmanifest',
  'CGpedia.apk'
];

for (const file of filesToCopy) {
  const src = path.join(__dirname, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(distDir, file));
    if (file !== 'index.html') {
      fs.copyFileSync(src, path.join(publicDir, file));
    }
    console.log(`Copied ${file} -> dist/${file}`);
  }
}

// Also create dist/download/CGpedia.apk for direct /download/CGpedia.apk route
const distDownloadDir = path.join(distDir, 'download');
if (!fs.existsSync(distDownloadDir)) {
  fs.mkdirSync(distDownloadDir, { recursive: true });
}
const apkSrc = path.join(__dirname, 'CGpedia.apk');
if (fs.existsSync(apkSrc)) {
  fs.copyFileSync(apkSrc, path.join(distDownloadDir, 'CGpedia.apk'));
}

console.log('CGpedia Web Build completed successfully in /dist and /');
