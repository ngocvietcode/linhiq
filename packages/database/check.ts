import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const docs = await prisma.document.findMany({ select: { title: true, isProcessed: true, subject: { select: { name: true } } }});
  console.log(docs);
}
main();
