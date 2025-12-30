/**
 * Fix user names - Update name field from firstName + lastName
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUserNames() {
  console.log('🔧 Fixing user names...\n');

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        workos_user_id: true
      }
    });

    console.log(`📊 Found ${users.length} users\n`);

    let updatedCount = 0;

    for (const user of users) {
      // Construct the full name from firstName and lastName
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

      // Update if name is different or empty
      if (!user.name || user.name !== fullName) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            name: fullName || 'Unknown User'
          }
        });

        console.log(`✅ Updated name for ${user.email}:`);
        console.log(`   Old: "${user.name || '(empty)'}"`);
        console.log(`   New: "${fullName || 'Unknown User'}"`);
        console.log(`   WorkOS User: ${user.workos_user_id ? 'Yes' : 'No'}\n`);

        updatedCount++;
      }
    }

    if (updatedCount === 0) {
      console.log('✅ All user names are already correct!\n');
    } else {
      console.log(`\n🎉 Updated ${updatedCount} user name(s)!\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserNames();
