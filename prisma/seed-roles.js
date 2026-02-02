const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * System Roles Seed Script
 *
 * These are Level 2-4 application roles (Level 0-1 are handled by WorkOS):
 * - Level 0: Admin (WorkOS "owner" role)
 * - Level 1: Client Admin (WorkOS "admin" role)
 * - Level 2: Training Manager (database)
 * - Level 3: Training Coordinator, Instructor (database)
 * - Level 4: Participant, Viewer (database)
 */

const SYSTEM_ROLES = [
  {
    slug: 'training_manager',
    name: 'Training Manager',
    description: 'Creates and manages training projects, assigns resources, monitors progress',
    hierarchyLevel: 2
  },
  {
    slug: 'training_coordinator',
    name: 'Training Coordinator',
    description: 'Handles logistics, scheduling, and event coordination for assigned projects',
    hierarchyLevel: 3
  },
  {
    slug: 'instructor',
    name: 'Instructor',
    description: 'Delivers training sessions, grades assessments, and tracks attendance',
    hierarchyLevel: 3
  },
  {
    slug: 'participant',
    name: 'Participant',
    description: 'Learner who takes courses and completes assessments',
    hierarchyLevel: 4
  },
  {
    slug: 'viewer',
    name: 'Viewer',
    description: 'Read-only access for stakeholders and observers',
    hierarchyLevel: 4
  }
];

async function main() {
  console.log('Seeding system roles...\n');

  for (const role of SYSTEM_ROLES) {
    const result = await prisma.system_roles.upsert({
      where: { slug: role.slug },
      update: {
        name: role.name,
        description: role.description,
        hierarchyLevel: role.hierarchyLevel
      },
      create: role
    });

    console.log(`  [Level ${role.hierarchyLevel}] ${result.name} (${result.slug})`);
  }

  console.log('\nDone seeding roles!');

  // Display summary
  const count = await prisma.system_roles.count();
  console.log(`\nTotal roles in database: ${count}`);
}

main()
  .catch((error) => {
    console.error('Error seeding roles:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
