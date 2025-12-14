import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { managerEndpoints } from '../api/managerApi';

interface ManagerState {
  renters: any[];
  complaints: any[];
  tasks: any[];
  bills: any[];
  pendingPayments: any[];
  stats: any;
  loading: boolean;
  error: string | null;
}

const initialState: ManagerState = {
  renters: [],
  complaints: [],
  tasks: [],
  bills: [],
  pendingPayments: [],
  stats: null,
  loading: false,
  error: null,
};

// Async Thunks
export const fetchDashboardStats = createAsyncThunk(
  'manager/fetchDashboardStats',
  async () => {
    const response = await managerEndpoints.getDashboardStats();
    return response.data;
  }
);

export const fetchRenters = createAsyncThunk(
  'manager/fetchRenters',
  async (params?: any) => {
    const response = await managerEndpoints.getRenters(params);
    return response.data;
  }
);

export const approveRenter = createAsyncThunk(
  'manager/approveRenter',
  async ({ id, data }: { id: string; data: any }) => {
    const response = await managerEndpoints.approveRenter(id, data);
    return response.data;
  }
);

const managerSlice = createSlice({
  name: 'manager',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateTaskStatus: (state, action) => {
      const { id, status } = action.payload;
      const task = state.tasks.find(t => t.id === id);
      if (task) {
        task.status = status;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch stats';
      });
    // Add more cases for other async thunks
  },
});

export const { clearError, updateTaskStatus } = managerSlice.actions;
export default managerSlice.reducer;