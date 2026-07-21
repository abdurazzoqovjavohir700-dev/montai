const fs = require('fs');
fs.mkdirSync('out', { recursive: true });
fs.writeFileSync('out/index.html', '<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=https://montai-plum.vercel.app"></head></html>');
console.log('out/index.html created');
