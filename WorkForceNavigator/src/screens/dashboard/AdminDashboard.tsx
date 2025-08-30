import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  List,
  Divider,
  Avatar
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { signOut } from '../../store/authSlice';
import { RootState, AppDispatch } from '../../store/store';

export const AdminDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleSignOut = () => {
    dispatch(signOut());
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.welcomeCard}>
        <Card.Content>
          <View style={styles.header}>
            <Avatar.Icon size={60} icon="shield-account" />
            <View style={styles.headerText}>
              <Title>Welcome, {user?.profile.firstName}!</Title>
              <Paragraph>Administrator Dashboard</Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>System Overview</Title>
          <List.Item
            title="Total Users"
            description="Manage all system users"
            left={(props) => <List.Icon {...props} icon="account-group" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <Divider />
          <List.Item
            title="Active Jobs"
            description="Monitor all ongoing jobs"
            left={(props) => <List.Icon {...props} icon="briefcase" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <Divider />
          <List.Item
            title="System Settings"
            description="Configure application settings"
            left={(props) => <List.Icon {...props} icon="cog" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Quick Actions</Title>
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              icon="account-plus"
              style={styles.actionButton}
            >
              Add User
            </Button>
            <Button
              mode="contained"
              icon="chart-line"
              style={styles.actionButton}
            >
              View Reports
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Account</Title>
          <List.Item
            title="Profile Settings"
            description="Update your profile information"
            left={(props) => <List.Icon {...props} icon="account-edit" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <Divider />
          <List.Item
            title="Sign Out"
            description="Sign out of your account"
            left={(props) => <List.Icon {...props} icon="logout" />}
            onPress={handleSignOut}
          />
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16
  },
  welcomeCard: {
    marginBottom: 16,
    elevation: 4
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerText: {
    marginLeft: 16,
    flex: 1
  },
  card: {
    marginBottom: 16,
    elevation: 2
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8
  }
});