import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { UserRole } from '../../types/auth';
import { AdminDashboard } from '../../screens/dashboard/AdminDashboard';
import { ManagerDashboard } from '../../screens/dashboard/ManagerDashboard';
import { TechnicianDashboard } from '../../screens/dashboard/TechnicianDashboard';

export const DashboardContainer: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) {
    return null;
  }

  const renderDashboard = () => {
    switch (user.role) {
      case UserRole.ADMIN:
        return <AdminDashboard />;
      case UserRole.MANAGER:
        return <ManagerDashboard />;
      case UserRole.TECHNICIAN:
        return <TechnicianDashboard />;
      default:
        return <TechnicianDashboard />;
    }
  };

  return (
    <View style={styles.container}>
      {renderDashboard()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});