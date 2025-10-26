/**
 * Event Integration Layer
 * 
 * Connects domain events with Redux actions, RTK Query, and semantic commands.
 * This provides automatic event emission for all state changes.
 */

import eventBus from './EventBus';
import { DomainEvents, createAttendanceEvent, createEnrollmentEvent } from './domainEvents';

/**
 * Redux Middleware for automatic event emission
 */
export const createEventMiddleware = () => {
  return store => next => action => {
    const result = next(action);
    const state = store.getState();

    // Map Redux actions to domain events
    switch (action.type) {
      // Attendance events
      case 'attendance/markPresent/fulfilled':
        eventBus.publish(DomainEvents.PARTICIPANT_MARKED_PRESENT, 
          action.payload.command,
          { source: 'redux', action: action.type }
        );
        break;

      case 'attendance/markAbsent/fulfilled':
        eventBus.publish(DomainEvents.PARTICIPANT_MARKED_ABSENT,
          action.payload.command,
          { source: 'redux', action: action.type }
        );
        break;

      case 'attendance/recordLateArrival/fulfilled':
        eventBus.publish(DomainEvents.PARTICIPANT_ARRIVED_LATE,
          action.payload.command,
          { source: 'redux', action: action.type }
        );
        break;

      // Enrollment events
      case 'enrollment/enrollParticipant/fulfilled':
        eventBus.publish(DomainEvents.PARTICIPANT_ENROLLED_IN_EVENT,
          action.payload.command,
          { source: 'redux', action: action.type }
        );
        break;

      case 'enrollment/removeParticipant/fulfilled':
        eventBus.publish(DomainEvents.PARTICIPANT_REMOVED_FROM_EVENT,
          action.payload.command,
          { source: 'redux', action: action.type }
        );
        break;

      case 'enrollment/enrollGroup/fulfilled':
        eventBus.publish(DomainEvents.GROUP_ENROLLED_IN_EVENT,
          action.payload.command,
          { source: 'redux', action: action.type }
        );
        break;

      // Participant events
      case 'participant/add/fulfilled':
        eventBus.publish(DomainEvents.PARTICIPANT_ADDED_TO_PROJECT,
          action.payload.command,
          { source: 'participant-form', action: action.type }
        );
        break;

      case 'participant/add/rejected':
        eventBus.publish(DomainEvents.PARTICIPANT_ADD_FAILED,
          {
            command: action.meta?.arg,
            error: action.error
          },
          { source: 'participant-form', action: action.type }
        );
        break;

      // Project events
      case 'projects/addProject/fulfilled':
        eventBus.publish(DomainEvents.PROJECT_CREATED,
          action.payload,
          { source: 'redux', action: action.type }
        );
        break;

      case 'projects/updateProject/fulfilled':
        eventBus.publish(DomainEvents.PROJECT_UPDATED,
          action.payload,
          { source: 'redux', action: action.type }
        );
        break;

      // Error events
      case 'attendance/markPresent/rejected':
      case 'attendance/markAbsent/rejected':
      case 'enrollment/enrollParticipant/rejected':
        eventBus.publish(DomainEvents.CRITICAL_ERROR_OCCURRED,
          {
            action: action.type,
            error: action.error,
            payload: action.meta?.arg
          },
          { source: 'redux', action: action.type }
        );
        break;
    }

    return result;
  };
};

/**
 * RTK Query Event Integration
 * Wraps RTK Query endpoints to emit events on success/failure
 */
export const withEventEmission = (endpoint, eventConfig) => {
  const originalOnQueryStarted = endpoint.onQueryStarted;
  
  endpoint.onQueryStarted = async (arg, api) => {
    try {
      // Call original if exists
      if (originalOnQueryStarted) {
        await originalOnQueryStarted(arg, api);
      }
      
      // Wait for query to complete
      const result = await api.queryFulfilled;
      
      // Emit success event
      if (eventConfig.successEvent) {
        eventBus.publish(eventConfig.successEvent, {
          ...result.data,
          requestArgs: arg
        }, {
          source: 'rtk-query',
          endpoint: endpoint.name
        });
      }
    } catch (error) {
      // Emit error event
      if (eventConfig.errorEvent) {
        eventBus.publish(eventConfig.errorEvent, {
          error: error.error,
          requestArgs: arg
        }, {
          source: 'rtk-query',
          endpoint: endpoint.name
        });
      }
    }
  };
  
  return endpoint;
};

/**
 * Event-Driven Side Effects
 * Subscribe to events and trigger side effects
 */
export const initializeEventHandlers = (store) => {
  // Import snackbar action
  const { openSnackbar } = require('store/reducers/snackbar');

  // ==============================|| PARTICIPANT EVENTS ||============================== //

  // Success notification for participant updates
  eventBus.subscribe(DomainEvents.PARTICIPANT_UPDATED, async (event) => {
    const { participant, updatedFields } = event.payload;

    const participantName = participant.name || 'Participant';
    store.dispatch(openSnackbar({
      open: true,
      message: `${participantName} updated successfully`,
      variant: 'alert',
      alert: { color: 'success' }
    }));
  });

  // Error notification for participant update failures
  eventBus.subscribe(DomainEvents.PARTICIPANT_UPDATE_FAILED, async (event) => {
    const { error } = event.payload;

    store.dispatch(openSnackbar({
      open: true,
      message: error || 'Failed to update participant',
      variant: 'alert',
      alert: { color: 'error' }
    }));
  });

  // Success notification for role updates
  eventBus.subscribe(DomainEvents.PARTICIPANT_ROLE_UPDATED, async (event) => {
    const { participant, action, previousRole, newRole } = event.payload;

    store.dispatch(openSnackbar({
      open: true,
      message: `Role updated successfully${newRole ? ` to ${newRole}` : ''}`,
      variant: 'alert',
      alert: { color: 'success' }
    }));
  });

  // Error notification for role update failures
  eventBus.subscribe(DomainEvents.PARTICIPANT_ROLE_UPDATE_FAILED, async (event) => {
    const { error, reason } = event.payload;

    let message = 'Failed to update role';
    if (reason === 'missing_participant_id') {
      message = 'Invalid participant ID';
    } else if (error) {
      message = `Failed to update role: ${error}`;
    }

    store.dispatch(openSnackbar({
      open: true,
      message,
      variant: 'alert',
      alert: { color: 'error' }
    }));
  });

  // ==============================|| GROUP EVENTS ||============================== //

  // Success notification for adding participant to group
  eventBus.subscribe(DomainEvents.PARTICIPANT_ADDED_TO_GROUP, async (event) => {
    store.dispatch(openSnackbar({
      open: true,
      message: 'Participant has been added to group successfully',
      variant: 'alert',
      alert: { color: 'success' }
    }));
  });

  // Error notification for adding participant to group
  eventBus.subscribe(DomainEvents.PARTICIPANT_ADD_TO_GROUP_FAILED, async (event) => {
    const { error } = event.payload;

    store.dispatch(openSnackbar({
      open: true,
      message: error || 'Failed to add participant to group',
      variant: 'alert',
      alert: { color: 'error' }
    }));
  });

  // Success notification for removing participant from group
  eventBus.subscribe(DomainEvents.PARTICIPANT_REMOVED_FROM_GROUP, async (event) => {
    store.dispatch(openSnackbar({
      open: true,
      message: 'Participant has been removed from group successfully',
      variant: 'alert',
      alert: { color: 'success' }
    }));
  });

  // Error notification for removing participant from group
  eventBus.subscribe(DomainEvents.PARTICIPANT_REMOVE_FROM_GROUP_FAILED, async (event) => {
    const { error } = event.payload;

    store.dispatch(openSnackbar({
      open: true,
      message: error || 'Failed to remove participant from group',
      variant: 'alert',
      alert: { color: 'error' }
    }));
  });

  // Success notification for moving participant between groups
  eventBus.subscribe(DomainEvents.PARTICIPANT_MOVED_BETWEEN_GROUPS, async (event) => {
    const { newGroup, previousGroup } = event.payload;

    let message = 'Participant group updated successfully';
    if (!previousGroup && newGroup) {
      message = 'Participant added to group successfully';
    } else if (previousGroup && !newGroup) {
      message = 'Participant removed from group successfully';
    }

    store.dispatch(openSnackbar({
      open: true,
      message,
      variant: 'alert',
      alert: { color: 'success' }
    }));
  });

  // Error notification for moving participant between groups
  eventBus.subscribe(DomainEvents.PARTICIPANT_MOVE_BETWEEN_GROUPS_FAILED, async (event) => {
    const { error } = event.payload;

    store.dispatch(openSnackbar({
      open: true,
      message: error || 'Failed to update group assignment',
      variant: 'alert',
      alert: { color: 'error' }
    }));
  });

  // ==============================|| ATTENDANCE EVENTS ||============================== //

  // Attendance threshold monitoring
  eventBus.subscribe(DomainEvents.PARTICIPANT_MARKED_PRESENT, async (event) => {
    const { event: trainingEvent } = event.payload;

    // Check if attendance threshold reached
    if (trainingEvent.currentAttendance >= trainingEvent.requiredAttendance) {
      eventBus.publish(DomainEvents.ATTENDANCE_THRESHOLD_REACHED, {
        eventId: trainingEvent.id,
        threshold: trainingEvent.requiredAttendance,
        current: trainingEvent.currentAttendance
      });
    }
  });

  // Capacity monitoring
  eventBus.subscribe(DomainEvents.PARTICIPANT_ENROLLED_IN_EVENT, async (event) => {
    const { event: trainingEvent } = event.payload;
    
    if (trainingEvent.currentCount >= trainingEvent.capacity) {
      eventBus.publish(DomainEvents.EVENT_CAPACITY_REACHED, {
        eventId: trainingEvent.id,
        capacity: trainingEvent.capacity
      });
    } else if (trainingEvent.currentCount >= trainingEvent.capacity * 0.9) {
      eventBus.publish(DomainEvents.EVENT_CAPACITY_WARNING, {
        eventId: trainingEvent.id,
        capacity: trainingEvent.capacity,
        current: trainingEvent.currentCount,
        remaining: trainingEvent.capacity - trainingEvent.currentCount
      });
    }
  });

  // Cache invalidation on updates
  eventBus.subscribe(DomainEvents.ATTENDANCE_STATUS_CHANGED, async (event) => {
    // Trigger cache invalidation for affected entities
    eventBus.publish(DomainEvents.CACHE_INVALIDATED, {
      entities: ['event', 'participant'],
      ids: [event.payload.event.id, event.payload.participant.id]
    });
  });

  // Progress calculation triggers
  eventBus.subscribe(DomainEvents.MODULE_COMPLETED, async (event) => {
    const { participant, course } = event.payload;
    
    // Trigger progress recalculation
    eventBus.publish(DomainEvents.GROUP_PROGRESS_CALCULATED, {
      trigger: 'module_completion',
      participant,
      course
    });
  });

  // Notification triggers
  eventBus.subscribe(DomainEvents.EVENT_CAPACITY_REACHED, async (event) => {
    // Send notification to project managers
    eventBus.publish(DomainEvents.NOTIFICATION_SENT, {
      type: 'capacity_reached',
      recipients: ['project_managers'],
      data: event.payload
    });
  });

  // Audit logging
  eventBus.subscribe('*', async (event) => {
    // Log all events for audit trail (disabled for production)
    // if (process.env.NODE_ENV === 'development') {
    //   console.group(`🎯 Domain Event: ${event.type}`);
    //   console.log('Payload:', event.payload);
    //   console.log('Metadata:', event.metadata);
    //   console.groupEnd();
    // }
  });
};

/**
 * React Hook for subscribing to domain events
 */
import { useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';

export const useDomainEvent = (eventType, handler, deps = []) => {
  useEffect(() => {
    const unsubscribe = eventBus.subscribe(eventType, handler);
    return unsubscribe;
  }, [eventType, ...deps]);
};

export const useDomainEventEmitter = () => {
  const dispatch = useDispatch();
  
  const emit = useCallback((eventType, payload, metadata = {}) => {
    return eventBus.publish(eventType, payload, {
      ...metadata,
      source: metadata.source || 'react-component'
    });
  }, []);

  return emit;
};

/**
 * HOC for components that need event capabilities
 */
export const withDomainEvents = (Component) => {
  return function WithDomainEventsComponent(props) {
    const emit = useDomainEventEmitter();
    
    return <Component {...props} emitEvent={emit} />;
  };
};

/**
 * Event Aggregator for complex event patterns
 */
export class EventAggregator {
  constructor() {
    this.aggregations = new Map();
  }

  /**
   * Aggregate related events within a time window
   */
  aggregate(eventTypes, windowMs, handler) {
    const aggregationId = `agg_${Date.now()}`;
    const buffer = [];
    let timeoutId = null;

    const flush = () => {
      if (buffer.length > 0) {
        handler(buffer);
        buffer.length = 0;
      }
    };

    eventTypes.forEach(eventType => {
      eventBus.subscribe(eventType, (event) => {
        buffer.push(event);
        
        clearTimeout(timeoutId);
        timeoutId = setTimeout(flush, windowMs);
      }, { id: aggregationId });
    });

    this.aggregations.set(aggregationId, { eventTypes, flush });
    
    return () => this.stopAggregation(aggregationId);
  }

  stopAggregation(aggregationId) {
    const aggregation = this.aggregations.get(aggregationId);
    if (aggregation) {
      aggregation.flush();
      aggregation.eventTypes.forEach(eventType => {
        eventBus.unsubscribe(eventType, aggregationId);
      });
      this.aggregations.delete(aggregationId);
    }
  }
}

// Create singleton aggregator
export const eventAggregator = new EventAggregator();

/**
 * Event Sourcing Support
 * Store and replay events for debugging and testing
 */
export class EventStore {
  constructor() {
    this.snapshots = new Map();
  }

  /**
   * Create a snapshot of current events
   */
  createSnapshot(name) {
    const snapshot = {
      name,
      timestamp: new Date().toISOString(),
      events: eventBus.getHistory()
    };
    
    this.snapshots.set(name, snapshot);
    return snapshot;
  }

  /**
   * Replay events from a snapshot
   */
  async replaySnapshot(name, speed = 1) {
    const snapshot = this.snapshots.get(name);
    if (!snapshot) {
      throw new Error(`Snapshot "${name}" not found`);
    }
    
    await eventBus.replay(snapshot.events, speed);
  }

  /**
   * Export events for debugging
   */
  exportEvents(filter = {}) {
    const events = eventBus.getHistory(filter);
    return JSON.stringify(events, null, 2);
  }

  /**
   * Import and replay events
   */
  async importAndReplay(eventsJson, speed = 1) {
    const events = JSON.parse(eventsJson);
    await eventBus.replay(events, speed);
  }
}

// Create singleton event store
export const eventStore = new EventStore();