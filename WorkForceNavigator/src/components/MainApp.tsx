import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { AuthContainer } from './auth/AuthContainer';
import { DashboardContainer } from './dashboard/DashboardContainer';

export const MainApp: React.FC = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <View style={styles.container}>
      {isAuthenticated ? <DashboardContainer /> : <AuthContainer />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});