import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setAgendaData } from '../reducers/project/agenda';
import { setDashboardData } from '../reducers/project/dashboard';
import { setSettingsData } from '../reducers/project/settings';
import {
  participantsUpserted,
  participantAdded,
  participantRemoved,
  participantsManyRemoved,
  participantUpdated,
  updateMetadata
} from '../entities/participantsSlice';
import {
  groupsUpserted,
  groupAdded,
  groupUpdated,
  groupRemoved
} from '../entities/groupsSlice';
import {
  eventsUpserted,
  eventAdded,
  eventUpdated,
  eventRemoved
} from '../entities/eventsSlice';

/**
 * RTK Query API for Project Management
 * Centralized sync layer for all project-related operations
 */
export const projectApi = createApi({
  reducerPath: 'projectApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: '/api/',
    prepareHeaders: (headers) => {
      // Add any auth headers here if needed
      headers.set('content-type', 'application/json');
      return headers;
    },
  }),
  
  // Define entity types for cache invalidation
  tagTypes: [
    'Project',
    'ProjectAgenda',
    'ProjectParticipants',
    'Event',
    'Participant',
    'Group',
    'GroupParticipants',
    'GroupCurriculum',
    'GroupProgress',
    'Attendance',
    'Progress',
    'Checklist',
    'ChecklistProgress',
    'Assessment',
    'ParticipantScores',
    'AssessmentAttempts',
    'ProjectAssessments',
    'DailyNotes'
  ],
  
  endpoints: (builder) => ({
    // ==============================|| AGENDA QUERIES ||============================== //
    
    /**
     * Fetch comprehensive project agenda data
     * Replaces: fetchProjectAgenda action
     */
    getProjectAgenda: builder.query({
      query: (projectId) => ({
        url: 'projects/fetchProjectAgenda',
        method: 'POST',
        body: { projectId }
      }),
      providesTags: (_, __, projectId) => [
        { type: 'ProjectAgenda', id: projectId },
        { type: 'Project', id: projectId },
        'Event',
        'Participant',
        'Group'
      ],
      // Transform response to match expected format
      transformResponse: (response) => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.error || 'Failed to fetch project agenda');
      },
      // Normalize entities on successful query
      async onQueryStarted(projectId, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          // Sync to Redux agenda store for components that still read from there
          if (data) {
            dispatch(setAgendaData(data));
          }

          // NOTE: Participants are NOT normalized here
          // They should be fetched via getProjectParticipants query (primary source)
          // Agenda reads participants from normalized entities store

          // Normalize groups into entity store
          if (data?.groups && data.groups.length > 0) {
            dispatch(groupsUpserted(data.groups));
          }

          // Normalize events into entity store
          if (data?.events && data.events.length > 0) {
            // Add projectId to each event for proper filtering
            // Ensure projectId is always a number for consistent filtering
            const eventsWithProjectId = data.events.map(event => ({
              ...event,
              projectId: parseInt(projectId)
            }));
            dispatch(eventsUpserted(eventsWithProjectId));
          }
        } catch (error) {
          console.error('Failed to normalize entities:', error);
        }
      },
      // Cache for 5 minutes
      keepUnusedDataFor: 300,
    }),

    /**
     * Fetch project dashboard data
     */
    getProjectDashboard: builder.query({
      query: (projectId) => ({
        url: 'projects/fetchProjectDashboard',
        method: 'POST',
        body: { projectId }
      }),
      providesTags: (_, __, projectId) => [
        { type: 'Project', id: projectId },
        { type: 'Checklist', id: projectId },
        { type: 'ChecklistProgress', id: projectId },
        'Event',
        'Participant',
        'Attendance'
      ],
      transformResponse: (response) => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.error || 'Failed to fetch project dashboard');
      },
      async onQueryStarted(projectId, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            // Sync to Redux store for components that still read from there
            dispatch(setDashboardData(data));
          }
        } catch (error) {
          console.error('Failed to fetch project dashboard:', error);
        }
      },
      keepUnusedDataFor: 300,
    }),

    /**
     * Fetch project settings
     */
    getProjectSettings: builder.query({
      query: (projectId) => ({
        url: 'projects/fetchProjectSettings',
        method: 'POST',
        body: { projectId }
      }),
      providesTags: (_, __, projectId) => [
        { type: 'Project', id: projectId }
      ],
      transformResponse: (response) => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.error || 'Failed to fetch project settings');
      },
      async onQueryStarted(projectId, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            // Sync to Redux store for components that still read from there
            dispatch(setSettingsData({ data }));
          }
        } catch (error) {
          console.error('Failed to fetch project settings:', error);
        }
      },
      keepUnusedDataFor: 600,
    }),

    /**
     * Update project settings
     * CQRS: Command for updating project schedule and configuration
     */
    updateProjectSettings: builder.mutation({
      query: ({ projectId, ...settings }) => ({
        url: 'projects/update-project-settings',
        method: 'PUT',
        body: { projectId, ...settings }
      }),
      invalidatesTags: (_, __, { projectId }) => [
        { type: 'Project', id: projectId },
        'ProjectAgenda', // Agenda needs refresh if schedule changes
        'Event' // Events may be affected by schedule changes
      ],
      // Optimistic update for immediate UI feedback
      async onQueryStarted({ projectId, ...settings }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          projectApi.util.updateQueryData('getProjectSettings', projectId, (draft) => {
            // Update the settings in cache optimistically
            if (draft && draft.settings) {
              Object.assign(draft.settings, settings);
            }
          })
        );

        try {
          const { data } = await queryFulfilled;

          // Sync to Redux store for components that still read from there
          if (data?.settings) {
            dispatch(setSettingsData({ data: { settings: data.settings } }));
          }

          // Publish domain event for cross-component communication
          if (typeof window !== 'undefined' && window.eventBus) {
            window.eventBus.publish('settings.updated', {
              projectId,
              settings: data.settings,
              updatedFields: Object.keys(settings)
            });
          }
        } catch {
          // Revert optimistic update on error
          patchResult.undo();
        }
      }
    }),

    // ==============================|| PARTICIPANTS QUERIES ||============================== //

    /**
     * Fetch project participants (dedicated query for participants table)
     * CQRS: Separate read model for participant management
     */
    getProjectParticipants: builder.query({
      query: (projectId) => ({
        url: 'projects/fetchParticipantsDetails',
        method: 'POST',
        body: { projectId }
      }),
      providesTags: (_, __, projectId) => [
        { type: 'ProjectParticipants', id: projectId },
        { type: 'Project', id: projectId },
        'Participant'
      ],
      // Transform response to ensure consistent format
      transformResponse: (response) => {
        // fetchParticipantsDetails returns array directly, not wrapped in success object
        return Array.isArray(response) ? response : [];
      },
      // Normalize participants into entity store on successful query
      async onQueryStarted(projectId, { dispatch, queryFulfilled }) {
        try {
          const { data: participants } = await queryFulfilled;

          // Filter out invalid entries (where participant is null/undefined)
          const validParticipants = participants?.filter(p => p && p.participant) || [];

          // Normalize participants into entity store
          if (validParticipants && validParticipants.length > 0) {
            dispatch(participantsUpserted(validParticipants));
            dispatch(updateMetadata({
              projectId,
              totalCount: validParticipants.length,
              lastFetch: new Date().toISOString()
            }));
          }
        } catch (error) {
          console.error('Failed to normalize participants:', error);
        }
      },
      // Cache for 10 minutes - same as other project queries
      // This prevents refetching when drawer opens/closes
      keepUnusedDataFor: 600,
    }),

    /**
     * Fetch training recipient participants (CQRS Read Model)
     * Returns all participants from a training recipient that can be added to project
     * Filters out participants already enrolled if projectId is provided
     */
    getTrainingRecipientParticipants: builder.query({
      query: ({ trainingRecipientId, projectId }) => {
        console.log('[RTK Query] Building query with:', { trainingRecipientId, projectId });
        return {
          url: 'training-recipients/fetch-participants',
          method: 'GET',
          params: { trainingRecipientId, projectId }
        };
      },
      providesTags: (_, __, { trainingRecipientId, projectId }) => [
        { type: 'Project', id: projectId },
        'Participant'
      ],
      // Transform response to ensure consistent format
      transformResponse: (response) => {
        console.log('[RTK Query] getTrainingRecipientParticipants response:', response);
        if (response.success) {
          const enrolledCount = response.participants?.filter(p => p.isEnrolled).length || 0;
          console.log('[RTK Query] Returning participants:', response.participants?.length || 0, `(${enrolledCount} enrolled, ${(response.participants?.length || 0) - enrolledCount} available)`);
          return response.participants || [];
        }
        console.warn('[RTK Query] Response was not successful:', response);
        return [];
      },
      transformErrorResponse: (error) => {
        console.error('[RTK Query] getTrainingRecipientParticipants error:', error);
        return error;
      },
      // Cache for 5 minutes - available participants may change
      keepUnusedDataFor: 300,
    }),

    // ==============================|| GROUPS QUERIES ||============================== //

    /**
     * Fetch project groups (dedicated query for groups management)
     * CQRS: Separate read model for group management with participants and curriculums
     */
    getGroupsDetails: builder.query({
      query: (projectId) => ({
        url: 'projects/fetchGroupsDetails',
        method: 'POST',
        body: { projectId }
      }),
      providesTags: (_, __, projectId) => [
        { type: 'Project', id: projectId },
        'Group',
        'GroupParticipants',
        'GroupCurriculum',
        'GroupProgress'
      ],
      // Transform response to ensure consistent format
      transformResponse: (response) => {
        // fetchGroupsDetails returns array directly
        return Array.isArray(response) ? response : [];
      },
      // Normalize groups into entity store on successful query
      async onQueryStarted(projectId, { dispatch, queryFulfilled }) {
        try {
          const { data: groups } = await queryFulfilled;

          // Filter out invalid entries
          const validGroups = groups?.filter(g => g && g.id) || [];

          // Normalize groups into entity store
          if (validGroups && validGroups.length > 0) {
            dispatch(groupsUpserted(validGroups));
          }
        } catch (error) {
          console.error('Failed to normalize groups:', error);
        }
      },
      // Cache for 10 minutes - same as other project queries
      keepUnusedDataFor: 600,
    }),

    // ==============================|| ATTENDANCE MUTATIONS ||============================== //

    /**
     * Update participant attendance status
     * Replaces: updateAttendanceStatus action
     */
    updateAttendanceStatus: builder.mutation({
      query: ({ eventId, participantId, attendance_status }) => ({
        url: 'projects/updateAttendanceStatus',
        method: 'POST',
        body: { eventId, participantId, attendance_status }
      }),
      // Invalidate related cache entries
      invalidatesTags: (_, __, { eventId, participantId }) => [
        { type: 'Event', id: eventId },
        { type: 'Participant', id: participantId },
        { type: 'Attendance', id: `${eventId}-${participantId}` },
        'ProjectAgenda'
      ],
      // Optimistic update
      onQueryStarted: async ({ eventId, participantId, attendance_status }, { dispatch, queryFulfilled, getState }) => {
        // Find the project ID for cache updates
        const state = getState();
        const projectId = state.projectAgenda?.projectId;
        
        if (projectId) {
          // Optimistically update the cache
          const patchResult = dispatch(
            projectApi.util.updateQueryData('getProjectAgenda', projectId, (draft) => {
              const event = draft.events?.find(e => e.id === eventId);
              if (event) {
                const attendee = event.event_attendees?.find(
                  a => a.enrollee?.id === participantId || a.enrolleeId === participantId
                );
                if (attendee) {
                  attendee.attendance_status = attendance_status;
                }
              }
            })
          );

          try {
            await queryFulfilled;
            // RTK Query will automatically refetch due to invalidatesTags
          } catch {
            // Revert optimistic update on failure
            patchResult.undo();
          }
        }
      },
    }),

    /**
     * Add participant to event
     * Replaces: addEventParticipant action
     */
    addEventParticipant: builder.mutation({
      query: ({ eventId, participantId, attendance_status = 'scheduled' }) => ({
        url: 'projects/addEventParticipant',
        method: 'POST',
        body: { eventId, participantId, attendance_status }
      }),
      invalidatesTags: (_, __, { eventId, projectId }) => [
        { type: 'Event', id: eventId },
        'ProjectAgenda',
        'Participant',
        // Invalidate checklist when participants are added to events
        // This ensures checklist reflects which participants are in course events
        ...(projectId ? [{ type: 'Checklist', id: projectId }, 'ChecklistProgress'] : [])
      ],
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
          // RTK Query will automatically refetch due to invalidatesTags
        } catch (error) {
          console.error('Failed to add event participant:', error);
        }
      },
    }),

    /**
     * Remove participant from event
     * Replaces: removeEventParticipant action
     */
    removeEventParticipant: builder.mutation({
      query: ({ eventId, participantId }) => ({
        url: 'projects/removeEventParticipant',
        method: 'POST',
        body: { eventId, participantId }
      }),
      invalidatesTags: (_, __, { eventId, projectId }) => [
        { type: 'Event', id: eventId },
        'ProjectAgenda',
        'Participant',
        // Invalidate checklist when participants are removed from events
        ...(projectId ? [{ type: 'Checklist', id: projectId }, 'ChecklistProgress'] : [])
      ],
    }),

    /**
     * Move participant between events
     * Removes from source event and adds to target event
     */
    moveParticipantBetweenEvents: builder.mutation({
      query: ({ participantId, fromEventId, toEventId, projectId }) => ({
        url: 'projects/move-participant-between-events',
        method: 'POST',
        body: { participantId, fromEventId, toEventId, projectId }
      }),
      invalidatesTags: (_, __, { fromEventId, toEventId }) => [
        { type: 'Event', id: fromEventId },
        { type: 'Event', id: toEventId },
        'ProjectAgenda',
        'Participant'
      ],
      // Optimistic update for immediate UI feedback
      onQueryStarted: async ({ participantId, fromEventId, toEventId, projectId }, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
          // Trigger a refetch of project agenda to update all related data
          dispatch(projectApi.endpoints.getProjectAgenda.initiate(projectId, { forceRefetch: true }));
        } catch (error) {
          console.error('Failed to move participant between events:', error);
        }
      }
    }),

    /**
     * Add group to event
     * Replaces: addEventGroup action
     */
    addEventGroup: builder.mutation({
      query: ({ eventId, groupId, projectId }) => ({
        url: 'projects/addEventGroup',
        method: 'POST',
        body: { eventId, groupId, projectId }
      }),
      invalidatesTags: (_, __, { eventId, projectId }) => [
        { type: 'Event', id: eventId },
        { type: 'ProjectAgenda', id: projectId },
        'ProjectAgenda',
        'Group',
        'Participant',
        // Invalidate checklist when groups are added to events
        // Groups contain participants, so this affects who can see checklist items
        { type: 'Checklist', id: projectId },
        'ChecklistProgress'
      ],
      // Force refetch of project agenda to ensure UI updates
      onQueryStarted: async ({ eventId, groupId, projectId }, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
          // RTK Query will automatically refetch due to invalidatesTags
        } catch (error) {
          console.error('Failed to add group to event:', error);
        }
      }
    }),

    // ==============================|| GROUP MANAGEMENT ||============================== //
    
    /**
     * Move participant between groups
     * ENHANCED WITH CASCADE: Updates event enrollment based on new/old group assignments
     */
    moveParticipantToGroup: builder.mutation({
      query: ({ participantId, fromGroupId, toGroupId, projectId }) => ({
        url: 'projects/move-participant-between-groups',
        method: 'POST',
        body: { participantId, fromGroupId, toGroupId, projectId, cascadeToEvents: true }
      }),
      invalidatesTags: (_, __, { projectId, participantId, fromGroupId, toGroupId }) => [
        { type: 'Participant', id: participantId },
        { type: 'Group', id: fromGroupId },
        { type: 'Group', id: toGroupId },
        { type: 'GroupParticipants', id: fromGroupId },
        { type: 'GroupParticipants', id: toGroupId },
        { type: 'ProjectParticipants', id: projectId },
        'ProjectAgenda',
        'Event' // Cascade invalidation
      ],
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          // Update groups in normalized store
          if (args.fromGroupId) {
            dispatch(groupsUpserted([{
              id: args.fromGroupId,
              participants: [] // Will be refreshed by invalidation
            }]));
          }
          if (args.toGroupId && data?.participant) {
            dispatch(groupsUpserted([{
              id: args.toGroupId,
              participants: [data.participant]
            }]));
          }

          // Cascade to events
          if (data?.eventsToAddTo && data.eventsToAddTo.length > 0) {
            console.log(`[Cascade] Participant ${args.participantId} added to ${data.eventsToAddTo.length} events via new group`);
          }
          if (data?.eventsToRemoveFrom && data.eventsToRemoveFrom.length > 0) {
            console.log(`[Cascade] Participant ${args.participantId} removed from ${data.eventsToRemoveFrom.length} events due to group change`);
          }

          // Update events in normalized store if returned
          if (data?.affectedEvents && data.affectedEvents.length > 0) {
            dispatch(eventsUpserted(data.affectedEvents));
          }
        } catch (error) {
          console.error('Failed to move participant between groups:', error);
        }
      }
    }),

    /**
     * Add participant to group
     * ENHANCED WITH CASCADE: Also adds participant to events where group is assigned
     */
    addParticipantToGroup: builder.mutation({
      query: ({ projectId, groupId, participantId }) => ({
        url: 'projects/add-participant-to-group',
        method: 'POST',
        body: { projectId, groupId, participantId, cascadeToEvents: true }
      }),
      invalidatesTags: (_, __, { projectId, groupId, participantId }) => [
        { type: 'Group', id: groupId },
        { type: 'Participant', id: participantId },
        { type: 'ProjectParticipants', id: projectId },
        { type: 'GroupParticipants', id: groupId },
        'ProjectAgenda',
        'Event' // Cascade invalidation
      ],
      async onQueryStarted({ groupId, participantId, projectId }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          // Update normalized entities
          if (data?.participant) {
            // Add participant to group in normalized store
            dispatch(groupsUpserted([{
              id: groupId,
              participants: data.participant ? [data.participant] : []
            }]));
          }

          // If group is assigned to events, participant was cascaded to those events
          if (data?.affectedEvents && data.affectedEvents.length > 0) {
            console.log(`[Cascade] Participant ${participantId} added to ${data.affectedEvents.length} events via group ${groupId}`);

            // Update events in normalized store
            if (data.affectedEvents.length > 0) {
              dispatch(eventsUpserted(data.affectedEvents));
            }
          }
        } catch (error) {
          console.error('Failed to add participant to group:', error);
        }
      }
    }),

    /**
     * Remove participant from group
     * ENHANCED WITH CASCADE: Removes participant from events if they're no longer in any assigned group
     */
    removeParticipantFromGroup: builder.mutation({
      query: ({ groupId, participantId, projectId }) => ({
        url: 'projects/remove-participant-from-group',
        method: 'POST',
        body: { groupId, participantId, projectId, cascadeToEvents: true }
      }),
      invalidatesTags: (_, __, { projectId, groupId, participantId }) => [
        { type: 'Group', id: groupId },
        { type: 'Participant', id: participantId },
        { type: 'ProjectParticipants', id: projectId },
        { type: 'GroupParticipants', id: groupId },
        'ProjectAgenda',
        'Event' // Cascade invalidation
      ],
      async onQueryStarted({ groupId, participantId, projectId }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          // Update normalized entities
          dispatch(groupsUpserted([{
            id: groupId,
            participants: [] // Will be refreshed by invalidation
          }]));

          // If participant was removed from events, cascade
          if (data?.eventsToRemoveFrom && data.eventsToRemoveFrom.length > 0) {
            console.log(`[Cascade] Participant ${participantId} removed from ${data.eventsToRemoveFrom.length} events via group ${groupId}`);

            // Update events in normalized store
            if (data.affectedEvents && data.affectedEvents.length > 0) {
              dispatch(eventsUpserted(data.affectedEvents));
            }
          }
        } catch (error) {
          console.error('Failed to remove participant from group:', error);
        }
      }
    }),

    // ==============================|| PROGRESS TRACKING ||============================== //
    
    /**
     * Get event progress
     * Replaces: getEventProgress action
     */
    getEventProgress: builder.query({
      query: (eventId) => ({
        url: 'events/get-progress',
        method: 'GET',
        params: { eventId }
      }),
      providesTags: (_, __, eventId) => [
        { type: 'Progress', id: eventId }
      ],
    }),

    /**
     * Save module progress
     * Replaces: saveModuleProgress action
     */
    saveModuleProgress: builder.mutation({
      query: ({ eventId, moduleId, activityIds, completed }) => ({
        url: 'events/save-module-progress',
        method: 'POST',
        body: { eventId, moduleId, activityIds, completed }
      }),
      invalidatesTags: (_, __, { eventId }) => [
        { type: 'Progress', id: eventId }
      ],
    }),

    /**
     * Reset module progress
     * Replaces: resetModuleProgress action
     */
    resetModuleProgress: builder.mutation({
      query: ({ eventId, moduleId }) => ({
        url: 'events/reset-module-progress',
        method: 'POST',
        body: { eventId, moduleId }
      }),
      invalidatesTags: (_, __, { eventId }) => [
        { type: 'Progress', id: eventId }
      ],
    }),

    // ==============================|| EVENT MUTATIONS ||============================== //
    
    /**
     * Create new event
     */
    createEvent: builder.mutation({
      query: ({ projectId, eventData, events = [] }) => ({
        url: 'calendar/db-create-event',
        method: 'POST',
        body: {
          newEvent: eventData,
          events: events,
          projectId: projectId
        }
      }),
      invalidatesTags: (_, __, { projectId }) => [
        // IMPORTANT: Only invalidate specific tags to avoid overwhelming Prisma
        // Removed global 'Project' tag - it triggers fetchParticipantsDetails,
        // fetchProjectSettings, checklist-progress in parallel, crashing database
        // Removed global 'Event' tag - use specific event ID when available
        { type: 'ProjectAgenda', id: projectId }
        // Note: Can't invalidate specific Event ID here since it's created server-side
      ],
      onQueryStarted: async ({ eventData }, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;

          // Add event to normalized store
          if (data?.event) {
            dispatch(eventAdded(data.event));
          }

          // RTK Query will automatically refetch due to invalidatesTags
        } catch (error) {
          console.error('Failed to create event:', error);
        }
      },
    }),
    
    /**
     * Update event
     */
    updateEvent: builder.mutation({
      query: ({ eventId, updates, projectId }) => ({
        url: 'calendar/db-update-event',
        method: 'POST',
        body: { 
          eventId: eventId,
          event: {
            id: eventId,
            ...updates,
            projectId
          }
        }
      }),
      invalidatesTags: (_, __, { eventId }) => [
        { type: 'Event', id: eventId },
        'ProjectAgenda'
      ],
      onQueryStarted: async ({ eventId, updates }, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;

          // Update event in normalized store
          dispatch(eventUpdated({ id: eventId, changes: updates }));

          // RTK Query will automatically refetch due to invalidatesTags
        } catch (error) {
          console.error('Failed to update event:', error);
        }
      },
    }),
    
    /**
     * Delete event
     */
    deleteEvent: builder.mutation({
      query: ({ eventId, projectId }) => ({
        url: 'calendar/db-delete-event',
        method: 'POST',
        body: { eventId, projectId }
      }),
      invalidatesTags: (_, __, { projectId, eventId }) => [
        // IMPORTANT: Only invalidate specific tags to avoid overwhelming Prisma
        // Removed global 'Project' tag - it triggered fetchParticipantsDetails,
        // fetchProjectSettings, checklist-progress in parallel, crashing database
        { type: 'Event', id: eventId },
        { type: 'ProjectAgenda', id: projectId }
      ],
      onQueryStarted: async ({ eventId }, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;

          // Remove event from normalized store
          dispatch(eventRemoved(eventId));

          // RTK Query will automatically refetch due to invalidateTags
        } catch (error) {
          console.error('Failed to delete event:', error);
        }
      },
    }),
    
    /**
     * Import curriculum schedule
     */
    importCurriculumSchedule: builder.mutation({
      query: ({ projectId, curriculumId, scheduleData }) => ({
        url: 'projects/import-curriculum-schedule',
        method: 'POST',
        body: { projectId, curriculumId, scheduleData }
      }),
      invalidatesTags: (_, __, { projectId }) => [
        { type: 'Project', id: projectId },
        'ProjectAgenda',
        'Event'
      ],
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;

          // Add multiple events to normalized store
          if (data?.events && data.events.length > 0) {
            dispatch(eventsUpserted(data.events));
          }

          // RTK Query will automatically refetch due to invalidatesTags
        } catch (error) {
          console.error('Failed to import curriculum schedule:', error);
        }
      },
    }),

    // ==============================|| GROUP MUTATIONS ||============================== //
    
    /**
     * Add new group to project
     */
    addGroup: builder.mutation({
      query: ({ projectId, groupData }) => {
        console.log('[RTK Query] addGroup query:', { projectId, groupData });
        return {
          url: 'projects/add-group',
          method: 'POST',
          body: { projectId, newGroup: groupData }
        };
      },
      invalidatesTags: (_, __, { projectId }) => [
        { type: 'Project', id: projectId },
        'ProjectAgenda',
        'Group'
      ],
      onQueryStarted: async ({ projectId, groupData }, { dispatch, queryFulfilled, getState }) => {
        console.log('[RTK Query] addGroup started:', { projectId, groupData });
        try {
          const { data } = await queryFulfilled;
          console.log('[RTK Query] addGroup success:', data);

          // Add group to normalized store
          if (data?.group) {
            dispatch(groupAdded(data.group));
            console.log('[RTK Query] Group added to normalized store');
          } else {
            console.warn('[RTK Query] No group in response data:', data);
          }

          // RTK Query will automatically refetch due to invalidatesTags
        } catch (error) {
          console.error('[RTK Query] addGroup failed:', error);
          console.error('[RTK Query] Error details:', error.data || error.message);
        }
      },
    }),
    
    /**
     * Update group details
     */
    updateGroup: builder.mutation({
      query: ({ groupId, updates, projectId }) => ({
        url: 'projects/update-group',
        method: 'POST',
        body: { groupId, updates, projectId }
      }),
      invalidatesTags: (_, __, { groupId }) => [
        { type: 'Group', id: groupId },
        'ProjectAgenda'
      ],
      onQueryStarted: async ({ groupId, updates }, { dispatch, queryFulfilled, getState }) => {
        try {
          await queryFulfilled;
          
          // Update group in normalized store
          dispatch(groupUpdated({ id: groupId, changes: updates }));
          
          // RTK Query will automatically refetch due to invalidatesTags
        } catch (error) {
          console.error('Failed to update group:', error);
        }
      },
    }),
    
    /**
     * Remove group from project
     */
    removeGroup: builder.mutation({
      query: ({ projectId, groupId }) => ({
        url: 'projects/remove-group',
        method: 'POST',
        body: { projectId, groupId }
      }),
      invalidatesTags: (_, __, { projectId, groupId }) => [
        { type: 'Project', id: projectId },
        { type: 'Group', id: groupId },
        'ProjectAgenda'
      ],
      onQueryStarted: async ({ groupId }, { dispatch, queryFulfilled, getState }) => {
        try {
          await queryFulfilled;
          
          // Remove group from normalized store
          dispatch(groupRemoved(groupId));

          // RTK Query will automatically refetch due to invalidatesTags
        } catch (error) {
          console.error('Failed to remove group:', error);
        }
      },
    }),

    /**
     * Get group curriculums with course details and completion data
     * CQRS: Read model for group curriculum management
     */
    getGroupCurriculums: builder.query({
      query: ({ groupId }) => ({
        url: `groups/fetch-group-curriculums?groupId=${groupId}`,
        method: 'GET'
      }),
      providesTags: (result, error, { groupId }) => [
        { type: 'GroupCurriculum', id: groupId },
        { type: 'Group', id: groupId }
      ],
      // Cache for 5 minutes
      keepUnusedDataFor: 300
    }),

    /**
     * Assign curriculum to group
     * Affects expected modules for events where group is enrolled
     */
    assignCurriculumToGroup: builder.mutation({
      query: ({ groupId, curriculumId, projectId }) => ({
        url: 'projects/assign-curriculum-to-group',
        method: 'POST',
        body: { groupId, curriculumId, projectId }
      }),
      invalidatesTags: (_, __, { groupId, projectId }) => [
        { type: 'Group', id: groupId },
        { type: 'GroupCurriculum', id: groupId },
        { type: 'GroupProgress', id: groupId },
        { type: 'Project', id: projectId },
        'ProjectAgenda', // Events may need to show updated expected modules
        'Event'
      ],
      async onQueryStarted({ groupId, curriculumId }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          // Update group in normalized store with new curriculum
          if (data?.curriculum) {
            dispatch(groupsUpserted([{
              id: groupId,
              curriculums: [data.curriculum]
            }]));
          }

          console.log(`[Cascade] Curriculum ${curriculumId} assigned to group ${groupId}, events updated`);
        } catch (error) {
          console.error('Failed to assign curriculum to group:', error);
        }
      }
    }),

    /**
     * Remove curriculum from group
     */
    removeCurriculumFromGroup: builder.mutation({
      query: ({ groupId, curriculumId, projectId }) => ({
        url: 'projects/remove-curriculum-from-group',
        method: 'POST',
        body: { groupId, curriculumId, projectId }
      }),
      invalidatesTags: (_, __, { groupId, projectId }) => [
        { type: 'Group', id: groupId },
        { type: 'GroupCurriculum', id: groupId },
        { type: 'GroupProgress', id: groupId },
        { type: 'Project', id: projectId },
        'ProjectAgenda',
        'Event'
      ],
      async onQueryStarted({ groupId, curriculumId }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;

          // Update group in normalized store
          dispatch(groupsUpserted([{
            id: groupId,
            curriculums: [] // Will be refreshed by invalidation
          }]));

          console.log(`[Cascade] Curriculum ${curriculumId} removed from group ${groupId}, events updated`);
        } catch (error) {
          console.error('Failed to remove curriculum from group:', error);
        }
      }
    }),

    /**
     * Clear progress cache for groups
     */
    clearProgressCache: builder.mutation({
      query: (projectId) => ({
        url: 'groups/clear-progress-cache',
        method: 'POST',
        body: { projectId }
      }),
      invalidatesTags: ['Group', 'ProjectAgenda'],
    }),
    
    // ==============================|| BULK OPERATIONS ||============================== //
    
    /**
     * Add multiple participants and groups to event
     * Custom bulk operation for better performance
     */
    addEventParticipantsAndGroups: builder.mutation({
      query: ({ eventId, participants = [], groups = [], projectId }) => ({
        url: 'projects/addEventParticipantsAndGroups',
        method: 'POST',
        body: { eventId, participants, groups, projectId }
      }),
      invalidatesTags: (_, __, { eventId, projectId }) => [
        { type: 'Event', id: eventId },
        'ProjectAgenda',
        'Participant',
        'Group',
        // Invalidate checklist when bulk adding participants/groups to events
        ...(projectId ? [{ type: 'Checklist', id: projectId }, 'ChecklistProgress'] : [])
      ],
    }),

    // ==============================|| PROJECT MANAGEMENT ||============================== //
    
    /**
     * Update project
     */
    updateProject: builder.mutation({
      query: ({ projectId, ...updates }) => ({
        url: 'projects/updateProject',
        method: 'POST',
        body: { projectId, ...updates }
      }),
      invalidatesTags: (_, __, { projectId }) => [
        { type: 'Project', id: projectId },
        'ProjectAgenda'
      ],
    }),

    /**
     * Fetch single project
     * For backward compatibility with existing code
     */
    getSingleProject: builder.query({
      query: (projectId) => ({
        url: 'projects/fetchSingleProject',
        method: 'POST',
        body: { projectId }
      }),
      providesTags: (_, __, projectId) => [
        { type: 'Project', id: projectId }
      ],
    }),

    // ==============================|| PARTICIPANT MANAGEMENT ||============================== //
    
    /**
     * Add single participant to project
     */
    addParticipant: builder.mutation({
      query: ({ projectId, participantData }) => ({
        url: 'projects/db-create-project_participant',
        method: 'POST',
        body: { projectId, newParticipant: participantData }
      }),
      transformResponse: (response) => {
        // Handle API response properly - don't throw on success: false
        // Let the component handle this in onQueryStarted
        return response;
      },
      invalidatesTags: (_, __, { projectId }) => [
        { type: 'Project', id: projectId },
        { type: 'ProjectParticipants', id: projectId },
        'ProjectAgenda',
        'Participant'
      ],
      onQueryStarted: async (_, { dispatch, queryFulfilled, getState }) => {
        try {
          const { data } = await queryFulfilled;

          // Check if the API operation was successful
          if (data?.success === true) {
            // RTK Query will automatically refetch due to invalidatesTags
          } else if (data?.success === false) {
            // Handle API-level errors (like participant already exists)
            throw new Error(data.message || data.error || 'Failed to add participant');
          }
        } catch (error) {
          console.error('Failed to add participant:', error);
          // Re-throw to let calling components handle the error
          throw error;
        }
      },
    }),

    /**
     * Add multiple participants to project
     */
    addMultipleParticipants: builder.mutation({
      query: ({ projectId, participants }) => ({
        url: 'projects/db-create-multiple-participants',
        method: 'POST',
        body: { projectId, newParticipants: participants }
      }),
      invalidatesTags: (_, __, { projectId }) => [
        { type: 'Project', id: projectId },
        { type: 'ProjectParticipants', id: projectId },
        'ProjectAgenda',
        'Participant'
      ],
      onQueryStarted: async (_, { dispatch, queryFulfilled, getState }) => {
        try {
          await queryFulfilled;
          // RTK Query will automatically refetch due to invalidatesTags
        } catch (error) {
          console.error('Failed to add multiple participants:', error);
        }
      },
    }),

    /**
     * Update participant
     * Uses the database-backed endpoint to persist changes
     */
    updateParticipant: builder.mutation({
      query: ({ participantId, updates }) => ({
        url: 'participants/updateParticipant',
        method: 'POST',
        body: { participantId, updates }
      }),
      invalidatesTags: (_, __, { participantId, projectId }) => [
        { type: 'Participant', id: participantId },
        { type: 'ProjectParticipants', id: projectId },
        'ProjectAgenda'
      ],
      onQueryStarted: async ({ participantId, updates, projectId }, { dispatch, queryFulfilled, getState }) => {
        try {
          const { data } = await queryFulfilled;

          // Find the project_participants entity ID from the normalized store
          const state = getState();
          const allParticipants = state.participants?.entities || {};
          const projectParticipantEntry = Object.values(allParticipants).find(
            pp => pp.participant?.id === participantId
          );

          if (projectParticipantEntry && data?.participant) {
            // Update the normalized entity with the new participant data
            dispatch(participantUpdated({
              id: projectParticipantEntry.id, // Use project_participants.id
              changes: {
                participant: data.participant // Update nested participant object
              }
            }));
          }

          // Also invalidate the project participants query to trigger refetch if needed
          const currentProjectId = projectId || state.projectSettings?.projectId;
          if (currentProjectId) {
            dispatch(projectApi.util.invalidateTags([
              { type: 'ProjectParticipants', id: currentProjectId }
            ]));
          }
        } catch (error) {
          console.error('Failed to update participant:', error);
        }
      },
    }),

    /**
     * Remove single participant from project
     */
    removeParticipant: builder.mutation({
      query: ({ participantId }) => ({
        url: 'projects/db-delete-project_participant',
        method: 'POST',
        body: { participantId }
      }),
      invalidatesTags: (_, __, { projectId, participantId }) => [
        { type: 'Project', id: projectId },
        { type: 'ProjectParticipants', id: projectId },
        { type: 'Participant', id: participantId },
        'ProjectAgenda'
      ],
      onQueryStarted: async ({ participantId }, { dispatch, queryFulfilled, getState }) => {
        try {
          await queryFulfilled;
          
          // Remove participant from normalized store
          dispatch(participantRemoved(participantId));
          
          // RTK Query will automatically refetch due to invalidatesTags
        } catch (error) {
          console.error('Failed to remove participant:', error);
        }
      },
    }),

    /**
     * Remove multiple participants from project
     */
    removeMultipleParticipants: builder.mutation({
      query: ({ projectId, participantIds }) => ({
        url: 'projects/db-delete-many-project_participant',
        method: 'POST',
        body: { projectId, participantIds }
      }),
      invalidatesTags: (_, __, { projectId }) => [
        { type: 'Project', id: projectId },
        { type: 'ProjectParticipants', id: projectId },
        'ProjectAgenda',
        'Participant'
      ],
      onQueryStarted: async ({ participantIds }, { dispatch, queryFulfilled, getState }) => {
        try {
          await queryFulfilled;

          // Immediately remove participants from normalized store
          if (participantIds && participantIds.length > 0) {
            dispatch(participantsManyRemoved(participantIds));
          }

          // RTK Query will automatically refetch due to invalidatesTags
        } catch (error) {
          console.error('Failed to remove multiple participants:', error);
        }
      },
    }),

    /**
     * Import participants from CSV
     */
    importParticipantsFromCSV: builder.mutation({
      query: ({ projectId, participants }) => ({
        url: 'participants/import-csv',
        method: 'POST',
        body: { projectId, participants }
      }),
      invalidatesTags: (_, __, { projectId }) => [
        { type: 'Project', id: projectId },
        { type: 'ProjectParticipants', id: projectId },
        'ProjectAgenda',
        'Participant'
      ],
      onQueryStarted: async (_, { dispatch, queryFulfilled, getState }) => {
        try {
          await queryFulfilled;
          // RTK Query will automatically refetch due to invalidatesTags
        } catch (error) {
          console.error('Failed to import participants from CSV:', error);
        }
      },
    }),

    // ==============================|| ROLES ||============================== //

    /**
     * Fetch available roles for a project
     * Used by role dropdown selectors
     */
    getAvailableRoles: builder.query({
      query: (projectId) => ({
        url: `projects/available-roles?projectId=${projectId}`,
        method: 'GET',
      }),
      providesTags: (_, __, projectId) => [
        { type: 'Project', id: projectId }
      ],
      transformResponse: (response) => {
        if (response.success && response.roles) {
          return response.roles;
        }
        return [];
      },
      // Cache for 10 minutes - roles don't change frequently
      keepUnusedDataFor: 600,
    }),

    // ==============================|| CHECKLIST QUERIES ||============================== //

    /**
     * Fetch project checklist items with progress
     * Returns all checklist items from courses in project curriculums
     * Replaces: getProjectChecklist thunk
     */
    getProjectChecklist: builder.query({
      query: (projectId) => ({
        url: 'projects/checklist-progress',
        method: 'GET',
        params: { projectId }
      }),
      providesTags: (_, __, projectId) => [
        { type: 'Checklist', id: projectId },
        { type: 'Project', id: projectId }
      ],
      transformResponse: (response) => {
        // API returns array of checklist items directly
        return Array.isArray(response) ? response : [];
      },
      // Cache for 5 minutes - checklist data doesn't change frequently
      keepUnusedDataFor: 300,
      // Refetch when component mounts or when switching tabs
      // This ensures fresh data when user switches to Checklist tab after adding participants
      refetchOnMountOrArgChange: true,
      // Refetch when window regains focus (e.g., switching back from another tab/window)
      refetchOnFocus: true,
    }),

    /**
     * Fetch participant progress for a specific checklist item
     * Shows which participants have completed the item
     */
    getParticipantChecklistProgress: builder.query({
      query: ({ projectId, checklistItemId }) => ({
        url: 'projects/checklist-participant-progress',
        method: 'GET',
        params: { projectId, checklistItemId }
      }),
      providesTags: (_, __, { projectId, checklistItemId }) => [
        { type: 'ChecklistProgress', id: `${projectId}-${checklistItemId}` },
        { type: 'Checklist', id: projectId },
        'Participant'
      ],
      transformResponse: (response) => {
        // API returns { summary, participants }
        return response;
      },
      // Cache for 3 minutes - participant progress may change frequently
      keepUnusedDataFor: 180,
      // Refetch when dialog opens to show latest participant list
      refetchOnMountOrArgChange: true,
      // Refetch when window regains focus
      refetchOnFocus: true,
    }),

    // ==============================|| CHECKLIST MUTATIONS ||============================== //

    /**
     * Toggle checklist item completion (project-level)
     * Updates both completion status and optional notes
     * Handles both course and curriculum checklist items
     */
    toggleChecklistItem: builder.mutation({
      query: ({ projectId, checklistItemId, completed, notes, completedBy, itemType }) => ({
        url: 'projects/checklist-progress',
        method: 'POST',
        body: { projectId, checklistItemId, completed, notes, completedBy, itemType }
      }),
      invalidatesTags: (_, __, { projectId, checklistItemId }) => [
        { type: 'Checklist', id: projectId },
        { type: 'ChecklistProgress', id: `${projectId}-${checklistItemId}` }
      ],
      transformResponse: (response) => {
        if (response.message || response.progress) {
          return response;
        }
        throw new Error('Failed to update checklist item');
      },
    }),

    /**
     * Update participant-specific checklist progress
     * For participant-only tasks
     */
    updateParticipantChecklistProgress: builder.mutation({
      query: ({ participantId, checklistItemId, completed, notes }) => ({
        url: 'participants/checklist-items',
        method: 'PUT',
        body: { participantId, checklistItemId, completed, notes }
      }),
      invalidatesTags: (result, error, { projectId, checklistItemId }) => {
        const tags = [
          { type: 'ChecklistProgress', id: `${projectId}-${checklistItemId}` }
        ];

        // Also invalidate main checklist to reflect auto-completion
        if (result?.success) {
          tags.push({ type: 'Checklist', id: projectId });
        }

        return tags;
      },
      transformResponse: (response) => {
        if (response.success) {
          return response;
        }
        throw new Error(response.message || 'Failed to update participant progress');
      },
    }),

    // ==============================|| CURRICULUM CHECKLIST MANAGEMENT ||============================== //

    /**
     * Get curriculum checklist items
     * Fetches checklist templates for a curriculum
     */
    getCurriculumChecklistItems: builder.query({
      query: (curriculumId) => ({
        url: 'curriculums/checklist-items',
        params: { curriculumId }
      }),
      providesTags: (_, __, curriculumId) => [
        { type: 'Checklist', id: `curriculum-${curriculumId}` }
      ],
      transformResponse: (response) => {
        if (Array.isArray(response)) {
          return response;
        }
        throw new Error('Failed to fetch curriculum checklist items');
      },
    }),

    /**
     * Create new curriculum checklist item
     * Adds a new checklist template to the curriculum
     */
    createCurriculumChecklistItem: builder.mutation({
      query: (itemData) => ({
        url: 'curriculums/checklist-items',
        method: 'POST',
        body: itemData
      }),
      invalidatesTags: (_, __, { curriculumId }) => [
        { type: 'Checklist', id: `curriculum-${curriculumId}` }
      ],
      transformResponse: (response) => {
        if (response.id) {
          return response;
        }
        throw new Error('Failed to create checklist item');
      },
    }),

    /**
     * Update curriculum checklist item
     * Modifies an existing checklist template
     */
    updateCurriculumChecklistItem: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `curriculums/checklist-items?id=${id}`,
        method: 'PUT',
        body: updates
      }),
      invalidatesTags: (result, _, { curriculumId }) => [
        { type: 'Checklist', id: `curriculum-${curriculumId}` }
      ],
      transformResponse: (response) => {
        if (response.id) {
          return response;
        }
        throw new Error('Failed to update checklist item');
      },
    }),

    /**
     * Delete curriculum checklist item
     * Removes a checklist template from the curriculum
     */
    deleteCurriculumChecklistItem: builder.mutation({
      query: ({ id, curriculumId }) => ({
        url: `curriculums/checklist-items?id=${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: (_, __, { curriculumId }) => [
        { type: 'Checklist', id: `curriculum-${curriculumId}` }
      ],
      transformResponse: (response) => {
        if (response.message) {
          return response;
        }
        throw new Error('Failed to delete checklist item');
      },
    }),

    // ==============================|| ASSESSMENT MANAGEMENT ||============================== //

    /**
     * Get all assessments and scores for a participant
     * Fetches grouped assessment data with attempts and statistics
     */
    getParticipantAssessments: builder.query({
      query: ({ participantId, courseId, currentOnly = false }) => ({
        url: 'score-cards/getParticipantScores',
        params: { participantId, courseId, currentOnly: currentOnly ? 'true' : 'false' }
      }),
      providesTags: (_, __, { participantId }) => [
        { type: 'ParticipantScores', id: participantId },
        'Assessment',
        'Progress'
      ],
      transformResponse: (response) => {
        if (response.success) {
          return response;
        }
        throw new Error(response.message || 'Failed to fetch participant assessments');
      }
    }),

    /**
     * Record a new assessment score for a participant
     * Handles automatic attempt tracking and retake validation
     */
    recordAssessmentScore: builder.mutation({
      query: (scoreData) => ({
        url: 'score-cards/recordScore',
        method: 'POST',
        body: scoreData
      }),
      invalidatesTags: (_, __, { participantId, projectId }) => [
        { type: 'ParticipantScores', id: participantId },
        'Assessment',
        'Progress',
        'Participant',
        ...(projectId ? [{ type: 'ProjectAssessments', id: projectId }] : [])
      ],
      transformResponse: (response) => {
        if (response.success) {
          return response;
        }
        throw new Error(response.message || 'Failed to record score');
      }
    }),

    /**
     * Get assessment attempt history for a specific participant and assessment
     * Returns all attempts with details
     */
    getAssessmentAttempts: builder.query({
      query: ({ assessmentId, participantId }) => ({
        url: 'score-cards/getAttemptHistory',
        params: { assessmentId, participantId }
      }),
      providesTags: (_, __, { participantId, assessmentId }) => [
        { type: 'AssessmentAttempts', id: `${participantId}-${assessmentId}` },
        { type: 'ParticipantScores', id: participantId }
      ],
      transformResponse: (response) => {
        if (response.success) {
          return response;
        }
        throw new Error(response.message || 'Failed to fetch attempt history');
      }
    }),

    /**
     * Override an assessment score (instructor manual adjustment)
     * Allows changing pass/fail status with reason
     */
    overrideAssessmentScore: builder.mutation({
      query: ({ scoreId, passed, overrideReason, overriddenBy }) => ({
        url: 'score-cards/overrideScore',
        method: 'POST',
        body: { scoreId, passed, overrideReason, overriddenBy }
      }),
      invalidatesTags: (_, __, { participantId }) => [
        { type: 'ParticipantScores', id: participantId },
        'Assessment',
        'Progress'
      ],
      transformResponse: (response) => {
        if (response.success) {
          return response;
        }
        throw new Error(response.message || 'Failed to override score');
      }
    }),

    /**
     * Toggle assessment active status for a project
     * Creates or updates project_assessment_config override
     */
    toggleAssessmentForProject: builder.mutation({
      query: ({ projectId, courseAssessmentId, isActive, createdBy }) => ({
        url: 'score-cards/toggleAssessmentForProject',
        method: 'POST',
        body: { projectId, courseAssessmentId, isActive, createdBy }
      }),
      invalidatesTags: (_, __, { projectId }) => [
        'Assessment',
        'ParticipantScores',
        { type: 'Project', id: projectId },
        { type: 'ProjectAssessments', id: projectId },
        'Progress'
      ],
      transformResponse: (response) => {
        if (response.success) {
          return response;
        }
        throw new Error(response.message || 'Failed to toggle assessment');
      }
    }),

    /**
     * Get project-level assessment data aggregated across all participants
     * Returns assessment statistics and individual participant scores
     */
    getProjectAssessments: builder.query({
      query: (projectId) => ({
        url: 'score-cards/getProjectAssessments',
        params: { projectId }
      }),
      providesTags: (_, __, projectId) => [
        { type: 'ProjectAssessments', id: projectId },
        { type: 'Project', id: projectId },
        'Assessment',
        'Progress'
      ],
      transformResponse: (response) => {
        if (response.success) {
          return response;
        }
        throw new Error(response.message || 'Failed to fetch project assessments');
      }
    }),

    // ===== Daily Training Notes Management =====

    getDailyTrainingNotes: builder.query({
      query: ({ projectId, date }) => ({
        url: `projects/daily-training-notes`,
        params: { projectId, date }
      }),
      providesTags: (result, error, { projectId, date }) => [
        { type: 'DailyNotes', id: `${projectId}-${date || 'all'}` },
        { type: 'Project', id: projectId }
      ]
    }),

    updateDailyTrainingNotes: builder.mutation({
      query: ({ projectId, date, keyHighlights, challenges, sessionNotes, author, authorRole }) => ({
        url: `projects/daily-training-notes`,
        method: 'POST',
        params: { projectId, date },
        body: { keyHighlights, challenges, sessionNotes, author, authorRole }
      }),
      invalidatesTags: (result, error, { projectId, date }) => [
        { type: 'DailyNotes', id: `${projectId}-${date}` },
        { type: 'DailyNotes', id: `${projectId}-all` },
        { type: 'Project', id: projectId }
      ]
    }),

    deleteDailyTrainingNotes: builder.mutation({
      query: ({ projectId, date }) => ({
        url: `projects/daily-training-notes`,
        method: 'DELETE',
        params: { projectId, date }
      }),
      invalidatesTags: (result, error, { projectId, date }) => [
        { type: 'DailyNotes', id: `${projectId}-${date}` },
        { type: 'DailyNotes', id: `${projectId}-all` },
        { type: 'Project', id: projectId }
      ]
    }),
  }),
});

// Export hooks for use in components
export const {
  // Queries
  useGetProjectAgendaQuery,
  useGetProjectDashboardQuery,
  useGetProjectSettingsQuery,
  useGetProjectParticipantsQuery,
  useGetTrainingRecipientParticipantsQuery,
  useGetGroupsDetailsQuery,
  useGetEventProgressQuery,
  useGetSingleProjectQuery,
  useGetAvailableRolesQuery,
  useGetProjectChecklistQuery,
  useGetParticipantChecklistProgressQuery,

  // Mutations
  useUpdateAttendanceStatusMutation,
  useAddEventParticipantMutation,
  useRemoveEventParticipantMutation,
  useMoveParticipantBetweenEventsMutation,
  useAddEventGroupMutation,
  useMoveParticipantToGroupMutation,
  useAddParticipantToGroupMutation,
  useRemoveParticipantFromGroupMutation,
  useSaveModuleProgressMutation,
  useResetModuleProgressMutation,
  useAddEventParticipantsAndGroupsMutation,
  useUpdateProjectMutation,
  useUpdateProjectSettingsMutation,

  // Event Management
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useImportCurriculumScheduleMutation,

  // Group Management
  useGetGroupCurriculumsQuery,
  useAddGroupMutation,
  useUpdateGroupMutation,
  useRemoveGroupMutation,
  useClearProgressCacheMutation,

  // Participant Management
  useAddParticipantMutation,
  useAddMultipleParticipantsMutation,
  useUpdateParticipantMutation,
  useRemoveParticipantMutation,
  useRemoveMultipleParticipantsMutation,
  useImportParticipantsFromCSVMutation,

  // Checklist Management
  useToggleChecklistItemMutation,
  useUpdateParticipantChecklistProgressMutation,
  useGetCurriculumChecklistItemsQuery,
  useCreateCurriculumChecklistItemMutation,
  useUpdateCurriculumChecklistItemMutation,
  useDeleteCurriculumChecklistItemMutation,

  // Assessment Management
  useGetParticipantAssessmentsQuery,
  useGetProjectAssessmentsQuery,
  useRecordAssessmentScoreMutation,
  useGetAssessmentAttemptsQuery,
  useOverrideAssessmentScoreMutation,
  useToggleAssessmentForProjectMutation,

  // Daily Training Notes Management
  useGetDailyTrainingNotesQuery,
  useUpdateDailyTrainingNotesMutation,
  useDeleteDailyTrainingNotesMutation,

  // Utilities
  useLazyGetProjectAgendaQuery,
  usePrefetch,
} = projectApi;

// Export endpoints for advanced usage
export const { endpoints } = projectApi;