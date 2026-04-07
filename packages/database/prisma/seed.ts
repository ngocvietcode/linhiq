import { PrismaClient } from '@javirs/database';

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

  const science = await prisma.subject.upsert({
    where: { name_curriculum: { name: 'Science', curriculum: 'IGCSE' } },
    update: {},
    create: {
      name: 'Science',
      curriculum: 'IGCSE',
      description: 'Cambridge Lower Secondary Science (grade 9)',
      iconEmoji: '🔭',
    },
  });

  console.log(`  ✅ Subjects: ${biology.name}, ${math.name}, ${chemistry.name}, ${science.name}`);

  // ── Biology Topics ────────────────────────
  const bioTopics = [
    { name: 'Characteristics of Living Organisms', orderIndex: 1 },
    { name: 'Cells', orderIndex: 2 },
    { name: 'Enzymes', orderIndex: 3 },
    { name: 'Nutrition in Plants', orderIndex: 4 },
    { name: 'Nutrition in Humans', orderIndex: 5 },
    { name: 'Transport in Plants', orderIndex: 6 },
    { name: 'Transport in Humans', orderIndex: 7 },
    { name: 'Gas Exchange and Respiration', orderIndex: 8 },
    { name: 'Coordination and Response', orderIndex: 9 },
    { name: 'Reproduction', orderIndex: 10 },
    { name: 'Inheritance', orderIndex: 11 },
    { name: 'Organisms and their Environment', orderIndex: 12 },
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
  const passwordHash = await bcrypt.hash('Admin@123', 12);
  
  await prisma.user.upsert({
    where: { email: 'admin@linhiq.com' },
    update: { passwordHash, role: 'ADMIN' },
    create: {
      email: 'admin@linhiq.com',
      name: 'System Admin',
      role: 'ADMIN',
      passwordHash,
    },
  });

  console.log('  ✅ Admin user: admin@linhiq.com / Admin@123');
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
