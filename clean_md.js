const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(__dirname, 'apps/data/curriculum/igcse');

function cleanFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const initialLength = content.length;

    // 1. Full block regexes (with optional ---)
    const block1 = /Original material[\s\S]{0,100}© Cambridge University Press 2021\. This material is not final and is subject to further changes prior to publication\.[\s\S]{0,100}ISBN[\s_]*9781108742863\.[\s\S]{0,100}(?:---[\s\S]{0,100})?We are working with Cambridge Assessment International Education towards endorsement of this title\./gi;
    
    const block2 = /Original material is not final and is subject to further changes prior to publication\. © Cambridge University Press 2021\. This material[\s\S]{0,50}ISBN[\s_]*9781108742863\.[\s\S]{0,100}(?:---[\s\S]{0,100})?We are working with Cambridge Assessment International Education towards endorsement of this title\./gi;
    
    // 2. Individual sentence replacements (for stray ones)
    const strays = [
        /Original material\s*© Cambridge University Press 2021\. This material is not final and is subject to further changes prior to publication\./gi,
        /Original material\s/gi,
        /© Cambridge University Press 2021\. This material is not final and is subject to further changes prior to publication\./gi,
        /ISBN[\s_]*9781108742863\./gi,
        /We are working with Cambridge Assessment International Education towards endorsement of this title\./gi,
        /Original material is not final and is subject to further changes prior to publication\. © Cambridge University Press 2021\. This material/gi
    ];

    content = content.replace(block1, '');
    content = content.replace(block2, '');
    
    for (const r of strays) {
        content = content.replace(r, '');
    }

    // Clean up empty lines created
    content = content.replace(/\n{3,}/g, '\n\n');

    if (content.length !== initialLength) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Cleaned: ${filePath} (Removed ${initialLength - content.length} chars)`);
    }
}

function traverse(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverse(fullPath);
        } else if (fullPath.endsWith('.md')) {
            cleanFile(fullPath);
        }
    }
}

traverse(targetDir);
console.log('Done cleaning markdown files.');
