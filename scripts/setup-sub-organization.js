/**
 * Setup Sub-Organization and Assign User
 *
 * This script creates a sub-organization under an organization and assigns a user to it.
 *
 * Usage: node scripts/setup-sub-organization.js
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function setupSubOrganization() {
  try {
    console.log('🔧 Setting up sub-organization...\n');

    // Step 1: Find the Test Organization
    console.log('📋 Finding Test Organization...');
    const testOrg = await prisma.organizations.findFirst({
      where: { title: 'Test Organization' }
    });

    if (!testOrg) {
      console.error('❌ Test Organization not found. Run sync-workos-organizations.js first.');
      process.exit(1);
    }

    console.log(`✅ Found organization: ${testOrg.title} (ID: ${testOrg.id})\n`);

    // Step 2: Check if sub-organization already exists
    console.log('📋 Checking for existing sub-organization...');
    let subOrg = await prisma.sub_organizations.findFirst({
      where: { organizationId: testOrg.id }
    });

    if (subOrg) {
      console.log(`✅ Sub-organization already exists: ${subOrg.title} (ID: ${subOrg.id})\n`);
    } else {
      // Create sub-organization
      console.log('📝 Creating sub-organization "Training Department"...');
      subOrg = await prisma.sub_organizations.create({
        data: {
          title: 'Training Department',
          description: 'Main training department for Test Organization',
          organizationId: testOrg.id,
          createdBy: 'system',
          updatedby: 'system',
          createdAt: new Date(),
          lastUpdated: new Date()
        }
      });
      console.log(`✅ Created sub-organization: ${subOrg.title} (ID: ${subOrg.id})\n`);
    }

    // Step 3: Find user to assign
    console.log('👤 Finding user to assign...');
    const user = await prisma.user.findFirst({
      where: {
        workos_user_id: { not: null }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!user) {
      console.error('❌ No user found with workos_user_id.');
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.email} (${user.name})\n`);

    // Step 4: Assign user to sub-organization
    if (user.sub_organizationId === subOrg.id) {
      console.log(`✅ User already assigned to sub-organization: ${subOrg.title}\n`);
    } else {
      console.log(`📝 Assigning user to sub-organization...`);
      await prisma.user.update({
        where: { id: user.id },
        data: { sub_organizationId: subOrg.id }
      });
      console.log(`✅ User assigned to sub-organization: ${subOrg.title}\n`);
    }

    // Step 5: Display summary
    console.log('📊 Summary:');
    console.log(`   Organization: ${testOrg.title}`);
    console.log(`   Sub-Organization: ${subOrg.title}`);
    console.log(`   User: ${user.name} (${user.email})`);
    console.log(`   User assigned to: ${subOrg.title}\n`);

    console.log('✅ Setup complete!');
    console.log('💡 Now refresh your claims by clicking "Refresh with WorkOS" in the app.\n');

  } catch (error) {
    console.error('❌ Error setting up sub-organization:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupSubOrganization()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to setup sub-organization:', error);
    process.exit(1);
  });
