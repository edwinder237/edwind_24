/**
 * Check project "888" details
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProject() {
  try {
    const project = await prisma.projects.findFirst({
      where: {
        title: '888'
      },
      include: {
        user: true
      }
    });

    if (!project) {
      console.log('❌ Project "888" not found');
      return;
    }

    console.log('📊 Project "888" details:\n');
    console.log(`Project ID: ${project.id}`);
    console.log(`Title: ${project.title}`);
    console.log(`Created By: ${project.CreatedBy}`);
    console.log(`Created At: ${project.createdAt}\n`);

    console.log('👤 Creator User Details:');
    if (project.user) {
      console.log(`   User ID: ${project.user.id}`);
      console.log(`   Email: ${project.user.email}`);
      console.log(`   Name: ${project.user.name || '❌ NO NAME'}`);
      console.log(`   First Name: ${project.user.firstName}`);
      console.log(`   Last Name: ${project.user.lastName}`);
      console.log(`   WorkOS User ID: ${project.user.workos_user_id || '❌ NOT SET'}\n`);
    } else {
      console.log('   ❌ User not found!\n');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProject();
