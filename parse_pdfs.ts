import { LlamaParseReader } from "llamaindex";
import * as fs from 'fs/promises';
import { resolve, parse } from 'path';

const API_KEY = "llx-4xn9ODNoVjMWWu3MsyDfs0NxiPknULsr5TtAklFx79YeGgEb";
process.env.LLAMA_CLOUD_API_KEY = API_KEY;

async function main() {
    const inputDir = 'D:/Projects/LinhIQ/apps/data/curriculum/igcse/biology/pdf';
    const outputDir = 'D:/Projects/LinhIQ/apps/data/curriculum/igcse/biology/markdown';
    
    // Create outputDir if it doesn't exist
    await fs.mkdir(outputDir, { recursive: true });

    const files = await fs.readdir(inputDir);
    const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));

    const reader = new LlamaParseReader({ resultType: "markdown" });

    for (const file of pdfFiles) {
        console.log(`Processing ${file}...`);
        const inputPath = resolve(inputDir, file);
        const outputPath = resolve(outputDir, parse(file).name + '.md');
        
        try {
            const documents = await reader.loadData(inputPath);
            const markdownContent = documents.map(d => d.text).join('\n\n');
            await fs.writeFile(outputPath, markdownContent, 'utf-8');
            console.log(`Saved markdown to ${outputPath}`);
        } catch (error) {
            console.error(`Error processing ${file}:`, error);
        }
    }
}

main().catch(console.error);
