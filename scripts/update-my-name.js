/**
 * Update your user's name to proper capitalization
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MY_USER_ID = 'user_01JZXNQA3JRE71HVV7YDGFSC1Q';

async function updateMyName() {
  console.log('🔧 Updating your user name...\n');

  try {
    const user = await prisma.user.findUnique({
      where: { id: MY_USER_ID }
    });

    if (!user) {
      console.error(`❌ User not found: ${MY_USER_ID}`);
      return;
    }

    console.log(`📝 Current user data:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   First Name: ${user.firstName}`);
    console.log(`   Last Name: ${user.lastName}`);
    console.log(`   Full Name: ${user.name}\n`);

    // Capitalize firstName and lastName
    const firstName = user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1).toLowerCase();
    const lastName = user.lastName.charAt(0).toUpperCase() + user.lastName.slice(1).toLowerCase();
    const fullName = `${firstName} ${lastName}`;

    await prisma.user.update({
      where: { id: MY_USER_ID },
      data: {
        firstName: firstName,
        lastName: lastName,
        name: fullName
      }
    });

    console.log(`✅ Updated your name to: ${fullName}\n`);
    console.log(`📋 Now when you create projects, they will show "Created by: ${fullName}"\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateMyName();
