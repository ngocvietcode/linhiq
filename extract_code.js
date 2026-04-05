const fs = require('fs');
const text = fs.readFileSync('apps/api/dist/main.js', 'utf8');
const start = text.indexOf('async sendMessage(');
const end = text.indexOf('async getSettings(');
fs.writeFileSync('temp.js', text.substring(start, start + 3000));
