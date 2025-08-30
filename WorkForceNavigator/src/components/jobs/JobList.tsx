import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { 
  Card, 
  Text, 
  Chip, 
  Button, 
  List, 
  Divider, 
  ActivityIndicator,
  Badge,
  IconButton
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { fetchTechnicianJobs, updateJob, setCurrentJob } from '../../store/jobSlice';
import { Job, JobStatus, JobPriority, JobType } from '../../types/job';

interface JobListProps {
  technicianId: string;
  onJobPress?: (job: Job) => void;
  showActions?: boolean;
}

export const JobList: React.FC<JobListProps> = ({
  technicianId,
  onJobPress,
  showActions = true
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { technicianJobs, isLoading, error } = useSelector((state: RootState) => state.jobs);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadJobs();
  }, [technicianId]);

  const loadJobs = async () => {
    try {
      await dispatch(fetchTechnicianJobs({ 
        technicianId,
        status: [JobStatus.ASSIGNED, JobStatus.IN_PROGRESS] 
      })).unwrap();
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  const handleStartJob = async (job: Job) => {
    try {
      await dispatch(updateJob({
        jobId: job.id,
        updates: {
          status: JobStatus.IN_PROGRESS,
          startedAt: new Date(),
          notes: `Job started by technician at ${new Date().toLocaleString()}`
        }
      })).unwrap();
    } catch (error) {
      console.error('Failed to start job:', error);
    }
  };

  const handleCompleteJob = async (job: Job) => {
    try {
      const actualDuration = job.startedAt 
        ? Math.floor((Date.now() - job.startedAt.getTime()) / 60000) // minutes
        : job.estimatedDuration;

      await dispatch(updateJob({
        jobId: job.id,
        updates: {
          status: JobStatus.COMPLETED,
          completedAt: new Date(),
          actualDuration,
          notes: `Job completed by technician at ${new Date().toLocaleString()}`
        }
      })).unwrap();
    } catch (error) {
      console.error('Failed to complete job:', error);
    }
  };

  const getStatusColor = (status: JobStatus): string => {
    switch (status) {
      case JobStatus.ASSIGNED:
        return '#2196F3';
      case JobStatus.IN_PROGRESS:
        return '#FF9800';
      case JobStatus.COMPLETED:
        return '#4CAF50';
      case JobStatus.CANCELLED:
        return '#F44336';
      case JobStatus.ON_HOLD:
        return '#9E9E9E';
      default:
        return '#757575';
    }
  };

  const getPriorityColor = (priority: JobPriority): string => {
    switch (priority) {
      case JobPriority.URGENT:
        return '#F44336';
      case JobPriority.HIGH:
        return '#FF9800';
      case JobPriority.MEDIUM:
        return '#2196F3';
      case JobPriority.LOW:
        return '#4CAF50';
      default:
        return '#757575';
    }
  };

  const getJobTypeIcon = (type: JobType): string => {
    switch (type) {
      case JobType.INSTALLATION:
        return 'tools';
      case JobType.REPAIR:
        return 'wrench';
      case JobType.MAINTENANCE:
        return 'cog';
      case JobType.INSPECTION:
        return 'magnify';
      case JobType.UPGRADE:
        return 'arrow-up-bold';
      case JobType.EMERGENCY:
        return 'alert';
      default:
        return 'briefcase';
    }
  };

  const formatTimeSlot = (timeSlot: { start: string; end: string }): string => {
    return `${timeSlot.start} - ${timeSlot.end}`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderJobItem = ({ item: job }: { item: Job }) => (
    <Card style={styles.jobCard} onPress={() => onJobPress?.(job)}>
      <Card.Content>
        <View style={styles.jobHeader}>
          <View style={styles.jobTitleRow}>
            <List.Icon icon={getJobTypeIcon(job.type)} />
            <View style={styles.jobTitleContainer}>
              <Text variant="titleMedium" style={styles.jobTitle}>
                {job.title}
              </Text>
              <Text variant="bodySmall" style={styles.jobCustomer}>
                {job.customer.name}
              </Text>
            </View>
            <View style={styles.jobBadges}>
              <Chip 
                mode="outlined" 
                compact 
                style={[styles.statusChip, { borderColor: getStatusColor(job.status) }]}
                textStyle={{ color: getStatusColor(job.status) }}
              >
                {job.status.replace('_', ' ').toUpperCase()}
              </Chip>
            </View>
          </View>
        </View>

        <View style={styles.jobDetails}>
          <View style={styles.detailRow}>
            <List.Icon icon="map-marker" />
            <Text variant="bodySmall" style={styles.detailText}>
              {job.location.address}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <List.Icon icon="clock" />
            <Text variant="bodySmall" style={styles.detailText}>
              {formatDate(job.scheduledDate)} • {formatTimeSlot(job.scheduledTimeSlot)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <List.Icon icon="timer" />
            <Text variant="bodySmall" style={styles.detailText}>
              Est. {job.estimatedDuration} min
            </Text>
            <Chip 
              mode="outlined" 
              compact 
              style={[styles.priorityChip, { borderColor: getPriorityColor(job.priority) }]}
              textStyle={{ color: getPriorityColor(job.priority) }}
            >
              {job.priority.toUpperCase()}
            </Chip>
          </View>
        </View>

        {job.description && (
          <Text variant="bodySmall" style={styles.jobDescription}>
            {job.description}
          </Text>
        )}

        {showActions && (
          <View style={styles.actionButtons}>
            {job.status === JobStatus.ASSIGNED && (
              <Button
                mode="contained"
                onPress={() => handleStartJob(job)}
                style={styles.actionButton}
                icon="play"
              >
                Start Job
              </Button>
            )}
            
            {job.status === JobStatus.IN_PROGRESS && (
              <Button
                mode="contained"
                onPress={() => handleCompleteJob(job)}
                style={[styles.actionButton, styles.completeButton]}
                icon="check"
              >
                Complete
              </Button>
            )}
            
            <Button
              mode="outlined"
              onPress={() => onJobPress?.(job)}
              style={styles.actionButton}
              icon="eye"
            >
              View Details
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading jobs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <Card style={styles.errorCard}>
          <Card.Content>
            <Text style={styles.errorText}>Error: {error}</Text>
            <Button mode="outlined" onPress={loadJobs} style={styles.retryButton}>
              Retry
            </Button>
          </Card.Content>
        </Card>
      )}

      <FlatList
        data={technicianJobs}
        renderItem={renderJobItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <List.Icon icon="briefcase-outline" />
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No Jobs Assigned
              </Text>
              <Text variant="bodyMedium" style={styles.emptyMessage}>
                You don't have any active jobs at the moment.
              </Text>
            </Card.Content>
          </Card>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  jobCard: {
    marginBottom: 12,
    elevation: 2,
  },
  jobHeader: {
    marginBottom: 12,
  },
  jobTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  jobTitleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  jobTitle: {
    fontWeight: 'bold',
  },
  jobCustomer: {
    color: '#666',
    marginTop: 2,
  },
  jobBadges: {
    alignItems: 'flex-end',
  },
  statusChip: {
    marginBottom: 4,
  },
  priorityChip: {
    marginLeft: 8,
  },
  jobDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    marginLeft: 8,
    flex: 1,
  },
  jobDescription: {
    marginBottom: 12,
    fontStyle: 'italic',
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  errorCard: {
    margin: 16,
    backgroundColor: '#FFEBEE',
  },
  errorText: {
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    alignSelf: 'center',
  },
  emptyCard: {
    margin: 16,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#666',
  },
});