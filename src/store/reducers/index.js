// third-party
import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// RTK Query API
import { projectApi } from '../api/projectApi';

// Normalized entities
import { entityReducers } from '../entities';

// project import
import calendar from './calendar';
import menu from './menu';
import snackbar from './snackbar';
import user from './user';
import courses from './courses';
import projects from './project'; // Modular structure with projects.js instead of core.js
// projectDashboard removed - dashboard metrics now computed via derived selectors
import projectAgenda from './project/agenda';
import projectSettings from './project/settings';
import trainingRecipients from './trainingRecipients';
import events from './events';
import topics from './topics';
import loading from './loading';

// ==============================|| COMBINE REDUCERS ||============================== //

const reducers = combineReducers({
  calendar,
  menu,
  snackbar,
  user,
  courses,
  projects,
  // projectDashboard removed - using derived selectors (selectCompleteDashboard)
  projectAgenda,
  projectSettings,
  trainingRecipients,
  eventsLegacy: events, // Rename legacy events to avoid conflict
  topics,
  loading,
  // RTK Query API slice
  [projectApi.reducerPath]: projectApi.reducer,
  // Normalized entities (these now get the clean names)
  ...entityReducers
});

export default reducers;
