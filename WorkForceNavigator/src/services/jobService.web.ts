import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { firebaseFirestore } from '../config/firebase.web';
import { 
  Job, 
  JobFilter, 
  JobUpdate, 
  JobAssignment, 
  JobStats, 
  TechnicianWorkload,
  JobStatus,
  JobPriority,
  JobType 
} from '../types/job';

class JobService {
  private readonly JOBS_COLLECTION = 'jobs';
  private readonly ASSIGNMENTS_COLLECTION = 'job_assignments';

  /**
   * Create a new job
   */
  async createJob(jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const job: Omit<Job, 'id'> = {
        ...jobData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(firebaseFirestore, this.JOBS_COLLECTION), {
        ...job,
        createdAt: Timestamp.fromDate(job.createdAt),
        updatedAt: Timestamp.fromDate(job.updatedAt),
        scheduledDate: Timestamp.fromDate(job.scheduledDate),
        assignedAt: job.assignedAt ? Timestamp.fromDate(job.assignedAt) : null,
        startedAt: job.startedAt ? Timestamp.fromDate(job.startedAt) : null,
        completedAt: job.completedAt ? Timestamp.fromDate(job.completedAt) : null
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating job:', error);
      throw new Error('Failed to create job');
    }
  }

  /**
   * Get job by ID
   */
  async getJobById(jobId: string): Promise<Job | null> {
    try {
      const docRef = doc(firebaseFirestore, this.JOBS_COLLECTION, jobId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return this.convertFirestoreToJob(jobId, data);
    } catch (error) {
      console.error('Error getting job:', error);
      throw new Error('Failed to get job');
    }
  }

  /**
   * Update job
   */
  async updateJob(jobId: string, updates: JobUpdate): Promise<void> {
    try {
      const docRef = doc(firebaseFirestore, this.JOBS_COLLECTION, jobId);
      
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      };

      // Convert dates to Timestamps
      if (updates.startedAt) {
        updateData.startedAt = Timestamp.fromDate(updates.startedAt);
      }
      if (updates.completedAt) {
        updateData.completedAt = Timestamp.fromDate(updates.completedAt);
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating job:', error);
      throw new Error('Failed to update job');
    }
  }

  /**
   * Delete job
   */
  async deleteJob(jobId: string): Promise<void> {
    try {
      const docRef = doc(firebaseFirestore, this.JOBS_COLLECTION, jobId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting job:', error);
      throw new Error('Failed to delete job');
    }
  }

  /**
   * Get jobs with filtering and pagination
   */
  async getJobs(
    filter?: JobFilter,
    pageSize: number = 20,
    lastJobId?: string
  ): Promise<{ jobs: Job[]; hasMore: boolean }> {
    try {
      let q = query(
        collection(firebaseFirestore, this.JOBS_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(pageSize + 1) // Get one extra to check if there are more
      );

      // Apply filters
      if (filter) {
        if (filter.status && filter.status.length > 0) {
          q = query(q, where('status', 'in', filter.status));
        }
        if (filter.priority && filter.priority.length > 0) {
          q = query(q, where('priority', 'in', filter.priority));
        }
        if (filter.type && filter.type.length > 0) {
          q = query(q, where('type', 'in', filter.type));
        }
        if (filter.assignedTechnicianId) {
          q = query(q, where('assignedTechnicianId', '==', filter.assignedTechnicianId));
        }
        if (filter.dateRange) {
          q = query(
            q,
            where('scheduledDate', '>=', Timestamp.fromDate(filter.dateRange.start)),
            where('scheduledDate', '<=', Timestamp.fromDate(filter.dateRange.end))
          );
        }
      }

      // Handle pagination
      if (lastJobId) {
        const lastJobDoc = await getDoc(doc(firebaseFirestore, this.JOBS_COLLECTION, lastJobId));
        if (lastJobDoc.exists()) {
          q = query(q, startAfter(lastJobDoc));
        }
      }

      const querySnapshot = await getDocs(q);
      const jobs: Job[] = [];

      querySnapshot.forEach((doc: any) => {
        if (jobs.length < pageSize) {
          jobs.push(this.convertFirestoreToJob(doc.id, doc.data()));
        }
      });

      const hasMore = querySnapshot.docs.length > pageSize;

      // Apply client-side filters that can't be done in Firestore
      let filteredJobs = jobs;
      if (filter) {
        if (filter.searchText) {
          const searchLower = filter.searchText.toLowerCase();
          filteredJobs = jobs.filter(job => 
            job.title.toLowerCase().includes(searchLower) ||
            job.description.toLowerCase().includes(searchLower) ||
            job.customer.name.toLowerCase().includes(searchLower) ||
            job.location.address.toLowerCase().includes(searchLower)
          );
        }

        if (filter.location) {
          filteredJobs = filteredJobs.filter(job => {
            const distance = this.calculateDistance(
              filter.location!.latitude,
              filter.location!.longitude,
              job.location.latitude,
              job.location.longitude
            );
            return distance <= filter.location!.radius;
          });
        }
      }

      return { jobs: filteredJobs, hasMore };
    } catch (error) {
      console.error('Error getting jobs:', error);
      throw new Error('Failed to get jobs');
    }
  }

  /**
   * Assign job to technician
   */
  async assignJob(assignment: JobAssignment): Promise<void> {
    try {
      const batch = writeBatch(firebaseFirestore);

      // Update job with assignment
      const jobRef = doc(firebaseFirestore, this.JOBS_COLLECTION, assignment.jobId);
      batch.update(jobRef, {
        assignedTechnicianId: assignment.technicianId,
        assignedBy: assignment.assignedBy,
        assignedAt: Timestamp.fromDate(assignment.assignedAt),
        status: JobStatus.ASSIGNED,
        updatedAt: Timestamp.fromDate(new Date())
      });

      // Create assignment record
      const assignmentRef = doc(collection(firebaseFirestore, this.ASSIGNMENTS_COLLECTION));
      batch.set(assignmentRef, {
        ...assignment,
        assignedAt: Timestamp.fromDate(assignment.assignedAt)
      });

      await batch.commit();
    } catch (error) {
      console.error('Error assigning job:', error);
      throw new Error('Failed to assign job');
    }
  }

  /**
   * Get jobs assigned to a technician
   */
  async getTechnicianJobs(
    technicianId: string,
    status?: JobStatus[]
  ): Promise<Job[]> {
    try {
      let q = query(
        collection(firebaseFirestore, this.JOBS_COLLECTION),
        where('assignedTechnicianId', '==', technicianId),
        orderBy('scheduledDate', 'asc')
      );

      if (status && status.length > 0) {
        q = query(q, where('status', 'in', status));
      }

      const querySnapshot = await getDocs(q);
      const jobs: Job[] = [];

      querySnapshot.forEach((doc: any) => {
        jobs.push(this.convertFirestoreToJob(doc.id, doc.data()));
      });

      return jobs;
    } catch (error) {
      console.error('Error getting technician jobs:', error);
      throw new Error('Failed to get technician jobs');
    }
  }

  /**
   * Get job statistics
   */
  async getJobStats(dateRange?: { start: Date; end: Date }): Promise<JobStats> {
    try {
      let q = query(collection(firebaseFirestore, this.JOBS_COLLECTION));

      if (dateRange) {
        q = query(
          q,
          where('createdAt', '>=', Timestamp.fromDate(dateRange.start)),
          where('createdAt', '<=', Timestamp.fromDate(dateRange.end))
        );
      }

      const querySnapshot = await getDocs(q);
      const stats: JobStats = {
        total: 0,
        pending: 0,
        assigned: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        onHold: 0
      };

      querySnapshot.forEach((doc) => {
        const job = doc.data();
        stats.total++;
        
        switch (job.status) {
          case JobStatus.PENDING:
            stats.pending++;
            break;
          case JobStatus.ASSIGNED:
            stats.assigned++;
            break;
          case JobStatus.IN_PROGRESS:
            stats.inProgress++;
            break;
          case JobStatus.COMPLETED:
            stats.completed++;
            break;
          case JobStatus.CANCELLED:
            stats.cancelled++;
            break;
          case JobStatus.ON_HOLD:
            stats.onHold++;
            break;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting job stats:', error);
      throw new Error('Failed to get job statistics');
    }
  }

  /**
   * Get technician workload
   */
  async getTechnicianWorkload(technicianId: string): Promise<TechnicianWorkload> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get all jobs for technician
      const allJobsQuery = query(
        collection(firebaseFirestore, this.JOBS_COLLECTION),
        where('assignedTechnicianId', '==', technicianId)
      );

      // Get today's completed jobs
      const todayJobsQuery = query(
        collection(firebaseFirestore, this.JOBS_COLLECTION),
        where('assignedTechnicianId', '==', technicianId),
        where('completedAt', '>=', Timestamp.fromDate(today)),
        where('completedAt', '<', Timestamp.fromDate(tomorrow))
      );

      const [allJobsSnapshot, todayJobsSnapshot] = await Promise.all([
        getDocs(allJobsQuery),
        getDocs(todayJobsQuery)
      ]);

      let activeJobs = 0;
      let scheduledJobs = 0;
      let totalDuration = 0;
      let completedJobs = 0;

      allJobsSnapshot.forEach((doc) => {
        const job = doc.data();
        
        if (job.status === JobStatus.IN_PROGRESS) {
          activeJobs++;
        } else if (job.status === JobStatus.ASSIGNED) {
          scheduledJobs++;
        }

        if (job.actualDuration) {
          totalDuration += job.actualDuration;
          completedJobs++;
        }
      });

      const completedToday = todayJobsSnapshot.size;
      const averageJobDuration = completedJobs > 0 ? totalDuration / completedJobs : 0;

      return {
        technicianId,
        technicianName: '', // Will be populated by caller
        activeJobs,
        scheduledJobs,
        completedToday,
        averageJobDuration
      };
    } catch (error) {
      console.error('Error getting technician workload:', error);
      throw new Error('Failed to get technician workload');
    }
  }

  /**
   * Search jobs by proximity to location
   */
  async getJobsByProximity(
    latitude: number,
    longitude: number,
    radiusKm: number,
    maxResults: number = 10
  ): Promise<Job[]> {
    try {
      // Note: This is a simplified proximity search
      // For production, consider using GeoFirestore or similar
      const q = query(
        collection(firebaseFirestore, this.JOBS_COLLECTION),
        where('status', 'in', [JobStatus.PENDING, JobStatus.ASSIGNED]),
        limit(maxResults * 3) // Get more to filter by distance
      );

      const querySnapshot = await getDocs(q);
      const jobs: Job[] = [];

      querySnapshot.forEach((doc) => {
        const job = this.convertFirestoreToJob(doc.id, doc.data());
        const distance = this.calculateDistance(
          latitude,
          longitude,
          job.location.latitude,
          job.location.longitude
        );

        if (distance <= radiusKm) {
          jobs.push({ ...job, distance } as Job & { distance: number });
        }
      });

      // Sort by distance and limit results
      jobs.sort((a, b) => (a as any).distance - (b as any).distance);
      return jobs.slice(0, maxResults);
    } catch (error) {
      console.error('Error getting jobs by proximity:', error);
      throw new Error('Failed to get jobs by proximity');
    }
  }

  /**
   * Convert Firestore document to Job object
   */
  private convertFirestoreToJob(id: string, data: any): Job {
    return {
      id,
      title: data.title,
      description: data.description,
      type: data.type,
      status: data.status,
      priority: data.priority,
      customer: data.customer,
      location: data.location,
      assignedTechnicianId: data.assignedTechnicianId,
      assignedBy: data.assignedBy,
      assignedAt: data.assignedAt?.toDate(),
      scheduledDate: data.scheduledDate?.toDate(),
      scheduledTimeSlot: data.scheduledTimeSlot,
      estimatedDuration: data.estimatedDuration,
      requirements: data.requirements,
      startedAt: data.startedAt?.toDate(),
      completedAt: data.completedAt?.toDate(),
      actualDuration: data.actualDuration,
      notes: data.notes || [],
      internalNotes: data.internalNotes || [],
      createdBy: data.createdBy,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      completionNotes: data.completionNotes,
      customerSignature: data.customerSignature,
      photos: data.photos || [],
      workSummary: data.workSummary
    };
  }

  /**
   * Calculate distance between two points in kilometers
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const jobService = new JobService();