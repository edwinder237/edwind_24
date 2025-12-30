// third-party
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'utils/axios';

// ==============================|| USER SLICE ||============================== //

const initialState = {
  user: null,
  isLoading: true, // Start as true to prevent premature redirects
  isAuthenticated: false,
  error: null,
  initialized: false // Track if we've attempted to fetch user at least once
};

// Async thunk to fetch user data from WorkOS
export const fetchUser = createAsyncThunk(
  'user/fetchUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/user');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: 'Failed to fetch user' });
    }
  }
);

// Async thunk to logout user
export const logoutUser = createAsyncThunk(
  'user/logout',
  async (_, { rejectWithValue }) => {
    try {
      await axios.post('/api/logout');
      return null;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: 'Failed to logout' });
    }
  }
);

// Async thunk to manually refresh user data from WorkOS
export const refreshUser = createAsyncThunk(
  'user/refreshUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/auth/refresh-user');
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: 'Failed to refresh user from WorkOS' });
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Action to clear user state (for logout)
    clearUser(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.initialized = true;
      state.isLoading = false;
    },
    // Action to update user state manually
    setUser(state, action) {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.initialized = true;
      state.isLoading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch user
      .addCase(fetchUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
        state.initialized = true;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload?.error || 'Authentication failed';
        state.initialized = true;
      })
      // Logout user
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        state.initialized = true;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || 'Logout failed';
        // Still clear user even if logout fails
        state.user = null;
        state.isAuthenticated = false;
        state.initialized = true;
      })
      // Refresh user from WorkOS
      .addCase(refreshUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(refreshUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
        state.initialized = true;
      })
      .addCase(refreshUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || 'Failed to refresh user';
        // Keep user authenticated even if refresh fails
      });
  }
});

export const { clearUser, setUser } = userSlice.actions;

export default userSlice.reducer;
