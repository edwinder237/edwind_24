const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================
// PERMISSIONS CATALOG
// ============================================

const PERMISSIONS = [
  // Projects
  { key: 'projects:create', name: 'Create Projects', resource: 'projects', action: 'create', scope: null, category: 'projects' },
  { key: 'projects:read', name: 'View All Projects', resource: 'projects', action: 'read', scope: null, category: 'projects' },
  { key: 'projects:read:assigned', name: 'View Assigned Projects', resource: 'projects', action: 'read', scope: 'assigned', category: 'projects' },
  { key: 'projects:read:enrolled', name: 'View Enrolled Projects', resource: 'projects', action: 'read', scope: 'enrolled', category: 'projects' },
  { key: 'projects:open', name: 'Open Project Details', resource: 'projects', action: 'open', scope: null, category: 'projects' },
  { key: 'projects:update', name: 'Edit Projects', resource: 'projects', action: 'update', scope: null, category: 'projects' },
  { key: 'projects:update:own', name: 'Edit Own Projects', resource: 'projects', action: 'update', scope: 'own', category: 'projects' },
  { key: 'projects:delete', name: 'Delete Projects', resource: 'projects', action: 'delete', scope: null, category: 'projects' },
  { key: 'projects:delete:own', name: 'Delete Own Projects', resource: 'projects', action: 'delete', scope: 'own', category: 'projects' },

  // Courses
  { key: 'courses:create', name: 'Create Courses', resource: 'courses', action: 'create', scope: null, category: 'courses' },
  { key: 'courses:read', name: 'View All Courses', resource: 'courses', action: 'read', scope: null, category: 'courses' },
  { key: 'courses:read:assigned', name: 'View Assigned Courses', resource: 'courses', action: 'read', scope: 'assigned', category: 'courses' },
  { key: 'courses:read:enrolled', name: 'View Enrolled Courses', resource: 'courses', action: 'read', scope: 'enrolled', category: 'courses' },
  { key: 'courses:read:published', name: 'View Published Courses', resource: 'courses', action: 'read', scope: 'published', category: 'courses' },
  { key: 'courses:update', name: 'Edit Courses', resource: 'courses', action: 'update', scope: null, category: 'courses' },
  { key: 'courses:update:assigned', name: 'Edit Assigned Courses', resource: 'courses', action: 'update', scope: 'assigned', category: 'courses' },
  { key: 'courses:publish', name: 'Publish Courses', resource: 'courses', action: 'publish', scope: null, category: 'courses' },
  { key: 'courses:delete', name: 'Delete Courses', resource: 'courses', action: 'delete', scope: null, category: 'courses' },

  // Curriculums
  { key: 'curriculums:create', name: 'Create Curriculums', resource: 'curriculums', action: 'create', scope: null, category: 'courses' },
  { key: 'curriculums:read', name: 'View All Curriculums', resource: 'curriculums', action: 'read', scope: null, category: 'courses' },
  { key: 'curriculums:read:assigned', name: 'View Assigned Curriculums', resource: 'curriculums', action: 'read', scope: 'assigned', category: 'courses' },
  { key: 'curriculums:update', name: 'Edit Curriculums', resource: 'curriculums', action: 'update', scope: null, category: 'courses' },
  { key: 'curriculums:assign', name: 'Assign Curriculums to Projects', resource: 'curriculums', action: 'assign', scope: null, category: 'courses' },
  { key: 'curriculums:publish', name: 'Publish Curriculums', resource: 'curriculums', action: 'publish', scope: null, category: 'courses' },
  { key: 'curriculums:delete', name: 'Delete Curriculums', resource: 'curriculums', action: 'delete', scope: null, category: 'courses' },

  // Events/Schedule
  { key: 'events:create', name: 'Create Events', resource: 'events', action: 'create', scope: null, category: 'events' },
  { key: 'events:read', name: 'View All Events', resource: 'events', action: 'read', scope: null, category: 'events' },
  { key: 'events:read:assigned', name: 'View Assigned Events', resource: 'events', action: 'read', scope: 'assigned', category: 'events' },
  { key: 'events:read:enrolled', name: 'View Enrolled Events', resource: 'events', action: 'read', scope: 'enrolled', category: 'events' },
  { key: 'events:update', name: 'Edit Events', resource: 'events', action: 'update', scope: null, category: 'events' },
  { key: 'events:delete', name: 'Delete Events', resource: 'events', action: 'delete', scope: null, category: 'events' },
  { key: 'events:attendance', name: 'Take Attendance', resource: 'events', action: 'attendance', scope: null, category: 'events' },
  { key: 'events:attendance:self', name: 'Mark Own Attendance', resource: 'events', action: 'attendance', scope: 'self', category: 'events' },

  // Participants
  { key: 'participants:create', name: 'Add Participants', resource: 'participants', action: 'create', scope: null, category: 'participants' },
  { key: 'participants:import', name: 'Import Participants', resource: 'participants', action: 'import', scope: null, category: 'participants' },
  { key: 'participants:read', name: 'View All Participants', resource: 'participants', action: 'read', scope: null, category: 'participants' },
  { key: 'participants:read:assigned', name: 'View Assigned Participants', resource: 'participants', action: 'read', scope: 'assigned', category: 'participants' },
  { key: 'participants:read:limited', name: 'View Participants (Limited PII)', resource: 'participants', action: 'read', scope: 'limited', category: 'participants' },
  { key: 'participants:update', name: 'Edit Participants', resource: 'participants', action: 'update', scope: null, category: 'participants' },
  { key: 'participants:update:own', name: 'Edit Own Profile', resource: 'participants', action: 'update', scope: 'own', category: 'participants' },
  { key: 'participants:delete', name: 'Remove Participants', resource: 'participants', action: 'delete', scope: null, category: 'participants' },
  { key: 'participants:progress', name: 'View Participant Progress', resource: 'participants', action: 'progress', scope: null, category: 'participants' },
  { key: 'participants:progress:own', name: 'View Own Progress', resource: 'participants', action: 'progress', scope: 'own', category: 'participants' },

  // Assessments
  { key: 'assessments:create', name: 'Create Assessments', resource: 'assessments', action: 'create', scope: null, category: 'assessments' },
  { key: 'assessments:read', name: 'View All Assessment Results', resource: 'assessments', action: 'read', scope: null, category: 'assessments' },
  { key: 'assessments:read:assigned', name: 'View Assigned Assessment Results', resource: 'assessments', action: 'read', scope: 'assigned', category: 'assessments' },
  { key: 'assessments:read:own', name: 'View Own Assessment Results', resource: 'assessments', action: 'read', scope: 'own', category: 'assessments' },
  { key: 'assessments:submit', name: 'Submit Assessments', resource: 'assessments', action: 'submit', scope: null, category: 'assessments' },
  { key: 'assessments:grade', name: 'Grade Assessments', resource: 'assessments', action: 'grade', scope: null, category: 'assessments' },
  { key: 'assessments:override', name: 'Override Assessment Grades', resource: 'assessments', action: 'override', scope: null, category: 'assessments' },

  // Timeline
  { key: 'timeline:read', name: 'View Timeline', resource: 'timeline', action: 'read', scope: null, category: 'timeline' },
  { key: 'timeline:read:assigned', name: 'View Assigned Project Timeline', resource: 'timeline', action: 'read', scope: 'assigned', category: 'timeline' },
  { key: 'timeline:update', name: 'Edit Timeline', resource: 'timeline', action: 'update', scope: null, category: 'timeline' },
  { key: 'timeline:update:own', name: 'Edit Own Project Timeline', resource: 'timeline', action: 'update', scope: 'own', category: 'timeline' },
  { key: 'timeline:configure', name: 'Configure Timeline Milestones', resource: 'timeline', action: 'configure', scope: null, category: 'timeline' },

  // Kirkpatrick
  { key: 'kirkpatrick:create', name: 'Create Evaluations', resource: 'kirkpatrick', action: 'create', scope: null, category: 'kirkpatrick' },
  { key: 'kirkpatrick:read', name: 'View All Kirkpatrick Results', resource: 'kirkpatrick', action: 'read', scope: null, category: 'kirkpatrick' },
  { key: 'kirkpatrick:read:assigned', name: 'View Assigned Project Results', resource: 'kirkpatrick', action: 'read', scope: 'assigned', category: 'kirkpatrick' },
  { key: 'kirkpatrick:read:own', name: 'View Own Submissions', resource: 'kirkpatrick', action: 'read', scope: 'own', category: 'kirkpatrick' },
  { key: 'kirkpatrick:submit', name: 'Submit Feedback (All Levels)', resource: 'kirkpatrick', action: 'submit', scope: null, category: 'kirkpatrick' },
  { key: 'kirkpatrick:submit:l1-2', name: 'Submit Feedback (L1-L2)', resource: 'kirkpatrick', action: 'submit', scope: 'l1-2', category: 'kirkpatrick' },
  { key: 'kirkpatrick:configure', name: 'Configure Evaluation Levels', resource: 'kirkpatrick', action: 'configure', scope: null, category: 'kirkpatrick' },
  { key: 'kirkpatrick:export', name: 'Export Kirkpatrick Results', resource: 'kirkpatrick', action: 'export', scope: null, category: 'kirkpatrick' },

  // Reports
  { key: 'reports:read', name: 'View All Reports', resource: 'reports', action: 'read', scope: null, category: 'reports' },
  { key: 'reports:read:assigned', name: 'View Assigned Project Reports', resource: 'reports', action: 'read', scope: 'assigned', category: 'reports' },
  { key: 'reports:read:own', name: 'View Own Progress Reports', resource: 'reports', action: 'read', scope: 'own', category: 'reports' },
  { key: 'reports:export', name: 'Export Reports', resource: 'reports', action: 'export', scope: null, category: 'reports' },
  { key: 'reports:custom', name: 'Create Custom Reports', resource: 'reports', action: 'custom', scope: null, category: 'reports' },

  // Certificates
  { key: 'certificates:read', name: 'View All Certificates', resource: 'certificates', action: 'read', scope: null, category: 'reports' },
  { key: 'certificates:read:own', name: 'View Own Certificates', resource: 'certificates', action: 'read', scope: 'own', category: 'reports' },
  { key: 'certificates:download', name: 'Download Certificates', resource: 'certificates', action: 'download', scope: null, category: 'reports' },
  { key: 'certificates:download:own', name: 'Download Own Certificates', resource: 'certificates', action: 'download', scope: 'own', category: 'reports' },

  // RESOURCES
  // Instructors
  { key: 'instructors:create', name: 'Add Instructors', resource: 'instructors', action: 'create', scope: null, category: 'resources' },
  { key: 'instructors:read', name: 'View All Instructors', resource: 'instructors', action: 'read', scope: null, category: 'resources' },
  { key: 'instructors:read:own', name: 'View Own Instructor Profile', resource: 'instructors', action: 'read', scope: 'own', category: 'resources' },
  { key: 'instructors:read:name', name: 'View Instructor Names Only', resource: 'instructors', action: 'read', scope: 'name', category: 'resources' },
  { key: 'instructors:update', name: 'Edit Instructors', resource: 'instructors', action: 'update', scope: null, category: 'resources' },
  { key: 'instructors:update:own', name: 'Edit Own Instructor Profile', resource: 'instructors', action: 'update', scope: 'own', category: 'resources' },
  { key: 'instructors:delete', name: 'Delete Instructors', resource: 'instructors', action: 'delete', scope: null, category: 'resources' },
  { key: 'instructors:assign', name: 'Assign Instructors to Projects/Events', resource: 'instructors', action: 'assign', scope: null, category: 'resources' },

  // Training Recipients
  { key: 'training_recipients:create', name: 'Add Training Recipients', resource: 'training_recipients', action: 'create', scope: null, category: 'resources' },
  { key: 'training_recipients:read', name: 'View All Training Recipients', resource: 'training_recipients', action: 'read', scope: null, category: 'resources' },
  { key: 'training_recipients:read:assigned', name: 'View Assigned Training Recipients', resource: 'training_recipients', action: 'read', scope: 'assigned', category: 'resources' },
  { key: 'training_recipients:update', name: 'Edit Training Recipients', resource: 'training_recipients', action: 'update', scope: null, category: 'resources' },
  { key: 'training_recipients:delete', name: 'Delete Training Recipients', resource: 'training_recipients', action: 'delete', scope: null, category: 'resources' },

  // Rooms
  { key: 'rooms:create', name: 'Add Rooms', resource: 'rooms', action: 'create', scope: null, category: 'resources' },
  { key: 'rooms:read', name: 'View All Rooms', resource: 'rooms', action: 'read', scope: null, category: 'resources' },
  { key: 'rooms:read:assigned', name: 'View Assigned Rooms', resource: 'rooms', action: 'read', scope: 'assigned', category: 'resources' },
  { key: 'rooms:update', name: 'Edit Rooms', resource: 'rooms', action: 'update', scope: null, category: 'resources' },
  { key: 'rooms:delete', name: 'Delete Rooms', resource: 'rooms', action: 'delete', scope: null, category: 'resources' },
  { key: 'rooms:book', name: 'Book Rooms for Events', resource: 'rooms', action: 'book', scope: null, category: 'resources' },

  // Topics
  { key: 'topics:create', name: 'Add Topics', resource: 'topics', action: 'create', scope: null, category: 'resources' },
  { key: 'topics:read', name: 'View All Topics', resource: 'topics', action: 'read', scope: null, category: 'resources' },
  { key: 'topics:update', name: 'Edit Topics', resource: 'topics', action: 'update', scope: null, category: 'resources' },
  { key: 'topics:delete', name: 'Delete Topics', resource: 'topics', action: 'delete', scope: null, category: 'resources' },

  // Participant Roles (job titles)
  { key: 'participant_roles:create', name: 'Add Participant Roles', resource: 'participant_roles', action: 'create', scope: null, category: 'resources' },
  { key: 'participant_roles:read', name: 'View All Participant Roles', resource: 'participant_roles', action: 'read', scope: null, category: 'resources' },
  { key: 'participant_roles:read:own', name: 'View Own Role', resource: 'participant_roles', action: 'read', scope: 'own', category: 'resources' },
  { key: 'participant_roles:update', name: 'Edit Participant Roles', resource: 'participant_roles', action: 'update', scope: null, category: 'resources' },
  { key: 'participant_roles:delete', name: 'Delete Participant Roles', resource: 'participant_roles', action: 'delete', scope: null, category: 'resources' },
  { key: 'participant_roles:assign', name: 'Assign Roles to Participants', resource: 'participant_roles', action: 'assign', scope: null, category: 'resources' },

  // Team Members
  { key: 'team_members:create', name: 'Add Team Members', resource: 'team_members', action: 'create', scope: null, category: 'resources' },
  { key: 'team_members:read', name: 'View Team Members', resource: 'team_members', action: 'read', scope: null, category: 'resources' },
  { key: 'team_members:update', name: 'Edit Team Members', resource: 'team_members', action: 'update', scope: null, category: 'resources' },
  { key: 'team_members:delete', name: 'Delete Team Members', resource: 'team_members', action: 'delete', scope: null, category: 'resources' },

  // USER MANAGEMENT
  { key: 'users:invite', name: 'Invite Users', resource: 'users', action: 'invite', scope: null, category: 'user_management' },
  { key: 'users:read', name: 'View All Users', resource: 'users', action: 'read', scope: null, category: 'user_management' },
  { key: 'users:update', name: 'Edit Users', resource: 'users', action: 'update', scope: null, category: 'user_management' },
  { key: 'users:update:roles', name: 'Edit User Roles', resource: 'users', action: 'update', scope: 'roles', category: 'user_management' },
  { key: 'users:deactivate', name: 'Deactivate Users', resource: 'users', action: 'deactivate', scope: null, category: 'user_management' },

  // Sub-Organizations
  { key: 'sub_organizations:create', name: 'Create Sub-Organizations', resource: 'sub_organizations', action: 'create', scope: null, category: 'user_management' },
  { key: 'sub_organizations:read', name: 'View Sub-Organizations', resource: 'sub_organizations', action: 'read', scope: null, category: 'user_management' },
  { key: 'sub_organizations:update', name: 'Edit Sub-Organizations', resource: 'sub_organizations', action: 'update', scope: null, category: 'user_management' },
  { key: 'sub_organizations:delete', name: 'Delete Sub-Organizations', resource: 'sub_organizations', action: 'delete', scope: null, category: 'user_management' },

  // Settings
  { key: 'settings:read', name: 'View Settings', resource: 'settings', action: 'read', scope: null, category: 'settings' },
  { key: 'settings:update', name: 'Manage Settings', resource: 'settings', action: 'update', scope: null, category: 'settings' },
  { key: 'settings:integrations', name: 'Manage Integrations', resource: 'settings', action: 'integrations', scope: null, category: 'settings' },
  { key: 'settings:billing', name: 'Manage Billing', resource: 'settings', action: 'billing', scope: null, category: 'settings' },

  // Roles & Permissions
  { key: 'roles:read', name: 'View Roles', resource: 'roles', action: 'read', scope: null, category: 'user_management' },
  { key: 'roles:permissions:read', name: 'View Role Permissions', resource: 'roles', action: 'permissions:read', scope: null, category: 'user_management' },
  { key: 'roles:permissions:update', name: 'Manage Role Permissions', resource: 'roles', action: 'permissions:update', scope: null, category: 'user_management' },
];

// ============================================
// DEFAULT PERMISSIONS PER ROLE
// ============================================

const ROLE_PERMISSIONS = {
  training_manager: [
    // Projects
    'projects:create', 'projects:read', 'projects:open', 'projects:update', 'projects:delete:own',
    // Courses (view only)
    'courses:read',
    // Curriculums
    'curriculums:read', 'curriculums:assign',
    // Events
    'events:create', 'events:read', 'events:update', 'events:delete',
    // Participants
    'participants:create', 'participants:import', 'participants:read', 'participants:update', 'participants:delete', 'participants:progress',
    // Assessments
    'assessments:read',
    // Timeline
    'timeline:read', 'timeline:update:own',
    // Kirkpatrick
    'kirkpatrick:create', 'kirkpatrick:read', 'kirkpatrick:export',
    // Reports
    'reports:read', 'reports:export',
    // Resources
    'instructors:read', 'instructors:assign',
    'training_recipients:read',
    'rooms:read', 'rooms:book',
    'topics:read',
    'participant_roles:read', 'participant_roles:assign',
    'team_members:read',
    // User Management (view only)
    'users:read',
    'sub_organizations:read',
    // Roles
    'roles:read',
  ],

  training_coordinator: [
    // Projects (assigned only)
    'projects:read:assigned', 'projects:open',
    // Courses (view only)
    'courses:read',
    // Curriculums (view only)
    'curriculums:read',
    // Events
    'events:create', 'events:read:assigned', 'events:update', 'events:attendance',
    // Participants
    'participants:create', 'participants:read:assigned', 'participants:update',
    // Assessments
    'assessments:read:assigned',
    // Timeline
    'timeline:read:assigned',
    // Kirkpatrick
    'kirkpatrick:read:assigned',
    // Reports
    'reports:read:assigned',
    // Resources
    'instructors:read', 'instructors:assign',
    'training_recipients:read:assigned',
    'rooms:read', 'rooms:book',
    'topics:read',
    'participant_roles:read', 'participant_roles:assign',
    'team_members:read',
  ],

  instructor: [
    // Projects (assigned only)
    'projects:read:assigned', 'projects:open',
    // Courses
    'courses:read:assigned', 'courses:update:assigned',
    // Curriculums
    'curriculums:read:assigned',
    // Events
    'events:read:assigned', 'events:attendance',
    // Participants
    'participants:read:assigned', 'participants:progress',
    // Assessments
    'assessments:read:assigned', 'assessments:grade',
    // Timeline
    'timeline:read:assigned',
    // Kirkpatrick
    'kirkpatrick:submit:l1-2', 'kirkpatrick:read:own',
    // Reports
    'reports:read:assigned',
    // Resources
    'instructors:read:own', 'instructors:update:own',
    'training_recipients:read:assigned',
    'rooms:read:assigned',
    'topics:read',
    'participant_roles:read',
  ],

  participant: [
    // Projects (enrolled only)
    'projects:read:enrolled', 'projects:open',
    // Courses
    'courses:read:enrolled',
    // Curriculums
    'curriculums:read:assigned',
    // Events
    'events:read:enrolled', 'events:attendance:self',
    // Participants (own profile only)
    'participants:read:own', 'participants:update:own', 'participants:progress:own',
    // Assessments
    'assessments:submit', 'assessments:read:own',
    // Kirkpatrick
    'kirkpatrick:submit', 'kirkpatrick:read:own',
    // Reports
    'reports:read:own',
    // Certificates
    'certificates:read:own', 'certificates:download:own',
    // Resources (minimal)
    'instructors:read:name',
    'rooms:read:assigned',
    'participant_roles:read:own',
  ],

  viewer: [
    // Projects (assigned only)
    'projects:read:assigned', 'projects:open',
    // Courses
    'courses:read:published',
    // Curriculums
    'curriculums:read:assigned',
    // Events
    'events:read:assigned',
    // Participants (limited PII)
    'participants:read:limited',
    // Assessments
    'assessments:read:assigned',
    // Timeline
    'timeline:read:assigned',
    // Kirkpatrick
    'kirkpatrick:read:assigned',
    // Reports
    'reports:read:assigned',
    // Resources (view only)
    'instructors:read:name',
    'training_recipients:read:assigned',
    'rooms:read',
    'topics:read',
    'participant_roles:read',
  ],
};

async function main() {
  console.log('Seeding permissions...\n');

  // 1. Create all permissions
  console.log('Creating permissions...');
  for (const perm of PERMISSIONS) {
    await prisma.permissions.upsert({
      where: { key: perm.key },
      update: perm,
      create: perm,
    });
  }
  console.log(`  ✓ Created ${PERMISSIONS.length} permissions\n`);

  // 2. Get all roles and permissions from database
  const roles = await prisma.system_roles.findMany();
  const permissions = await prisma.permissions.findMany();
  const permissionMap = Object.fromEntries(permissions.map(p => [p.key, p.id]));

  // 3. Create role-permission mappings
  console.log('Creating role-permission mappings...');
  for (const role of roles) {
    const rolePermKeys = ROLE_PERMISSIONS[role.slug] || [];
    let count = 0;

    for (const permKey of rolePermKeys) {
      const permissionId = permissionMap[permKey];
      if (!permissionId) {
        console.warn(`  ⚠ Permission not found: ${permKey}`);
        continue;
      }

      await prisma.role_permissions.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permissionId,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permissionId,
        },
      });
      count++;
    }
    console.log(`  [${role.name}] ${count} permissions assigned`);
  }

  console.log('\n✓ Done seeding permissions!');

  // Summary
  const totalRolePerms = await prisma.role_permissions.count();
  console.log(`\nSummary:`);
  console.log(`  - ${permissions.length} permissions in catalog`);
  console.log(`  - ${totalRolePerms} role-permission mappings`);
}

main()
  .catch((err) => {
    console.error('Error seeding permissions:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
