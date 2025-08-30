import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  List,
  Divider,
  Avatar,
  Chip
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { signOut } from '../../store/authSlice';
import { RootState, AppDispatch } from '../../store/store';

export const ManagerDashboard: React.FC = () => {
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
            <Avatar.Icon size={60} icon="account-tie" />
            <View style={styles.headerText}>
              <Title>Welcome, {user?.profile.firstName}!</Title>
              <Paragraph>Manager Dashboard</Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Team Overview</Title>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Chip icon="account-check">5 Active</Chip>
            </View>
            <View style={styles.statItem}>
              <Chip icon="account-clock">2 En-route</Chip>
            </View>
            <View style={styles.statItem}>
              <Chip icon="account-off">1 Offline</Chip>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Job Management</Title>
          <List.Item
            title="Active Jobs"
            description="12 jobs in progress"
            left={(props) => <List.Icon {...props} icon="briefcase-check" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <Divider />
          <List.Item
            title="Pending Assignments"
            description="3 jobs awaiting assignment"
            left={(props) => <List.Icon {...props} icon="briefcase-clock" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <Divider />
          <List.Item
            title="Team Location"
            description="View technicians on map"
            left={(props) => <List.Icon {...props} icon="map-marker-multiple" />}
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
              icon="plus"
              style={styles.actionButton}
            >
              New Job
            </Button>
            <Button
              mode="contained"
              icon="account-search"
              style={styles.actionButton}
            >
              Find Technician
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Reports & Analytics</Title>
          <List.Item
            title="Performance Metrics"
            description="View team performance data"
            left={(props) => <List.Icon {...props} icon="chart-bar" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <Divider />
          <List.Item
            title="Timesheet Approvals"
            description="2 pending approvals"
            left={(props) => <List.Icon {...props} icon="clock-check" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16
  },
  statItem: {
    alignItems: 'center'
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