export enum JobStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold'
}

export enum JobPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum JobType {
  INSTALLATION = 'installation',
  REPAIR = 'repair',
  MAINTENANCE = 'maintenance',
  INSPECTION = 'inspection',
  UPGRADE = 'upgrade',
  EMERGENCY = 'emergency'
}

export interface JobLocation {
  address: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  zipCode: string;
  landmark?: string;
  accessInstructions?: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  alternatePhone?: string;
  address: JobLocation;
  notes?: string;
}

export interface Equipment {
  id: string;
  name: string;
  model: string;
  serialNumber?: string;
  quantity: number;
  description?: string;
}

export interface JobRequirements {
  skills: string[];
  equipment: Equipment[];
  estimatedDuration: number; // in minutes
  tools: string[];
  specialInstructions?: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  type: JobType;
  status: JobStatus;
  priority: JobPriority;
  
  // Customer and location
  customer: Customer;
  location: JobLocation;
  
  // Assignment
  assignedTechnicianId?: string;
  assignedBy?: string;
  assignedAt?: Date;
  
  // Scheduling
  scheduledDate: Date;
  scheduledTimeSlot: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  estimatedDuration: number; // in minutes
  
  // Requirements
  requirements: JobRequirements;
  
  // Progress tracking
  startedAt?: Date;
  completedAt?: Date;
  actualDuration?: number; // in minutes
  
  // Notes and updates
  notes: string[];
  internalNotes: string[];
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Completion details
  completionNotes?: string;
  customerSignature?: string;
  photos?: string[]; // URLs to uploaded photos
  workSummary?: string;
}

export interface JobFilter {
  status?: JobStatus[];
  priority?: JobPriority[];
  type?: JobType[];
  assignedTechnicianId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // in kilometers
  };
  searchText?: string;
}

export interface JobUpdate {
  status?: JobStatus;
  notes?: string;
  internalNotes?: string;
  startedAt?: Date;
  completedAt?: Date;
  actualDuration?: number;
  completionNotes?: string;
  customerSignature?: string;
  photos?: string[];
  workSummary?: string;
}

export interface JobAssignment {
  jobId: string;
  technicianId: string;
  assignedBy: string;
  assignedAt: Date;
  notes?: string;
}

export interface JobStats {
  total: number;
  pending: number;
  assigned: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  onHold: number;
}

export interface TechnicianWorkload {
  technicianId: string;
  technicianName: string;
  activeJobs: number;
  scheduledJobs: number;
  completedToday: number;
  averageJobDuration: number;
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
}