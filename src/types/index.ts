export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  source: 'Apify LinkedIn Actor' | 'RapidAPI LinkedIn' | 'Greenhouse ATS' | 'Lever ATS' | 'Public Jobs Feed' | 'User Custom Entry';
  postedDate: string;
  matchScore: number | null;
  salary?: string;
  type: 'Full-time' | 'Contract' | 'Part-time' | 'Internship' | 'Not specified';
  experienceLevel: 'Internship' | 'Entry-Level' | 'Mid-Senior' | 'Director' | 'Executive' | 'Not specified';
  workplaceType: 'Remote' | 'Hybrid' | 'On-site' | 'Not specified';
  originalUrl: string;
  description: string;
  skillsRequired: string[];
  isStale?: boolean;
  verified?: boolean;
  saved?: boolean;
  matchResult?: MatchResult;
}

export interface MatchResult {
  score: number;
  summary: string;
  matchingEvidence: string[];
  potentialSkillGaps: string[];
  eligibilityWarnings: string[];
  evaluatedAt?: string;
  isFallback?: boolean;
}

export interface WorkExperienceItem {
  jobTitle: string;
  company: string;
  duration?: string;
  yearsOfExperience?: number;
  responsibilities: string[];
}

export interface EducationItem {
  degree: string;
  institution: string;
  graduationYear?: string;
}

export interface StructuredProfile {
  headline?: string;
  skills: string[];
  technicalTools: string[];
  qualifications: string[];
  certifications: string[];
  experience: WorkExperienceItem[];
  education: EducationItem[];
  projects: string[];
  languages: string[];
  domains: string[];
  yearsOfExperienceTotal?: number;
}

export interface Resume {
  text: string;
  name: string;
  lastUpdated: string;
  extractedSkills: string[];
  parsedRole?: string;
  profile?: StructuredProfile;
  extractionStatus?: 'idle' | 'extracting' | 'completed' | 'failed';
  profileVersion?: number;
}

export type ApplicationStatus = 'Applied' | 'Interview' | 'Offer' | 'Rejected';

export interface Application {
  id: string;
  jobId?: string;
  jobTitle: string;
  company: string;
  location?: string;
  originalUrl: string;
  status: ApplicationStatus;
  appliedDate: string;
  lastUpdatedDate: string;
  notes?: string;
  salary?: string;
  contactPerson?: string;
  followUpNeeded?: boolean;
}

export interface ScanSchedule {
  enabled: boolean;
  frequencyType: 'hourly' | 'daily';
  frequencyValue: number; // e.g. 1 to 24 for hours, 1 to 5 for days
  lastScanTime: string;
  nextScanTime: string;
  lastSuccessfulScanJobsCount: number;
  sourceFailuresCount: number;
  status: 'idle' | 'running' | 'completed' | 'error';
}

export interface SourceHealth {
  id: string;
  name: string;
  type: 'Apify LinkedIn Actor' | 'RapidAPI LinkedIn' | 'Public RSS/ATS' | 'Direct Employer ATS';
  status: 'Connected' | 'Available' | 'Configured (not health-tested)' | 'Credentials Required' | 'Error' | 'Quota Exceeded';
  lastCheckTime: string;
  jobsIndexedCount: number;
  allowedRefreshInterval: string;
  requiresApiKey: boolean;
  apiKeyName?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'match' | 'scan' | 'followup' | 'system';
  link?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  isAuthenticated: boolean;
  role?: string;
  joinedDate: string;
  preferences: {
    pushNotifications: boolean;
    highMatchAlerts: boolean;
    emailSummaries: boolean;
    autoSaveHighMatches: boolean;
  };
  apiKeys?: {
    apifyApiToken?: string;
    rapidapiKey?: string;
  };
}
