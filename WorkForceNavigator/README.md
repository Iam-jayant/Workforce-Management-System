# WorkForce Navigator

A mobile-first, Mappls-powered platform for utility maintenance and installation operations.

## Project Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components
├── services/       # Business logic and API services
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── store/          # Redux store configuration
├── navigation/     # Navigation configuration
└── config/         # App configuration (Firebase, Mappls, etc.)
```

## Setup Instructions

1. **Environment Configuration**
   - Copy `.env.example` to `.env`
   - Fill in your Firebase and Mappls API credentials

2. **Firebase Setup**
   - Create a Firebase project
   - Enable Authentication, Firestore, Realtime Database, Storage, and Cloud Messaging
   - Download and add configuration files as needed

3. **Mappls Setup**
   - Register for Mappls API keys
   - Add your API keys to the environment configuration

## Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser
- `npm run type-check` - Run TypeScript type checking

## Dependencies

### Core
- React Native with Expo
- TypeScript
- React Navigation
- React Native Paper (UI components)

### Firebase
- Authentication
- Firestore (structured data)
- Realtime Database (live updates)
- Storage (file uploads)
- Cloud Messaging (notifications)
- Cloud Functions (server-side logic)

### Mappls
- Map SDK for React Native
- Direction Widget
- Routing and Navigation APIs

### State Management
- Redux Toolkit
- Redux Persist
- React Redux

## Next Steps

This foundation provides:
- ✅ Project structure with TypeScript
- ✅ Firebase SDK integration
- ✅ Mappls SDK integration
- ✅ Basic configuration setup
- ✅ Development environment

Ready for implementing authentication, location tracking, and other features!