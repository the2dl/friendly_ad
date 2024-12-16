import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateShareableLink(type: 'user' | 'group', id: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}?type=${type}&id=${encodeURIComponent(id)}`;
}
