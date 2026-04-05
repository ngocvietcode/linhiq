import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Subjects ──────────────────────────────
  const biology = await prisma.subject.upsert({
    where: { name_curriculum: { name: 'Biology', curriculum: 'IGCSE' } },
    update: {},
    create: {
      name: 'Biology',
      curriculum: 'IGCSE',
      description: 'Cambridge IGCSE Biology (0610)',
      iconEmoji: '🧬',
    },
  });

  const math = await prisma.subject.upsert({
    where: { name_curriculum: { name: 'Mathematics', curriculum: 'IGCSE' } },
    update: {},
    create: {
      name: 'Mathematics',
      curriculum: 'IGCSE',
      description: 'Cambridge IGCSE Mathematics (0580)',
      iconEmoji: '🔢',
    },
  });

  const chemistry = await prisma.subject.upsert({
    where: { name_curriculum: { name: 'Chemistry', curriculum: 'IGCSE' } },
    update: {},
    create: {
      name: 'Chemistry',
      curriculum: 'IGCSE',
      description: 'Cambridge IGCSE Chemistry (0620)',
      iconEmoji: '⚗️',
    },
  });

  console.log(`  ✅ Subjects: ${biology.name}, ${math.name}, ${chemistry.name}`);

  // ── Biology Topics ────────────────────────
  const bioTopics = [
    { name: 'Characteristics of Living Organisms', chapter: 'Chapter 1', orderIndex: 1 },
    { name: 'Cells', chapter: 'Chapter 2', orderIndex: 2 },
    { name: 'Enzymes', chapter: 'Chapter 3', orderIndex: 3 },
    { name: 'Nutrition in Plants', chapter: 'Chapter 4', orderIndex: 4 },
    { name: 'Nutrition in Humans', chapter: 'Chapter 5', orderIndex: 5 },
    { name: 'Transport in Plants', chapter: 'Chapter 6', orderIndex: 6 },
    { name: 'Transport in Humans', chapter: 'Chapter 7', orderIndex: 7 },
    { name: 'Gas Exchange and Respiration', chapter: 'Chapter 8', orderIndex: 8 },
    { name: 'Coordination and Response', chapter: 'Chapter 9', orderIndex: 9 },
    { name: 'Reproduction', chapter: 'Chapter 10', orderIndex: 10 },
    { name: 'Inheritance', chapter: 'Chapter 11', orderIndex: 11 },
    { name: 'Organisms and their Environment', chapter: 'Chapter 12', orderIndex: 12 },
  ];

  for (const topic of bioTopics) {
    await prisma.topic.upsert({
      where: {
        subjectId_name: { subjectId: biology.id, name: topic.name },
      },
      update: {},
      create: {
        subjectId: biology.id,
        ...topic,
      },
    });
  }

  console.log(`  ✅ Biology Topics: ${bioTopics.length} topics seeded`);

  // ── Demo Admin User ───────────────────────
  const bcrypt = require('bcryptjs');
  const passwordHash = await bcrypt.hash('admin123', 12);
  
  await prisma.user.upsert({
    where: { email: 'admin@javirs.io' },
    update: { passwordHash },
    create: {
      email: 'admin@javirs.io',
      name: 'Admin',
      role: 'ADMIN',
      passwordHash,
    },
  });

  console.log('  ✅ Admin user: admin@javirs.io');
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
