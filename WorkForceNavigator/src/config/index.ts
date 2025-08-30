// Export all configuration modules
export * from './firebase';
export * from './mappls';

// App configuration
export const appConfig = {
  name: 'WorkForce Navigator',
  version: '1.0.0',
  environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000',
};

// Location tracking configuration
export const locationConfig = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 10000,
  distanceFilter: 10, // meters
  interval: 30000, // 30 seconds
};

// Notification configuration
export const notificationConfig = {
  channelId: 'workforce_navigator',
  channelName: 'WorkForce Navigator',
  channelDescription: 'Notifications for job assignments and updates',
};