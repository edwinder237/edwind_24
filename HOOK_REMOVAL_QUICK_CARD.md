# Hook Removal Safety - Quick Reference Card

## At a Glance

| Hook File | Lines | Usage | Safe? | Confidence | Action |
|-----------|-------|-------|-------|-----------|--------|
| **useAttendanceManagement.js** | 180 | 0 (ref only) | YES | 95% | DELETE NOW |
| **useAttendanceManagementRTK.js** | 212 | 2 (Attendees.js) | NO YET | N/A | MIGRATE FIRST |
| **useAttendanceManagementCommands.js** | 227 | 0 | YES | 95% | DELETE NOW |
| **useAddParticipantsDialog.js** | 115 | 0 | YES | 95% | DELETE NOW |
| **useNormalizedAttendance.js** | 276 | 0 | YES | 98% | DELETE NOW |

---

## Phase 1: Delete 4 Files NOW (5 min)

```bash
# Delete these 4 dead code files
rm src/sections/apps/project-manager/Poject-page/Agenda-tab/features/participants/hooks/useAttendanceManagement.js
rm src/sections/apps/project-manager/Poject-page/Agenda-tab/features/participants/hooks/useAttendanceManagementCommands.js
rm src/sections/apps/project-manager/Poject-page/Agenda-tab/features/participants/hooks/useAddParticipantsDialog.js
rm src/sections/apps/project-manager/Poject-page/Agenda-tab/features/participants/hooks/useNormalizedAttendance.js
```

**Update `hooks/index.js` - Remove these 4 lines:**
```javascript
// DELETE THESE:
export { useAttendanceManagement as useAttendanceManagementLegacy } from './useAttendanceManagement';
export { default as useAttendanceManagementCommands } from './useAttendanceManagementCommands';
export { default as useAddParticipantsDialog } from './useAddParticipantsDialog';
export { default as useNormalizedAttendance } from './useNormalizedAttendance';

// KEEP THESE:
export { useAttendanceManagementCQRS as useAttendanceManagement } from './useAttendanceManagementCQRS';
export { default as useAttendanceManagementCQRS } from './useAttendanceManagementCQRS';
export { default as useParticipantData } from './useParticipantData';
export { default as useAddParticipantsDialogRTK } from './useAddParticipantsDialogRTK';
```

---

## Phase 2: Migrate RTK to CQRS (15 min + testing)

**File: `components/Attendees.js`**

**Change Line 23:**
```javascript
// OLD
import { useAttendanceManagementRTK } from '../hooks/useAttendanceManagementRTK';

// NEW
import { useAttendanceManagementCQRS } from '../hooks/useAttendanceManagementCQRS';
```

**Change Line 106:**
```javascript
// OLD
const attendanceManagement = useAttendanceManagementRTK(
  eventParticipants, 
  selectedEvent, 
  singleProject
);

// NEW
const attendanceManagement = useAttendanceManagementCQRS(
  eventParticipants, 
  selectedEvent, 
  singleProject
);
```

**Test these workflows:**
- Mark participant present/absent/late
- Remove participant from event
- Move participant to group
- Verify notifications appear

---

## Phase 3: Delete RTK Hook (2 min)

After Phase 2 is tested and working:

```bash
rm src/sections/apps/project-manager/Poject-page/Agenda-tab/features/participants/hooks/useAttendanceManagementRTK.js
```

**Update `hooks/index.js` - Remove:**
```javascript
export { default as useAttendanceManagementRTK } from './useAttendanceManagementRTK';
```

---

## Phase 4: Verification (5 min)

```bash
# Run these commands to verify no broken imports
grep -r "useAttendanceManagement\b" src/ | grep -v "CQRS" | grep -v "Commands" | grep -v "RTK"
grep -r "useAddParticipantsDialog\b" src/ | grep -v "RTK"
grep -r "useNormalizedAttendance" src/

# Build to catch any remaining issues
npm run build
```

**Expected Output:** No matches found (all clean)

---

## Why Safe?

- **4 files have ZERO component usage** - only referenced in index.js as re-exports
- **All functionality migrated** to useAttendanceManagementCQRS (CQRS version)
- **Only 1 hook actively used** (RTK version) - has clear migration path to CQRS
- **API compatible** - drop-in replacement, same return interface
- **Frontend only** - no database or production impact

---

## Rollback (If Needed)

```bash
git restore src/sections/apps/project-manager/Poject-page/Agenda-tab/features/participants/
```

---

## Risk Assessment

| Phase | Risk | Time | Impact |
|-------|------|------|--------|
| Phase 1 (Delete 4) | VERY LOW | 5m | None |
| Phase 2 (Migrate) | LOW | 15m | Cache behavior (better) |
| Phase 3 (Delete RTK) | VERY LOW | 2m | None |
| Phase 4 (Verify) | VERY LOW | 5m | Confidence check |
| **TOTAL** | **VERY LOW** | **27m** | **None** |

---

## Dead Code Being Deleted

### 1. useAttendanceManagement.js (Oct 1, 2024)
- Oldest version using Redux reducers directly
- Marked as "Legacy" in code comments
- Zero component usage
- 180 lines of unused code

### 2. useAttendanceManagementCommands.js (Oct 18, 2024)
- Experimental semantic commands implementation
- Never integrated into component tree
- 227 lines of unused code

### 3. useAddParticipantsDialog.js (Oct 13, 2024)
- Legacy version fully replaced by RTK variant
- Both use same underlying command
- 115 lines of unused code

### 4. useNormalizedAttendance.js (Oct 1, 2024)
- Exploring old EntityAdapter pattern
- Never used anywhere
- 276 lines of unused code (+ bonus unused hook)

**Total dead code removed: ~798 lines**

---

## Currently Active Hooks (KEEP THESE)

1. **useAttendanceManagementCQRS.js** - CQRS pattern, semantic commands
2. **useAddParticipantsDialogRTK.js** - Dialog state management
3. **useParticipantData.js** - Data transformation and filtering

---

## Architecture Evolution

```
OLD PATTERN (Delete):
useAttendanceManagement.js → Redux reducers

INTERMEDIATE (Delete after migration):
useAttendanceManagementRTK.js → RTK Query mutations

CURRENT (Keep):
useAttendanceManagementCQRS.js → Semantic commands
```

---

Generated: 2025-11-02
Analysis: Comprehensive codebase grep + git history + code review
Confidence: 95%+ for all 4 deletions, LOW risk migration for RTK
