import fsp from 'fs/promises';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const API_KEY = "llx-4xn9ODNoVjMWWu3MsyDfs0NxiPknULsr5TtAklFx79YeGgEb";
const BASE_URL = "https://api.cloud.llamaindex.ai/api/parsing";

const books = [
    {
        file: "D:/Projects/Javirs/apps/data/curriculum/igcse/new books/Edexcel International-GCSE Chemistry 9-1 Revision Guide by CGP (1).pdf",
        subject: "Chemistry",
        folderName: "chemistry",
        outputName: "CGP_Chemistry.md"
    },
    {
        file: "D:/Projects/Javirs/apps/data/curriculum/igcse/new books/Edexcel International-GCSE Maths 9-1 Revision Guide by CGP.pdf",
        subject: "Mathematics",
        folderName: "maths",
        outputName: "CGP_Maths.md"
    },
    {
        file: "D:/Projects/Javirs/apps/data/curriculum/igcse/new books/Edexcel International-GCSE Physics 9-1 Revision Guide by CGP.pdf",
        subject: "Physics",
        folderName: "physics",
        outputName: "CGP_Physics.md"
    }
];

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function uploadFileWithCurl(filePath) {
    console.log(`Uploading ${filePath} via curl...`);
    // Dùng curl để hỗ trợ file >100MB ổn định hơn Node fetch mặc định
    const cmd = `curl.exe -sS -X POST "${BASE_URL}/upload" -H "Authorization: Bearer ${API_KEY}" -H "Accept: application/json" -F "file=@${filePath}"`;
    const result = execSync(cmd, { encoding: 'utf-8' });
    const json = JSON.parse(result);
    return json.id;
}

async function checkStatus(jobId) {
    const response = await fetch(`${BASE_URL}/job/${jobId}`, {
        headers: { 'Authorization': `Bearer ${API_KEY}`, 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`Status check failed: ${response.status}`);
    return await response.json();
}

async function getMarkdownResult(jobId) {
    const response = await fetch(`${BASE_URL}/job/${jobId}/result/markdown`, {
        headers: { 'Authorization': `Bearer ${API_KEY}`, 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`Failed to get markdown: ${response.status}`);
    const data = await response.json();
    return data.markdown;
}

async function processBook(book) {
    console.log(`\n\n==========================================`);
    console.log(`Bắt đầu xử lý sách: ${path.basename(book.file)}`);
    console.log(`==========================================`);
    
    const outputDir = `D:/Projects/Javirs/apps/data/curriculum/igcse/${book.folderName}/textbook`;
    await fsp.mkdir(outputDir, { recursive: true });
    
    // 1. Lưu ý API key có thể check trùng job (LlamaParse tự tạo jobID mới)
    const jobId = uploadFileWithCurl(book.file);
    console.log(`Uploaded thành công! Job ID: ${jobId}`);
    
    let status = 'PENDING';
    let lastStatus = '';
    while (status !== 'SUCCESS' && status !== 'ERROR' && status !== 'CANCELED') {
        try {
            const jobInfo = await checkStatus(jobId);
            status = jobInfo.status;
            if (status !== lastStatus) {
                console.log(`LlamaParse Status: ${status}`);
                lastStatus = status;
            }
        } catch (e) {
            console.error(e.message);
        }
        if (status === 'PENDING') await wait(5000);
    }

    if (status === 'SUCCESS') {
        console.log(`Tải file Markdown...`);
        const markdown = await getMarkdownResult(jobId);
        const outputPath = path.join(outputDir, book.outputName);
        await fsp.writeFile(outputPath, markdown, 'utf-8');
        console.log(`Saved output to ${outputPath}`);
        
        console.log(`---------- BẮT ĐẦU CẮT CHUNK VÀ IMPL VÀO DATABASE CHO ${book.subject} ---------`);
        try {
            execSync(`npm run db:ingest ${book.subject}`, { stdio: 'inherit', cwd: 'D:/Projects/Javirs/packages/database' });
            console.log(`Ingest thành công môn ${book.subject}.`);
        } catch(e) {
            console.log(`Lỗi khi chạy nx or npm db:ingest cho ${book.subject}: ${e.message}`);
        }
    } else {
        console.error(`Final parse status was ${status}. Không chạy ingest.`);
    }
}

async function main() {
    for (const book of books) {
        await processBook(book);
    }
    console.log(`\n\n🎉 TẤT CẢ SÁCH ĐÃ ĐƯỢC XỬ LÝ HOÀN TẤT 🎉`);
}

main().catch(console.error);
