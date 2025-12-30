# Modules Feature

This feature handles course module progress tracking, activity completion, and progress visualization for training events.

## Components

### ModulesWidget
Main component that displays course modules in an accordion layout with completion tracking.

**Location:** `components/ModulesWidget.js`

**Usage:**
```jsx
import { ModulesWidget } from '../features/modules/components';

<ModulesWidget eventState={scheduleState} />
```

**Props:**
- `eventState` - Object containing:
  - `courseTitle` - Title of the course
  - `modules` - Array of module objects
  - `course` - Course object with details
  - `selectedEvent` - Currently selected event
  - `participants` - Array of participants

**Features:**
- Accordion-style module display
- Progress tracking per module
- Completion status indicators
- Auto-expand next module on completion
- Integration with event progress API

### VerticalLinearStepper
Step-by-step activity tracker within each module.

**Location:** `components/VerticalLinearStepper.js`

**Usage:**
```jsx
import { VerticalLinearStepper } from '../features/modules/components';

<VerticalLinearStepper
  activities={module.activities}
  onComplete={handleModuleComplete}
  onReset={handleModuleReset}
  moduleIndex={index}
  eventId={selectedEvent?.id}
  moduleId={module.id}
  moduleTitle={module.title}
  eventData={selectedEvent}
/>
```

**Props:**
- `activities` - Array of activity objects
- `onComplete` - Callback when all activities are completed
- `onReset` - Callback when progress is reset
- `moduleIndex` - Index of the module
- `eventId` - ID of the event
- `moduleId` - ID of the module
- `moduleTitle` - Title of the module
- `eventData` - Full event object

**Features:**
- Linear progression through activities
- Activity type icons (video, lecture, presentation, group activity)
- Content URL links with "Open in new tab" action
- Email module link to participants
- Save/reset progress to database
- Loading states for async operations

## Data Flow

### CQRS Architecture
These components follow CQRS (Command Query Responsibility Segregation) patterns:

**Queries:**
- `getEventProgress(eventId)` - Fetches module and activity progress for an event

**Commands:**
- `saveModuleProgress(eventId, moduleId, activityIds)` - Saves module completion
- `resetModuleProgress(eventId, moduleId, activities)` - Resets module progress

**State:**
- `state.projectAgenda.moduleProgress` - Module completion data
- `state.projectAgenda.progressLoading` - Loading state for progress operations

## API Endpoints

- `POST /api/events/save-module-progress` - Save module completion
- `GET /api/events/get-progress` - Get event progress
- `POST /api/events/reset-module-progress` - Reset module progress
- `POST /api/email/send-module-link` - Email module URL to participants

## Migration Notes

**Previously located in:** `shared/components/`

**Moved to:** `features/modules/components/`

**Reason:** Module progress tracking is a distinct feature domain that deserves its own feature folder, making it easier to find and maintain alongside other features like events, participants, and scheduling.

**Files renamed:**
- `moduleswidget.js` → `ModulesWidget.js` (PascalCase for consistency)

## Related Features

- **Events** - Module progress is tracked per event
- **Participants** - Progress can be viewed per participant
- **Scheduling** - Course events display module progress
