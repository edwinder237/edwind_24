import { attendanceCommands } from './attendanceCommands';

/**
 * Command Dispatcher - Centralized command execution
 * 
 * Provides a unified interface for executing semantic commands.
 * This abstraction allows for:
 * - Command logging and auditing
 * - Permission checking
 * - Command validation
 * - Event emission for cross-cutting concerns
 */

class CommandDispatcher {
  constructor(store) {
    this.store = store;
    this.commands = {
      ...attendanceCommands
    };
    this.commandHistory = [];
    this.maxHistorySize = 100;
  }

  /**
   * Execute a command with full context and logging
   * @param {string} commandName - The command to execute
   * @param {Object} payload - Command payload
   * @param {Object} context - Additional context (user, permissions, etc.)
   */
  async execute(commandName, payload, context = {}) {
    const command = this.commands[commandName];
    
    if (!command) {
      throw new Error(`Unknown command: ${commandName}`);
    }

    // Pre-execution logging
    const executionId = this.generateExecutionId();
    const commandExecution = {
      id: executionId,
      command: commandName,
      payload,
      context,
      timestamp: new Date().toISOString(),
      status: 'executing'
    };

    try {
      // Log command start
      this.logCommand(commandExecution);
      
      // Execute the command
      const result = await this.store.dispatch(command(payload));
      
      // Update execution record
      commandExecution.status = 'completed';
      commandExecution.result = result;
      commandExecution.completedAt = new Date().toISOString();
      
      // Log success
      this.logCommand(commandExecution);
      
      return result;

    } catch (error) {
      // Update execution record with error
      commandExecution.status = 'failed';
      commandExecution.error = error.message;
      commandExecution.completedAt = new Date().toISOString();
      
      // Log failure
      this.logCommand(commandExecution);
      
      throw error;
    }
  }

  /**
   * Get command execution history
   */
  getHistory() {
    return [...this.commandHistory];
  }

  /**
   * Get recent commands of a specific type
   */
  getRecentCommands(commandName, limit = 10) {
    return this.commandHistory
      .filter(cmd => cmd.command === commandName)
      .slice(-limit);
  }

  /**
   * Clear command history
   */
  clearHistory() {
    this.commandHistory = [];
  }

  /**
   * Generate unique execution ID
   */
  generateExecutionId() {
    return `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Log command execution
   */
  logCommand(commandExecution) {
    // Add to history
    this.commandHistory.push({ ...commandExecution });
    
    // Maintain history size limit
    if (this.commandHistory.length > this.maxHistorySize) {
      this.commandHistory = this.commandHistory.slice(-this.maxHistorySize);
    }

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      const { command, status, payload } = commandExecution;
      console.group(`🎯 Command: ${command} (${status})`);
      console.log('Payload:', payload);
      if (commandExecution.result) {
        console.log('Result:', commandExecution.result);
      }
      if (commandExecution.error) {
        console.error('Error:', commandExecution.error);
      }
      console.groupEnd();
    }
  }
}

/**
 * Create command dispatcher instance
 */
export const createCommandDispatcher = (store) => {
  return new CommandDispatcher(store);
};

/**
 * Command dispatcher hooks for React components
 */
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

export const useCommands = () => {
  const dispatch = useDispatch();

  const executeCommand = useCallback(async (commandName, payload) => {
    const command = attendanceCommands[commandName];
    
    if (!command) {
      throw new Error(`Unknown command: ${commandName}`);
    }

    try {
      const result = await dispatch(command(payload));
      
      // Emit custom event for cross-cutting concerns
      window.dispatchEvent(new CustomEvent('commandExecuted', {
        detail: {
          command: commandName,
          payload,
          result,
          timestamp: new Date().toISOString()
        }
      }));
      
      return result;
    } catch (error) {
      // Emit error event
      window.dispatchEvent(new CustomEvent('commandFailed', {
        detail: {
          command: commandName,
          payload,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }));
      
      throw error;
    }
  }, [dispatch]);

  return {
    // Attendance commands
    markPresent: useCallback(
      (participant, event, status = 'present') => 
        executeCommand('markParticipantPresent', { participant, event, actualStatus: status }),
      [executeCommand]
    ),
    
    markAbsent: useCallback(
      (participant, event, reason) => 
        executeCommand('markParticipantAbsent', { participant, event, reason }),
      [executeCommand]
    ),
    
    recordLateArrival: useCallback(
      (participant, event, minutesLate) => 
        executeCommand('recordLateArrival', { participant, event, minutesLate }),
      [executeCommand]
    ),

    // Enrollment commands
    enrollParticipant: useCallback(
      (participant, event, enrollmentType = 'individual') => 
        executeCommand('enrollParticipantInEvent', { participant, event, enrollmentType }),
      [executeCommand]
    ),
    
    removeParticipant: useCallback(
      (participant, event, reason) => 
        executeCommand('removeParticipantFromEvent', { participant, event, reason }),
      [executeCommand]
    ),

    // Group commands
    moveToGroup: useCallback(
      (participant, fromGroup, toGroup) => 
        executeCommand('moveParticipantToGroup', { participant, fromGroup, toGroup }),
      [executeCommand]
    ),
    
    enrollGroup: useCallback(
      (group, event) => 
        executeCommand('enrollGroupInEvent', { group, event }),
      [executeCommand]
    ),

    // Bulk commands
    enrollMultiple: useCallback(
      (participants, groups, event) => 
        executeCommand('enrollMultipleInEvent', { participants, groups, event }),
      [executeCommand]
    ),

    // Generic command execution
    execute: executeCommand
  };
};

/**
 * Command shortcuts for common operations
 */
export const CommandShortcuts = {
  // Quick attendance updates
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  SCHEDULED: 'scheduled',

  // Quick actions
  quickMarkPresent: (participant, event) => ({
    command: 'markParticipantPresent',
    payload: { participant, event, actualStatus: 'present' }
  }),

  quickMarkAbsent: (participant, event) => ({
    command: 'markParticipantAbsent',
    payload: { participant, event }
  }),

  quickEnroll: (participant, event) => ({
    command: 'enrollParticipantInEvent',
    payload: { participant, event }
  })
};