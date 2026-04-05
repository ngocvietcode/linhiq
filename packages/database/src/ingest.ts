import { PrismaClient, SourceType } from '@prisma/client';
import { Pool } from 'pg';
import { resolve, basename } from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';
import { embed, generateText } from 'ai';
import { google } from '@ai-sdk/google';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../../.env') });
if (process.env.GEMINI_API_KEY) {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;
}
const prisma = new PrismaClient();

// Word-count proxy chunking (800 token approx -> 600 words)
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

function chunkText(text: string, maxWords: number = 600, overlapWords: number = 100): string[] {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return [text];
  
  const chunks: string[] = [];
  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + maxWords).join(' ');
    chunks.push(chunk);
    i += maxWords - overlapWords;
  }
  return chunks;
}

// Markdown Header Splitter
function splitMarkdown(markdownText: string): { chapter: string, content: string }[] {
    const lines = markdownText.split('\n');
    const sections: { chapter: string, content: string }[] = [];
    let currentChapter = 'General';
    let currentContent: string[] = [];
    
    for (const line of lines) {
        if (line.trim().startsWith('## ')) {
            if (currentContent.length > 0) {
                sections.push({ chapter: currentChapter, content: currentContent.join('\n').trim() });
            }
            currentChapter = line.replace('## ', '').trim();
            currentContent = [line];
        } else {
            currentContent.push(line);
        }
    }
    if (currentContent.length > 0) {
        sections.push({ chapter: currentChapter, content: currentContent.join('\n').trim() });
    }
    return sections;
}

// Extract keywords for fallback ILIKE search
async function extractKeywords(text: string, retries = 3): Promise<string[]> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { text: result } = await generateText({
        model: google('gemini-2.5-flash'),
        system: 'Extract 3-5 core academic scientific keywords from this text. Return them as a comma-separated list without quotes or formatting.',
        prompt: text
      });
      return result.split(',').map(s => s.trim()).filter(Boolean);
    } catch (e: any) {
      if (attempt === retries) {
        console.warn('  ⚠️ Failed to extract keywords after retries, skipping...');
        return [];
      }
      if (e.statusCode === 429 || e.message?.includes('429')) {
        console.log(`  🕒 Rate limited (Flash), sleeping 10s... (Attempt ${attempt}/${retries})`);
        await delay(10000);
      } else {
        throw e;
      }
    }
  }
  return [];
}

// Generate pgvector embedding array
async function generateEmbedding(text: string, retries = 5): Promise<number[]> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { embedding } = await embed({
        model: google.textEmbeddingModel('gemini-embedding-001'),
        value: text,
      });
      return embedding;
    } catch (e: any) {
      if (attempt === retries) throw e;
      if (e.statusCode === 429 || e.message?.includes('429')) {
        console.log(`  🕒 Rate limited (Embedding), sleeping 10s... (Attempt ${attempt}/${retries})`);
        await delay(10000);
      } else {
        throw e;
      }
    }
  }
  throw new Error('Failed to generate embedding after retries');
}

function formatVector(values: number[]): string {
  return `[${values.join(',')}]`;
}

async function main() {
  console.log('📚 Starting fully-automated RAG Ingestion Pipeline...\n');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query('CREATE EXTENSION IF NOT EXISTS vector');

  const bioSubject = await prisma.subject.findFirst({ where: { name: 'Biology' } });
  if (!bioSubject) throw new Error('Biology subject not found.');

  console.log('🧹 Purging previous TEXTBOOK documents for Biology to prepare overwrite...');
  await prisma.document.deleteMany({
    where: { subjectId: bioSubject.id, sourceType: SourceType.TEXTBOOK }
  });

  const rawDir = resolve(__dirname, '../../../apps/data/curriculum/igcse/biology/textbook');
  let mdFiles: string[] = [];
  try {
    const files = await fs.readdir(rawDir);
    mdFiles = files.filter(f => f.endsWith('.md'));
  } catch (err) {
     console.log(`No textbook directory found at ${rawDir}. Exiting.`, err);
     process.exit(0);
  }

  let totalChunksIngested = 0;

  for (const filename of mdFiles) {
    const filepath = resolve(rawDir, filename);
    const textContent = await fs.readFile(filepath, 'utf-8');
    
    const document = await prisma.document.create({
      data: {
        subjectId: bioSubject.id,
        title: basename(filename, '.md'),
        sourceType: SourceType.TEXTBOOK,
      }
    });

    const sections = splitMarkdown(textContent);
    console.log(`\n📄 Processing file: ${filename} (${sections.length} headings found)`);

    for (const section of sections) {
      if (section.content.trim().length === 0) continue;

      const topicMatch = await prisma.topic.findFirst({
         where: { subjectId: bioSubject.id, name: { contains: section.chapter.replace(/^[0-9.]+\s*/, ''), mode: 'insensitive' } }
      });
      
      const textChunks = chunkText(section.content);
      
      for (let i = 0; i < textChunks.length; i++) {
        const chunkContent = textChunks[i];
        
        console.log(`  ⚙️ Processing Chunk [${section.chapter}] Part ${i+1}/${textChunks.length}`);
        
        // Optional slight delay between chunks to help smooth out rate limits
        await delay(500);

        // Concurrent AI calls to speed up ingestion
        const [keywords, vector] = await Promise.all([
           extractKeywords(chunkContent),
           generateEmbedding(chunkContent)
        ]);
        
        const pgVectorStr = formatVector(vector);

        const chunk = await prisma.documentChunk.create({
          data: {
            documentId: document.id,
            topicId: topicMatch?.id,
            content: chunkContent,
            keywords: keywords,
            chunkIndex: i,
            metadata: { chapter: section.chapter, source: filename }
          }
        });

        await pool.query(
          `UPDATE "DocumentChunk" SET embedding = $1::vector WHERE id = $2`,
          [pgVectorStr, chunk.id]
        );

        totalChunksIngested++;
        console.log(`  ✅ Ingested successfully (Words: ${chunkContent.split(' ').length}, Keywords: ${keywords.length})`);
      }
    }
    
    await prisma.document.update({
        where: { id: document.id },
        data: { isProcessed: true, processedAt: new Date(), pageCount: totalChunksIngested }
    });
  }

  await pool.end();
  await prisma.$disconnect();
  console.log(`\n🎉 Ingestion complete! Total Chunks Created: ${totalChunksIngested}`);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
