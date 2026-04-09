import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import opdReducer from './slices/opdSlice';

const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['isAuthenticated', 'user', 'token'],
};

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  ui: uiReducer,
  opd: opdReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
