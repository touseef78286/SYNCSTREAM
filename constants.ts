
export const SYNC_THRESHOLD = 0.8; // Tightened to 800ms for better experience
export const HEARTBEAT_INTERVAL = 1200; // ms between master broadcasts
export const AUDIO_DUCKING_VOLUME = 0.20; // Exact 20% volume requested
export const DEFAULT_ROOM_ID = 'SYNC-STREAM-CINEMA';

export const MOCK_USERS = [
  { id: 'u1', name: 'Master User', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Master', isOnline: true },
  { id: 'u2', name: 'Partner', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Partner', isOnline: true },
];
