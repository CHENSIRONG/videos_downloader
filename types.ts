export interface DownloadRequest {
  url: string;
  format: 'mp4' | 'mp3';
  quality: '1080p' | '720p' | '480p' | 'best';
}

export interface DownloadedVideo {
  id: string;
  url: string;
  originalUrl: string;
  title: string;
  source: 'YouTube' | 'X (Twitter)' | 'Direct Link' | 'Instagram' | 'Unknown';
  size: string;
  duration: string;
  createdAt: number;
  thumbnail?: string;
}

export enum DownloadStatus {
  IDLE = 'IDLE',
  RESOLVING = 'RESOLVING', // Checking URL
  FETCHING_INFO = 'FETCHING_INFO', // Getting metadata
  DOWNLOADING = 'DOWNLOADING', // Downloading bytes
  PROCESSING = 'PROCESSING', // Finalizing
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}