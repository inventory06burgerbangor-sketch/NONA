export type PaperTexture = 'ruled' | 'grid' | 'blank' | 'parchment';
export type BookTheme = 'vintage' | 'botanical' | 'celestial' | 'minimalist' | 'leather';

export interface TextSnippet {
  id: string;
  x: number; // percentage (0 - 85) across page width
  y: number; // percentage (0 - 90) down page height
  text: string;
  fontStyle: 'handwriting' | 'serif' | 'sans' | 'mono';
  fontSize: number; // px, e.g. 16, 20, 24, 28
  color: string; // e.g. '#292524', '#1e3a8a', '#78350f', '#064e3b'
  rotation: number; // -4 to 4 degrees for organic feel
  updatedAt: string;
}

export interface BookPage {
  id: string;
  pageNumber: number;
  title?: string;
  snippets: TextSnippet[];
  isTorn?: boolean;
  tornAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Book {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  theme: BookTheme;
  coverImage: string;
  paperTexture: PaperTexture;
  totalPages: number;
  pages: BookPage[];
  tornScraps: BookPage[];
  createdAt: string;
}

export interface PhotoItem {
  id: string;
  ownerId: string;
  ownerName: string;
  url: string;
  caption: string;
  date: string;
  rotation: number;
  zIndex: number;
  collaborators?: string[]; // Tagged user accounts / collaborators
}

export type ScheduleCategory = 'penting' | 'kegiatan' | 'deadline' | 'personal';

export interface ScheduleItem {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  category: ScheduleCategory;
  alarmEnabled: boolean;
  alarmTriggered: boolean;
  completed: boolean;
  createdAt: string;
}

export interface PermissionRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  targetOwnerId: string;
  bookTitle: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
  respondedAt?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  avatar: string;
  roleDescription: string;
  book: Book;
  photos: PhotoItem[];
  schedules: ScheduleItem[];
  allowedViewerIds: string[]; // users who can view this user's book
  permissionRequests: PermissionRequest[]; // requests received
  sentRequests: PermissionRequest[]; // requests sent
}

export type ActiveTab = 'the-word' | 'the-art' | 'the-time';

