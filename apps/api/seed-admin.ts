import { PrismaClient } from '@linhiq/database';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Admin@123', 12);
  const user = await db.user.upsert({
    where: { email: 'admin@linhiq.com' },
    update: { role: 'ADMIN', passwordHash: hash },
    create: { email: 'admin@linhiq.com', name: 'System Admin', passwordHash: hash, role: 'ADMIN' }
  });
  console.log('✅ Admin user updated/created with correct password:', user.email, user.role);
  await db.$disconnect();
}
main().catch(e => {
  console.error(e);
  process.exit(1);
});
