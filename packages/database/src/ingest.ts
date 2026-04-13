import { PrismaClient, SourceType } from '@prisma/client';

import { Pool } from 'pg';
import { resolve, basename } from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';
import { embed, generateText, generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../../.env') });
if (process.env.LITELLM_API_KEY) {
  process.env.OPENAI_API_KEY = process.env.LITELLM_API_KEY;
} else if (process.env.GEMINI_API_KEY) {
  process.env.OPENAI_API_KEY = process.env.GEMINI_API_KEY;
}
const litellm = createOpenAI({
  baseURL: process.env.LITELLM_URL || 'http://localhost:4000/v1',
  apiKey: process.env.OPENAI_API_KEY || 'dummy'
});
const prisma = new PrismaClient();

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

// Extract keywords for fallback ILIKE search
async function extractKeywords(text: string, retries = 3): Promise<string[]> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { text: result } = await generateText({
        model: litellm('gemini-2.5-flash'),
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
        model: litellm.textEmbeddingModel('gemini-embedding-001'),
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

// --- NEW AI PARSING LOGIC ---

const roadmapSchema = z.object({
  milestones: z.array(z.object({
    name: z.string().describe('Tên chương/mốc lớn đã được làm sạch để hiện UI'),
    topics: z.array(z.object({
      name: z.string().describe('Tên bài học con đã làm sạch'),
      originalHeading: z.string().describe('Ghi lại chính xác 100% dòng heading nguyên bản trong Markdown (ví dụ: "# Characteristics of ...") để làm marker ghép nối data.')
    }))
  }))
});

type RoadmapType = z.infer<typeof roadmapSchema>;

async function extractRoadmapFromAI(markdownText: string): Promise<RoadmapType> {
  const lines = markdownText.split('\n');
  const headings = lines.filter(line => line.trim().startsWith('#'));
  const headingsText = headings.join('\n');

  console.log('🤖 Sending Table of Contents to Gemini to infer curriculum structure...');
  const { object } = await generateObject({
    model: litellm('gemini-2.5-flash'),
    schema: roadmapSchema,
    prompt: `Dưới đây là danh sách các thẻ heading trích xuất từ sách giáo khoa. Hãy dùng kiến thức của bạn để phân tích và nhóm chúng thành các Mốc Lớn (Milestones/Chapters) và các Bài Học (Topics) nằm bên trong.\nLưu ý: Không phải thẻ nào cũng là Milestone, hãy gom cẩn thận.\n\n${headingsText}`
  });
  return object;
}

// --- MAIN INGESTION ---

async function main() {
  const subjectName = process.argv[2] || 'Biology';
  console.log(`📚 Starting fully-automated AI-Roadmap RAG Ingestion Pipeline for ${subjectName}...\n`);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query('CREATE EXTENSION IF NOT EXISTS vector');

  const subject = await prisma.subject.findFirst({ where: { name: subjectName } });
  if (!subject) throw new Error(`${subjectName} subject not found.`);

  const folderName = subjectName === 'Mathematics' ? 'maths' : subjectName.toLowerCase();
  const rawDir = resolve(__dirname, `../../../apps/data/curriculum/igcse/${folderName}/textbook`);
  let mdFiles: string[] = [];
  try {
    const files = await fs.readdir(rawDir);
    mdFiles = files.filter(f => f.endsWith('.md'));
  } catch (err) {
     console.log(`No textbook directory found at ${rawDir}. Exiting.`);
     process.exit(0);
  }

  let totalChunksIngested = 0;

  for (const filename of mdFiles) {
    const filepath = resolve(rawDir, filename);
    const textContent = await fs.readFile(filepath, 'utf-8');
    
    // 1. Dùng AI phân tích mục lục
    const roadmap = await extractRoadmapFromAI(textContent);
    console.log(`✅ Extracted Roadmap: ${roadmap.milestones.length} Milestones found.`);

    // 2. Ghi Milestones & Topics xuống Database
    let globalMilestoneCounter = 1;
    let globalTopicCounter = 1;

    // Để mapping từ originalHeading -> topicId trong lúc cắt text
    const headingToTopicIdMap = new Map<string, string>();

    for (const ms of roadmap.milestones) {
      const milestone = await prisma.milestone.upsert({
        where: { subjectId_name: { subjectId: subject.id, name: ms.name } },
        update: { orderIndex: globalMilestoneCounter },
        create: { subjectId: subject.id, name: ms.name, orderIndex: globalMilestoneCounter }
      });
      globalMilestoneCounter++;

      for (const t of ms.topics) {
        const topic = await prisma.topic.upsert({
          where: { subjectId_name: { subjectId: subject.id, name: t.name } },
          update: { milestoneId: milestone.id, orderIndex: globalTopicCounter },
          create: { 
            subjectId: subject.id, 
            milestoneId: milestone.id,
            name: t.name, 
            orderIndex: globalTopicCounter 
          }
        });
        headingToTopicIdMap.set(t.originalHeading.trim(), topic.id);
        globalTopicCounter++;
      }
    }

    // Xoá document cũ
    await prisma.document.deleteMany({
      where: { subjectId: subject.id, sourceType: SourceType.TEXTBOOK, title: basename(filename, '.md') }
    });

    const document = await prisma.document.create({
      data: {
        subjectId: subject.id,
        title: basename(filename, '.md'),
        sourceType: SourceType.TEXTBOOK,
      }
    });

    // 3. Quét Markdown theo từng dòng để gộp text theo Topic
    const sections: { topicId: string | null, content: string }[] = [];
    let currentTopicId: string | null = null;
    let currentContent: string[] = [];

    const lines = textContent.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      let matchedTopicId = headingToTopicIdMap.get(trimmedLine);
      
      if (!matchedTopicId && trimmedLine.startsWith('#')) {
        const cleanLine = trimmedLine.replace(/^#+\s*/, '').toLowerCase().trim();
        for (const [key, id] of headingToTopicIdMap.entries()) {
          if (key.replace(/^#+\s*/, '').toLowerCase().trim() === cleanLine) {
            matchedTopicId = id;
            break;
          }
        }
      }

      if (matchedTopicId) {
        if (currentContent.length > 0) {
          sections.push({ topicId: currentTopicId, content: currentContent.join('\n').trim() });
        }
        currentTopicId = matchedTopicId;
        currentContent = [line];
      } else {
        currentContent.push(line);
      }
    }
    if (currentContent.length > 0) {
      sections.push({ topicId: currentTopicId, content: currentContent.join('\n').trim() });
    }

    console.log(`\n📄 Processing file: ${filename} (${sections.length} content chunks mapped)`);

    for (const section of sections) {
      if (section.content.trim().length === 0) continue;
      
      const textChunks = chunkText(section.content);
      
      for (let i = 0; i < textChunks.length; i++) {
        const chunkContent = textChunks[i];
        console.log(`  ⚙️ Processing Topic [${section.topicId || 'Intro'}] Part ${i+1}/${textChunks.length}`);
        
        await delay(500);

        const [keywords, vector] = await Promise.all([
           extractKeywords(chunkContent),
           generateEmbedding(chunkContent)
        ]);
        
        const pgVectorStr = formatVector(vector);

        const chunk = await prisma.documentChunk.create({
          data: {
            documentId: document.id,
            topicId: section.topicId,
            content: chunkContent,
            keywords: keywords,
            chunkIndex: i,
            metadata: { source: filename }
          }
        });

        await pool.query(
          `UPDATE "DocumentChunk" SET embedding = $1::vector WHERE id = $2`,
          [pgVectorStr, chunk.id]
        );

        totalChunksIngested++;
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
