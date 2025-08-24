/**
 * Aether Forge - Core Types
 * Data structures for the Spark collaboration platform
 */

export interface Spark {
  id: string;
  title: string;
  oneLiner: string;
  tags: string[];
  artifactType: 'text' | 'audio' | 'code' | 'design' | 'business' | 'art';
  content: string; // The actual spark content
  creatorId: string;
  creatorUsername: string;
  createdAt: string;
  seasonId: string;
  
  // Engagement metrics
  boosts: number;
  commits: number;
  views: number;
  
  // Status
  status: 'active' | 'crystallized' | 'archived';
  
  // Social proof
  recentBoosters?: string[]; // Recent usernames who boosted
  commitCount?: number; // Number of people who joined to build
}

export interface Season {
  id: string;
  name: string;
  state: 'prep' | 'live' | 'crystallize' | 'ended';
  vertical: string; // e.g., 'micro-apps', 'music', 'art'
  startDate: string;
  endDate: string;
  crystallizeDate: string;
  
  // Metrics
  totalSparks: number;
  totalCommits: number;
  crystallizedCount: number;
  
  // Prize/sponsorship
  prizePool?: number;
  sponsors?: string[];
}

export interface BuildRoom {
  id: string;
  sparkId: string;
  members: BuildMember[];
  createdAt: string;
  
  // Project status
  status: 'planning' | 'building' | 'shipped' | 'paused';
  progress: number; // 0-100
  
  // AI-generated plan
  aiPlan: string[];
  completedTasks: string[];
  nextSteps: string[];
  
  // Collaboration
  splitAgreement: SplitAgreement;
  lastActivity: string;
}

export interface BuildMember {
  userId: string;
  username: string;
  role: string; // 'creator' | 'developer' | 'designer' | 'marketer' | etc.
  joinedAt: string;
  contribution: string;
  equity?: number; // Percentage if using split agreement
}

export interface SplitAgreement {
  type: 'equal' | 'custom' | 'work-for-hire';
  splits: { [userId: string]: number }; // Percentages
  terms: string;
  signedBy: string[]; // User IDs who have agreed
  createdAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  
  // Forge stats
  sparksCreated: number;
  sparksBoosts: number; // Total boosts received
  buildsJoined: number;
  projectsShipped: number;
  
  // Reputation
  creatorRating: number; // 0-5 stars
  collaboratorRating: number; // 0-5 stars
  
  // Streaks
  dailyStreak: number;
  longestStreak: number;
  
  // Badges/achievements
  badges: string[];
  
  // Season history
  seasonsParticipated: string[];
  crystallizedSparks: string[];
}

export interface BoostAction {
  id: string;
  userId: string;
  username: string;
  sparkId: string;
  createdAt: string;
  
  // Optional boost message
  message?: string;
}

export interface CommitAction {
  id: string;
  userId: string;
  username: string;
  sparkId: string;
  role: string; // What they want to contribute
  message: string; // Why they want to join
  createdAt: string;
  
  // Status
  status: 'pending' | 'accepted' | 'declined';
}