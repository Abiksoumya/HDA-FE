import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL } from '@/utils/config';
import apiClient, { isTokenValid } from '@/utils/apiClient';
import type { AuthState, User, LoginResponse } from '@/types';

const LOGIN_URL = `${API_BASE_URL}/api/user/login`;

// ── Thunks ──────────────────────────────────────────────────────────────────

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (
    { username, password }: { username: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_user_name: username, p_pass_word: password }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null) as LoginResponse | null;
        return rejectWithValue(err?.message ?? 'Invalid credentials');
      }

      const res = (await response.json()) as LoginResponse;

      if (res?.success && res.data?.token) {
        localStorage.setItem('authToken', res.data.token);

        // Fetch user profile
        try {
          const profileRes = await apiClient.get<{ success: boolean; data?: User }>(
            '/api/user/get-user-details',
          );
          const user = profileRes.data?.success ? profileRes.data.data ?? res.data.user : res.data.user;
          return { token: res.data.token, user: user ?? null };
        } catch {
          return { token: res.data.token, user: res.data.user ?? null };
        }
      }

      return rejectWithValue(res.message ?? 'Login failed');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error. Please check your connection.';
      return rejectWithValue(msg);
    }
  },
);

export const restoreAuthThunk = createAsyncThunk(
  'auth/restore',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('authToken');
    if (!token || !isTokenValid(token)) {
      localStorage.removeItem('authToken');
      return rejectWithValue('No valid token');
    }

    try {
      const profileRes = await apiClient.get<{ success: boolean; data?: User }>(
        '/api/user/get-user-details',
      );
      if (profileRes.data?.success) {
        const decoded = jwtDecode<{ exp: number }>(token);
        return { token, user: profileRes.data.data ?? null, exp: decoded.exp };
      }
      localStorage.removeItem('authToken');
      return rejectWithValue('Profile fetch failed');
    } catch {
      localStorage.removeItem('authToken');
      return rejectWithValue('Session expired');
    }
  },
);

// ── Slice ────────────────────────────────────────────────────────────────────

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem('authToken');
    },
    clearError(state) {
      state.error = null;
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    // login
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user ?? null;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // restore
    builder
      .addCase(restoreAuthThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(restoreAuthThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(restoreAuthThunk.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      });
  },
});

export const { logout, clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
