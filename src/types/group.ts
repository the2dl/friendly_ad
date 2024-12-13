export interface Group {
  id: string;
  name: string;
  description: string;
  type: 'security' | 'distribution';
  members: string[];
  owner: string;
  created: string;
  lastModified: string;
  memberCount?: number;
}