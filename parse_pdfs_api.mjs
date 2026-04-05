import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

const API_KEY = "llx-4xn9ODNoVjMWWu3MsyDfs0NxiPknULsr5TtAklFx79YeGgEb";
const BASE_URL = "https://api.cloud.llamaindex.ai/api/parsing";

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function uploadFile(filePath) {
    const fileName = path.basename(filePath);
    console.log(`Uploading ${fileName} to LlamaParse...`);
    
    // Instead of Blob, FormData in Undici (Node 18+) fetch supports File 
    // We can also use simple FormData with Blob
    const fileContent = await fsp.readFile(filePath);
    const blob = new Blob([fileContent], { type: 'application/pdf' });
    
    const formData = new FormData();
    formData.append('file', blob, fileName);

    const response = await fetch(`${BASE_URL}/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Accept': 'application/json'
        },
        body: formData
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${JSON.stringify(data)}`);
    }

    return data.id;
}

async function checkStatus(jobId) {
    const response = await fetch(`${BASE_URL}/job/${jobId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Status check failed: ${response.status} ${response.statusText} ${err}`);
    }

    const data = await response.json();
    return data; // returning the whole object
}

async function getMarkdownResult(jobId) {
    const response = await fetch(`${BASE_URL}/job/${jobId}/result/markdown`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Failed to get result: ${response.status} ${response.statusText} ${err}`);
    }

    const data = await response.json();
    return data.markdown;
}

async function main() {
    try {
        const inputDir = 'D:/Projects/Javirs/apps/data/curriculum/igcse/biology/pdf';
        const outputDir = 'D:/Projects/Javirs/apps/data/curriculum/igcse/biology/textbook';

        await fsp.mkdir(outputDir, { recursive: true });

        const files = await fsp.readdir(inputDir);
        const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));

        if (pdfFiles.length === 0) {
            console.log(`No PDF files found in ${inputDir}`);
            return;
        }

        for (const file of pdfFiles) {
            try {
                const inputPath = path.join(inputDir, file);
                const outputPath = path.join(outputDir, path.parse(file).name + '.md');
                
                const jobId = await uploadFile(inputPath);
                console.log(`Job ID: ${jobId}. Polling for status...`);

                let status = 'PENDING';
                while (status !== 'SUCCESS' && status !== 'ERROR' && status !== 'CANCELED') {
                    await wait(5000); // 5 seconds
                    const jobInfo = await checkStatus(jobId);
                    status = jobInfo.status;
                    process.stdout.write(`Status: ${status}\r`);
                }
                console.log(`\nFinal status: ${status}`);

                if (status === 'SUCCESS') {
                    const markdown = await getMarkdownResult(jobId);
                    await fsp.writeFile(outputPath, markdown, 'utf-8');
                    console.log(`Saved markdown to ${outputPath}`);
                } else {
                    console.error(`Failed to parse ${file}, status: ${status}`);
                }

            } catch (error) {
                console.error(`\nError processing ${file}:`, error);
            }
        }
    } catch (err) {
        console.error("Global Error:", err);
    }
}

main();
