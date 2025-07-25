import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  isLoading: boolean;
  notification: {
    type: 'success' | 'error' | 'info' | null;
    message: string | null;
  };
}

const initialState: UiState = {
  isLoading: false,
  notification: {
    type: null,
    message: null,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    showNotification: (
      state,
      action: PayloadAction<{ type: 'success' | 'error' | 'info'; message: string }>
    ) => {
      state.notification = action.payload;
    },
    clearNotification: (state) => {
      state.notification = {
        type: null,
        message: null,
      };
    },
  },
});

export const { setLoading, showNotification, clearNotification } = uiSlice.actions;
export default uiSlice.reducer;
