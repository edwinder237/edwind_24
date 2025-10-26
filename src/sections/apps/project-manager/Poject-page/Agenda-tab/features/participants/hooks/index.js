// Legacy version (kept for reference)
export { useAttendanceManagement as useAttendanceManagementLegacy } from './useAttendanceManagement';

// CQRS version - NOW ACTIVE! 🚀
export { useAttendanceManagementCQRS as useAttendanceManagement } from './useAttendanceManagementCQRS';

// Other exports
export { default as useAttendanceManagementCommands } from './useAttendanceManagementCommands';
export { default as useAttendanceManagementRTK } from './useAttendanceManagementRTK';
export { useAttendanceManagementCQRS } from './useAttendanceManagementCQRS';
export { default as useParticipantData } from './useParticipantData';
export { default as useAddParticipantsDialog } from './useAddParticipantsDialog';
export { default as useAddParticipantsDialogRTK } from './useAddParticipantsDialogRTK';
export { default as useNormalizedAttendance } from './useNormalizedAttendance';