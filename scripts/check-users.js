/**
 * Check existing users in database
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        workos_user_id: true,
        firstName: true,
        lastName: true
      }
    });

    console.log(`\n📊 Found ${users.length} users in database:\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   WorkOS ID: ${user.workos_user_id || '❌ NOT SET'}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}\n`);
    });

    console.log('Current WorkOS User ID from session: user_01JZXNQA3JRE71HVV7YDGFSC1Q\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
