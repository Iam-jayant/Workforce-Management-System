import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { jobService } from '../services';
import { 
  Job, 
  JobFilter, 
  JobUpdate, 
  JobAssignment, 
  JobStats, 
  TechnicianWorkload,
  JobStatus 
} from '../types/job';

export interface JobState {
  jobs: Job[];
  currentJob: Job | null;
  technicianJobs: Job[];
  jobStats: JobStats | null;
  technicianWorkloads: Record<string, TechnicianWorkload>;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  lastJobId: string | null;
  filter: JobFilter | null;
}

const initialState: JobState = {
  jobs: [],
  currentJob: null,
  technicianJobs: [],
  jobStats: null,
  technicianWorkloads: {},
  isLoading: false,
  error: null,
  hasMore: true,
  lastJobId: null,
  filter: null,
};

// Async thunks
export const createJob = createAsyncThunk(
  'jobs/createJob',
  async (jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const jobId = await jobService.createJob(jobData);
      const job = await jobService.getJobById(jobId);
      return job;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchJobs = createAsyncThunk(
  'jobs/fetchJobs',
  async (
    { filter, pageSize = 20, refresh = false }: { 
      filter?: JobFilter; 
      pageSize?: number; 
      refresh?: boolean; 
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { jobs: JobState };
      const lastJobId = refresh ? null : state.jobs.lastJobId;
      
      const result = await jobService.getJobs(filter, pageSize, lastJobId || undefined);
      return { ...result, refresh, filter };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchJobById = createAsyncThunk(
  'jobs/fetchJobById',
  async (jobId: string, { rejectWithValue }) => {
    try {
      const job = await jobService.getJobById(jobId);
      if (!job) {
        throw new Error('Job not found');
      }
      return job;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateJob = createAsyncThunk(
  'jobs/updateJob',
  async (
    { jobId, updates }: { jobId: string; updates: JobUpdate },
    { rejectWithValue }
  ) => {
    try {
      await jobService.updateJob(jobId, updates);
      const updatedJob = await jobService.getJobById(jobId);
      return updatedJob;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteJob = createAsyncThunk(
  'jobs/deleteJob',
  async (jobId: string, { rejectWithValue }) => {
    try {
      await jobService.deleteJob(jobId);
      return jobId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const assignJob = createAsyncThunk(
  'jobs/assignJob',
  async (assignment: JobAssignment, { rejectWithValue }) => {
    try {
      await jobService.assignJob(assignment);
      const updatedJob = await jobService.getJobById(assignment.jobId);
      return updatedJob;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchTechnicianJobs = createAsyncThunk(
  'jobs/fetchTechnicianJobs',
  async (
    { technicianId, status }: { technicianId: string; status?: JobStatus[] },
    { rejectWithValue }
  ) => {
    try {
      const jobs = await jobService.getTechnicianJobs(technicianId, status);
      return { technicianId, jobs };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchJobStats = createAsyncThunk(
  'jobs/fetchJobStats',
  async (dateRange: { start: Date; end: Date } | undefined, { rejectWithValue }) => {
    try {
      const stats = await jobService.getJobStats(dateRange);
      return stats;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchTechnicianWorkload = createAsyncThunk(
  'jobs/fetchTechnicianWorkload',
  async (technicianId: string, { rejectWithValue }) => {
    try {
      const workload = await jobService.getTechnicianWorkload(technicianId);
      return workload;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchJobsByProximity = createAsyncThunk(
  'jobs/fetchJobsByProximity',
  async (
    { latitude, longitude, radiusKm, maxResults }: {
      latitude: number;
      longitude: number;
      radiusKm: number;
      maxResults?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const jobs = await jobService.getJobsByProximity(latitude, longitude, radiusKm, maxResults);
      return jobs;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Job slice
const jobSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setCurrentJob: (state, action: PayloadAction<Job | null>) => {
      state.currentJob = action.payload;
    },
    
    clearJobs: (state) => {
      state.jobs = [];
      state.lastJobId = null;
      state.hasMore = true;
    },
    
    setFilter: (state, action: PayloadAction<JobFilter | null>) => {
      state.filter = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    updateJobInList: (state, action: PayloadAction<Job>) => {
      const index = state.jobs.findIndex(job => job.id === action.payload.id);
      if (index !== -1) {
        state.jobs[index] = action.payload;
      }
      
      // Update technician jobs if applicable
      const techIndex = state.technicianJobs.findIndex(job => job.id === action.payload.id);
      if (techIndex !== -1) {
        state.technicianJobs[techIndex] = action.payload;
      }
      
      // Update current job if it's the same
      if (state.currentJob?.id === action.payload.id) {
        state.currentJob = action.payload;
      }
    },
    
    removeJobFromList: (state, action: PayloadAction<string>) => {
      state.jobs = state.jobs.filter(job => job.id !== action.payload);
      state.technicianJobs = state.technicianJobs.filter(job => job.id !== action.payload);
      
      if (state.currentJob?.id === action.payload) {
        state.currentJob = null;
      }
    },
  },
  
  extraReducers: (builder) => {
    // Create Job
    builder
      .addCase(createJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.jobs.unshift(action.payload);
        }
      })
      .addCase(createJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Jobs
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        const { jobs, hasMore, refresh, filter } = action.payload;
        
        if (refresh) {
          state.jobs = jobs;
        } else {
          state.jobs.push(...jobs);
        }
        
        state.hasMore = hasMore;
        state.lastJobId = jobs.length > 0 ? jobs[jobs.length - 1].id : null;
        state.filter = filter || null;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Job By ID
    builder
      .addCase(fetchJobById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentJob = action.payload;
      })
      .addCase(fetchJobById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update Job
    builder
      .addCase(updateJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateJob.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          jobSlice.caseReducers.updateJobInList(state, { 
            payload: action.payload, 
            type: 'jobs/updateJobInList' 
          });
        }
      })
      .addCase(updateJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete Job
    builder
      .addCase(deleteJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteJob.fulfilled, (state, action) => {
        state.isLoading = false;
        jobSlice.caseReducers.removeJobFromList(state, { 
          payload: action.payload, 
          type: 'jobs/removeJobFromList' 
        });
      })
      .addCase(deleteJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Assign Job
    builder
      .addCase(assignJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(assignJob.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          jobSlice.caseReducers.updateJobInList(state, { 
            payload: action.payload, 
            type: 'jobs/updateJobInList' 
          });
        }
      })
      .addCase(assignJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Technician Jobs
    builder
      .addCase(fetchTechnicianJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTechnicianJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.technicianJobs = action.payload.jobs;
      })
      .addCase(fetchTechnicianJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Job Stats
    builder
      .addCase(fetchJobStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobStats = action.payload;
      })
      .addCase(fetchJobStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Technician Workload
    builder
      .addCase(fetchTechnicianWorkload.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTechnicianWorkload.fulfilled, (state, action) => {
        state.isLoading = false;
        state.technicianWorkloads[action.payload.technicianId] = action.payload;
      })
      .addCase(fetchTechnicianWorkload.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Jobs By Proximity
    builder
      .addCase(fetchJobsByProximity.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobsByProximity.fulfilled, (state, action) => {
        state.isLoading = false;
        // Could add nearby jobs to a separate state property if needed
      })
      .addCase(fetchJobsByProximity.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setCurrentJob,
  clearJobs,
  setFilter,
  clearError,
  updateJobInList,
  removeJobFromList,
} = jobSlice.actions;

export default jobSlice.reducer;