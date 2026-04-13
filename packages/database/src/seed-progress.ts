import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding missing progress mapping...');

  // 1. Get the admin user
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@linhiq.io' },
  });

  if (!admin) {
    throw new Error('Admin user not found. Please run main seed first.');
  }

  // 2. Add Student Profile
  await prisma.studentProfile.upsert({
    where: { userId: admin.id },
    update: { streakDays: 7 },
    create: {
      userId: admin.id,
      streakDays: 7,
    },
  });

  console.log('✅ Student Profile seeded (7 streak days)');

  // 3. Add Study Sessions
  await prisma.studySession.deleteMany({ where: { userId: admin.id } });
  
  await prisma.studySession.createMany({
    data: [
      { userId: admin.id, durationMin: 45, date: new Date(Date.now() - 2 * 86400000) },
      { userId: admin.id, durationMin: 60, date: new Date(Date.now() - 1 * 86400000) },
      { userId: admin.id, durationMin: 30, date: new Date() },
    ],
  });

  console.log('✅ Study Sessions seeded (total 135 mins = 2h 15m)');

  // 4. Get Biology and some topics
  const biology = await prisma.subject.findFirst({
    where: { name: 'Biology' },
    include: { topics: true },
  });

  if (biology && biology.topics.length > 0) {
    // Add Topic Progress (mastery of 3 topics)
    await prisma.topicProgress.deleteMany({ where: { userId: admin.id } });

    await prisma.topicProgress.createMany({
      data: [
        {
          userId: admin.id,
          topicId: biology.topics[0].id,
          masteryLevel: 0.9,
          lastStudiedAt: new Date(),
        },
        {
          userId: admin.id,
          topicId: biology.topics[1].id,
          masteryLevel: 0.85,
          lastStudiedAt: new Date(),
        },
        {
          userId: admin.id,
          topicId: biology.topics[2].id,
          masteryLevel: 0.4,
          lastStudiedAt: new Date(),
        },
      ],
    });
    console.log('✅ Topic Progress seeded (2 mastered topics, 1 learning)');
  }

  console.log('🎉 Progress Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
