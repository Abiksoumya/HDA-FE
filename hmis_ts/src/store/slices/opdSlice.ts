import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { OpdState } from '@/types';

const initialState: OpdState = {
  opdData: {},
};

const opdSlice = createSlice({
  name: 'opd',
  initialState,
  reducers: {
    setOpdData(state, action: PayloadAction<Record<string, unknown>>) {
      state.opdData = { ...state.opdData, ...action.payload };
    },
    resetOpdData(state) {
      state.opdData = {};
    },
  },
});

export const { setOpdData, resetOpdData } = opdSlice.actions;
export default opdSlice.reducer;
