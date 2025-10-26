/**
 * Store Services Index
 * 
 * Centralized exports for all store services.
 * This allows for clean imports: import { syncProjectToStores } from 'store/services'
 */

// Project synchronization services
export {
  syncProjectToStores,
  syncSettingsToStores,
  syncProjectInfoToStores,
  syncProjectInfoToSettingsStore,
  syncSettingsResponseToStores,
  syncInstructorsToStores,
  logSync,
  validateDispatch
} from './projectSync';

// Future services can be added here:
// export { ... } from './userSync';
// export { ... } from './courseSync';
// export { ... } from './eventSync';

// Default export for convenience
export { default as projectSync } from './projectSync';