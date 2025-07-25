import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { authApi } from './services/authApi';
import { jobsApi } from './services/jobsApi';
import { usersApi } from './services/usersApi';
import { resumesApi } from './services/resumesApi';
import { adminApi } from './services/adminApi';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    [authApi.reducerPath]: authApi.reducer,
    [jobsApi.reducerPath]: jobsApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [resumesApi.reducerPath]: resumesApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      jobsApi.middleware,
      usersApi.middleware,
      resumesApi.middleware,
      adminApi.middleware
    ),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;