const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  console.log('🔄 Migrating trainingRecipientId data...\n');
  
  const result = await prisma.$executeRaw`
    UPDATE project_participants pp
    SET "trainingRecipientId" = p."trainingRecipientId"
    FROM participants p
    WHERE pp."participantId" = p.id
    AND pp."trainingRecipientId" IS NULL;
  `;
  
  console.log(`✅ Updated ${result} records\n`);
  
  const total = await prisma.project_participants.count();
  const withTR = await prisma.project_participants.count({ 
    where: { trainingRecipientId: { not: null } } 
  });
  
  console.log(`Total: ${total} | With TR: ${withTR} | Without: ${total - withTR}`);
  
  await prisma.$disconnect();
}

migrate().catch(console.error);
