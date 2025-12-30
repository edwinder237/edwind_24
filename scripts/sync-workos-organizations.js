/**
 * Sync WorkOS Organizations to Local Database
 *
 * This script fetches all organizations from WorkOS and syncs them to the local database.
 * It creates organization records with the correct workos_org_id for claims to work properly.
 *
 * Usage: node scripts/sync-workos-organizations.js
 */

import { WorkOS } from '@workos-inc/node';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();
const workos = new WorkOS(process.env.WORKOS_API_KEY);

async function syncOrganizations() {
  try {
    console.log('🔄 Starting WorkOS organization sync...\n');

    // Fetch all organizations from WorkOS
    console.log('📥 Fetching organizations from WorkOS...');
    const { data: workosOrgs } = await workos.organizations.listOrganizations({
      limit: 100
    });

    console.log(`✅ Found ${workosOrgs.length} organization(s) in WorkOS\n`);

    // Sync each organization
    for (const workosOrg of workosOrgs) {
      console.log(`📋 Processing: ${workosOrg.name}`);
      console.log(`   WorkOS Org ID: ${workosOrg.id}`);

      // Check if organization already exists in local database
      const existingOrg = await prisma.organizations.findUnique({
        where: { workos_org_id: workosOrg.id }
      });

      if (existingOrg) {
        console.log(`   ✓ Organization already exists in local DB (ID: ${existingOrg.id})`);

        // Update organization name if it changed
        if (existingOrg.title !== workosOrg.name) {
          await prisma.organizations.update({
            where: { id: existingOrg.id },
            data: { title: workosOrg.name }
          });
          console.log(`   ✓ Updated organization name to: ${workosOrg.name}`);
        }
      } else {
        // Create new organization
        const newOrg = await prisma.organizations.create({
          data: {
            workos_org_id: workosOrg.id,
            title: workosOrg.name,
            description: `Organization synced from WorkOS`,
            logo_url: null,
            status: 'active',
            type: 'standard',
            published: true,
            updatedby: 'system',
            createdBy: 'system',
            createdAt: new Date(workosOrg.createdAt),
            lastUpdated: new Date(workosOrg.updatedAt)
          }
        });
        console.log(`   ✅ Created new organization in local DB (ID: ${newOrg.id})`);
      }

      console.log('');
    }

    console.log('✅ Organization sync complete!\n');

    // Display summary
    console.log('📊 Summary:');
    const totalOrgs = await prisma.organizations.count();
    console.log(`   Total organizations in local database: ${totalOrgs}`);

    const orgsWithWorkOS = await prisma.organizations.count({
      where: { workos_org_id: { not: null } }
    });
    console.log(`   Organizations linked to WorkOS: ${orgsWithWorkOS}\n`);

  } catch (error) {
    console.error('❌ Error syncing organizations:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the sync
syncOrganizations()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to sync organizations:', error);
    process.exit(1);
  });
