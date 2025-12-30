const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getOrganizationContext(organizationId) {
  try {
    const organization = await prisma.organizations.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        workos_org_id: true,
        title: true
      }
    });

    if (!organization) {
      return null;
    }

    // Get all sub-organizations for this organization
    const subOrganizations = await prisma.sub_organizations.findMany({
      where: { organizationId: organizationId },
      select: {
        id: true,
        title: true
      }
    });

    const subOrganizationIds = subOrganizations.map(so => so.id);

    return {
      organizationId: organization.id,
      workosOrgId: organization.workos_org_id,
      title: organization.title,
      subOrganizationIds
    };

  } catch (error) {
    console.error('Error fetching organization context:', error);
    return null;
  }
}

async function main() {
  // Test with Solution Media 360
  const orgId = '232a3071-54c3-4efd-82de-dd99130db39c';

  console.log(`\nTesting getOrganizationContext for: Solution Media 360 (${orgId})`);
  const context = await getOrganizationContext(orgId);
  console.log('\nContext returned:');
  console.log(JSON.stringify(context, null, 2));

  // Count projects for these sub-org IDs
  if (context && context.subOrganizationIds.length > 0) {
    const projectCount = await prisma.projects.count({
      where: {
        sub_organizationId: {
          in: context.subOrganizationIds
        }
      }
    });
    console.log(`\nProjects count for sub-org IDs [${context.subOrganizationIds}]: ${projectCount}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
