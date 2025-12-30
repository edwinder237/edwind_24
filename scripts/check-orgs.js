const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get all organizations with their sub-organizations
  const orgs = await prisma.organizations.findMany({
    include: {
      sub_organizations: true
    }
  });

  console.log('\n=== ORGANIZATIONS ===');
  for (const org of orgs) {
    console.log(`\n${org.title} (${org.id})`);
  }

  // Get all sub-organizations
  const subOrgs = await prisma.sub_organizations.findMany({
    include: {
      organization: true
    }
  });

  console.log('\n\n=== SUB-ORGANIZATIONS ===');
  for (const subOrg of subOrgs) {
    console.log(`${subOrg.title} (${subOrg.id}) -> ${subOrg.organization.title}`);
  }

  // Count projects per sub-organization
  console.log('\n\n=== PROJECTS PER SUB-ORGANIZATION ===');
  for (const subOrg of subOrgs) {
    const count = await prisma.projects.count({
      where: { sub_organizationId: subOrg.id }
    });
    console.log(`${subOrg.title}: ${count} projects`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
