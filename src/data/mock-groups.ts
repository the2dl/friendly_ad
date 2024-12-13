import { Group } from '@/types/group';
import { mockUsers } from './mock-data';

export const mockGroups: Group[] = [
  {
    id: '1',
    name: 'Developers',
    description: 'Software development team members',
    type: 'security',
    members: mockUsers.filter(u => u.department === 'Engineering').map(u => u.id),
    owner: 'Jane Smith',
    created: '2023-01-15T08:00:00Z',
    lastModified: '2024-03-15T14:30:00Z'
  },
  {
    id: '2',
    name: 'Marketing Team',
    description: 'Marketing department members',
    type: 'distribution',
    members: mockUsers.filter(u => u.department === 'Marketing').map(u => u.id),
    owner: 'Bob Wilson',
    created: '2023-02-20T09:15:00Z',
    lastModified: '2024-03-18T11:20:00Z'
  },
  {
    id: '3',
    name: 'Finance Team',
    description: 'Finance department members',
    type: 'security',
    members: mockUsers.filter(u => u.department === 'Finance').map(u => u.id),
    owner: 'Sarah Lee',
    created: '2023-03-10T10:30:00Z',
    lastModified: '2024-03-20T16:45:00Z'
  }
];