import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { authApi } from "./services/authApi";
import { jobsApi, recruiterJobsApi } from "./services/jobsApi";
import { usersApi } from "./services/usersApi";
import { resumesApi } from "./services/resumesApi";
import { adminApi } from "./services/adminApi";
import { faqApi } from "./services/faqApi";
import { settingsApi } from "./services/settingsApi";
import { supportApi } from "./services/supportApi";
import { emailNotificationsApi } from "./services/emailNotificationsApi";
import authReducer from "./slices/authSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    [authApi.reducerPath]: authApi.reducer,
    [jobsApi.reducerPath]: jobsApi.reducer,
    [recruiterJobsApi.reducerPath]: recruiterJobsApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [resumesApi.reducerPath]: resumesApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [faqApi.reducerPath]: faqApi.reducer,
    [settingsApi.reducerPath]: settingsApi.reducer,
    [supportApi.reducerPath]: supportApi.reducer,
    [emailNotificationsApi.reducerPath]: emailNotificationsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      jobsApi.middleware,
      recruiterJobsApi.middleware,
      usersApi.middleware,
      resumesApi.middleware,
      adminApi.middleware,
      faqApi.middleware,
      settingsApi.middleware,
      supportApi.middleware,
      emailNotificationsApi.middleware
    ),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
