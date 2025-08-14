// third-party
import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';


// project import
import calendar from './calendar';
import menu from './menu';
import snackbar from './snackbar';
import courses from './courses';
import projects from './projects';
import trainingRecipients from './trainingRecipients';
import events from './events';
import topics from './topics';
import loading from './loading';

// ==============================|| COMBINE REDUCERS ||============================== //

const reducers = combineReducers({
  calendar,
  menu,
  snackbar,
  courses,
  projects,
  trainingRecipients,
  events,
  topics,
  loading
});

export default reducers;
