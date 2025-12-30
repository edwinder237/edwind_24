/**
 * Check "Having Fun" project details
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProject() {
  try {
    const project = await prisma.projects.findFirst({
      where: {
        title: 'Having Fun'
      },
      include: {
        user: true
      }
    });

    if (!project) {
      console.log('❌ Project "Having Fun" not found');
      return;
    }

    console.log('📊 Project "Having Fun" details:\n');
    console.log(`Project ID: ${project.id}`);
    console.log(`Title: ${project.title}`);
    console.log(`Created By Field: ${project.CreatedBy}`);
    console.log(`Created At: ${project.createdAt}\n`);

    console.log('👤 Creator User Details (from relation):');
    if (project.user) {
      console.log(`   User ID: ${project.user.id}`);
      console.log(`   Email: ${project.user.email}`);
      console.log(`   Name: "${project.user.name || 'NO NAME'}"`);
      console.log(`   First Name: ${project.user.firstName}`);
      console.log(`   Last Name: ${project.user.lastName}`);
      console.log(`   WorkOS User ID: ${project.user.workos_user_id || 'NOT SET'}\n`);
    } else {
      console.log('   ❌ User relation is NULL!\n');
      console.log(`   The CreatedBy field points to: ${project.CreatedBy}`);
      console.log(`   This user might not exist in the database.\n`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProject();
