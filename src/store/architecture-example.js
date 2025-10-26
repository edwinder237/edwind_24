// CQRS + Event-Driven Architecture for EDWIND
// Based on the diagram provided

// ==============================|| COMMANDS (INTENTS) ||============================== //

const commands = {
  // User intentions - what they want to achieve
  addParticipant: createAsyncThunk(
    'commands/addParticipant',
    async ({ eventId, participantId }, { dispatch }) => {
      // 1. Dispatch command intent
      const command = {
        type: 'ADD_PARTICIPANT',
        payload: { eventId, participantId },
        timestamp: Date.now(),
        userId: getCurrentUserId()
      };
      
      // 2. Forward to sync layer
      return dispatch(syncLayer.processCommand(command));
    }
  ),

  moveParticipantToGroup: createAsyncThunk(
    'commands/moveParticipantToGroup',
    async ({ participantId, fromGroupId, toGroupId }, { dispatch }) => {
      const command = {
        type: 'MOVE_PARTICIPANT_TO_GROUP',
        payload: { participantId, fromGroupId, toGroupId },
        timestamp: Date.now(),
        userId: getCurrentUserId()
      };
      
      return dispatch(syncLayer.processCommand(command));
    }
  ),

  updateAttendanceStatus: createAsyncThunk(
    'commands/updateAttendanceStatus',
    async ({ eventId, participantId, status }, { dispatch }) => {
      const command = {
        type: 'UPDATE_ATTENDANCE_STATUS',
        payload: { eventId, participantId, status },
        timestamp: Date.now(),
        userId: getCurrentUserId()
      };
      
      return dispatch(syncLayer.processCommand(command));
    }
  )
};

// ==============================|| CENTRALIZED SYNC LAYER ||============================== //

const syncLayer = {
  // RTK Query API for network calls
  api: createApi({
    reducerPath: 'syncApi',
    baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
    tagTypes: ['Project', 'Event', 'Participant', 'Group'],
    endpoints: (builder) => ({
      addEventParticipant: builder.mutation({
        query: ({ eventId, participantId }) => ({
          url: `events/${eventId}/participants`,
          method: 'POST',
          body: { participantId }
        }),
        invalidatesTags: ['Event', 'Participant']
      }),
      
      moveParticipantGroup: builder.mutation({
        query: ({ participantId, fromGroupId, toGroupId }) => ({
          url: `participants/${participantId}/move-group`,
          method: 'PATCH',
          body: { fromGroupId, toGroupId }
        }),
        invalidatesTags: ['Group', 'Participant']
      })
    })
  }),

  // Command processor
  processCommand: createAsyncThunk(
    'syncLayer/processCommand',
    async (command, { dispatch, getState }) => {
      try {
        // 1. Optimistic update (optional)
        dispatch(domainEvents.emit({
          type: `${command.type}_PENDING`,
          payload: command.payload,
          optimistic: true
        }));

        // 2. Network call
        let response;
        switch (command.type) {
          case 'ADD_PARTICIPANT':
            response = await dispatch(
              syncLayer.api.endpoints.addEventParticipant.initiate(command.payload)
            ).unwrap();
            break;
            
          case 'MOVE_PARTICIPANT_TO_GROUP':
            response = await dispatch(
              syncLayer.api.endpoints.moveParticipantGroup.initiate(command.payload)
            ).unwrap();
            break;
            
          default:
            throw new Error(`Unknown command type: ${command.type}`);
        }

        // 3. Emit domain events on success
        dispatch(domainEvents.emit({
          type: `${command.type}_SUCCESS`,
          payload: { ...command.payload, response },
          timestamp: Date.now()
        }));

        return response;

      } catch (error) {
        // 4. Emit failure events
        dispatch(domainEvents.emit({
          type: `${command.type}_FAILED`,
          payload: { ...command.payload, error: error.message },
          timestamp: Date.now()
        }));
        
        throw error;
      }
    }
  )
};

// ==============================|| DOMAIN EVENTS ||============================== //

const domainEvents = createSlice({
  name: 'domainEvents',
  initialState: {
    events: [],
    processing: false
  },
  reducers: {
    emit: (state, action) => {
      // Store event for replay/debugging
      state.events.push(action.payload);
      
      // Limit event history
      if (state.events.length > 1000) {
        state.events = state.events.slice(-500);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncLayer.processCommand.pending, (state) => {
        state.processing = true;
      })
      .addCase(syncLayer.processCommand.fulfilled, (state) => {
        state.processing = false;
      })
      .addCase(syncLayer.processCommand.rejected, (state) => {
        state.processing = false;
      });
  }
});

// ==============================|| NORMALIZED DOMAIN STORES ||============================== //

// Participants Store (Normalized with EntityAdapter)
const participantsAdapter = createEntityAdapter({
  selectId: (participant) => participant.id,
  sortComparer: (a, b) => a.firstName.localeCompare(b.firstName)
});

const participantsSlice = createSlice({
  name: 'participants',
  initialState: participantsAdapter.getInitialState({
    loading: false,
    lastUpdated: null
  }),
  reducers: {
    // Direct updates for optimistic UI
    updateParticipantOptimistic: participantsAdapter.updateOne
  },
  extraReducers: (builder) => {
    builder
      // Listen to domain events
      .addCase(domainEvents.actions.emit, (state, action) => {
        const { type, payload, optimistic } = action.payload;
        
        switch (type) {
          case 'ADD_PARTICIPANT_SUCCESS':
            participantsAdapter.upsertOne(state, payload.response.participant);
            break;
            
          case 'MOVE_PARTICIPANT_TO_GROUP_SUCCESS':
            participantsAdapter.updateOne(state, {
              id: payload.participantId,
              changes: { groupId: payload.toGroupId }
            });
            break;
            
          case 'UPDATE_ATTENDANCE_STATUS_SUCCESS':
            participantsAdapter.updateOne(state, {
              id: payload.participantId,
              changes: { 
                attendanceStatus: payload.status,
                lastAttendanceUpdate: Date.now()
              }
            });
            break;
        }
        
        if (!optimistic) {
          state.lastUpdated = Date.now();
        }
      });
  }
});

// Groups Store
const groupsAdapter = createEntityAdapter();

const groupsSlice = createSlice({
  name: 'groups',
  initialState: groupsAdapter.getInitialState(),
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(domainEvents.actions.emit, (state, action) => {
      const { type, payload } = action.payload;
      
      switch (type) {
        case 'MOVE_PARTICIPANT_TO_GROUP_SUCCESS':
          // Update group membership
          if (payload.fromGroupId) {
            const fromGroup = state.entities[payload.fromGroupId];
            if (fromGroup) {
              fromGroup.participantIds = fromGroup.participantIds.filter(
                id => id !== payload.participantId
              );
            }
          }
          
          const toGroup = state.entities[payload.toGroupId];
          if (toGroup && !toGroup.participantIds.includes(payload.participantId)) {
            toGroup.participantIds.push(payload.participantId);
          }
          break;
      }
    });
  }
});

// Agenda Store
const agendaSlice = createSlice({
  name: 'agenda',
  initialState: {
    events: [],
    selectedEventId: null,
    attendanceStats: {},
    lastUpdated: null
  },
  reducers: {
    selectEvent: (state, action) => {
      state.selectedEventId = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(domainEvents.actions.emit, (state, action) => {
      const { type, payload } = action.payload;
      
      switch (type) {
        case 'ADD_PARTICIPANT_SUCCESS':
        case 'UPDATE_ATTENDANCE_STATUS_SUCCESS':
          // Recalculate attendance stats
          const eventId = payload.eventId;
          state.attendanceStats[eventId] = calculateAttendanceStats(
            state.events.find(e => e.id === eventId)
          );
          state.lastUpdated = Date.now();
          break;
      }
    });
  }
});

// ==============================|| DERIVED VIEWS (SELECTORS) ||============================== //

// Dashboard derived state
const selectDashboardData = createSelector(
  [
    (state) => state.participants,
    (state) => state.groups,
    (state) => state.agenda,
    (state) => state.settings
  ],
  (participants, groups, agenda, settings) => ({
    totalParticipants: participants.ids.length,
    activeGroups: groups.ids.length,
    upcomingEvents: agenda.events.filter(e => new Date(e.start) > new Date()).length,
    attendanceRate: calculateOverallAttendanceRate(agenda.attendanceStats),
    lastUpdated: Math.max(
      participants.lastUpdated || 0,
      groups.lastUpdated || 0,
      agenda.lastUpdated || 0
    )
  })
);

// Overview derived state
const selectOverviewData = createSelector(
  [
    (state) => state.participants.entities,
    (state) => state.groups.entities,
    (state) => state.agenda.selectedEventId,
    (state) => state.agenda.events
  ],
  (participants, groups, selectedEventId, events) => {
    const selectedEvent = events.find(e => e.id === selectedEventId);
    if (!selectedEvent) return null;
    
    return {
      event: selectedEvent,
      participants: selectedEvent.participantIds.map(id => participants[id]),
      groups: selectedEvent.groupIds.map(id => groups[id]),
      stats: calculateEventStats(selectedEvent, participants)
    };
  }
);

// ==============================|| STORE CONFIGURATION ||============================== //

export const store = configureStore({
  reducer: {
    // Domain stores
    participants: participantsSlice.reducer,
    groups: groupsSlice.reducer,
    agenda: agendaSlice.reducer,
    settings: settingsSlice.reducer,
    
    // System stores
    domainEvents: domainEvents.reducer,
    
    // API layer
    [syncLayer.api.reducerPath]: syncLayer.api.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(syncLayer.api.middleware)
      .concat(eventSyncMiddleware), // Custom middleware for cross-store sync
});

// Event sync middleware
const eventSyncMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  
  // Additional cross-cutting concerns
  if (action.type === domainEvents.actions.emit.type) {
    const event = action.payload;
    
    // Analytics tracking
    if (!event.optimistic) {
      analytics.track(event.type, event.payload);
    }
    
    // Real-time notifications
    if (event.type.includes('SUCCESS')) {
      notificationService.show({
        type: 'success',
        message: getSuccessMessage(event.type)
      });
    }
    
    // WebSocket sync for real-time collaboration
    if (shouldSyncRealtime(event.type)) {
      websocketService.broadcast(event);
    }
  }
  
  return result;
};

// ==============================|| USAGE IN COMPONENTS ||============================== //

// In your Attendees component
const Attendees = ({ selectedEvent }) => {
  const dispatch = useDispatch();
  
  // Derived data from multiple stores
  const overviewData = useSelector(selectOverviewData);
  const isProcessing = useSelector(state => state.domainEvents.processing);
  
  const handleAddParticipant = (participantId) => {
    dispatch(commands.addParticipant({
      eventId: selectedEvent.id,
      participantId
    }));
  };
  
  const handleMoveToGroup = (participantId, fromGroupId, toGroupId) => {
    dispatch(commands.moveParticipantToGroup({
      participantId,
      fromGroupId,
      toGroupId
    }));
  };
  
  // Component renders based on derived state...
};