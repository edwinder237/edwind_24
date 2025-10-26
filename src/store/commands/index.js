/**
 * Semantic Commands Index
 *
 * Centralized export point for all semantic commands in the application.
 * Commands represent user intentions and business operations rather than
 * technical implementation details.
 */

// Import all command modules
import { participantCommands } from './participantCommands';
import { attendanceCommands } from './attendanceCommands';
import { groupCommands } from './groupCommands';
import { eventCommands } from './eventCommands';
import { checklistCommands } from './checklistCommands';
import { settingsCommands } from './settingsCommands';
import { calendarCommands } from './calendarCommands';

// Export individual command modules
export { participantCommands } from './participantCommands';
export { attendanceCommands } from './attendanceCommands';
export { groupCommands } from './groupCommands';
export { eventCommands } from './eventCommands';
export { checklistCommands } from './checklistCommands';
export { settingsCommands } from './settingsCommands';
export { calendarCommands } from './calendarCommands';

// Export command dispatcher utilities
export { executeCommand, createCommandContext } from './commandDispatcher';

// Export combined commands object for convenience
export const commands = {
  participant: participantCommands,
  attendance: attendanceCommands,
  group: groupCommands,
  event: eventCommands,
  checklist: checklistCommands,
  settings: settingsCommands,
  calendar: calendarCommands
};

// Export default as commands for backward compatibility
export default commands;