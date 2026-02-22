export enum Role {
  SUPERADMIN = 'superadmin',
  ADMIN = 'Admin',
  PARTICIPANT = 'Participant'
}

export enum EventType {
  HACKATHON = 'Hackathon',
  CONFERENCE = 'Conference',
  WORKSHOP = 'Workshop',
  MEETUP = 'Meetup'
}

export interface Event {
  id: string;
  name: string;
  description: string;
  date: string; // ISO format
  venue: string;
  onlineLink?: string;
  maxTeamSize: number;
  capacity: number;
  registrationDeadline: string; // ISO format
  type: EventType;
  participantsCount: number;
  teamsCount: number;
  registeredUserIds: string[];
  participationType?: 'Individual' | 'Team';
  entryType?: 'Free' | 'Paid';
  paymentLink?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  bio: string;
  skills: string[];
  interests: string[];
  matchScore?: number;
  tags: string[];
  whyMatch?: string;
}

export interface Team {
  id: string;
  name: string;
  eventId: string;
  leaderId: string;
  members: string[]; // User IDs
  invites: string[]; // User IDs
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'Announcement' | 'Reminder' | 'Update';
}

export interface Stats {
  totalEvents: number;
  totalParticipants: number;
  upcomingEvents: number;
  recentRegistrations: number;
}