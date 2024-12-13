import { User } from '@/types/user';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@company.com',
    department: 'Engineering',
    title: 'Senior Software Engineer',
    groups: ['Developers', 'Cloud Access', 'VPN Users'],
    location: 'New York',
    status: 'active',
    lastLogin: '2024-03-20T10:30:00Z',
    manager: 'Jane Smith',
    phoneNumber: '+1 (555) 123-4567',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=60',
  },
  {
    id: '2',
    name: 'Alice Johnson',
    email: 'alice.j@company.com',
    department: 'Marketing',
    title: 'Marketing Manager',
    groups: ['Marketing Team', 'Content Creators'],
    location: 'London',
    status: 'active',
    lastLogin: '2024-03-21T08:15:00Z',
    manager: 'Bob Wilson',
    phoneNumber: '+44 20 7123 4567',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=60',
  },
  {
    id: '3',
    name: 'David Chen',
    email: 'david.c@company.com',
    department: 'Finance',
    title: 'Financial Analyst',
    groups: ['Finance Team', 'Reporting'],
    location: 'Singapore',
    status: 'inactive',
    lastLogin: '2024-03-15T14:45:00Z',
    manager: 'Sarah Lee',
    phoneNumber: '+65 6789 0123',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=60',
  },
];

export const departments = [
  'All',
  'Engineering',
  'Marketing',
  'Finance',
  'HR',
  'Sales',
  'Operations',
];

export const locations = ['All', 'New York', 'London', 'Singapore', 'Tokyo', 'Sydney'];