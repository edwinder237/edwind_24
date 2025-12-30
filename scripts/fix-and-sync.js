/**
 * Fix WorkOS user IDs and sync to organization
 */

const { PrismaClient } = require('@prisma/client');
const { WorkOS } = require('@workos-inc/node');

const prisma = new PrismaClient();
const workos = new WorkOS(process.env.WORKOS_API_KEY);

const SESSION_USER_ID = 'user_01JZXNQA3JRE71HVV7YDGFSC1Q'; // From session

async function fixAndSync() {
  console.log('🔧 Fixing WorkOS integration...\n');

  try {
    // 1. Fix the workos_user_id for users where id starts with "user_"
    console.log('🔄 Updating workos_user_id for WorkOS users...');

    const workosUsers = await prisma.user.findMany({
      where: {
        id: {
          startsWith: 'user_'
        },
        workos_user_id: null
      }
    });

    for (const user of workosUsers) {
      await prisma.user.update({
        where: { id: user.id },
        data: { workos_user_id: user.id }
      });
      console.log(`✅ Set workos_user_id for ${user.email}: ${user.id}`);
    }

    // 2. Get the organization
    const org = await prisma.organizations.findFirst({
      where: {
        workos_org_id: {
          not: null
        }
      }
    });

    if (!org || !org.workos_org_id) {
      console.error('❌ No WorkOS organization found. Run sync-to-workos.js first.');
      return;
    }

    console.log(`\n📦 Found organization: ${org.title}`);
    console.log(`   WorkOS ID: ${org.workos_org_id}`);

    // 3. Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: SESSION_USER_ID }
    });

    if (!currentUser) {
      console.error(`❌ User not found: ${SESSION_USER_ID}`);
      return;
    }

    console.log(`\n👤 Current user: ${currentUser.email}`);
    console.log(`   WorkOS User ID: ${currentUser.workos_user_id}`);

    // 4. Check if membership already exists in WorkOS
    console.log('\n🔄 Checking WorkOS membership...');

    const existingMemberships = await workos.userManagement.listOrganizationMemberships({
      userId: currentUser.workos_user_id,
      organizationId: org.workos_org_id
    });

    if (existingMemberships.data.length > 0) {
      console.log(`✅ Membership already exists in WorkOS`);
      const membership = existingMemberships.data[0];
      console.log(`   Role: ${membership.role}`);
      console.log(`   Status: ${membership.status}`);

      // 5. Sync to local database
      const localMembership = await prisma.organization_memberships.findUnique({
        where: { workos_membership_id: membership.id }
      });

      if (!localMembership) {
        console.log('🔄 Syncing membership to local database...');
        await prisma.organization_memberships.create({
          data: {
            workos_membership_id: membership.id,
            userId: currentUser.id,
            organizationId: org.id,
            workos_role: typeof membership.role === 'object' ? membership.role.slug : membership.role,
            status: membership.status,
            cached_at: new Date()
          }
        });
        console.log('✅ Membership synced to local database');
      } else {
        console.log('✅ Membership already synced to local database');
      }
    } else {
      // 6. Create membership in WorkOS
      console.log('🔄 Creating membership in WorkOS...');

      const membership = await workos.userManagement.createOrganizationMembership({
        userId: currentUser.workos_user_id,
        organizationId: org.workos_org_id,
        roleSlug: 'admin'
      });

      console.log(`✅ Created membership in WorkOS`);
      console.log(`   Membership ID: ${membership.id}`);
      console.log(`   Role: ${membership.role}`);
      console.log(`   Status: ${membership.status}`);

      // 7. Sync to local database
      await prisma.organization_memberships.create({
        data: {
          workos_membership_id: membership.id,
          userId: currentUser.id,
          organizationId: org.id,
          workos_role: typeof membership.role === 'object' ? membership.role.slug : membership.role,
          status: membership.status,
          cached_at: new Date()
        }
      });

      console.log('✅ Membership synced to local database');
    }

    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Log out of your app (clear cookies)');
    console.log('2. Log back in via WorkOS');
    console.log('3. Navigate to http://localhost:8081/projects');
    console.log('4. You should now see your organization, role, and permissions!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    if (error.response?.data) {
      console.error('WorkOS API Error:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    await prisma.$disconnect();
  }
}

fixAndSync();
