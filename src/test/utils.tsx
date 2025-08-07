import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { authSlice } from "@/app/store/slices/authSlice";
import { supportApi } from "@/app/store/services/supportApi";

// Mock store for testing
export const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
      [supportApi.reducerPath]: supportApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(supportApi.middleware),
    preloadedState: {
      auth: {
        user: {
          _id: "test-user-id",
          name: "Test User",
          email: "test@example.com",
          role: "user",
        },
        token: "test-token",
        isAuthenticated: true,
        ...initialState.auth,
      },
      ...initialState,
    },
  });
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  initialState?: any;
  store?: any;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  {
    initialState = {},
    store = createMockStore(initialState),
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};

// Mock data generators
export const mockSupportTicket = {
  _id: "ticket-123",
  ticketNumber: "ST-2024-001",
  subject: "Test Support Ticket",
  message: "This is a test support ticket message",
  category: "Technical Issue",
  priority: "Medium",
  status: "Open",
  submittedBy: {
    _id: "user-123",
    name: "Test User",
    email: "test@example.com",
  },
  responses: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockTicketResponse = {
  _id: "response-123",
  message: "This is a test response",
  respondedBy: {
    _id: "admin-123",
    name: "Admin User",
    email: "admin@example.com",
  },
  isInternal: false,
  createdAt: new Date().toISOString(),
};

export const mockUser = {
  _id: "user-123",
  name: "Test User",
  email: "test@example.com",
  role: "user",
};

export const mockAdmin = {
  _id: "admin-123",
  name: "Admin User",
  email: "admin@example.com",
  role: "admin",
};
