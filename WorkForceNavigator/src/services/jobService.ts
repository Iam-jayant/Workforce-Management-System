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
} from '@react-native-firebase/firestore';
import { firebaseFirestore } from '../config/firebase';
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
import { JobValidation, DataSanitizer } from '../utils/validation';
import { COLLECTIONS } from '../config/firestoreCollections';

class JobService {
  private readonly JOBS_COLLECTION = COLLECTIONS.JOBS;
  private readonly ASSIGNMENTS_COLLECTION = COLLECTIONS.JOB_ASSIGNMENTS;
  private readonly USERS_COLLECTION = COLLECTIONS.USERS;
  private readonly TIMESHEETS_COLLECTION = COLLECTIONS.TIMESHEETS;

  /**
   * Create a new job
   */
  async createJob(jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Validate job data
      const validation = JobValidation.validateJobCreation(jobData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Sanitize input data
      const sanitizedData = DataSanitizer.sanitizeJobData(jobData);

      const job: Omit<Job, 'id'> = {
        ...sanitizedData,
        status: JobStatus.PENDING, // Ensure new jobs start as pending
        notes: sanitizedData.notes || [],
        internalNotes: sanitizedData.internalNotes || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Generate search keywords for better searchability
      const searchKeywords = this.generateSearchKeywords(job);

      const docRef = await addDoc(collection(firebaseFirestore, this.JOBS_COLLECTION), {
        ...job,
        searchKeywords,
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
      if (error instanceof Error) {
        throw error;
      }
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
      // Get current job to validate status transitions
      const currentJob = await this.getJobById(jobId);
      if (!currentJob) {
        throw new Error('Job not found');
      }

      // Validate status transition if status is being updated
      if (updates.status && updates.status !== currentJob.status) {
        const statusValidation = JobValidation.validateStatusTransition(currentJob.status, updates.status);
        if (!statusValidation.isValid) {
          throw new Error(`Status transition validation failed: ${statusValidation.errors.join(', ')}`);
        }
      }

      // Validate completion data if job is being completed
      if (updates.status === JobStatus.COMPLETED) {
        const completionValidation = JobValidation.validateJobCompletion(updates);
        if (!completionValidation.isValid) {
          throw new Error(`Completion validation failed: ${completionValidation.errors.join(', ')}`);
        }
      }

      // Sanitize update data
      const sanitizedUpdates = DataSanitizer.sanitizeJobData(updates);

      const docRef = doc(firebaseFirestore, this.JOBS_COLLECTION, jobId);
      
      const updateData: any = {
        ...sanitizedUpdates,
        updatedAt: Timestamp.fromDate(new Date())
      };

      // Convert dates to Timestamps
      if (updates.startedAt) {
        updateData.startedAt = Timestamp.fromDate(updates.startedAt);
      }
      if (updates.completedAt) {
        updateData.completedAt = Timestamp.fromDate(updates.completedAt);
      }

      // Auto-set timestamps based on status
      if (updates.status === JobStatus.IN_PROGRESS && !currentJob.startedAt) {
        updateData.startedAt = Timestamp.fromDate(new Date());
      }
      if (updates.status === JobStatus.COMPLETED && !currentJob.completedAt) {
        updateData.completedAt = Timestamp.fromDate(new Date());
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating job:', error);
      if (error instanceof Error) {
        throw error;
      }
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
      // Validate assignment data
      const validation = JobValidation.validateJobAssignment(
        assignment.jobId,
        assignment.technicianId,
        assignment.assignedBy
      );
      if (!validation.isValid) {
        throw new Error(`Assignment validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if job exists and is in valid state for assignment
      const job = await this.getJobById(assignment.jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      if (job.status !== JobStatus.PENDING) {
        throw new Error(`Job cannot be assigned. Current status: ${job.status}`);
      }

      // Check if technician exists and is active
      const technicianDoc = await getDoc(doc(firebaseFirestore, this.USERS_COLLECTION, assignment.technicianId));
      if (!technicianDoc.exists()) {
        throw new Error('Technician not found');
      }

      const technician = technicianDoc.data();
      if (!technician?.isActive) {
        throw new Error('Technician is not active');
      }

      if (technician.role !== 'technician') {
        throw new Error('User is not a technician');
      }

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
        assignedAt: Timestamp.fromDate(assignment.assignedAt),
        assignmentReason: 'manual' // Default reason, can be enhanced
      });

      await batch.commit();
    } catch (error) {
      console.error('Error assigning job:', error);
      if (error instanceof Error) {
        throw error;
      }
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

      querySnapshot.forEach((doc: any) => {
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

      allJobsSnapshot.forEach((doc: any) => {
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

      querySnapshot.forEach((doc: any) => {
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

  /**
   * Generate search keywords for better job searchability
   */
  private generateSearchKeywords(job: Omit<Job, 'id'>): string[] {
    const keywords: string[] = [];
    
    // Add title and description words
    const titleWords = job.title.toLowerCase().split(/\s+/);
    const descriptionWords = job.description.toLowerCase().split(/\s+/);
    keywords.push(...titleWords, ...descriptionWords);
    
    // Add customer name
    keywords.push(job.customer.name.toLowerCase());
    
    // Add location information
    keywords.push(job.location.city.toLowerCase());
    keywords.push(job.location.state.toLowerCase());
    keywords.push(job.location.address.toLowerCase());
    
    // Add job type and priority
    keywords.push(job.type.toLowerCase());
    keywords.push(job.priority.toLowerCase());
    
    // Add skills
    keywords.push(...job.requirements.skills.map(skill => skill.toLowerCase()));
    
    // Remove duplicates and empty strings
    return [...new Set(keywords.filter(keyword => keyword.length > 0))];
  }

  /**
   * Advanced job search with multiple criteria
   */
  async searchJobs(searchParams: {
    query?: string;
    filters?: JobFilter;
    sortBy?: 'createdAt' | 'scheduledDate' | 'priority' | 'distance';
    sortOrder?: 'asc' | 'desc';
    pageSize?: number;
    lastJobId?: string;
  }): Promise<{ jobs: Job[]; hasMore: boolean }> {
    try {
      const {
        query: searchQuery,
        filters,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        pageSize = 20,
        lastJobId
      } = searchParams;

      let q = query(
        collection(firebaseFirestore, this.JOBS_COLLECTION),
        orderBy(sortBy, sortOrder),
        limit(pageSize + 1)
      );

      // Apply filters
      if (filters) {
        if (filters.status && filters.status.length > 0) {
          q = query(q, where('status', 'in', filters.status));
        }
        if (filters.priority && filters.priority.length > 0) {
          q = query(q, where('priority', 'in', filters.priority));
        }
        if (filters.type && filters.type.length > 0) {
          q = query(q, where('type', 'in', filters.type));
        }
        if (filters.assignedTechnicianId) {
          q = query(q, where('assignedTechnicianId', '==', filters.assignedTechnicianId));
        }
        if (filters.dateRange) {
          q = query(
            q,
            where('scheduledDate', '>=', Timestamp.fromDate(filters.dateRange.start)),
            where('scheduledDate', '<=', Timestamp.fromDate(filters.dateRange.end))
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

      // Apply text search if provided
      let filteredJobs = jobs;
      if (searchQuery && searchQuery.trim().length > 0) {
        const searchLower = searchQuery.toLowerCase();
        filteredJobs = jobs.filter(job => {
          // Search in multiple fields
          return (
            job.title.toLowerCase().includes(searchLower) ||
            job.description.toLowerCase().includes(searchLower) ||
            job.customer.name.toLowerCase().includes(searchLower) ||
            job.location.address.toLowerCase().includes(searchLower) ||
            job.location.city.toLowerCase().includes(searchLower) ||
            job.requirements.skills.some(skill => skill.toLowerCase().includes(searchLower)) ||
            job.type.toLowerCase().includes(searchLower) ||
            job.priority.toLowerCase().includes(searchLower)
          );
        });
      }

      // Apply location-based filtering
      if (filters?.location) {
        filteredJobs = filteredJobs.filter(job => {
          const distance = this.calculateDistance(
            filters.location!.latitude,
            filters.location!.longitude,
            job.location.latitude,
            job.location.longitude
          );
          return distance <= filters.location!.radius;
        });
      }

      return { jobs: filteredJobs, hasMore };
    } catch (error) {
      console.error('Error searching jobs:', error);
      throw new Error('Failed to search jobs');
    }
  }

  /**
   * Get job recommendations for a technician based on skills and location
   */
  async getJobRecommendations(
    technicianId: string,
    maxResults: number = 10
  ): Promise<Job[]> {
    try {
      // Get technician details
      const technicianDoc = await getDoc(doc(firebaseFirestore, this.USERS_COLLECTION, technicianId));
      if (!technicianDoc.exists()) {
        throw new Error('Technician not found');
      }

      const technician = technicianDoc.data();
      const technicianSkills = technician?.skills || [];
      const technicianLocation = technician?.currentLocation;

      // Get pending jobs
      const q = query(
        collection(firebaseFirestore, this.JOBS_COLLECTION),
        where('status', '==', JobStatus.PENDING),
        orderBy('priority', 'desc'),
        limit(maxResults * 2) // Get more to filter and rank
      );

      const querySnapshot = await getDocs(q);
      const jobs: (Job & { score: number })[] = [];

      querySnapshot.forEach((doc: any) => {
        const job = this.convertFirestoreToJob(doc.id, doc.data());
        
        // Calculate recommendation score
        let score = 0;
        
        // Skill match score (0-50 points)
        const requiredSkills = job.requirements.skills;
        const matchingSkills = requiredSkills.filter(skill => 
          technicianSkills.includes(skill)
        );
        score += (matchingSkills.length / requiredSkills.length) * 50;
        
        // Priority score (0-30 points)
        const priorityScores = {
          [JobPriority.URGENT]: 30,
          [JobPriority.HIGH]: 20,
          [JobPriority.MEDIUM]: 10,
          [JobPriority.LOW]: 5
        };
        score += priorityScores[job.priority] || 0;
        
        // Distance score (0-20 points) - closer is better
        if (technicianLocation) {
          const distance = this.calculateDistance(
            technicianLocation.latitude,
            technicianLocation.longitude,
            job.location.latitude,
            job.location.longitude
          );
          
          // Inverse distance scoring (closer = higher score)
          if (distance <= 5) score += 20;
          else if (distance <= 10) score += 15;
          else if (distance <= 20) score += 10;
          else if (distance <= 50) score += 5;
        }
        
        jobs.push({ ...job, score });
      });

      // Sort by score and return top results
      return jobs
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults)
        .map(({ score, ...job }) => job);
    } catch (error) {
      console.error('Error getting job recommendations:', error);
      throw new Error('Failed to get job recommendations');
    }
  }

  /**
   * Bulk update job statuses
   */
  async bulkUpdateJobs(
    updates: Array<{ jobId: string; updates: JobUpdate }>
  ): Promise<void> {
    try {
      const batch = writeBatch(firebaseFirestore);
      
      for (const { jobId, updates: jobUpdates } of updates) {
        const jobRef = doc(firebaseFirestore, this.JOBS_COLLECTION, jobId);
        
        const updateData: any = {
          ...jobUpdates,
          updatedAt: Timestamp.fromDate(new Date())
        };

        // Convert dates to Timestamps
        if (jobUpdates.startedAt) {
          updateData.startedAt = Timestamp.fromDate(jobUpdates.startedAt);
        }
        if (jobUpdates.completedAt) {
          updateData.completedAt = Timestamp.fromDate(jobUpdates.completedAt);
        }

        batch.update(jobRef, updateData);
      }

      await batch.commit();
    } catch (error) {
      console.error('Error bulk updating jobs:', error);
      throw new Error('Failed to bulk update jobs');
    }
  }

  /**
   * Get jobs requiring attention (overdue, high priority, etc.)
   */
  async getJobsRequiringAttention(): Promise<Job[]> {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Get overdue jobs
      const overdueQuery = query(
        collection(firebaseFirestore, this.JOBS_COLLECTION),
        where('scheduledDate', '<', Timestamp.fromDate(now)),
        where('status', 'in', [JobStatus.PENDING, JobStatus.ASSIGNED])
      );

      // Get high priority jobs
      const highPriorityQuery = query(
        collection(firebaseFirestore, this.JOBS_COLLECTION),
        where('priority', 'in', [JobPriority.HIGH, JobPriority.URGENT]),
        where('status', 'in', [JobStatus.PENDING, JobStatus.ASSIGNED])
      );

      // Get long-running jobs
      const longRunningQuery = query(
        collection(firebaseFirestore, this.JOBS_COLLECTION),
        where('startedAt', '<', Timestamp.fromDate(oneDayAgo)),
        where('status', '==', JobStatus.IN_PROGRESS)
      );

      const [overdueSnapshot, highPrioritySnapshot, longRunningSnapshot] = await Promise.all([
        getDocs(overdueQuery),
        getDocs(highPriorityQuery),
        getDocs(longRunningQuery)
      ]);

      const jobsMap = new Map<string, Job>();

      // Collect all jobs requiring attention
      [overdueSnapshot, highPrioritySnapshot, longRunningSnapshot].forEach(snapshot => {
        snapshot.forEach((doc: any) => {
          const job = this.convertFirestoreToJob(doc.id, doc.data());
          jobsMap.set(job.id, job);
        });
      });

      return Array.from(jobsMap.values());
    } catch (error) {
      console.error('Error getting jobs requiring attention:', error);
      throw new Error('Failed to get jobs requiring attention');
    }
  }
}

export const jobService = new JobService();