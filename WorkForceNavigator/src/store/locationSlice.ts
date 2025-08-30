import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { locationService, LocationData } from '../services';

export interface LocationState {
    currentLocation: LocationData | null;
    isTracking: boolean;
    isLoading: boolean;
    error: string | null;
    locationHistory: LocationData[];
    teamLocations: Record<string, LocationData>; // userId -> location
}

const initialState: LocationState = {
    currentLocation: null,
    isTracking: false,
    isLoading: false,
    error: null,
    locationHistory: [],
    teamLocations: {},
};

// Async thunks
export const startLocationTracking = createAsyncThunk(
    'location/startTracking',
    async (userId: string, { rejectWithValue }) => {
        try {
            const success = await locationService.startTracking(userId);
            if (!success) {
                throw new Error('Failed to start location tracking');
            }
            return userId;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const getCurrentLocation = createAsyncThunk(
    'location/getCurrentLocation',
    async (userId: string, { rejectWithValue }) => {
        try {
            const location = await locationService.getCurrentLocation();
            if (!location) {
                throw new Error('Unable to get current location');
            }
            location.userId = userId;
            return location;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const getLocationHistory = createAsyncThunk(
    'location/getLocationHistory',
    async (
        { userId, startTime, endTime }: {
            userId: string;
            startTime?: number;
            endTime?: number;
        },
        { rejectWithValue }
    ) => {
        try {
            const history = await locationService.getLocationHistory(userId, startTime, endTime);
            return history;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const syncOfflineLocations = createAsyncThunk(
    'location/syncOfflineLocations',
    async (_, { rejectWithValue }) => {
        try {
            await locationService.syncOfflineLocations();
            return true;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Location slice
const locationSlice = createSlice({
    name: 'location',
    initialState,
    reducers: {
        setCurrentLocation: (state, action: PayloadAction<LocationData>) => {
            state.currentLocation = action.payload;
            state.error = null;
        },

        setTeamMemberLocation: (state, action: PayloadAction<{ userId: string; location: LocationData }>) => {
            state.teamLocations[action.payload.userId] = action.payload.location;
        },

        removeTeamMemberLocation: (state, action: PayloadAction<string>) => {
            delete state.teamLocations[action.payload];
        },

        stopTracking: (state) => {
            locationService.stopTracking();
            state.isTracking = false;
            state.error = null;
        },

        clearLocationHistory: (state) => {
            state.locationHistory = [];
        },

        clearError: (state) => {
            state.error = null;
        },

        setTrackingStatus: (state, action: PayloadAction<boolean>) => {
            state.isTracking = action.payload;
        },
    },

    extraReducers: (builder) => {
        // Start Location Tracking
        builder
            .addCase(startLocationTracking.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(startLocationTracking.fulfilled, (state) => {
                state.isLoading = false;
                state.isTracking = true;
                state.error = null;
            })
            .addCase(startLocationTracking.rejected, (state, action) => {
                state.isLoading = false;
                state.isTracking = false;
                state.error = action.payload as string;
            });

        // Get Current Location
        builder
            .addCase(getCurrentLocation.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getCurrentLocation.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentLocation = action.payload;
                state.error = null;
            })
            .addCase(getCurrentLocation.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Get Location History
        builder
            .addCase(getLocationHistory.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getLocationHistory.fulfilled, (state, action) => {
                state.isLoading = false;
                state.locationHistory = action.payload;
                state.error = null;
            })
            .addCase(getLocationHistory.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Sync Offline Locations
        builder
            .addCase(syncOfflineLocations.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(syncOfflineLocations.fulfilled, (state) => {
                state.isLoading = false;
                state.error = null;
            })
            .addCase(syncOfflineLocations.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const {
    setCurrentLocation,
    setTeamMemberLocation,
    removeTeamMemberLocation,
    stopTracking,
    clearLocationHistory,
    clearError,
    setTrackingStatus,
} = locationSlice.actions;

export default locationSlice.reducer;