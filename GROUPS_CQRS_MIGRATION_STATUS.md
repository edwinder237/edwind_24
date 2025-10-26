# Groups Tab CQRS Migration - Implementation Status

## 🎯 Objective
Migrate the Groups tab to CQRS architecture with Event Bus integration, enabling automatic cascade updates between Groups and Agenda tabs when participants are added/removed from groups that are assigned to events.

## ✅ Completed Phases (1-6)

### Phase 1: RTK Query Endpoints ✓
**File Modified**: `src/store/api/projectApi.js`

**Added/Enhanced:**
1. ✅ Added new tag types for granular cache invalidation:
   - `GroupParticipants`
   - `GroupCurriculum`
   - `GroupProgress`

2. ✅ New Query: `getGroupsDetails`
   - Fetches all groups for a project
   - Normalizes groups into entity store
   - Cached for 10 minutes

3. ✅ Enhanced `addParticipantToGroup` mutation:
   - Added `cascadeToEvents: true` flag
   - Invalidates Event cache (cascade invalidation)
   - Normalizes updated events
   - Logs cascade operations

4. ✅ Enhanced `removeParticipantFromGroup` mutation:
   - Added cascade logic
   - Removes participant from events if no longer in any assigned group
   - Event cache invalidation

5. ✅ Enhanced `moveParticipantToGroup` mutation:
   - Dual cascade (add to new group's events, remove from old group's events)
   - Updates normalized stores for both groups and events
   - Detailed cascade logging

6. ✅ New Mutations: `assignCurriculumToGroup` and `removeCurriculumFromGroup`
   - Updates expected modules for events where group is enrolled
   - Invalidates progress caches
   - Normalizes curriculum data

### Phase 2-3: Group Commands Enhanced ✓
**File Modified**: `src/store/commands/groupCommands.js`

**Enhanced:**
1. ✅ `addParticipantToGroup` command:
   - Publishes `PARTICIPANT_ADDED_TO_GROUP` event with `cascadeInfo`
   - Publishes `GROUP_PARTICIPANT_CASCADED_TO_EVENTS` if cascade occurred
   - Includes affected event count in event payload

2. ✅ `removeParticipantFromGroup` command:
   - Publishes cascade events with `eventsToRemoveFrom` array
   - Emits separate cascade event for cross-domain communication

3. ✅ `moveParticipantBetweenGroups` command:
   - Publishes dual cascade events (add + remove)
   - Detailed cascade information in event payload
   - Separate events for add and remove cascades

### Phase 4-5: Cross-Domain Event Handlers ✓
**File Created**: `src/store/events/crossDomainEventHandlers.js`

**Implemented:**
1. ✅ Groups → Agenda event handlers:
   - `PARTICIPANT_ADDED_TO_GROUP` → invalidate Agenda cache
   - `PARTICIPANT_REMOVED_FROM_GROUP` → update events
   - `PARTICIPANT_MOVED_BETWEEN_GROUPS` → sync both tabs
   - `GROUP_DELETED` → cascade to events
   - `CURRICULUM_ASSIGNED_TO_GROUP` → update event expectations

2. ✅ Agenda → Groups event handlers:
   - `GROUP_ENROLLED_IN_EVENT` → refresh Groups tab
   - `GROUP_REMOVED_FROM_EVENT` → update Groups
   - `ATTENDANCE_STATUS_CHANGED` → recalculate group progress
   - `PARTICIPANT_ENROLLED_IN_EVENT` → update group stats
   - `PARTICIPANT_ROLE_UPDATED` → refresh groups

3. ✅ Progress recalculation triggers:
   - Aggregates multiple progress-related events
   - Debounced invalidation (500ms) to avoid excessive recalcs

4. ✅ System events:
   - `CACHE_INVALIDATED` → propagate to related caches
   - `DATA_SYNC_COMPLETED` → refresh affected domains

5. ✅ Helper functions:
   - `shouldCascadeToEvents(group, action)` - Check if cascade will occur
   - `getAffectedEventCount(group)` - Get event count for notifications

### Phase 6: Store Configuration ✓
**File Modified**: `src/store/index.js`

**Changes:**
1. ✅ Imported `initializeCrossDomainHandlers`
2. ✅ Called after `initializeEventHandlers(store)`
3. ✅ Cross-domain handlers now active on app startup

## 🚧 Remaining Phases (7-9)

### Phase 7: Complete useGroupsCRUDRTK Hook
**File to Modify**: `src/sections/apps/project-manager/Poject-page/Enrolment-tab/Groups/hooks/useGroupsCRUDRTK.js`

**TODO:**
- [ ] Update to use enhanced RTK Query mutations
- [ ] Add cascade notification handling
- [ ] Show detailed feedback about affected events
- [ ] Implement error recovery with cascade rollback
- [ ] Add loading states from mutations

### Phase 8: Update GroupsRTK Component
**File to Modify**: `src/sections/apps/project-manager/Poject-page/Enrolment-tab/Groups/GroupsRTK.js`

**TODO:**
- [ ] Subscribe to cascade events for real-time UI updates
- [ ] Show badges/indicators when groups are linked to events
- [ ] Add tooltips showing which events will be affected by actions
- [ ] Implement optimistic UI updates
- [ ] Add cascade warning dialogs for destructive actions

### Phase 9: Backend API Implementation
**Files to Create/Modify:**
- [ ] `src/pages/api/projects/add-participant-to-group.js`
- [ ] `src/pages/api/projects/remove-participant-from-group.js`
- [ ] `src/pages/api/projects/move-participant-between-groups.js`
- [ ] `src/pages/api/projects/assign-curriculum-to-group.js`
- [ ] `src/pages/api/projects/remove-curriculum-from-group.js`

**Required Backend Logic:**

#### add-participant-to-group.js
```javascript
// 1. Add participant to group
// 2. Find all events where this group is assigned
// 3. Add participant to those events (create event_attendees records)
// 4. Return affectedEvents array with updated event objects
```

#### remove-participant-from-group.js
```javascript
// 1. Remove participant from group
// 2. Find events where this group is assigned
// 3. Check if participant is in other groups assigned to those events
// 4. Remove from events where they have no other group assignment
// 5. Return eventsToRemoveFrom array
```

#### move-participant-between-groups.js
```javascript
// 1. Remove from old group, add to new group
// 2. Find events for both groups
// 3. Calculate eventsToAddTo (new group's events)
// 4. Calculate eventsToRemoveFrom (old group's exclusive events)
// 5. Perform cascade operations
// 6. Return both arrays
```

## 🎨 Cascade Logic Flow

```
User Action (Groups Tab)
    ↓
RTK Mutation (with cascadeToEvents: true)
    ↓
Backend API
    ├─ Update Group
    ├─ Find Affected Events
    ├─ Update Event Attendees
    └─ Return Cascade Info
    ↓
Command Publishes Event with cascadeInfo
    ↓
Event Bus Routes Event
    ├─ Groups Tab: Update UI
    └─ Agenda Tab: Invalidate Cache
    ↓
Agenda Auto-Refreshes with New Data
```

## 🔍 Testing Checklist

### Unit Tests Needed:
- [ ] RTK Query endpoint responses with cascade data
- [ ] Cross-domain event handler logic
- [ ] Cascade info calculation in commands
- [ ] Helper functions (shouldCascadeToEvents, etc.)

### Integration Tests Needed:
- [ ] Add participant to group with events → verify cascade
- [ ] Remove participant from group → verify conditional cascade
- [ ] Move participant between groups → verify dual cascade
- [ ] Concurrent operations (race conditions)
- [ ] Cache invalidation timing

### E2E Test Scenarios:
1. **Add Participant to Group with Events**
   - Add participant to group
   - Verify participant appears in all group's events in Agenda tab
   - Verify real-time update (no manual refresh needed)

2. **Remove Participant from Group**
   - Remove participant from group
   - Verify participant removed from events (only if no other group)
   - Verify participant stays in events if in another assigned group

3. **Move Participant Between Groups**
   - Move participant from GroupA to GroupB
   - Verify added to GroupB's events
   - Verify removed from GroupA-only events
   - Verify stays in shared events

4. **Group Enrollment from Agenda**
   - Add group to event in Agenda tab
   - Verify all group participants appear in event
   - Verify Groups tab shows updated event count

5. **Attendance Changes**
   - Mark attendance in Agenda tab
   - Verify group progress updates in Groups tab
   - Verify no excessive refetches

## 📝 Migration Notes

### Backend Requirements
The backend APIs must implement the cascade logic as described above. The frontend is ready to consume the cascade information via:
- `result.affectedEvents` - Array of event IDs or event objects
- `result.eventsToRemoveFrom` - Array of event IDs
- `result.eventsToAddTo` - Array of event IDs (for move operation)

### Performance Considerations
- **Debouncing**: Progress recalculation is debounced by 500ms
- **Cache Strategy**: 10-minute cache for groups, 5-minute for agenda
- **Selective Invalidation**: Only affected entities are invalidated
- **Optimistic Updates**: Can be added in Phase 8

### Error Handling
- All mutations have error handling with event emission
- Failed cascades should rollback group changes
- User receives detailed error messages
- Error events published for monitoring

## 🚀 Deployment Strategy

1. **Phase 1-6** (Current) - Frontend Infrastructure Ready ✅
   - RTK Query endpoints configured
   - Event handlers registered
   - Cross-domain communication active

2. **Phase 7-8** (Next) - Component Integration
   - Update hooks to use new endpoints
   - Enhance UI with cascade indicators
   - Add user notifications

3. **Phase 9** (Backend) - API Implementation
   - Implement cascade logic in backend endpoints
   - Add database transactions for atomic operations
   - Deploy backend first, then frontend

4. **Testing & Rollout**
   - Feature flag: `USE_CQRS_ARCHITECTURE` (already exists)
   - Gradual rollout with monitoring
   - Rollback plan if issues detected

## 📊 Success Metrics

- ✅ No stale data between Groups and Agenda tabs
- ✅ Real-time updates without manual refresh
- ✅ User receives clear notifications about cascade operations
- ✅ < 100ms cache invalidation latency
- ✅ Zero data inconsistencies
- ✅ All operations are reversible

## 🔗 Related Files

**Core Infrastructure:**
- `src/store/api/projectApi.js` - RTK Query endpoints
- `src/store/commands/groupCommands.js` - Semantic commands
- `src/store/entities/groupsSlice.js` - Normalized entity store
- `src/store/events/EventBus.js` - Event bus implementation
- `src/store/events/domainEvents.js` - Event definitions
- `src/store/events/crossDomainEventHandlers.js` - Cross-domain logic
- `src/store/events/eventIntegration.js` - Event middleware
- `src/store/index.js` - Store configuration

**Components (To be updated):**
- `src/sections/apps/project-manager/Poject-page/Enrolment-tab/Groups/GroupsRTK.js`
- `src/sections/apps/project-manager/Poject-page/Enrolment-tab/Groups/hooks/useGroupsCRUDRTK.js`
- `src/sections/apps/project-manager/Poject-page/Enrolment-tab/Groups/hooks/useNormalizedGroups.js`

**Backend APIs (To be implemented):**
- `src/pages/api/projects/add-participant-to-group.js`
- `src/pages/api/projects/remove-participant-from-group.js`
- `src/pages/api/projects/move-participant-between-groups.js`
- `src/pages/api/projects/assign-curriculum-to-group.js`
- `src/pages/api/projects/remove-curriculum-from-group.js`

---

**Last Updated**: 2025-10-21
**Status**: Phases 1-6 Complete (60% done)
**Next Step**: Implement backend cascade logic (Phase 9) or continue with frontend components (Phases 7-8)
