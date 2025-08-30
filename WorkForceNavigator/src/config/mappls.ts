// Mappls SDK configuration
export const mapplsConfig = {
  restApiKey: process.env.EXPO_PUBLIC_MAPPLS_REST_API_KEY || '',
  mapSDKKey: process.env.EXPO_PUBLIC_MAPPLS_MAP_SDK_KEY || '',
  atlasClientId: process.env.EXPO_PUBLIC_MAPPLS_ATLAS_CLIENT_ID || '',
  atlasClientSecret: process.env.EXPO_PUBLIC_MAPPLS_ATLAS_CLIENT_SECRET || '',
};

// Mappls API endpoints
export const mapplsEndpoints = {
  geocoding: 'https://atlas.mappls.com/api/places/geocode',
  routing: 'https://apis.mappls.com/advancedmaps/v1/route',
  liveLocation: 'https://intouch.mappls.com/iot/api',
  places: 'https://atlas.mappls.com/api/places',
};

// Default map configuration
export const defaultMapConfig = {
  center: [77.2090, 28.6139], // New Delhi coordinates [longitude, latitude]
  zoom: 10,
  bearing: 0,
  pitch: 0,
};

// Geofence default settings
export const geofenceConfig = {
  defaultRadius: 100, // meters
  minRadius: 50,
  maxRadius: 500,
  trackingInterval: 30000, // 30 seconds
};

// Note: Direction widget functionality will be implemented using the core Mappls Map SDK
// when needed for routing and navigation features