// third-party
import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';


// project import
import chat from './chat';
import calendar from './calendar';
import menu from './menu';
import snackbar from './snackbar';
import productReducer from './product';
import cartReducer from './cart';
import kanban from './kanban';
import courses from './courses';
import invoice from './invoice';
import projects from './projects';

// ==============================|| COMBINE REDUCERS ||============================== //

const reducers = combineReducers({
  chat,
  calendar,
  menu,
  snackbar,
  cart: persistReducer(
    {
      key: 'cart',
      storage: AsyncStorage, //use to be storage
      keyPrefix: 'mantis-next-ts-'
    },
    cartReducer
  ),
  product: productReducer,
  kanban,
  invoice,
 courses,
  projects
});

export default reducers;
