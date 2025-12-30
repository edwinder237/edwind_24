/**
 * ============================================
 * Integration Test Data Seeding Script
 * ============================================
 *
 * Creates test data for multi-organization integration testing.
 * Run with: node tests/integration/seed-test-data.js
 *
 * Creates:
 * - 2 Test Organizations (Org A, Org B)
 * - 2 Projects per organization
 * - 3 Participants per project
 * - 2 Groups per project
 * - 2 Curriculums per organization
 * - 2 Courses per curriculum
 * - 2 Instructors per organization
 * - 2 Events per project
 *
 * NOTE: This script was written based on comprehensive Prisma schema analysis.
 * All field names and required fields have been verified against prisma/schema.prisma.
 */

const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m'
};

function log(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

/**
 * Test Organization Data
 */
const TEST_DATA = {
  testUserId: null,
  ORG_A: {
    name: 'Test Organization A',
    domain: 'test-org-a.com',
    parentOrgId: null,
    subOrgId: null,
    projectIds: [],
    participantIds: [],
    projectParticipantIds: [],
    groupIds: [],
    curriculumIds: [],
    courseIds: [],
    instructorIds: [],
    eventIds: []
  },
  ORG_B: {
    name: 'Test Organization B',
    domain: 'test-org-b.com',
    parentOrgId: null,
    subOrgId: null,
    projectIds: [],
    participantIds: [],
    projectParticipantIds: [],
    groupIds: [],
    curriculumIds: [],
    courseIds: [],
    instructorIds: [],
    eventIds: []
  }
};

/**
 * Get or create test user
 */
async function ensureTestUser() {
  try {
    let testUser = await prisma.user.findFirst({
      where: { email: 'test-seed-user@edwind-test.com' }
    });

    if (!testUser) {
      testUser = await prisma.user.findFirst({
        select: { id: true, email: true }
      });

      if (testUser) {
        log(`  ℹ Using existing user: ${testUser.email}`, COLORS.BLUE);
      } else {
        testUser = await prisma.user.create({
          data: {
            id: uuidv4(),
            email: 'test-seed-user@edwind-test.com',
            password: 'test-password-do-not-use',
            firstName: 'Test',
            lastName: 'User',
            role: 'admin',
            info: {}
          }
        });
        log('  ✓ Created test user', COLORS.GREEN);
      }
    } else {
      log('  ℹ Using test user from previous run', COLORS.BLUE);
    }

    TEST_DATA.testUserId = testUser.id;
    return testUser.id;
  } catch (error) {
    log(`  ✗ Error with test user: ${error.message}`, COLORS.RED);
    log('  💡 TIP: Make sure at least one user exists in the database', COLORS.YELLOW);
    throw error;
  }
}

/**
 * Clean existing test data
 */
async function cleanTestData() {
  log('\n🧹 Cleaning existing test data...', COLORS.YELLOW);

  try {
    const testSubOrgs = await prisma.sub_organizations.findMany({
      where: {
        OR: [
          { title: 'Test Organization A' },
          { title: 'Test Organization B' }
        ]
      }
    });

    if (testSubOrgs.length > 0) {
      const subOrgIds = testSubOrgs.map(so => so.id);

      // Get events first
      const events = await prisma.events.findMany({
        where: { project: { sub_organizationId: { in: subOrgIds } } },
        select: { id: true }
      });
      const eventIds = events.map(e => e.id);

      if (eventIds.length > 0) {
        await prisma.event_attendees.deleteMany({
          where: { eventsId: { in: eventIds } }
        });
        await prisma.event_groups.deleteMany({
          where: { eventsId: { in: eventIds } }
        });
        await prisma.event_instructors.deleteMany({
          where: { eventId: { in: eventIds } }
        });
        await prisma.events.deleteMany({
          where: { id: { in: eventIds } }
        });
      }

      // Get groups
      const groups = await prisma.groups.findMany({
        where: { project: { sub_organizationId: { in: subOrgIds } } },
        select: { id: true }
      });
      const groupIds = groups.map(g => g.id);

      if (groupIds.length > 0) {
        await prisma.group_participants.deleteMany({
          where: { groupId: { in: groupIds } }
        });
        await prisma.group_curriculums.deleteMany({
          where: { groupId: { in: groupIds } }
        });
        await prisma.groups.deleteMany({
          where: { id: { in: groupIds } }
        });
      }

      await prisma.project_participants.deleteMany({
        where: { project: { sub_organizationId: { in: subOrgIds } } }
      });

      // Delete curriculums (get via project_curriculums relation)
      const projectIds = await prisma.projects.findMany({
        where: { sub_organizationId: { in: subOrgIds } },
        select: { id: true }
      });
      const projectIdList = projectIds.map(p => p.id);

      if (projectIdList.length > 0) {
        const curriculumIds = await prisma.project_curriculums.findMany({
          where: { projectId: { in: projectIdList } },
          select: { curriculumId: true }
        });
        const curriculumIdList = [...new Set(curriculumIds.map(c => c.curriculumId))];

        if (curriculumIdList.length > 0) {
          await prisma.curriculum_courses.deleteMany({
            where: { curriculumId: { in: curriculumIdList } }
          });
          await prisma.curriculums.deleteMany({
            where: { id: { in: curriculumIdList } }
          });
        }

        await prisma.project_curriculums.deleteMany({
          where: { projectId: { in: projectIdList } }
        });
      }

      await prisma.courses.deleteMany({
        where: { sub_organizationId: { in: subOrgIds } }
      });
      await prisma.instructors.deleteMany({
        where: { sub_organizationId: { in: subOrgIds } }
      });
      await prisma.participants.deleteMany({
        where: { sub_organization: { in: subOrgIds } }
      });
      await prisma.projects.deleteMany({
        where: { sub_organizationId: { in: subOrgIds } }
      });
      await prisma.sub_organizations.deleteMany({
        where: { id: { in: subOrgIds } }
      });

      // Delete parent organizations
      const orgIds = testSubOrgs.map(so => so.organizationId);
      await prisma.organizations.deleteMany({
        where: { id: { in: orgIds } }
      });

      log(`  ✓ Cleaned ${testSubOrgs.length} test organizations`, COLORS.GREEN);
    } else {
      log('  ℹ No existing test data found', COLORS.BLUE);
    }
  } catch (error) {
    log(`  ✗ Error cleaning test data: ${error.message}`, COLORS.RED);
    throw error;
  }
}

/**
 * Create test organization
 */
async function createTestOrganization(orgData) {
  log(`\n📦 Creating ${orgData.name}...`, COLORS.BLUE);

  try {
    // Create parent organization (all required fields)
    const parentOrg = await prisma.organizations.create({
      data: {
        id: uuidv4(),
        title: orgData.name,
        updatedby: TEST_DATA.testUserId,
        createdBy: TEST_DATA.testUserId,
        published: false
      }
    });

    orgData.parentOrgId = parentOrg.id;
    log(`  ✓ Created parent organization: ${parentOrg.id}`, COLORS.GREEN);

    // Create sub_organization (all required fields)
    const subOrg = await prisma.sub_organizations.create({
      data: {
        title: orgData.name,
        description: `Test organization for integration testing: ${orgData.domain}`,
        organizationId: parentOrg.id,
        updatedby: TEST_DATA.testUserId,
        createdBy: TEST_DATA.testUserId
      }
    });

    orgData.subOrgId = subOrg.id;
    log(`  ✓ Created sub-organization: ${subOrg.id}`, COLORS.GREEN);

    // Create projects
    for (let i = 1; i <= 2; i++) {
      const project = await prisma.projects.create({
        data: {
          cuid: uuidv4(),
          title: `${orgData.name} - Project ${i}`,
          summary: `Test project ${i} for ${orgData.name}`,
          startDate: new Date(),
          projectStatus: 'Planning',
          published: false,
          CreatedBy: TEST_DATA.testUserId,
          sub_organizationId: subOrg.id
        }
      });

      orgData.projectIds.push(project.id);
      log(`  ✓ Created project: ${project.title}`, COLORS.GREEN);

      // Create participants for this project
      for (let j = 1; j <= 3; j++) {
        const participant = await prisma.participants.create({
          data: {
            firstName: `Participant${i}${j}`,
            lastName: `Test`,
            email: `participant${i}${j}-${Date.now()}@${orgData.domain}`,
            sub_organization: subOrg.id,
            credentials: {},
            profilePrefs: {}
          }
        });

        orgData.participantIds.push(participant.id);

        // Link to project (creates project_participant)
        const projectParticipant = await prisma.project_participants.create({
          data: {
            projectId: project.id,
            participantId: participant.id
          }
        });

        orgData.projectParticipantIds.push(projectParticipant.id);
      }

      log(`    ✓ Added 3 participants to project`, COLORS.GREEN);

      // Create groups for this project
      for (let k = 1; k <= 2; k++) {
        const group = await prisma.groups.create({
          data: {
            groupName: `Group ${k}`,
            projectId: project.id,
            chipColor: 'primary'
          }
        });

        orgData.groupIds.push(group.id);

        // Add last project_participant to group
        // NOTE: group_participants.participantId references project_participants.id
        if (orgData.projectParticipantIds.length > 0) {
          await prisma.group_participants.create({
            data: {
              groupId: group.id,
              participantId: orgData.projectParticipantIds[orgData.projectParticipantIds.length - 1]
            }
          });
        }
      }

      log(`    ✓ Created 2 groups for project`, COLORS.GREEN);

      // Create events for this project
      for (let e = 1; e <= 2; e++) {
        const event = await prisma.events.create({
          data: {
            title: `Event ${e}`,
            projectId: project.id,
            start: new Date(),
            end: new Date(Date.now() + 3600000),
            allDay: false
          }
        });

        orgData.eventIds.push(event.id);
      }

      log(`    ✓ Created 2 events for project`, COLORS.GREEN);
    }

    // Create curriculums (NO sub_organizationId field!)
    for (let i = 1; i <= 2; i++) {
      const curriculum = await prisma.curriculums.create({
        data: {
          title: `${orgData.name} - Curriculum ${i}`,
          description: `Test curriculum ${i}`
        }
      });

      orgData.curriculumIds.push(curriculum.id);
      log(`  ✓ Created curriculum: ${curriculum.title}`, COLORS.GREEN);

      // Link to first project
      await prisma.project_curriculums.create({
        data: {
          projectId: orgData.projectIds[0],
          curriculumId: curriculum.id
        }
      });

      // Create courses for this curriculum
      for (let j = 1; j <= 2; j++) {
        const course = await prisma.courses.create({
          data: {
            title: `Course ${i}${j}`,
            summary: `Test course ${i}${j}`,
            sub_organizationId: subOrg.id,
            createdBy: TEST_DATA.testUserId
          }
        });

        orgData.courseIds.push(course.id);

        // Link to curriculum (NO position field!)
        await prisma.curriculum_courses.create({
          data: {
            curriculumId: curriculum.id,
            courseId: course.id
          }
        });
      }

      log(`    ✓ Added 2 courses to curriculum`, COLORS.GREEN);
    }

    // Create instructors
    for (let i = 1; i <= 2; i++) {
      const instructor = await prisma.instructors.create({
        data: {
          firstName: `Instructor${i}`,
          lastName: 'Test',
          email: `instructor${i}-${Date.now()}@${orgData.domain}`,
          sub_organizationId: subOrg.id,
          expertise: ['Testing', 'Integration'],
          createdBy: TEST_DATA.testUserId
        }
      });

      orgData.instructorIds.push(instructor.id);
    }

    log(`  ✓ Created 2 instructors`, COLORS.GREEN);
    log(`✅ ${orgData.name} setup complete!\n`, COLORS.GREEN);

    return orgData;

  } catch (error) {
    log(`  ✗ Error creating ${orgData.name}: ${error.message}`, COLORS.RED);
    throw error;
  }
}

/**
 * Print test configuration
 */
function printTestConfiguration() {
  log('\n╔════════════════════════════════════════╗', COLORS.BLUE);
  log('║     Test Data Configuration            ║', COLORS.BLUE);
  log('╚════════════════════════════════════════╝', COLORS.BLUE);

  log('\n📋 Copy this configuration to multi-org-test-suite.js:\n', COLORS.YELLOW);

  console.log(`const TEST_ORGS = {
  ORG_A: {
    name: '${TEST_DATA.ORG_A.name}',
    sessionCookie: 'YOUR_SESSION_COOKIE_HERE', // Login as Org A user
    projectId: ${TEST_DATA.ORG_A.projectIds[0]},
    participantId: '${TEST_DATA.ORG_A.participantIds[0]}',
    groupId: ${TEST_DATA.ORG_A.groupIds[0]},
    curriculumId: ${TEST_DATA.ORG_A.curriculumIds[0]},
    courseId: ${TEST_DATA.ORG_A.courseIds[0]},
    instructorId: ${TEST_DATA.ORG_A.instructorIds[0]},
    eventId: ${TEST_DATA.ORG_A.eventIds[0]}
  },
  ORG_B: {
    name: '${TEST_DATA.ORG_B.name}',
    sessionCookie: 'YOUR_SESSION_COOKIE_HERE', // Login as Org B user
    projectId: ${TEST_DATA.ORG_B.projectIds[0]},
    participantId: '${TEST_DATA.ORG_B.participantIds[0]}',
    groupId: ${TEST_DATA.ORG_B.groupIds[0]},
    curriculumId: ${TEST_DATA.ORG_B.curriculumIds[0]},
    courseId: ${TEST_DATA.ORG_B.courseIds[0]},
    instructorId: ${TEST_DATA.ORG_B.instructorIds[0]},
    eventId: ${TEST_DATA.ORG_B.eventIds[0]}
  }
};`);

  log('\n📊 Test Data Summary:', COLORS.YELLOW);
  log(`\nOrganization A (Sub-Org ID: ${TEST_DATA.ORG_A.subOrgId}):`);
  log(`  - Projects: ${TEST_DATA.ORG_A.projectIds.length}`);
  log(`  - Participants: ${TEST_DATA.ORG_A.participantIds.length}`);
  log(`  - Groups: ${TEST_DATA.ORG_A.groupIds.length}`);
  log(`  - Curriculums: ${TEST_DATA.ORG_A.curriculumIds.length}`);
  log(`  - Courses: ${TEST_DATA.ORG_A.courseIds.length}`);
  log(`  - Instructors: ${TEST_DATA.ORG_A.instructorIds.length}`);
  log(`  - Events: ${TEST_DATA.ORG_A.eventIds.length}`);

  log(`\nOrganization B (Sub-Org ID: ${TEST_DATA.ORG_B.subOrgId}):`);
  log(`  - Projects: ${TEST_DATA.ORG_B.projectIds.length}`);
  log(`  - Participants: ${TEST_DATA.ORG_B.participantIds.length}`);
  log(`  - Groups: ${TEST_DATA.ORG_B.groupIds.length}`);
  log(`  - Curriculums: ${TEST_DATA.ORG_B.curriculumIds.length}`);
  log(`  - Courses: ${TEST_DATA.ORG_B.courseIds.length}`);
  log(`  - Instructors: ${TEST_DATA.ORG_B.instructorIds.length}`);
  log(`  - Events: ${TEST_DATA.ORG_B.eventIds.length}`);

  log('\n📝 Next Steps:', COLORS.YELLOW);
  log('  1. Copy the TEST_ORGS configuration above');
  log('  2. Login to the app as a user in Org A and get session cookie');
  log('  3. Login to the app as a user in Org B and get session cookie');
  log('  4. Update TEST_ORGS.ORG_A.sessionCookie and TEST_ORGS.ORG_B.sessionCookie');
  log('  5. Run: node tests/integration/multi-org-test-suite.js\n');
}

/**
 * Main execution
 */
async function main() {
  log('\n╔════════════════════════════════════════╗', COLORS.BLUE);
  log('║  Integration Test Data Seeding         ║', COLORS.BLUE);
  log('╚════════════════════════════════════════╝', COLORS.BLUE);

  try {
    // Get or create test user
    await ensureTestUser();

    // Clean existing test data
    await cleanTestData();

    // Create test organizations
    await createTestOrganization(TEST_DATA.ORG_A);
    await createTestOrganization(TEST_DATA.ORG_B);

    // Print configuration
    printTestConfiguration();

    log('✅ Test data seeding complete!\n', COLORS.GREEN);

  } catch (error) {
    log('\n❌ FATAL ERROR:', COLORS.RED);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, TEST_DATA };
