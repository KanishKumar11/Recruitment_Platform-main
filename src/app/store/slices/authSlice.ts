import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserRole } from '../../models/User';

// Server-side user with MongoDB _id
interface ServerUser {
  _id: import("mongoose").Types.ObjectId;
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isPrimary: boolean;
  companyName?: string;
  companySize?: string;
  designation?: string;
}

// Client-side user without MongoDB _id
interface ClientUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isPrimary: boolean;
  companyName?: string;
  companySize?: string;
  designation?: string;
}

// Use ClientUser for the auth state since we're on the client side
interface AuthState {
  user: ClientUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

// Try to load initial state from localStorage if available
let initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
};

// Only run on client side
if (typeof window !== 'undefined') {
  const savedAuth = localStorage.getItem('auth');
  if (savedAuth) {
    try {
      initialState = JSON.parse(savedAuth);
    } catch (e) {
      console.error('Failed to parse saved auth state', e);
    }
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: ClientUser; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth', JSON.stringify(state));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      
      // Clear from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth');
      }
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export type { ClientUser, ServerUser }; // Export types for use elsewhere

export default authSlice.reducer;