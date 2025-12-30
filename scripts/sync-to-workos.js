/**
 * Sync local organization to WorkOS and assign current user
 * Run this once to set up your test environment
 */

const { PrismaClient } = require('@prisma/client');
const { WorkOS } = require('@workos-inc/node');

const prisma = new PrismaClient();
const workos = new WorkOS(process.env.WORKOS_API_KEY);

const WORKOS_USER_ID = 'user_01JZXNQA3JRE71HVV7YDGFSC1Q'; // Your user ID from test-session

async function syncToWorkOS() {
  console.log('🔄 Starting WorkOS sync...\n');

  try {
    // 1. Get local organization
    const localOrg = await prisma.organizations.findFirst();

    if (!localOrg) {
      console.error('❌ No local organization found. Please create one first.');
      return;
    }

    console.log(`📦 Found local organization: ${localOrg.title}`);

    // 2. Check if organization already has WorkOS ID
    if (localOrg.workos_org_id) {
      console.log(`✅ Organization already synced to WorkOS: ${localOrg.workos_org_id}`);
    } else {
      // 3. Create organization in WorkOS
      console.log('🔄 Creating organization in WorkOS...');

      const workosOrg = await workos.organizations.createOrganization({
        name: localOrg.title,
        domainData: [] // No domain restrictions for testing
      });

      console.log(`✅ Created WorkOS organization: ${workosOrg.id}`);

      // 4. Store WorkOS org ID in local database
      await prisma.organizations.update({
        where: { id: localOrg.id },
        data: { workos_org_id: workosOrg.id }
      });

      console.log(`✅ Updated local organization with WorkOS ID`);
      localOrg.workos_org_id = workosOrg.id;
    }

    // 5. Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { workos_user_id: WORKOS_USER_ID }
    });

    if (!dbUser) {
      console.error(`❌ User not found in database with WorkOS ID: ${WORKOS_USER_ID}`);
      return;
    }

    console.log(`👤 Found user: ${dbUser.email}`);

    // 6. Check if user already has membership
    const existingMemberships = await workos.userManagement.listOrganizationMemberships({
      userId: WORKOS_USER_ID,
      organizationId: localOrg.workos_org_id
    });

    if (existingMemberships.data.length > 0) {
      console.log(`✅ User already has membership in organization`);
      console.log(`   Role: ${existingMemberships.data[0].role}`);
      console.log(`   Status: ${existingMemberships.data[0].status}`);
    } else {
      // 7. Create organization membership for user
      console.log('🔄 Creating organization membership...');

      const membership = await workos.userManagement.createOrganizationMembership({
        userId: WORKOS_USER_ID,
        organizationId: localOrg.workos_org_id,
        roleSlug: 'admin' // Assign as admin for testing
      });

      console.log(`✅ Created membership: ${membership.id}`);
      console.log(`   Role: ${membership.role}`);
      console.log(`   Status: ${membership.status}`);

      // 8. Sync membership to local database
      await prisma.organization_memberships.create({
        data: {
          workos_membership_id: membership.id,
          userId: dbUser.id,
          organizationId: localOrg.id,
          workos_role: membership.role,
          status: membership.status,
          cached_at: new Date()
        }
      });

      console.log(`✅ Synced membership to local database`);
    }

    console.log('\n🎉 Sync completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Log out and log back in via WorkOS');
    console.log('2. You should now see your organization, role, and permissions!');
    console.log('3. Navigate to http://localhost:8081/projects to see the debug panel\n');

  } catch (error) {
    console.error('❌ Error during sync:', error);
    if (error.response?.data) {
      console.error('WorkOS API Error:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    await prisma.$disconnect();
  }
}

syncToWorkOS();
