/**
 * Domain Event Bus
 * 
 * Centralized event bus for domain events in the EDWIND application.
 * This provides a publish-subscribe pattern for decoupled communication
 * between different parts of the application.
 * 
 * Features:
 * - Type-safe event definitions
 * - Async event handlers
 * - Event replay capabilities
 * - Event filtering and routing
 * - Performance monitoring
 */

class EventBus {
  constructor() {
    this.listeners = new Map();
    this.eventHistory = [];
    this.maxHistorySize = 1000;
    this.middleware = [];
    this.eventTypes = new Set();
    this.performanceMetrics = new Map();
  }

  /**
   * Register an event type with schema validation
   */
  registerEventType(eventType, schema = null) {
    this.eventTypes.add(eventType);
    if (schema) {
      // Store schema for validation if needed
      this.eventTypes[eventType] = schema;
    }
  }

  /**
   * Subscribe to an event
   * @param {string} eventType - The event type to listen for
   * @param {Function} handler - The handler function
   * @param {Object} options - Subscription options
   * @returns {Function} Unsubscribe function
   */
  subscribe(eventType, handler, options = {}) {
    const {
      once = false,
      priority = 0,
      filter = null,
      id = this.generateSubscriptionId()
    } = options;

    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    const subscription = {
      id,
      handler,
      once,
      priority,
      filter,
      subscribed: new Date().toISOString()
    };

    // Add subscription sorted by priority
    const listeners = this.listeners.get(eventType);
    const insertIndex = listeners.findIndex(l => l.priority < priority);
    
    if (insertIndex === -1) {
      listeners.push(subscription);
    } else {
      listeners.splice(insertIndex, 0, subscription);
    }

    // Return unsubscribe function
    return () => this.unsubscribe(eventType, id);
  }

  /**
   * Unsubscribe from an event
   */
  unsubscribe(eventType, subscriptionId) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      const index = listeners.findIndex(l => l.id === subscriptionId);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Publish an event
   * @param {string} eventType - The event type
   * @param {Object} payload - Event payload
   * @param {Object} metadata - Additional metadata
   */
  async publish(eventType, payload, metadata = {}) {
    const event = this.createEvent(eventType, payload, metadata);
    
    // Run middleware
    for (const mw of this.middleware) {
      await mw(event);
    }

    // Store in history
    this.addToHistory(event);

    // Track performance
    const startTime = performance.now();

    // Get listeners for this event type
    const listeners = this.listeners.get(eventType) || [];
    const wildcardListeners = this.listeners.get('*') || [];
    const allListeners = [...listeners, ...wildcardListeners];

    // Execute handlers
    const promises = allListeners.map(async (subscription) => {
      // Apply filter if specified
      if (subscription.filter && !subscription.filter(event)) {
        return;
      }

      try {
        await subscription.handler(event);
        
        // Remove if once
        if (subscription.once) {
          this.unsubscribe(eventType, subscription.id);
        }
      } catch (error) {
        console.error(`Error in event handler for ${eventType}:`, error);
        // Emit error event
        if (eventType !== 'EVENT_HANDLER_ERROR') {
          this.publish('EVENT_HANDLER_ERROR', {
            originalEvent: event,
            error: error.message,
            handler: subscription.id
          });
        }
      }
    });

    await Promise.allSettled(promises);

    // Record performance metrics
    const endTime = performance.now();
    this.recordPerformance(eventType, endTime - startTime, allListeners.length);

    return event;
  }

  /**
   * Create an event object
   */
  createEvent(eventType, payload, metadata = {}) {
    return {
      id: this.generateEventId(),
      type: eventType,
      payload,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        correlationId: metadata.correlationId || this.generateCorrelationId(),
        userId: metadata.userId,
        source: metadata.source || 'unknown'
      }
    };
  }

  /**
   * Add event to history
   */
  addToHistory(event) {
    this.eventHistory.push(event);
    
    // Maintain history size limit
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get event history
   */
  getHistory(filter = {}) {
    let history = [...this.eventHistory];
    
    if (filter.type) {
      history = history.filter(e => e.type === filter.type);
    }
    
    if (filter.since) {
      const sinceDate = new Date(filter.since);
      history = history.filter(e => new Date(e.metadata.timestamp) > sinceDate);
    }
    
    if (filter.correlationId) {
      history = history.filter(e => e.metadata.correlationId === filter.correlationId);
    }
    
    return history;
  }

  /**
   * Replay events
   */
  async replay(events, speed = 1) {
    for (const event of events) {
      await this.publish(event.type, event.payload, event.metadata);
      
      if (speed > 0) {
        await new Promise(resolve => setTimeout(resolve, 100 / speed));
      }
    }
  }

  /**
   * Add middleware
   */
  use(middleware) {
    this.middleware.push(middleware);
  }

  /**
   * Record performance metrics
   */
  recordPerformance(eventType, duration, handlerCount) {
    if (!this.performanceMetrics.has(eventType)) {
      this.performanceMetrics.set(eventType, {
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        maxDuration: 0,
        minDuration: Infinity
      });
    }
    
    const metrics = this.performanceMetrics.get(eventType);
    metrics.count++;
    metrics.totalDuration += duration;
    metrics.avgDuration = metrics.totalDuration / metrics.count;
    metrics.maxDuration = Math.max(metrics.maxDuration, duration);
    metrics.minDuration = Math.min(metrics.minDuration, duration);
    metrics.lastDuration = duration;
    metrics.lastHandlerCount = handlerCount;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(eventType = null) {
    if (eventType) {
      return this.performanceMetrics.get(eventType);
    }
    return Object.fromEntries(this.performanceMetrics);
  }

  /**
   * Clear all listeners
   */
  clear() {
    this.listeners.clear();
    this.eventHistory = [];
    this.performanceMetrics.clear();
  }

  /**
   * Generate unique IDs
   */
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  generateSubscriptionId() {
    return `sub_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  generateCorrelationId() {
    return `cor_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

// Create singleton instance
const eventBus = new EventBus();

// Export singleton and class
export default eventBus;
export { EventBus };

/**
 * React Hook for using the event bus
 */
import { useEffect, useCallback } from 'react';

export const useEventBus = () => {
  const subscribe = useCallback((eventType, handler, options) => {
    const unsubscribe = eventBus.subscribe(eventType, handler, options);
    return unsubscribe;
  }, []);

  const publish = useCallback((eventType, payload, metadata) => {
    return eventBus.publish(eventType, payload, metadata);
  }, []);

  const useEventSubscription = (eventType, handler, deps = []) => {
    useEffect(() => {
      const unsubscribe = eventBus.subscribe(eventType, handler);
      return unsubscribe;
    }, [eventType, ...deps]);
  };

  return {
    subscribe,
    publish,
    useEventSubscription,
    getHistory: eventBus.getHistory.bind(eventBus),
    getPerformanceMetrics: eventBus.getPerformanceMetrics.bind(eventBus)
  };
};