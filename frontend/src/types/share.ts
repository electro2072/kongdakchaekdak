export type ShareScope = 'all' | 'group' | 'custom';
export type SharePlatform = 'app' | 'instagram' | 'threads' | 'tiktok';

export interface ShareGroupOption {
  id: string;
  name: string;
  memberCount: number;
}
