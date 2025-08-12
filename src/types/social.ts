/**
 * Social platform type definitions
 * Types for living profiles, social cards, and life coordination
 */


export interface Community {
  id: string;
  name: string;
  description?: string;
  color: string;
  memberCount?: number;
  isJoined?: boolean;
}

export type SocialTab = 'buzz' | 'groups' | 'strategize' | 'collaborate';

// Feed & Living Profiles
export interface SocialCard {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  relationship: 'friend' | 'family' | 'acquaintance' | 'colleague';
  lastUpdated: string;
  isOnline: boolean;
  
  // Living Portfolio Data
  currentStatus: string; // AI-crafted status
  availability: AvailabilityStatus;
  recentActivities: Activity[];
  upcomingPlans: Plan[];
  workSchedule?: WorkSchedule;
  mood?: string;
  location?: string;
  
  // Integrations
  spotify?: SpotifyData;
  calendar?: CalendarSummary;
  
  // Privacy
  shareLevel: 'full' | 'limited' | 'minimal';
}

export interface AvailabilityStatus {
  status: 'available' | 'busy' | 'do-not-disturb' | 'away';
  message?: string;
  until?: string; // timestamp
  hangoutPreference?: 'coffee' | 'dinner' | 'activity' | 'virtual' | 'any';
}

export interface Activity {
  id: string;
  type: 'work' | 'exercise' | 'social' | 'hobby' | 'travel' | 'other';
  description: string;
  timestamp: string;
  location?: string;
  emoji?: string;
}

export interface Plan {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  location?: string;
  type: 'work' | 'personal' | 'social' | 'travel';
  inviteOpen?: boolean; // Can others join?
}

export interface WorkSchedule {
  timezone: string;
  workingHours: {
    start: string; // HH:mm format
    end: string;
  };
  workingDays: number[]; // 0-6, Sunday is 0
  breakTimes?: {
    start: string;
    end: string;
  }[];
  status: 'working' | 'break' | 'off-work' | 'vacation';
}

export interface SpotifyData {
  connected?: boolean;
  recentTracks: {
    name: string;
    artist: string;
    album?: string;
    playedAt: string;
  }[];
  topArtistsThisWeek: string[];
  currentlyPlaying?: {
    name: string;
    artist: string;
    isPlaying: boolean;
  };
  currentTrack?: {
    name: string;
    artist: string;
    isPlaying: boolean;
  };
  mood?: 'energetic' | 'chill' | 'focused' | 'party' | 'emotional';
}

export interface CalendarSummary {
  todayEvents: number;
  weekBusyness: 'light' | 'moderate' | 'heavy';
  nextFreeSlot?: string;
  upcomingImportant?: {
    title: string;
    time: string;
  };
}

// Coordination & Hangout Planning
export interface HangoutRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  type: 'coffee' | 'dinner' | 'activity' | 'virtual' | 'spontaneous';
  suggestedTime?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'maybe';
  createdAt: string;
}

export interface CoordinationGroup {
  id: string;
  name: string;
  members: string[]; // user IDs
  type: 'family' | 'friend-group' | 'work-team' | 'activity-group';
  sharedCalendar?: boolean;
  groupAvailability?: AvailabilityStatus;
}
