// third-party
import { configureStore } from '@reduxjs/toolkit';
import { useDispatch as useAppDispatch, useSelector as useAppSelector } from 'react-redux';

// project import
import reducers from './reducers';
import { projectApi } from './api/projectApi';
import { createEventMiddleware, initializeEventHandlers } from './events/eventIntegration';
import { initializeCrossDomainHandlers } from './events/crossDomainEventHandlers';

// ==============================|| REDUX TOOLKIT - MAIN STORE ||============================== //

const store = configureStore({
  reducer: reducers,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          // Ignore RTK Query actions that may contain non-serializable values
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/REGISTER',
        ],
      },
    }).concat(
      projectApi.middleware,
      createEventMiddleware() // Add domain events middleware
    ),
});

// Initialize event handlers after store creation
initializeEventHandlers(store);

// Initialize cross-domain event handlers for Groups ↔ Agenda communication
initializeCrossDomainHandlers(store);

const { dispatch } = store;

const useDispatch = () => useAppDispatch();
const useSelector = useAppSelector;

export { store, dispatch, useSelector, useDispatch };
