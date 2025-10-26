const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkParticipants() {
  // Find participants in project 33
  const projectParticipants = await prisma.project_participants.findMany({
    where: { projectId: 33 },
    include: {
      participant: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          trainingRecipientId: true
        }
      }
    }
  });
  
  console.log('Participants in project 33:');
  projectParticipants.forEach(pp => {
    console.log(`  - ${pp.participant.firstName} ${pp.participant.lastName} (ID: ${pp.participant.id})`);
    console.log(`    Email: ${pp.participant.email}`);
    console.log(`    TrainingRecipientId: ${pp.participant.trainingRecipientId}`);
    console.log(`    Status in project: ${pp.status}`);
  });
  
  // Check what the project's trainingRecipientId is
  const project = await prisma.projects.findUnique({
    where: { id: 33 },
    select: { id: true, title: true, trainingRecipientId: true }
  });
  
  console.log('\nProject info:');
  console.log(`  Project #${project.id}: ${project.title}`);
  console.log(`  TrainingRecipientId: ${project.trainingRecipientId}`);
  
  await prisma.$disconnect();
}

checkParticipants().catch(console.error);
