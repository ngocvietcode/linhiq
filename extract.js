const fs = require('fs');
let errTxt = fs.readFileSync('error.txt', 'utf16le');
if (errTxt.startsWith('\uFEFF')) errTxt = errTxt.slice(1);
const parsed = JSON.parse(errTxt);
fs.writeFileSync('clean_error.txt', parsed.error, 'utf8');
