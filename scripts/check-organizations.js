/**
 * Check organizations in database vs WorkOS
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrganizations() {
  try {
    const orgs = await prisma.organizations.findMany({
      select: {
        id: true,
        title: true,
        workos_org_id: true,
        type: true
      }
    });

    console.log(`\n📊 Found ${orgs.length} organizations in database:\n`);

    orgs.forEach((org, index) => {
      console.log(`${index + 1}. ${org.title}`);
      console.log(`   DB ID: ${org.id}`);
      console.log(`   WorkOS Org ID: ${org.workos_org_id || '❌ NOT SET'}`);
      console.log(`   Type: ${org.type || 'N/A'}\n`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrganizations();
