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
  Badge,
  Chip
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { signOut } from '../../store/authSlice';
import { RootState, AppDispatch } from '../../store/store';

export const TechnicianDashboard: React.FC = () => {
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
            <Avatar.Icon size={60} icon="account-hard-hat" />
            <View style={styles.headerText}>
              <Title>Welcome, {user?.profile.firstName}!</Title>
              <Paragraph>Technician Dashboard</Paragraph>
              <View style={styles.statusChip}>
                <Chip icon="check-circle" mode="outlined">Available</Chip>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title>Today's Jobs</Title>
            <Badge size={24}>3</Badge>
          </View>
          <List.Item
            title="Install Cable Connection"
            description="123 Main St • Due: 2:00 PM"
            left={(props) => <List.Icon {...props} icon="cable-data" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <Divider />
          <List.Item
            title="Repair Internet Service"
            description="456 Oak Ave • Due: 4:30 PM"
            left={(props) => <List.Icon {...props} icon="wifi-strength-2" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <Divider />
          <List.Item
            title="Equipment Maintenance"
            description="789 Pine St • Due: 6:00 PM"
            left={(props) => <List.Icon {...props} icon="tools" />}
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
              icon="map-marker"
              style={styles.actionButton}
            >
              Navigate
            </Button>
            <Button
              mode="contained"
              icon="clock-check"
              style={styles.actionButton}
            >
              Check In
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Work Status</Title>
          <List.Item
            title="Current Location"
            description="Downtown Service Area"
            left={(props) => <List.Icon {...props} icon="map-marker" />}
          />
          <Divider />
          <List.Item
            title="Hours Today"
            description="6.5 hours logged"
            left={(props) => <List.Icon {...props} icon="clock" />}
          />
          <Divider />
          <List.Item
            title="Jobs Completed"
            description="2 of 5 jobs completed today"
            left={(props) => <List.Icon {...props} icon="check-circle" />}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Tools & Resources</Title>
          <List.Item
            title="Job History"
            description="View completed jobs"
            left={(props) => <List.Icon {...props} icon="history" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <Divider />
          <List.Item
            title="Timesheet"
            description="View and submit timesheet"
            left={(props) => <List.Icon {...props} icon="calendar-clock" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <Divider />
          <List.Item
            title="Equipment Inventory"
            description="Check available equipment"
            left={(props) => <List.Icon {...props} icon="package-variant" />}
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
  statusChip: {
    marginTop: 8
  },
  card: {
    marginBottom: 16,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
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