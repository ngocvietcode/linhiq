import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

const API_KEY = "llx-4xn9ODNoVjMWWu3MsyDfs0NxiPknULsr5TtAklFx79YeGgEb";
const BASE_URL = "https://api.cloud.llamaindex.ai/api/parsing";

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

    return await response.json();
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
    const jobId = '8fb1918e-fd2d-4df8-a30d-f9759c6025f7';
    const outputDir = 'D:/Projects/LinhIQ/apps/data/curriculum/igcse/maths/textbook';
    const outputPath = path.join(outputDir, 'Cambridge _Maths_LBgrade 6.md');

    await fsp.mkdir(outputDir, { recursive: true });

    let status = 'PENDING';
    console.log(`Polling status for Job ${jobId}...`);

    while (status !== 'SUCCESS' && status !== 'ERROR' && status !== 'CANCELED') {
        const jobInfo = await checkStatus(jobId);
        status = jobInfo.status;
        console.log(`Status: ${status}`);
        if (status === 'PENDING') await wait(5000);
    }

    if (status === 'SUCCESS') {
        const markdown = await getMarkdownResult(jobId);
        await fsp.writeFile(outputPath, markdown, 'utf-8');
        console.log(`Saved output to ${outputPath}`);
    } else {
        console.error(`Final status was ${status}`);
    }
}

main().catch(console.error);
