import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref, set, push, onValue, off } from 'firebase/database';
import { firebaseDatabase } from '../config/firebase.web';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  userId: string;
  speed?: number;
  heading?: number;
}

export interface LocationUpdate {
  id: string;
  location: LocationData;
  synced: boolean;
}

class LocationService {
  private watchId: number | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private isTracking = false;
  private offlineQueue: LocationUpdate[] = [];
  private readonly LOCATION_STORAGE_KEY = 'offline_locations';
  private readonly UPDATE_INTERVAL = 30000; // 30 seconds

  /**
   * Request location permissions (Web Geolocation API)
   */
  async requestLocationPermission(): Promise<boolean> {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      return false;
    }

    try {
      // Test if we can get location
      await this.getCurrentLocation();
      return true;
    } catch (error) {
      console.error('Location permission denied:', error);
      return false;
    }
  }

  /**
   * Get current location using Web Geolocation API
   */
  async getCurrentLocation(): Promise<LocationData | null> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
            userId: '', // Will be set by caller
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
          };
          resolve(locationData);
        },
        (error) => {
          console.error('Location error:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  }

  /**
   * Start location tracking
   */
  async startTracking(userId: string): Promise<boolean> {
    if (this.isTracking) {
      return true;
    }

    const hasPermission = await this.requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    this.isTracking = true;

    // Start periodic location updates
    this.updateInterval = setInterval(async () => {
      const location = await this.getCurrentLocation();
      if (location) {
        location.userId = userId;
        await this.updateLocation(location);
      }
    }, this.UPDATE_INTERVAL);

    // Also start continuous watching
    if (navigator.geolocation) {
      this.watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
            userId,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
          };
          await this.updateLocation(locationData);
        },
        (error) => {
          console.error('Watch position error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 15000,
        }
      );
    }

    // Sync any offline locations
    await this.syncOfflineLocations();

    return true;
  }

  /**
   * Stop location tracking
   */
  stopTracking(): void {
    this.isTracking = false;

    if (this.watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Update location in Firebase or store offline
   */
  private async updateLocation(location: LocationData): Promise<void> {
    try {
      // Try to update Firebase
      const locationRef = ref(firebaseDatabase, `locations/${location.userId}`);
      await set(locationRef, {
        ...location,
        lastUpdated: Date.now(),
      });

      // Also add to location history
      const historyRef = ref(firebaseDatabase, `location_history/${location.userId}`);
      await push(historyRef, location);

    } catch (error) {
      console.log('Failed to update location online, storing offline:', error);
      // Store offline if Firebase update fails
      await this.storeLocationOffline(location);
    }
  }

  /**
   * Store location offline
   */
  private async storeLocationOffline(location: LocationData): Promise<void> {
    const locationUpdate: LocationUpdate = {
      id: `${Date.now()}_${Math.random()}`,
      location,
      synced: false,
    };

    this.offlineQueue.push(locationUpdate);
    await this.saveOfflineQueue();
  }

  /**
   * Save offline queue to storage
   */
  private async saveOfflineQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.LOCATION_STORAGE_KEY,
        JSON.stringify(this.offlineQueue)
      );
    } catch (error) {
      console.error('Failed to save offline locations:', error);
    }
  }

  /**
   * Load offline queue from storage
   */
  private async loadOfflineQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.LOCATION_STORAGE_KEY);
      if (stored) {
        this.offlineQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline locations:', error);
      this.offlineQueue = [];
    }
  }

  /**
   * Sync offline locations to Firebase
   */
  async syncOfflineLocations(): Promise<void> {
    await this.loadOfflineQueue();

    if (this.offlineQueue.length === 0) {
      return;
    }

    const syncPromises = this.offlineQueue
      .filter(update => !update.synced)
      .map(async (update) => {
        try {
          const locationRef = ref(firebaseDatabase, `locations/${update.location.userId}`);
          await set(locationRef, {
            ...update.location,
            lastUpdated: Date.now(),
          });

          const historyRef = ref(firebaseDatabase, `location_history/${update.location.userId}`);
          await push(historyRef, update.location);

          update.synced = true;
          return true;
        } catch (error) {
          console.error('Failed to sync location:', error);
          return false;
        }
      });

    await Promise.allSettled(syncPromises);

    // Remove synced locations
    this.offlineQueue = this.offlineQueue.filter(update => !update.synced);
    await this.saveOfflineQueue();
  }

  /**
   * Get real-time location updates for a user
   */
  subscribeToLocationUpdates(
    userId: string,
    callback: (location: LocationData | null) => void
  ): () => void {
    const locationRef = ref(firebaseDatabase, `locations/${userId}`);
    
    const unsubscribe = onValue(locationRef, (snapshot) => {
      const data = snapshot.val();
      callback(data || null);
    });

    return () => off(locationRef, 'value', unsubscribe);
  }

  /**
   * Get location history for a user
   */
  async getLocationHistory(
    userId: string,
    startTime?: number,
    endTime?: number
  ): Promise<LocationData[]> {
    return new Promise((resolve) => {
      const historyRef = ref(firebaseDatabase, `location_history/${userId}`);
      
      onValue(historyRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) {
          resolve([]);
          return;
        }

        let locations: LocationData[] = Object.values(data);

        // Filter by time range if provided
        if (startTime || endTime) {
          locations = locations.filter(location => {
            if (startTime && location.timestamp < startTime) return false;
            if (endTime && location.timestamp > endTime) return false;
            return true;
          });
        }

        // Sort by timestamp
        locations.sort((a, b) => a.timestamp - b.timestamp);
        resolve(locations);
      }, { onlyOnce: true });
    });
  }

  /**
   * Calculate distance between two points
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Check if tracking is active
   */
  isLocationTrackingActive(): boolean {
    return this.isTracking;
  }
}

export const locationService = new LocationService();