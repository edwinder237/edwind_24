const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMigration() {
  console.log('🔍 Checking migration status...\n');
  
  // Check total enrollments
  const total = await prisma.project_participants.count();
  console.log(`Total enrollments: ${total}`);
  
  // Check enrollments WITH trainingRecipientId
  const withTR = await prisma.project_participants.count({ 
    where: { trainingRecipientId: { not: null } } 
  });
  console.log(`Enrollments with TR: ${withTR}`);
  
  // Check enrollments WITHOUT trainingRecipientId
  const withoutTR = await prisma.project_participants.count({ 
    where: { trainingRecipientId: null } 
  });
  console.log(`Enrollments without TR: ${withoutTR}\n`);
  
  if (withoutTR > 0) {
    console.log('⚠️  WARNING: Some enrollments are missing trainingRecipientId!');
    
    // Show sample of enrollments without TR
    const sample = await prisma.project_participants.findMany({
      where: { trainingRecipientId: null },
      take: 5,
      include: {
        participant: { select: { email: true, trainingRecipientId: true } },
        project: { select: { title: true, trainingRecipientId: true } }
      }
    });
    
    console.log('\nSample enrollments without TR:');
    sample.forEach(enrollment => {
      console.log(`  - Project: ${enrollment.project.title} (TR: ${enrollment.project.trainingRecipientId})`);
      console.log(`    Participant: ${enrollment.participant.email} (Old TR: ${enrollment.participant.trainingRecipientId})`);
      console.log(`    Enrollment TR: ${enrollment.trainingRecipientId}\n`);
    });
  } else {
    console.log('✅ All enrollments have trainingRecipientId set!');
  }
  
  // Sample a few enrollments to verify data
  console.log('\n📊 Sample enrollments:');
  const samples = await prisma.project_participants.findMany({
    take: 3,
    include: {
      participant: { 
        select: { email: true, firstName: true, lastName: true } 
      },
      project: { 
        select: { title: true } 
      },
      training_recipient: {
        select: { name: true }
      }
    }
  });
  
  samples.forEach((enrollment, i) => {
    console.log(`\n${i + 1}. ${enrollment.participant.firstName} ${enrollment.participant.lastName}`);
    console.log(`   Project: ${enrollment.project.title}`);
    console.log(`   Training Recipient: ${enrollment.training_recipient?.name || 'NULL'}`);
    console.log(`   Status: ${enrollment.status}`);
  });
  
  await prisma.$disconnect();
}

checkMigration().catch(console.error);
