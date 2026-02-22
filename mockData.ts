
import { Role, User, Event, EventType, Stats, Team, Notification } from './types';

export const currentUser: User = {
  id: 'me',
  name: 'Alex Rivera',
  email: 'alex@lotus.ai',
  role: Role.PARTICIPANT,
  avatar: '',
  bio: 'Full-stack developer passionate about building community tools.',
  skills: ['React', 'Node.js', 'UI Design'],
  interests: ['Sustainability', 'EdTech', 'Open Source'],
  tags: ['Developer', 'Minimalist'],
  whyMatch: 'You are viewing your own profile.'
};

export const mockUsers: User[] = [
  {
    id: 'u2',
    name: 'Serena Bloom',
    email: 'serena@bloom.com',
    role: Role.PARTICIPANT,
    avatar: 'https://i.pravatar.cc/150?u=serena',
    bio: 'Product designer focusing on regenerative systems.',
    skills: ['Figma', 'Strategy', 'Sustainability'],
    interests: ['Permaculture', 'Minimalism'],
    matchScore: 92,
    tags: ['Designer', 'Eco-Conscious'],
    whyMatch: 'Strong alignment on sustainability and minimalist design principles.'
  },
  {
    id: 'u3',
    name: 'Julian Vance',
    email: 'julian@vance.io',
    role: Role.PARTICIPANT,
    avatar: 'https://i.pravatar.cc/150?u=julian',
    bio: 'Front-end engineer building the next web.',
    skills: ['React', 'TypeScript', 'Three.js'],
    interests: ['Creative Coding', 'Metaverse'],
    matchScore: 88,
    tags: ['Engineer', 'Web3'],
    whyMatch: 'Julian complements your back-end skills with deep front-end expertise.'
  }
];

export const mockEvents: Event[] = [
  {
    id: 'e1',
    name: 'EcoHack 2024',
    description: 'A 48-hour hackathon focused on building sustainable digital solutions.',
    date: '2025-05-15T09:00:00Z',
    venue: 'Green Tech Hub, SF',
    maxTeamSize: 4,
    capacity: 200,
    registrationDeadline: '2025-05-01T23:59:59Z',
    type: EventType.HACKATHON,
    participantsCount: 124,
    teamsCount: 32,
    registeredUserIds: ['u2']
  },
  {
    id: 'e2',
    name: 'LotUs Design Summit',
    description: 'Annual gathering of minimalist designers and visual storytellers.',
    date: '2025-06-05T10:00:00Z',
    venue: 'Digital Gardens Online',
    onlineLink: 'https://zoom.us/j/lotus-summit',
    maxTeamSize: 1,
    capacity: 500,
    registrationDeadline: '2025-05-20T23:59:59Z',
    type: EventType.CONFERENCE,
    participantsCount: 450,
    teamsCount: 0,
    registeredUserIds: []
  },
  {
    id: 'e3',
    name: 'Creator Workshop: Scaling with AI',
    description: 'Hands-on session using GenAI to optimize your creative workflow.',
    date: '2025-04-28T14:00:00Z',
    venue: 'Creator Space, London',
    maxTeamSize: 2,
    capacity: 50,
    registrationDeadline: '2025-04-20T23:59:59Z',
    type: EventType.WORKSHOP,
    participantsCount: 45,
    teamsCount: 12,
    registeredUserIds: ['me']
  },
  {
    id: 'e4',
    name: 'Sustainability Meetup',
    description: 'Local networking for eco-conscious developers and founders.',
    date: '2025-07-10T18:00:00Z',
    venue: 'The Greenhouse, NYC',
    maxTeamSize: 1,
    capacity: 30,
    registrationDeadline: '2025-07-05T23:59:59Z',
    type: EventType.MEETUP,
    participantsCount: 10,
    teamsCount: 0,
    registeredUserIds: []
  }
];

export const mockTeams: Team[] = [
  {
    id: 't1',
    name: 'Team Bloom',
    eventId: 'e1',
    leaderId: 'me',
    members: ['me', 'u2'],
    invites: ['u3']
  }
];

export const mockConnections = [
  { id: 'c1', user: mockUsers[0], status: 'Accepted' },
  { id: 'c2', user: mockUsers[1], status: 'Pending' }
];

export const mockNotifications: Notification[] = [
  { id: 'n1', title: 'Registration Closing', message: 'Registration for EcoHack 2024 closes in 48 hours!', date: '2024-10-30', type: 'Reminder' }
];

export const mockStats: Stats = {
  totalEvents: 12,
  totalParticipants: 1240,
  upcomingEvents: 4,
  recentRegistrations: 56
};
