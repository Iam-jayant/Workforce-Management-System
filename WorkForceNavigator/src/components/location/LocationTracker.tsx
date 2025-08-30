import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Card, Button, Text, Switch, ActivityIndicator } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { 
  startLocationTracking, 
  getCurrentLocation, 
  stopTracking, 
  setCurrentLocation,
  syncOfflineLocations 
} from '../../store/locationSlice';
import { locationService } from '../../services';

interface LocationTrackerProps {
  userId: string;
  showControls?: boolean;
  autoStart?: boolean;
}

export const LocationTracker: React.FC<LocationTrackerProps> = ({
  userId,
  showControls = true,
  autoStart = false
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    currentLocation, 
    isTracking, 
    isLoading, 
    error 
  } = useSelector((state: RootState) => state.location);
  
  const [locationSubscription, setLocationSubscription] = useState<(() => void) | null>(null);

  useEffect(() => {
    // Auto-start tracking if requested
    if (autoStart && !isTracking) {
      handleStartTracking();
    }

    // Set up real-time location subscription
    const unsubscribe = locationService.subscribeToLocationUpdates(
      userId,
      (location) => {
        if (location) {
          dispatch(setCurrentLocation(location));
        }
      }
    );
    setLocationSubscription(() => unsubscribe);

    // Sync offline locations on mount
    dispatch(syncOfflineLocations());

    return () => {
      if (locationSubscription) {
        locationSubscription();
      }
    };
  }, [userId, autoStart, dispatch]);

  const handleStartTracking = async () => {
    try {
      await dispatch(startLocationTracking(userId)).unwrap();
      Alert.alert('Success', 'Location tracking started successfully');
    } catch (error) {
      Alert.alert('Error', `Failed to start tracking: ${error}`);
    }
  };

  const handleStopTracking = () => {
    dispatch(stopTracking());
    Alert.alert('Info', 'Location tracking stopped');
  };

  const handleGetCurrentLocation = async () => {
    try {
      await dispatch(getCurrentLocation(userId)).unwrap();
    } catch (error) {
      Alert.alert('Error', `Failed to get location: ${error}`);
    }
  };

  const formatLocation = (location: any) => {
    if (!location) return 'No location data';
    
    const lat = location.latitude?.toFixed(6) || 'N/A';
    const lng = location.longitude?.toFixed(6) || 'N/A';
    const accuracy = location.accuracy ? `±${Math.round(location.accuracy)}m` : 'N/A';
    const time = location.timestamp ? new Date(location.timestamp).toLocaleTimeString() : 'N/A';
    
    return `${lat}, ${lng} (${accuracy}) at ${time}`;
  };

  return (
    <Card style={styles.card}>
      <Card.Title title="Location Tracking" />
      <Card.Content>
        {error && (
          <Text style={styles.errorText}>Error: {error}</Text>
        )}
        
        <View style={styles.statusRow}>
          <Text variant="bodyMedium">Status: </Text>
          <Text 
            variant="bodyMedium" 
            style={[styles.statusText, { color: isTracking ? '#4CAF50' : '#F44336' }]}
          >
            {isTracking ? 'Active' : 'Inactive'}
          </Text>
        </View>

        {currentLocation && (
          <View style={styles.locationInfo}>
            <Text variant="bodySmall" style={styles.locationText}>
              Current Location:
            </Text>
            <Text variant="bodySmall" style={styles.coordinates}>
              {formatLocation(currentLocation)}
            </Text>
          </View>
        )}

        {showControls && (
          <View style={styles.controls}>
            <View style={styles.switchRow}>
              <Text variant="bodyMedium">Auto Tracking</Text>
              <Switch
                value={isTracking}
                onValueChange={isTracking ? handleStopTracking : handleStartTracking}
                disabled={isLoading}
              />
            </View>

            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                onPress={handleGetCurrentLocation}
                disabled={isLoading}
                style={styles.button}
              >
                Get Location
              </Button>
              
              <Button
                mode="contained"
                onPress={() => dispatch(syncOfflineLocations())}
                disabled={isLoading}
                style={styles.button}
              >
                Sync Offline
              </Button>
            </View>
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" />
            <Text variant="bodySmall" style={styles.loadingText}>
              Processing location...
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    elevation: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontWeight: 'bold',
  },
  locationInfo: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  locationText: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  coordinates: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  controls: {
    marginTop: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  button: {
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 8,
  },
  loadingText: {
    marginLeft: 8,
  },
  errorText: {
    color: '#F44336',
    marginBottom: 8,
    textAlign: 'center',
  },
});