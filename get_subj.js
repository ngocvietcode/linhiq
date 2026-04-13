const { PrismaClient } = require('./packages/database/dist/index.js');
const db = new PrismaClient();

async function run() {
  const s = await db.subject.findFirst();
  console.log("Subject:", s);
  
  const fs = require('fs');
  fs.writeFileSync('subj.json', JSON.stringify(s||{}));
}
run().finally(() => db.$disconnect());
