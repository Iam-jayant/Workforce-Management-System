const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add web support and platform-specific extensions
config.resolver.platforms = ['ios', 'android', 'native', 'web'];
config.resolver.sourceExts = [...config.resolver.sourceExts, 'web.ts', 'web.tsx'];

// Ensure platform-specific files are resolved correctly
config.resolver.platformExtensions = ['web.tsx', 'web.ts', 'web.js', 'tsx', 'ts', 'js'];

module.exports = config;