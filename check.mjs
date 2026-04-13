/* check.mjs */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const docs = await prisma.documentChunk.groupBy({
    by: ['documentId'],
    _count: { id: true }
  });
  const documents = await prisma.document.findMany({
    select: { id: true, title: true, isProcessed: true, subject: { select: { name: true } } }
  });
  console.log("Documents currently in DB:", documents);
  console.log("Chunk distribution:", docs);
}
run().finally(() => prisma.$disconnect());
