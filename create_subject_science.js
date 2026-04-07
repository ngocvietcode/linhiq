const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    let subject = await prisma.subject.findFirst({ where: { name: 'Science' } });
    if (!subject) {
        subject = await prisma.subject.create({
            data: {
                name: 'Science',
                curriculum: 'IGCSE',
                iconEmoji: '🔭',
                isActive: true,
                orderIndex: 0
            }
        });
        console.log('Created Science subject:', subject);
    } else {
        console.log('Science subject already exists.');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
