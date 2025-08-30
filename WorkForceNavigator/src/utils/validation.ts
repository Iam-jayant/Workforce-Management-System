/**
 * Validation utilities for job management data models
 */

import { Job, JobStatus, JobPriority, JobType, Customer, Equipment, JobRequirements } from '../types/job';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class JobValidation {
  /**
   * Validate job creation data
   */
  static validateJobCreation(jobData: Partial<Job>): ValidationResult {
    const errors: string[] = [];

    // Required fields validation
    if (!jobData.title || jobData.title.trim().length === 0) {
      errors.push('Job title is required');
    } else if (jobData.title.length > 100) {
      errors.push('Job title must be less than 100 characters');
    }

    if (!jobData.description || jobData.description.trim().length === 0) {
      errors.push('Job description is required');
    } else if (jobData.description.length > 1000) {
      errors.push('Job description must be less than 1000 characters');
    }

    if (!jobData.type || !Object.values(JobType).includes(jobData.type)) {
      errors.push('Valid job type is required');
    }

    if (!jobData.priority || !Object.values(JobPriority).includes(jobData.priority)) {
      errors.push('Valid job priority is required');
    }

    if (!jobData.scheduledDate) {
      errors.push('Scheduled date is required');
    } else {
      const scheduledDate = new Date(jobData.scheduledDate);
      const now = new Date();
      if (scheduledDate < now) {
        errors.push('Scheduled date cannot be in the past');
      }
    }

    if (!jobData.estimatedDuration || jobData.estimatedDuration <= 0) {
      errors.push('Estimated duration must be greater than 0 minutes');
    } else if (jobData.estimatedDuration > 1440) { // 24 hours
      errors.push('Estimated duration cannot exceed 24 hours');
    }

    if (!jobData.createdBy || jobData.createdBy.trim().length === 0) {
      errors.push('Created by field is required');
    }

    // Validate customer data
    if (!jobData.customer) {
      errors.push('Customer information is required');
    } else {
      const customerValidation = this.validateCustomer(jobData.customer);
      errors.push(...customerValidation.errors);
    }

    // Validate location data
    if (!jobData.location) {
      errors.push('Job location is required');
    } else {
      const locationValidation = this.validateLocation(jobData.location);
      errors.push(...locationValidation.errors);
    }

    // Validate requirements
    if (!jobData.requirements) {
      errors.push('Job requirements are required');
    } else {
      const requirementsValidation = this.validateJobRequirements(jobData.requirements);
      errors.push(...requirementsValidation.errors);
    }

    // Validate scheduled time slot
    if (!jobData.scheduledTimeSlot) {
      errors.push('Scheduled time slot is required');
    } else {
      const timeSlotValidation = this.validateTimeSlot(jobData.scheduledTimeSlot);
      errors.push(...timeSlotValidation.errors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate job status transitions
   */
  static validateStatusTransition(currentStatus: JobStatus, newStatus: JobStatus): ValidationResult {
    const errors: string[] = [];

    const validTransitions: Record<JobStatus, JobStatus[]> = {
      [JobStatus.PENDING]: [JobStatus.ASSIGNED, JobStatus.CANCELLED],
      [JobStatus.ASSIGNED]: [JobStatus.IN_PROGRESS, JobStatus.CANCELLED, JobStatus.ON_HOLD],
      [JobStatus.IN_PROGRESS]: [JobStatus.COMPLETED, JobStatus.ON_HOLD, JobStatus.CANCELLED],
      [JobStatus.ON_HOLD]: [JobStatus.ASSIGNED, JobStatus.IN_PROGRESS, JobStatus.CANCELLED],
      [JobStatus.COMPLETED]: [], // No transitions from completed
      [JobStatus.CANCELLED]: [] // No transitions from cancelled
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      errors.push(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate customer data
   */
  static validateCustomer(customer: Customer): ValidationResult {
    const errors: string[] = [];

    if (!customer.name || customer.name.trim().length === 0) {
      errors.push('Customer name is required');
    } else if (customer.name.length > 100) {
      errors.push('Customer name must be less than 100 characters');
    }

    if (!customer.phone || customer.phone.trim().length === 0) {
      errors.push('Customer phone is required');
    } else if (!/^\+?[\d\s\-\(\)]{10,15}$/.test(customer.phone)) {
      errors.push('Customer phone must be a valid phone number');
    }

    if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      errors.push('Customer email must be a valid email address');
    }

    if (customer.alternatePhone && !/^\+?[\d\s\-\(\)]{10,15}$/.test(customer.alternatePhone)) {
      errors.push('Alternate phone must be a valid phone number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate job location
   */
  static validateLocation(location: any): ValidationResult {
    const errors: string[] = [];

    if (!location.address || location.address.trim().length === 0) {
      errors.push('Location address is required');
    }

    if (typeof location.latitude !== 'number' || location.latitude < -90 || location.latitude > 90) {
      errors.push('Valid latitude is required (-90 to 90)');
    }

    if (typeof location.longitude !== 'number' || location.longitude < -180 || location.longitude > 180) {
      errors.push('Valid longitude is required (-180 to 180)');
    }

    if (!location.city || location.city.trim().length === 0) {
      errors.push('City is required');
    }

    if (!location.state || location.state.trim().length === 0) {
      errors.push('State is required');
    }

    if (!location.zipCode || !/^\d{5}(-\d{4})?$/.test(location.zipCode)) {
      errors.push('Valid ZIP code is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate job requirements
   */
  static validateJobRequirements(requirements: JobRequirements): ValidationResult {
    const errors: string[] = [];

    if (!Array.isArray(requirements.skills)) {
      errors.push('Skills must be an array');
    } else if (requirements.skills.length === 0) {
      errors.push('At least one skill is required');
    }

    if (!Array.isArray(requirements.equipment)) {
      errors.push('Equipment must be an array');
    } else {
      requirements.equipment.forEach((equipment, index) => {
        const equipmentValidation = this.validateEquipment(equipment);
        equipmentValidation.errors.forEach(error => {
          errors.push(`Equipment ${index + 1}: ${error}`);
        });
      });
    }

    if (!requirements.estimatedDuration || requirements.estimatedDuration <= 0) {
      errors.push('Estimated duration must be greater than 0 minutes');
    }

    if (!Array.isArray(requirements.tools)) {
      errors.push('Tools must be an array');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate equipment data
   */
  static validateEquipment(equipment: Equipment): ValidationResult {
    const errors: string[] = [];

    if (!equipment.name || equipment.name.trim().length === 0) {
      errors.push('Equipment name is required');
    }

    if (!equipment.model || equipment.model.trim().length === 0) {
      errors.push('Equipment model is required');
    }

    if (!equipment.quantity || equipment.quantity <= 0) {
      errors.push('Equipment quantity must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate time slot
   */
  static validateTimeSlot(timeSlot: { start: string; end: string }): ValidationResult {
    const errors: string[] = [];

    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

    if (!timeSlot.start || !timeRegex.test(timeSlot.start)) {
      errors.push('Start time must be in HH:MM format');
    }

    if (!timeSlot.end || !timeRegex.test(timeSlot.end)) {
      errors.push('End time must be in HH:MM format');
    }

    if (timeSlot.start && timeSlot.end && timeRegex.test(timeSlot.start) && timeRegex.test(timeSlot.end)) {
      const [startHour, startMin] = timeSlot.start.split(':').map(Number);
      const [endHour, endMin] = timeSlot.end.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (endMinutes <= startMinutes) {
        errors.push('End time must be after start time');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate job assignment
   */
  static validateJobAssignment(jobId: string, technicianId: string, assignedBy: string): ValidationResult {
    const errors: string[] = [];

    if (!jobId || jobId.trim().length === 0) {
      errors.push('Job ID is required');
    }

    if (!technicianId || technicianId.trim().length === 0) {
      errors.push('Technician ID is required');
    }

    if (!assignedBy || assignedBy.trim().length === 0) {
      errors.push('Assigned by field is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate job completion data
   */
  static validateJobCompletion(completionData: {
    completionNotes?: string;
    workSummary?: string;
    photos?: string[];
    actualDuration?: number;
  }): ValidationResult {
    const errors: string[] = [];

    if (completionData.completionNotes && completionData.completionNotes.length > 1000) {
      errors.push('Completion notes must be less than 1000 characters');
    }

    if (completionData.workSummary && completionData.workSummary.length > 2000) {
      errors.push('Work summary must be less than 2000 characters');
    }

    if (completionData.actualDuration && completionData.actualDuration <= 0) {
      errors.push('Actual duration must be greater than 0 minutes');
    }

    if (completionData.photos && completionData.photos.length > 10) {
      errors.push('Maximum 10 photos allowed per job');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Sanitize input data to prevent injection attacks
 */
export class DataSanitizer {
  /**
   * Sanitize string input
   */
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes that could break queries
      .substring(0, 1000); // Limit length
  }

  /**
   * Sanitize job data before saving
   */
  static sanitizeJobData(jobData: any): any {
    const sanitized = { ...jobData };

    // Sanitize string fields
    if (sanitized.title) sanitized.title = this.sanitizeString(sanitized.title);
    if (sanitized.description) sanitized.description = this.sanitizeString(sanitized.description);
    if (sanitized.completionNotes) sanitized.completionNotes = this.sanitizeString(sanitized.completionNotes);
    if (sanitized.workSummary) sanitized.workSummary = this.sanitizeString(sanitized.workSummary);

    // Sanitize customer data
    if (sanitized.customer) {
      if (sanitized.customer.name) sanitized.customer.name = this.sanitizeString(sanitized.customer.name);
      if (sanitized.customer.email) sanitized.customer.email = this.sanitizeString(sanitized.customer.email);
      if (sanitized.customer.notes) sanitized.customer.notes = this.sanitizeString(sanitized.customer.notes);
    }

    // Sanitize location data
    if (sanitized.location) {
      if (sanitized.location.address) sanitized.location.address = this.sanitizeString(sanitized.location.address);
      if (sanitized.location.city) sanitized.location.city = this.sanitizeString(sanitized.location.city);
      if (sanitized.location.state) sanitized.location.state = this.sanitizeString(sanitized.location.state);
      if (sanitized.location.landmark) sanitized.location.landmark = this.sanitizeString(sanitized.location.landmark);
      if (sanitized.location.accessInstructions) sanitized.location.accessInstructions = this.sanitizeString(sanitized.location.accessInstructions);
    }

    // Sanitize arrays
    if (sanitized.notes && Array.isArray(sanitized.notes)) {
      sanitized.notes = sanitized.notes.map((note: string) => this.sanitizeString(note));
    }

    if (sanitized.internalNotes && Array.isArray(sanitized.internalNotes)) {
      sanitized.internalNotes = sanitized.internalNotes.map((note: string) => this.sanitizeString(note));
    }

    return sanitized;
  }
}