/**
 * ============================================
 * MIGRATE EXISTING ORGANIZATIONS TO FREE PLAN
 * ============================================
 *
 * Assigns all existing organizations without a subscription to the Free plan.
 * Run this once after adding subscription tables.
 *
 * Usage: node scripts/migrate-orgs-to-free-plan.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateOrganizations() {
  console.log('🔄 Migrating existing organizations to Enterprise plan...\n');

  try {
    // Get all organizations
    const allOrgs = await prisma.organizations.findMany({
      select: {
        id: true,
        title: true,
        workos_org_id: true,
        subscription: true
      }
    });

    console.log(`📊 Found ${allOrgs.length} total organizations\n`);

    // Filter organizations without subscriptions
    const orgsWithoutSubscription = allOrgs.filter(org => !org.subscription);

    console.log(`📝 Organizations without subscription: ${orgsWithoutSubscription.length}\n`);

    if (orgsWithoutSubscription.length === 0) {
      console.log('✅ All organizations already have subscriptions!');
      return;
    }

    // Create subscriptions for organizations without one
    let successCount = 0;
    let errorCount = 0;

    for (const org of orgsWithoutSubscription) {
      try {
        // Calculate 30 days from now
        const currentPeriodEnd = new Date();
        currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

        const subscription = await prisma.subscriptions.create({
          data: {
            organizationId: org.id,
            planId: 'enterprise',
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd,
            createdBy: 'migration-script',
            history: {
              create: {
                eventType: 'created',
                toPlanId: 'enterprise',
                toStatus: 'active',
                reason: 'Initial migration to subscription system - Enterprise plan for existing customers',
                changedBy: 'migration-script',
                changedByRole: 'system'
              }
            }
          }
        });

        console.log(`   ✅ ${org.title || org.id}: Assigned to Enterprise plan (Subscription ID: ${subscription.id})`);
        successCount++;

      } catch (error) {
        console.error(`   ❌ ${org.title || org.id}: Failed to create subscription`);
        console.error(`      Error: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   Total organizations: ${allOrgs.length}`);
    console.log(`   Already had subscriptions: ${allOrgs.length - orgsWithoutSubscription.length}`);
    console.log(`   Successfully migrated: ${successCount}`);
    console.log(`   Errors: ${errorCount}\n`);

    if (successCount > 0) {
      console.log('✅ Migration completed successfully!');
    }

    // Display all subscriptions
    console.log('\n📋 Current subscription status:');
    const allSubscriptions = await prisma.subscriptions.findMany({
      include: {
        organization: {
          select: {
            id: true,
            title: true
          }
        },
        plan: {
          select: {
            name: true,
            planId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    allSubscriptions.forEach(sub => {
      console.log(`   - ${sub.organization.title || sub.organization.id}: ${sub.plan.name} (${sub.status})`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateOrganizations()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to migrate organizations:', error);
    process.exit(1);
  });
