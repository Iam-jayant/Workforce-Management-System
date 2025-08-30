import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { LoginScreen } from '../../screens/auth/LoginScreen';
import { RegisterScreen } from '../../screens/auth/RegisterScreen';
import { setUser, setLoading } from '../../store/authSlice';
import { authService } from '../../services';
import { RootState, AppDispatch } from '../../store/store';

type AuthMode = 'login' | 'register';

export const AuthContainer: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading } = useSelector((state: RootState) => state.auth);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  
  // Animation for screen transitions
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Listen to authentication state changes
    dispatch(setLoading(true));
    
    const unsubscribe = authService.onAuthStateChanged((user) => {
      dispatch(setUser(user));
      dispatch(setLoading(false));
    });

    return unsubscribe;
  }, [dispatch]);

  const handleNavigateToRegister = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setAuthMode('register');
      slideAnim.setValue(100);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleNavigateToLogin = () => {
    Animated.timing(slideAnim, {
      toValue: 100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setAuthMode('login');
      slideAnim.setValue(-100);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  if (isLoading) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.loadingContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Animated.Text style={styles.loadingText}>
            Loading WorkForce Navigator...
          </Animated.Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.screenContainer,
          {
            transform: [{ translateX: slideAnim }]
          }
        ]}
      >
        {authMode === 'login' ? (
          <LoginScreen onNavigateToRegister={handleNavigateToRegister} />
        ) : (
          <RegisterScreen onNavigateToLogin={handleNavigateToLogin} />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  screenContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
});