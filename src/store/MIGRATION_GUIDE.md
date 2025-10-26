# RTK Query Migration Guide

## Phase 1: RTK Query Sync Layer ✅ COMPLETE

### What We've Built

1. **Centralized API Layer** (`/store/api/projectApi.js`)
   - All project-related API endpoints
   - Automatic caching and background updates
   - Optimistic updates for attendance changes
   - Cache invalidation strategies

2. **New API Endpoints**
   - `addEventParticipantsAndGroups` - Bulk operations
   - `move-participant-between-groups` - Atomic group moves

3. **RTK Query Integration**
   - Added to store with middleware
   - Configured cache tags for efficient invalidation

### Available RTK Query Hooks

```javascript
// Queries (data fetching)
import { 
  useGetProjectAgendaQuery,
  useGetProjectDashboardQuery,
  useGetProjectSettingsQuery,
  useGetEventProgressQuery 
} from 'store/api/projectApi';

// Mutations (data updates)
import {
  useUpdateAttendanceStatusMutation,
  useAddEventParticipantMutation,
  useRemoveEventParticipantMutation,
  useMoveParticipantToGroupMutation,
  useAddEventParticipantsAndGroupsMutation
} from 'store/api/projectApi';
```

### Migration Examples

#### Before (Manual Redux Thunk)
```javascript
const handleStatusChange = async (participantId, status) => {
  try {
    await dispatch(updateAttendanceStatus(eventId, participantId, status));
    await dispatch(fetchProjectAgenda(projectId, true)); // Manual refresh
  } catch (error) {
    // Manual error handling
  }
};
```

#### After (RTK Query)
```javascript
const [updateAttendance] = useUpdateAttendanceStatusMutation();

const handleStatusChange = async (participantId, status) => {
  try {
    await updateAttendance({ 
      eventId, 
      participantId, 
      attendance_status: status 
    }).unwrap();
    // Cache automatically updated!
    // Optimistic updates handled!
  } catch (error) {
    // Error from mutation
  }
};
```

## How to Start Using RTK Query Today

### 1. Component Level (Gradual Migration)

You can start using RTK Query in new components while keeping existing ones unchanged:

```javascript
// In your component
import { useGetProjectAgendaQuery } from 'store/api/projectApi';

const MyComponent = ({ projectId }) => {
  const { 
    data: agendaData, 
    isLoading, 
    error, 
    refetch 
  } = useGetProjectAgendaQuery(projectId);
  
  // Use agendaData instead of Redux state
};
```

### 2. Hook Level (Replace Manual API Calls)

Replace your custom hooks that make fetch calls:

```javascript
// Before - custom hook with manual fetch
const useAttendanceManagement = () => {
  const [loading, setLoading] = useState(false);
  
  const updateStatus = async (id, status) => {
    setLoading(true);
    const response = await fetch('/api/attendance', { ... });
    setLoading(false);
  };
  
  return { updateStatus, loading };
};

// After - RTK Query hook
const useAttendanceManagement = () => {
  const [updateAttendance, { isLoading }] = useUpdateAttendanceStatusMutation();
  
  const updateStatus = async (id, status) => {
    await updateAttendance({ participantId: id, attendance_status: status });
  };
  
  return { updateStatus, loading: isLoading };
};
```

### 3. Page Level (Full RTK Query)

For new pages or major refactors, use the RTK Query version:

```javascript
// Use AttendeesRTK instead of Attendees
<AttendeesRTK 
  projectId={projectId} // Enable RTK Query
  eventParticipants={eventParticipants}
  selectedEvent={selectedEvent}
  course={course}
/>
```

## Benefits You Get Immediately

### 1. Automatic Caching
```javascript
// First call - fetches from server
const { data: agenda1 } = useGetProjectAgendaQuery(projectId);

// Second call - returns cached data instantly
const { data: agenda2 } = useGetProjectAgendaQuery(projectId);
```

### 2. Background Updates
```javascript
const { data, isLoading, isFetching } = useGetProjectAgendaQuery(projectId, {
  pollingInterval: 30000, // Refresh every 30 seconds
  refetchOnFocus: true,   // Refresh when user returns to tab
});
```

### 3. Optimistic Updates
```javascript
// UI updates immediately, reverts on error
const [updateAttendance] = useUpdateAttendanceStatusMutation();
```

### 4. Loading States
```javascript
const { data, isLoading, isFetching, error } = useGetProjectAgendaQuery(projectId);

if (isLoading) return <Spinner />;
if (error) return <Error />;
return <DataComponent data={data} />;
```

## Performance Benefits

### Before RTK Query
- Manual cache management
- Multiple API calls for related data
- Manual loading states
- No request deduplication

### With RTK Query
- Automatic intelligent caching
- Request deduplication
- Background updates
- Normalized cache updates

## Migration Strategy

### Week 1: Start with New Features
- Use RTK Query for any new API calls
- Try `AttendeesRTK` component in development

### Week 2: Replace High-Traffic Endpoints
- Migrate attendance updates (most frequent)
- Migrate participant additions/removals

### Week 3: Migrate Bulk Operations
- Use bulk endpoints for better performance
- Migrate group operations

### Week 4: Convert Remaining Components
- Gradually replace existing components
- Remove old Redux thunks

## Next Steps (Phases 2-5)

Once comfortable with RTK Query:

1. **Phase 2**: Convert actions to semantic commands
2. **Phase 3**: Add domain events system  
3. **Phase 4**: Normalize stores with EntityAdapter
4. **Phase 5**: Create derived selectors

## Troubleshooting

### Common Issues

1. **Cache not updating**: Check invalidatesTags configuration
2. **Too many requests**: Use selectFromResult to limit re-renders
3. **Stale data**: Adjust keepUnusedDataFor setting

### Debug Tools

```javascript
// See all cache data
console.log(store.getState().projectApi);

// Manual cache invalidation
dispatch(projectApi.util.invalidateTags(['ProjectAgenda']));

// Reset entire cache
dispatch(projectApi.util.resetApiState());
```

This migration gives you modern, performant data fetching with minimal breaking changes!