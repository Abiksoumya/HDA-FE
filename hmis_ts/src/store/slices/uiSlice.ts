import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UiState, Toast } from '@/types';

const initialState: UiState = {
  sidebarOpen: true,
  activeItem: 'dashboard',
  toasts: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    setActiveItem(state, action: PayloadAction<string>) {
      state.activeItem = action.payload;
    },
    addToast(state, action: PayloadAction<Omit<Toast, 'id'>>) {
      state.toasts.push({ ...action.payload, id: Date.now().toString() });
    },
    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const { toggleSidebar, setSidebarOpen, setActiveItem, addToast, removeToast } =
  uiSlice.actions;
export default uiSlice.reducer;
