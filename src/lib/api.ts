import { User } from '@/types/user';
import { Group } from '@/types/group';

const API_BASE_URL = 'http://10.3.10.100:5001';

class ApiError extends Error {
  constructor(public status?: number, message?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function searchUsers(query: string, precise: boolean): Promise<User[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(query)}&type=users&precise=${precise}`);
    if (!response.ok) {
      throw new ApiError(response.status, 'Failed to fetch users');
    }
    return response.json();
  } catch (err) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new ApiError(undefined, 'Connection failed');
    }
    throw err;
  }
}

export async function searchGroups(query: string, precise: boolean): Promise<Group[]> {
  const response = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(query)}&type=groups&precise=${precise}`);
  if (!response.ok) {
    throw new Error('Failed to fetch groups');
  }
  return response.json();
}

export async function searchGroupMembers(groupDN: string): Promise<User[]> {
  const response = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(groupDN)}&type=group_members`);
  if (!response.ok) {
    throw new Error('Failed to fetch group members');
  }
  return response.json();
}

export async function getGroupDetails(groupId: string): Promise<Group> {
  console.log('Fetching group details for ID:', groupId);
  const response = await fetch(`${API_BASE_URL}/groups/${encodeURIComponent(groupId)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch group details');
  }
  const data = await response.json();
  console.log('API response:', data);
  return data;
} 