# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
```bash
# Install dependencies (uses pnpm)
pnpm install

# Run development server (Turbopack enabled, port 8081)
npm run dev

# Build production bundle (includes Prisma generation)
npm run build

# Start production server
npm start

# Database seeding
npm run seed
```

### Database Operations
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Reset database and reseed
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```

## Project Architecture

### Application Overview
EDWIND is a learning management system (LMS) focused on training project management with a sophisticated role-based access control system. The application manages courses, curriculums, projects, participants, and instructors through a comprehensive project lifecycle.

### Technology Stack
- **Frontend**: Next.js 15 with React 18, Material-UI 5, Ant Design Icons
- **Backend**: Next.js API Routes with Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: WorkOS AuthKit integration
- **State Management**: Redux Toolkit with Redux Persist
- **Styling**: Material-UI + Custom themes, Emotion for CSS-in-JS
- **Calendar**: FullCalendar with custom scheduling logic
- **Maps**: Google Maps API integration

### Core Domain Models

#### User Management
- **Users**: Multi-role system (Admin, Project Manager, Instructor, Participant)
- **Organizations**: Hierarchical structure with sub-organizations
- **Role-Based Access Control**: Fine-grained permissions per role

#### Learning Management
- **Courses**: Modular course structure with activities and objectives
- **Curriculums**: Collections of courses with sequencing
- **Projects**: Training programs with participants, schedules, and deliverables
- **Training Plans**: Structured learning paths with completion tracking

#### Project Lifecycle
- **Project Creation**: Multi-step wizard with curriculum assignment
- **Participant Enrollment**: Group management and role assignments  
- **Schedule Management**: Calendar integration with event tracking
- **Progress Tracking**: Completion metrics and reporting

### Key Architecture Patterns

#### State Management Flow
```
Component → Redux Action → API Route → Database → Prisma → Response → Redux Store → Component Update
```

#### Page Structure
- **Pages**: Next.js file-based routing in `src/pages/`
- **API Routes**: Backend logic in `src/pages/api/`
- **Sections**: Reusable page sections in `src/sections/`
- **Components**: Shared components in `src/components/`

#### Layout System
- **MainLayout**: Persistent layout with drawer navigation
- **Navigation**: Menu items defined in `src/menu-items/`
- **Breadcrumbs**: Dynamic breadcrumb generation
- **Theme System**: Multiple theme variants with Material-UI overrides

### Critical File Locations

#### Configuration
- `src/config.js`: Application constants and theme configuration
- `next.config.js`: Next.js configuration with custom webpack setup
- `prisma/schema.prisma`: Database schema definitions

#### Core State Management
- `src/store/index.js`: Redux store configuration
- `src/store/reducers/`: Feature-specific reducers (projects, courses, etc.)

#### Authentication & Security
- `src/components/AuthGuard.js`: Route protection logic
- `src/pages/api/auth/`: WorkOS authentication endpoints
- Role-based access controls implemented throughout API routes

#### Project Management Core
- `src/sections/apps/project-manager/`: Project management features
- `src/pages/projects/[id].js`: Dynamic project detail pages
- `src/sections/apps/project-manager/Poject-page/`: Project page components with tabs

### Database Schema Highlights

#### Key Relationships
- Organizations → Sub-Organizations → Users → Projects
- Projects → Curriculums → Courses → Modules → Activities
- Projects → Participants (with roles) → Groups
- Events → Projects/Participants with attendance tracking

#### Important Tables
- `projects`: Core project entities with status tracking
- `project_participants`: Many-to-many with role assignments
- `events`: Calendar events with instructor and participant assignments
- `courses`: Modular learning content with completion tracking

### Development Guidelines

#### API Route Patterns
- Consistent naming: `fetch*`, `create*`, `update*`, `delete*`
- Database operations prefixed with `db-*`
- Error handling with try/catch and proper HTTP status codes
- Input validation using schema validation

#### Component Organization
- Feature-based folder structure under `src/sections/apps/`
- Shared components in `src/components/`
- Material-UI theme overrides in `src/themes/overrides/`

#### State Management Patterns
- Actions use Redux Toolkit's `createAsyncThunk`
- API calls through custom axios utility
- Loading and error states managed consistently
- Optimistic updates where appropriate

### Testing Considerations
- No explicit test framework configured
- Use `npm run build` to verify TypeScript/syntax correctness
- Development server at `http://localhost:8081`

### Security & Access Control
- WorkOS handles authentication and session management
- Role-based permissions enforced at API route level
- Admin users have elevated privileges including force deletion capabilities
- Environment variables for sensitive configuration (DATABASE_URL, WorkOS settings)

### Performance Considerations
- Turbopack enabled for faster development builds
- Code splitting with Next.js dynamic imports
- Database queries optimized with Prisma includes/selects
- Material-UI component lazy loading where beneficial