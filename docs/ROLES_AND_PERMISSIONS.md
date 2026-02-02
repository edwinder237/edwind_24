# EDWIND LMS - Roles & Permissions System

> Complete documentation for the role-based access control (RBAC) system.

---

## Table of Contents

1. [Overview](#overview)
2. [Role Hierarchy](#role-hierarchy)
3. [Role Definitions](#role-definitions)
4. [Permission Categories](#permission-categories)
5. [App Flow: How Roles Are Resolved](#app-flow-how-roles-are-resolved)
6. [Data Sources](#data-sources)
7. [Permission Matrix](#permission-matrix)
8. [Database Schema](#database-schema)
9. [Implementation Guide](#implementation-guide)

---

## Overview

EDWIND uses a **3-step role resolution** system that combines WorkOS authentication with database-stored application roles.

### Quick Summary

| Level | Role | Source | Scope |
|-------|------|--------|-------|
| 0 | Admin | WorkOS | Full platform |
| 1 | Client Admin | WorkOS | Full organization |
| 2 | Training Manager | Database | Organization |
| 3 | Training Coordinator | Database | Assigned projects |
| 3 | Instructor | Database | Assigned courses |
| 4 | Participant | Database | Enrolled courses |
| 4 | Viewer | Database | Assigned (read-only) |

---

## Role Hierarchy

```
╔═══════════════════════════════════════════════════════════════════╗
║                        ADMIN TIER                                 ║
║                     (Managed by WorkOS)                           ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║   LEVEL 0: ADMIN (App Admin / Super Admin)                        ║
║   ────────────────────────────────────────                        ║
║   • Full platform access across ALL organizations                 ║
║   • Can manage billing, settings, all users                       ║
║   • Source: WorkOS "owner" role in ANY organization               ║
║                                                                   ║
║                              ↓                                    ║
║                                                                   ║
║   LEVEL 1: CLIENT ADMIN (Organization Admin)                      ║
║   ────────────────────────────────────────────                    ║
║   • Full access within THEIR organization only                    ║
║   • Can manage users, projects, courses, settings                 ║
║   • Source: WorkOS "admin" role in CURRENT organization           ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
                              ↓
╔═══════════════════════════════════════════════════════════════════╗
║                     OPERATIONAL TIER                              ║
║                   (Managed in Database)                           ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║   LEVEL 2: TRAINING MANAGER                                       ║
║   ─────────────────────────────                                   ║
║   • Create and manage projects                                    ║
║   • See ALL projects in organization                              ║
║   • Assign instructors, import participants                       ║
║   • View all reports, export data                                 ║
║                                                                   ║
║                              ↓                                    ║
║                                                                   ║
║   LEVEL 3: TRAINING COORDINATOR    |    INSTRUCTOR                ║
║   ─────────────────────────────    |    ───────────               ║
║   • Schedule events                |    • Teach courses           ║
║   • Book rooms                     |    • Grade assessments       ║
║   • Manage attendance              |    • Take attendance         ║
║   • ASSIGNED projects only         |    • ASSIGNED courses only   ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
                              ↓
╔═══════════════════════════════════════════════════════════════════╗
║                       END USER TIER                               ║
║                   (Managed in Database)                           ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║   LEVEL 4: PARTICIPANT             |    VIEWER                    ║
║   ────────────────────             |    ──────                    ║
║   • Take courses                   |    • Read-only access        ║
║   • Submit assessments             |    • View assigned projects  ║
║   • View own progress              |    • View reports            ║
║   • Download certificates          |    • No editing allowed      ║
║   • ENROLLED courses only          |    • ASSIGNED items only     ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## Role Definitions

### Level 0: Admin (Super Admin)

**Source:** WorkOS `owner` role in ANY organization

**Description:** Platform administrator with unrestricted access.

| Category | Permissions |
|----------|-------------|
| Projects | Create, View All, Edit, Delete, Archive |
| Courses | Create, Edit, Publish, Delete |
| Curriculums | Create, Edit, Publish, Delete, Assign |
| Participants | Add, Import, Edit, Remove, View Progress |
| Instructors | Add, Edit, Delete, Assign |
| Events | Create, Edit, Delete, Take Attendance |
| Assessments | Create, Grade, Override, View Results |
| Timeline | View All, Edit, Configure |
| Kirkpatrick | Create, Configure, View All, Export |
| Reports | View All, Export, Custom Reports |
| Resources | Full CRUD on all resources |
| Users | Invite, Edit Roles, Deactivate, Reset Password |
| Organizations | Create, Edit, Delete |
| Settings | Full access including billing |

---

### Level 1: Client Admin

**Source:** WorkOS `admin` role in CURRENT organization

**Description:** Organization administrator with full access within their org.

| Category | Permissions |
|----------|-------------|
| Projects | Create, View All (own org), Edit, Delete |
| Courses | Create, Edit, Publish, Delete (own org) |
| Curriculums | Create, Edit, Publish, Delete, Assign (own org) |
| Participants | Add, Import, Edit, Remove, View Progress (own org) |
| Instructors | Add, Edit, Delete, Assign (own org) |
| Events | Create, Edit, Delete, Take Attendance (own org) |
| Assessments | Create, Grade, Override, View Results (own org) |
| Timeline | View All, Edit, Configure (own org) |
| Kirkpatrick | Create, Configure, View Results, Export (own org) |
| Reports | View All, Export (own org) |
| Resources | Full CRUD (own org) |
| Users | Invite, Edit Roles, Deactivate (own org) |
| Sub-Organizations | Create, Edit, Delete |
| Settings | Organization settings only |

---

### Level 2: Training Manager

**Source:** Database `user_role_assignments` table

**Description:** Creates and manages training projects, assigns resources.

| Category | Permissions |
|----------|-------------|
| Projects | Create, View All, Edit, Delete Own |
| Courses | View All |
| Curriculums | View All, Assign to Projects |
| Participants | Add, Import, Edit, Remove, View Progress |
| Instructors | View, Assign to Projects |
| Events | Create, Edit, Delete |
| Assessments | View Results |
| Timeline | View All, Edit Own Projects |
| Kirkpatrick | Create Evaluations, View Results, Export |
| Reports | View All, Export |
| Resources | View, Assign |
| Users | View Only |

---

### Level 3: Training Coordinator

**Source:** Database `user_role_assignments` table

**Description:** Handles logistics and scheduling for assigned projects.

| Category | Permissions |
|----------|-------------|
| Projects | View Assigned |
| Courses | View |
| Curriculums | View |
| Participants | Add, Edit, View Progress |
| Instructors | View, Assign to Events |
| Events | Create, Edit, Take Attendance |
| Assessments | View Results |
| Timeline | View Assigned |
| Kirkpatrick | View Results |
| Reports | View Assigned |
| Resources | View, Book Rooms |
| Users | None |

---

### Level 3: Instructor

**Source:** Database `user_role_assignments` table

**Description:** Delivers training and grades assessments for assigned courses.

| Category | Permissions |
|----------|-------------|
| Projects | View Assigned |
| Courses | View Assigned, Edit Content (optional) |
| Curriculums | View Assigned |
| Participants | View Assigned, View Progress |
| Instructors | View/Edit Own Profile |
| Events | View Assigned, Take Attendance, Mark Complete |
| Assessments | Grade, View Results |
| Timeline | View Assigned |
| Kirkpatrick | Submit L1-2 Feedback, View Own |
| Reports | View Assigned |
| Resources | View Assigned |
| Users | None |

---

### Level 4: Participant

**Source:** Database `user_role_assignments` table

**Description:** Learner who takes courses and completes assessments.

| Category | Permissions |
|----------|-------------|
| Projects | View Enrolled |
| Courses | View Enrolled, Complete Activities |
| Curriculums | View Enrolled |
| Participants | View/Edit Own Profile |
| Events | View Enrolled, Mark Own Attendance |
| Assessments | Submit, View Own Results |
| Kirkpatrick | Submit Feedback (L1-4), View Own |
| Reports | View Own Progress |
| Certificates | View, Download Own |
| Resources | View Assigned (limited) |

---

### Level 4: Viewer

**Source:** Database `user_role_assignments` table

**Description:** Read-only access for stakeholders and observers.

| Category | Permissions |
|----------|-------------|
| Projects | View Assigned |
| Courses | View Published |
| Curriculums | View Published |
| Participants | View (no PII) |
| Events | View |
| Assessments | View Results |
| Timeline | View Assigned |
| Kirkpatrick | View Results |
| Reports | View Assigned |
| Resources | View |
| **Cannot:** | Create, Edit, or Delete anything |

---

## Permission Categories

### Core Features
- **Projects** - Training programs with schedules and participants
- **Courses** - Individual training courses with modules and activities
- **Curriculums** - Collections of courses grouped into learning paths
- **Participants** - Learners enrolled in training
- **Events** - Scheduled training sessions
- **Assessments** - Tests, quizzes, evaluations

### Features (In Development)
- **Timeline** - Project milestones, Gantt views, scheduling
- **Kirkpatrick** - Training evaluation (4 levels: Reaction, Learning, Behavior, Results)

### Resources
- **Instructors** - Trainers (Main, Assistant, Secondary types)
- **Training Recipients** - Organizations that receive training
- **Rooms** - Physical and virtual training spaces
- **Topics** - Training categories with icons/colors
- **Participant Roles** - Job titles for training targeting
- **Team Members** - Internal team management

### User Management
- **Users** - System user accounts
- **Organizations** - Top-level organizational units
- **Sub-Organizations** - Nested organizational units
- **Settings** - Configuration, integrations, billing

---

## App Flow: How Roles Are Resolved

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER MAKES REQUEST                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    STEP 1: AUTHENTICATE WITH WORKOS                     │
│                                                                         │
│   • User's session is validated                                         │
│   • Get user's organization memberships from WorkOS                     │
│   • Cache memberships in `organization_memberships` table               │
│                                                                         │
│   Result: List of { organizationId, workos_role }                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    STEP 2: CHECK isAppAdmin (Level 0)                   │
│                                                                         │
│   Query: Does user have workos_role === "owner" in ANY organization?    │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  const isAppAdmin = memberships.some(                           │   │
│   │    m => m.workos_role === 'owner'                               │   │
│   │  );                                                             │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   If YES → Return:                                                      │
│   {                                                                     │
│     isAppAdmin: true,                                                   │
│     isClientAdmin: false,                                               │
│     role: 'admin',                                                      │
│     permissions: ['*:*'],  // Full access                               │
│     hierarchyLevel: 0                                                   │
│   }                                                                     │
│   ──────────────────────────────────────────────────────────────────    │
│   If NO → Continue to Step 3                                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    STEP 3: CHECK isClientAdmin (Level 1)                │
│                                                                         │
│   Query: Does user have workos_role === "admin" in CURRENT org?         │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  const currentMembership = memberships.find(                    │   │
│   │    m => m.organizationId === currentOrgId                       │   │
│   │  );                                                             │   │
│   │  const isClientAdmin = ['admin', 'organization admin']          │   │
│   │    .includes(currentMembership?.workos_role);                   │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   If YES → Return:                                                      │
│   {                                                                     │
│     isAppAdmin: false,                                                  │
│     isClientAdmin: true,                                                │
│     role: 'client_admin',                                               │
│     permissions: ['projects:*', 'users:*', ...],  // All org perms      │
│     hierarchyLevel: 1                                                   │
│   }                                                                     │
│   ──────────────────────────────────────────────────────────────────    │
│   If NO → Continue to Step 4                                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    STEP 4: GET APP ROLE (Levels 2-4)                    │
│                                                                         │
│   Query: Look up user's role in `user_role_assignments` table           │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  const roleAssignment = await prisma.user_role_assignments      │   │
│   │    .findUnique({                                                │   │
│   │      where: { userId_organizationId: { userId, orgId } },       │   │
│   │      include: {                                                 │   │
│   │        role: {                                                  │   │
│   │          include: { permissions: true }                         │   │
│   │        }                                                        │   │
│   │      }                                                          │   │
│   │    });                                                          │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   Return:                                                               │
│   {                                                                     │
│     isAppAdmin: false,                                                  │
│     isClientAdmin: false,                                               │
│     role: 'training_manager' | 'instructor' | 'participant' | etc.,    │
│     permissions: ['projects:create', 'events:edit', ...],               │
│     hierarchyLevel: 2 | 3 | 4                                           │
│   }                                                                     │
│                                                                         │
│   If no role found → Default to 'viewer' with minimal permissions       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    STEP 5: BUILD USER CONTEXT                           │
│                                                                         │
│   Attach to request:                                                    │
│                                                                         │
│   req.orgContext = {                                                    │
│     userId: 'user_123',                                                 │
│     organizationId: 'org_456',                                          │
│     subOrganizationIds: [1, 2, 3],                                      │
│                                                                         │
│     // Role info                                                        │
│     isAppAdmin: false,                                                  │
│     isClientAdmin: false,                                               │
│     role: 'training_manager',                                           │
│     hierarchyLevel: 2,                                                  │
│                                                                         │
│     // Permissions                                                      │
│     permissions: [                                                      │
│       'projects:create',                                                │
│       'projects:read',                                                  │
│       'events:create',                                                  │
│       'participants:read',                                              │
│       ...                                                               │
│     ]                                                                   │
│   }                                                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    STEP 6: CHECK PERMISSION FOR ACTION                  │
│                                                                         │
│   In API route:                                                         │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  if (!hasPermission(req.orgContext.permissions, 'projects:create')) │
│   │    return res.status(403).json({ error: 'Forbidden' });         │   │
│   │  }                                                              │   │
│   │                                                                 │   │
│   │  // Proceed with action...                                      │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   Permission checking logic:                                            │
│   • '*:*' grants all permissions                                        │
│   • 'projects:*' grants all project permissions                         │
│   • 'projects:read' grants 'projects:read:own' (scope elevation)        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Sources

### Where Each Role Level Is Stored

```
┌───────────────────────────────────────────────────────────────────────────┐
│                              WORKOS                                       │
│                         (External Service)                                │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│   Manages:                                                                │
│   • User authentication                                                   │
│   • Organization memberships                                              │
│   • Basic roles: owner, admin, member                                     │
│                                                                           │
│   ┌─────────────────────────────────────────────────────────────────┐     │
│   │  Level 0: "owner" in ANY org → App Admin                        │     │
│   │  Level 1: "admin" in CURRENT org → Client Admin                 │     │
│   └─────────────────────────────────────────────────────────────────┘     │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Synced via webhook/API
                                    ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                         YOUR DATABASE (Neon)                              │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│   ┌─────────────────────────────────────────────────────────────────┐     │
│   │  organization_memberships (cached from WorkOS)                  │     │
│   │  ─────────────────────────────────────────────                  │     │
│   │  • userId                                                       │     │
│   │  • organizationId                                               │     │
│   │  • workos_role ← "owner", "admin", "member"                     │     │
│   │  • workos_membership_id                                         │     │
│   └─────────────────────────────────────────────────────────────────┘     │
│                                                                           │
│   ┌─────────────────────────────────────────────────────────────────┐     │
│   │  system_roles (role definitions)                                │     │
│   │  ──────────────────────────────                                 │     │
│   │  • slug: "training_manager", "instructor", etc.                 │     │
│   │  • name: "Training Manager"                                     │     │
│   │  • hierarchyLevel: 2, 3, 4                                      │     │
│   └─────────────────────────────────────────────────────────────────┘     │
│                                                                           │
│   ┌─────────────────────────────────────────────────────────────────┐     │
│   │  user_role_assignments (who has what role)                      │     │
│   │  ─────────────────────────────────────────                      │     │
│   │  • userId                                                       │     │
│   │  • roleId → system_roles                                        │     │
│   │  • organizationId                                               │     │
│   │  ─────────────────────────────────────────                      │     │
│   │  Level 2: training_manager                                      │     │
│   │  Level 3: training_coordinator, instructor                      │     │
│   │  Level 4: participant, viewer                                   │     │
│   └─────────────────────────────────────────────────────────────────┘     │
│                                                                           │
│   ┌─────────────────────────────────────────────────────────────────┐     │
│   │  permissions (permission definitions)                           │     │
│   │  ───────────────────────────────────                            │     │
│   │  • key: "projects:create", "events:read:assigned"               │     │
│   │  • resource: "projects", "events"                               │     │
│   │  • action: "create", "read", "update", "delete"                 │     │
│   │  • scope: null, "own", "assigned", "enrolled"                   │     │
│   └─────────────────────────────────────────────────────────────────┘     │
│                                                                           │
│   ┌─────────────────────────────────────────────────────────────────┐     │
│   │  role_permissions (which role has which permissions)            │     │
│   │  ───────────────────────────────────────────────                │     │
│   │  • roleId → system_roles                                        │     │
│   │  • permissionId → permissions                                   │     │
│   └─────────────────────────────────────────────────────────────────┘     │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## Permission Matrix

### Legend
- ✓ = Full access
- Own = Only records they created
- Org = Limited to their organization
- Assigned = Only items assigned to them
- Enrolled = Only courses they're enrolled in
- Own = Only their own data
- `-` = No access

### Core Permissions

| Permission | Admin | Client Admin | Training Manager | Coordinator | Instructor | Participant | Viewer |
|------------|:-----:|:------------:|:----------------:|:-----------:|:----------:|:-----------:|:------:|
| **PROJECTS** |
| Create | ✓ | Org | ✓ | - | - | - | - |
| View All | ✓ | Org | ✓ | - | - | - | - |
| View Assigned | ✓ | ✓ | ✓ | ✓ | ✓ | Enrolled | ✓ |
| Edit | ✓ | Org | ✓ | - | - | - | - |
| Delete | ✓ | Org | Own | - | - | - | - |
| **COURSES** |
| Create | ✓ | Org | - | - | - | - | - |
| Edit | ✓ | Org | - | - | Assigned | - | - |
| View | ✓ | Org | ✓ | ✓ | Assigned | Enrolled | Published |
| Publish | ✓ | Org | - | - | - | - | - |
| **EVENTS** |
| Create | ✓ | Org | ✓ | ✓ | - | - | - |
| Edit | ✓ | Org | ✓ | ✓ | - | - | - |
| Delete | ✓ | Org | ✓ | - | - | - | - |
| Attendance | ✓ | Org | ✓ | ✓ | ✓ | Self | - |
| **ASSESSMENTS** |
| Create | ✓ | Org | - | - | - | - | - |
| Grade | ✓ | Org | - | - | ✓ | - | - |
| Submit | - | - | - | - | - | ✓ | - |
| Override | ✓ | Org | - | - | - | - | - |
| View Results | ✓ | Org | ✓ | ✓ | Assigned | Own | Assigned |
| **REPORTS** |
| View All | ✓ | Org | ✓ | - | - | - | - |
| View Assigned | ✓ | ✓ | ✓ | ✓ | ✓ | Own | ✓ |
| Export | ✓ | Org | ✓ | - | - | - | - |
| **USERS** |
| Invite | ✓ | Org | - | - | - | - | - |
| View | ✓ | Org | ✓ | - | - | - | - |
| Edit Roles | ✓ | Org | - | - | - | - | - |
| Deactivate | ✓ | Org | - | - | - | - | - |

---

## Database Schema

### New Tables Required

```sql
-- SYSTEM ROLES (Level 2-4 definitions)
CREATE TABLE system_roles (
  id              SERIAL PRIMARY KEY,
  slug            VARCHAR(50) UNIQUE NOT NULL,  -- 'training_manager'
  name            VARCHAR(100) NOT NULL,         -- 'Training Manager'
  description     TEXT,
  hierarchy_level INT NOT NULL,                  -- 2, 3, 4
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- PERMISSIONS CATALOG
CREATE TABLE permissions (
  id          SERIAL PRIMARY KEY,
  key         VARCHAR(100) UNIQUE NOT NULL,  -- 'projects:create'
  name        VARCHAR(100) NOT NULL,          -- 'Create Projects'
  description TEXT,
  resource    VARCHAR(50) NOT NULL,           -- 'projects'
  action      VARCHAR(50) NOT NULL,           -- 'create'
  scope       VARCHAR(50),                    -- null, 'own', 'assigned'
  category    VARCHAR(50) NOT NULL,           -- 'projects'
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ROLE-PERMISSION MAPPING
CREATE TABLE role_permissions (
  id            SERIAL PRIMARY KEY,
  role_id       INT REFERENCES system_roles(id) ON DELETE CASCADE,
  permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
  created_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- USER ROLE ASSIGNMENTS
CREATE TABLE user_role_assignments (
  id                SERIAL PRIMARY KEY,
  user_id           VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
  role_id           INT REFERENCES system_roles(id),
  organization_id   VARCHAR(50) REFERENCES organizations(id) ON DELETE CASCADE,
  sub_organization_id INT,                      -- Optional scoping
  project_id        INT,                        -- Optional scoping
  assigned_at       TIMESTAMP DEFAULT NOW(),
  assigned_by       VARCHAR(50),                -- Who assigned
  expires_at        TIMESTAMP,                  -- Optional expiration
  is_active         BOOLEAN DEFAULT true,
  UNIQUE(user_id, organization_id)
);

-- AUDIT LOG
CREATE TABLE role_audit_log (
  id              SERIAL PRIMARY KEY,
  user_id         VARCHAR(50) NOT NULL,
  actor_id        VARCHAR(50) NOT NULL,
  action          VARCHAR(50) NOT NULL,         -- 'assigned', 'revoked'
  previous_role_id INT,
  new_role_id     INT,
  organization_id VARCHAR(50),
  reason          TEXT,
  ip_address      VARCHAR(50),
  created_at      TIMESTAMP DEFAULT NOW()
);
```

---

## Implementation Guide

### Phase 1: Schema Migration

```bash
npx prisma migrate dev --name add_role_system
```

### Phase 2: Seed Roles

```javascript
// prisma/seed-roles.js

const ROLES = [
  { slug: 'training_manager', name: 'Training Manager', hierarchyLevel: 2 },
  { slug: 'training_coordinator', name: 'Training Coordinator', hierarchyLevel: 3 },
  { slug: 'instructor', name: 'Instructor', hierarchyLevel: 3 },
  { slug: 'participant', name: 'Participant', hierarchyLevel: 4 },
  { slug: 'viewer', name: 'Viewer', hierarchyLevel: 4 }
];
```

### Phase 3: Update Middleware

```javascript
// src/lib/middleware/withOrgScope.js

// Step 1: Check App Admin (WorkOS owner)
const isAppAdmin = memberships.some(m => m.workos_role === 'owner');

// Step 2: Check Client Admin (WorkOS admin in current org)
const isClientAdmin = currentMembership?.workos_role === 'admin';

// Step 3: Get App Role (from database)
const roleAssignment = await prisma.user_role_assignments.findUnique({...});
```

### Phase 4: Add Permission Checks

```javascript
// In API routes
if (!hasPermission(req.orgContext.permissions, 'projects:create')) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

### Phase 5: Build Admin UI

- Role management page at `/admin/roles`
- User role assignment in user profile
- Permission viewer for transparency

---

## Quick Reference

### How to check if user can do something

```javascript
// Option 1: Check specific permission
if (hasPermission(req.orgContext.permissions, 'projects:create')) {
  // Allow action
}

// Option 2: Check admin status
if (req.orgContext.isAppAdmin || req.orgContext.isClientAdmin) {
  // Allow admin action
}

// Option 3: Check role level
if (req.orgContext.hierarchyLevel <= 2) {
  // User is Training Manager or higher
}
```

### How to assign a role

```javascript
await prisma.user_role_assignments.create({
  data: {
    userId: 'user_123',
    roleId: trainingManagerRole.id,
    organizationId: 'org_456',
    assignedBy: currentUser.id
  }
});
```

### How to get user's role

```javascript
const role = await prisma.user_role_assignments.findUnique({
  where: {
    userId_organizationId: {
      userId: 'user_123',
      organizationId: 'org_456'
    }
  },
  include: {
    role: {
      include: {
        permissions: { include: { permission: true } }
      }
    }
  }
});
```

---

## Summary

| What | Where | How |
|------|-------|-----|
| **Authentication** | WorkOS | Session/JWT |
| **App Admin (L0)** | WorkOS | `owner` in any org |
| **Client Admin (L1)** | WorkOS | `admin` in current org |
| **App Roles (L2-4)** | Database | `user_role_assignments` |
| **Permissions** | Database | `role_permissions` + `permissions` |
| **Subscriptions** | Stripe + Database | Separate from roles |

---

*Document Version: 1.0*
*Last Updated: January 2025*
