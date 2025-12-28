
export enum PlaybackState {
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  BUFFERING = 'BUFFERING'
}

export enum UserRole {
  MASTER = 'MASTER',
  FOLLOWER = 'FOLLOWER'
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isOnline: boolean;
  friends?: string[];
}

export enum MessageType {
  SYNC = 'SYNC',
  URL_CHANGE = 'URL_CHANGE',
  VOICE_STATE = 'VOICE_STATE',
  BROWSER_ACTION = 'BROWSER_ACTION'
}

export interface SyncMessage {
  type: MessageType;
  userId: string;
  currentTime?: number;
  state?: PlaybackState;
  videoUrl?: string;
  browserUrl?: string; // For Navigation Sync
  quality?: string; // For Video Quality Sync
  interactionType?: 'SCROLL' | 'CLICK' | 'HOVER';
  interactionData?: any;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isRead: boolean;
  isAI?: boolean;
}
