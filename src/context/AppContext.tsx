import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  UserAccount, 
  ActiveTab, 
  Book, 
  BookPage, 
  TextSnippet, 
  PhotoItem, 
  ScheduleItem, 
  PermissionRequest,
  BookTheme,
  PaperTexture 
} from '../types';
import { INITIAL_USERS } from '../data/initialData';
import { playPageTearSound, startAlarmChime, stopAlarmChime } from '../utils/audio';

const STORAGE_KEY = 'zainora_app_v2_users';
const CURRENT_USER_KEY = 'zainora_current_user_id';

interface AppContextType {
  users: UserAccount[];
  currentUserId: string | null;
  currentUser: UserAccount | null;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  switchUser: (userId: string) => void;
  createUserAccount: (data: {
    name: string;
    bookTitle: string;
    theme: BookTheme;
    coverImage: string;
    paperTexture: PaperTexture;
    totalPages: number;
  }) => Promise<void>;
  
  // Book Viewing & Permissions
  viewingBook: Book | null;
  setViewingBook: (book: Book | null) => void;
  canViewBook: (bookOwnerId: string) => boolean;
  canModifyBook: (bookOwnerId: string) => boolean;
  requestBookAccess: (targetOwnerId: string) => Promise<void>;
  respondPermissionRequest: (requestId: string, approve: boolean) => Promise<void>;
  deleteBook: (bookId: string) => Promise<boolean>;
  
  // Book Content Editing
  activePageNumber: number;
  setActivePageNumber: (pageNumber: number) => void;
  addSnippetToPage: (pageId: string, snippet: Omit<TextSnippet, 'id' | 'updatedAt'>) => Promise<void>;
  updateSnippet: (pageId: string, snippetId: string, text: string) => Promise<void>;
  deleteSnippet: (pageId: string, snippetId: string) => Promise<void>;
  addNewPage: (bookId: string) => Promise<void>;
  tearActivePage: (bookId: string, pageId: string) => Promise<void>;
  
  // ART / Gallery with Collaboration Tags
  addPhoto: (url: string, caption: string, collaborators?: string[]) => Promise<void>;
  deletePhoto: (photoId: string) => Promise<boolean>;
  canModifyPhoto: (photoOwnerId: string) => boolean;
  lastAddedPhotoId: string | null;

  // Plan / Schedule & Alarm (The Time)
  addSchedule: (item: Omit<ScheduleItem, 'id' | 'ownerId' | 'alarmTriggered' | 'createdAt'>) => Promise<void>;
  toggleScheduleAlarm: (id: string) => Promise<void>;
  toggleScheduleComplete: (id: string) => Promise<void>;
  deleteSchedule: (id: string) => Promise<boolean>;
  testAlarm: () => void;
  ringingAlarm: ScheduleItem | null;
  dismissAlarm: () => void;
  snoozeAlarm: (minutes: number) => void;

  // Notification stats
  pendingRequestsCount: number;
  notificationMessage: string | null;
  clearNotification: () => void;
  isOnline: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load local cache or initial empty users
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return INITIAL_USERS;
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(CURRENT_USER_KEY) || null;
    } catch (e) {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('the-word');
  const [viewingBookId, setViewingBookId] = useState<string | null>(null);
  const [activePageNumber, setActivePageNumber] = useState<number>(1);
  const [lastAddedPhotoId, setLastAddedPhotoId] = useState<string | null>(null);
  const [ringingAlarm, setRingingAlarm] = useState<ScheduleItem | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Sync state with the centralized server online backend
  const fetchOnlineState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.users)) {
          setUsers(data.users);
          setIsOnline(true);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.users));
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (err) {
      setIsOnline(false);
    }
  }, []);

  // Poll online backend every 3 seconds for actual real-time updates across all users
  useEffect(() => {
    fetchOnlineState();
    const interval = setInterval(fetchOnlineState, 3000);
    return () => clearInterval(interval);
  }, [fetchOnlineState]);

  // Sync current user ID
  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(CURRENT_USER_KEY, currentUserId);
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }, [currentUserId]);

  const currentUser = useMemo(() => {
    if (!currentUserId || users.length === 0) return null;
    return users.find(u => u.id === currentUserId) || users[0] || null;
  }, [users, currentUserId]);

  // Which book is being viewed
  const viewingBook = useMemo(() => {
    if (viewingBookId) {
      for (const u of users) {
        if (u.book?.id === viewingBookId) return u.book;
      }
    }
    return currentUser?.book || null;
  }, [viewingBookId, users, currentUser]);

  const setViewingBook = useCallback((book: Book | null) => {
    setViewingBookId(book ? book.id : null);
    setActivePageNumber(1);
  }, []);

  const clearNotification = useCallback(() => setNotificationMessage(null), []);

  const switchUser = useCallback((userId: string) => {
    setCurrentUserId(userId);
    setViewingBookId(null);
    setActivePageNumber(1);
    const target = users.find(u => u.id === userId);
    setNotificationMessage(`Beralih ke akun ${target?.name || userId}`);
  }, [users]);

  // Permission Checks
  const canViewBook = useCallback((bookOwnerId: string): boolean => {
    if (!currentUserId) return false;
    if (bookOwnerId === currentUserId) return true;
    const targetUser = users.find(u => u.id === bookOwnerId);
    if (!targetUser) return false;
    return (targetUser.allowedViewerIds || []).includes(currentUserId);
  }, [currentUserId, users]);

  // User only can delete/modify their own book, photos, notes
  const canModifyBook = useCallback((bookOwnerId: string): boolean => {
    if (!currentUserId) return false;
    return bookOwnerId === currentUserId;
  }, [currentUserId]);

  const canModifyPhoto = useCallback((photoOwnerId: string): boolean => {
    if (!currentUserId) return false;
    return photoOwnerId === currentUserId;
  }, [currentUserId]);

  // Request Access Flow (Online sync)
  const requestBookAccess = useCallback(async (targetOwnerId: string) => {
    if (!currentUserId || !currentUser) return;
    const targetUser = users.find(u => u.id === targetOwnerId);
    if (!targetUser) return;

    const newRequest: PermissionRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      requesterId: currentUserId,
      requesterName: currentUser.name,
      targetOwnerId,
      bookTitle: targetUser.book.title,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    try {
      await fetch('/api/permissions/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request: newRequest }),
      });
      fetchOnlineState();
    } catch (e) {
      // Local fallback
      setUsers(prev => prev.map(u => {
        if (u.id === targetOwnerId) {
          return { ...u, permissionRequests: [newRequest, ...(u.permissionRequests || [])] };
        }
        if (u.id === currentUserId) {
          return { ...u, sentRequests: [newRequest, ...(u.sentRequests || [])] };
        }
        return u;
      }));
    }

    setNotificationMessage(`Permintaan izin membuka buku "${targetUser.book.title}" dikirim ke ${targetUser.name}!`);
  }, [currentUserId, currentUser, users, fetchOnlineState]);

  // Respond to Permission Request (Online sync)
  const respondPermissionRequest = useCallback(async (requestId: string, approve: boolean) => {
    if (!currentUserId) return;

    try {
      await fetch('/api/permissions/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          targetOwnerId: currentUserId,
          approve,
        }),
      });
      fetchOnlineState();
    } catch (e) {
      setUsers(prev => prev.map(u => {
        if (u.id === currentUserId) {
          const req = u.permissionRequests.find(r => r.id === requestId);
          if (!req) return u;
          const updated = u.permissionRequests.map(r => r.id === requestId ? { ...r, status: approve ? 'approved' as const : 'denied' as const } : r);
          const newAllowed = approve ? Array.from(new Set([...u.allowedViewerIds, req.requesterId])) : u.allowedViewerIds;
          return { ...u, allowedViewerIds: newAllowed, permissionRequests: updated };
        }
        return u;
      }));
    }

    setNotificationMessage(approve ? 'Izin membuka buku telah disetujui!' : 'Permintaan izin telah ditolak.');
  }, [currentUserId, fetchOnlineState]);

  // Register New User Account (Online sync)
  const createUserAccount = useCallback(async (data: {
    name: string;
    bookTitle: string;
    theme: BookTheme;
    coverImage: string;
    paperTexture: PaperTexture;
    totalPages: number;
  }) => {
    const newUserId = `user_${Date.now().toString(36)}`;
    const newBook: Book = {
      id: `book_${Date.now()}`,
      ownerId: newUserId,
      ownerName: data.name,
      title: data.bookTitle,
      theme: data.theme,
      coverImage: data.coverImage,
      paperTexture: data.paperTexture,
      totalPages: data.totalPages,
      pages: [
        {
          id: `page_${Date.now()}_1`,
          pageNumber: 1,
          title: 'Halaman 1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          snippets: [
            {
              id: `snip_${Date.now()}`,
              x: 10,
              y: 12,
              text: `Selamat datang di buku catatan Anda: "${data.bookTitle}". Sentuh atau klik di sudut mana pun di atas kertas untuk mulai menulis.`,
              fontStyle: 'handwriting',
              fontSize: 22,
              color: '#3B4D39',
              rotation: -0.5,
              updatedAt: new Date().toISOString(),
            },
          ],
        },
      ],
      tornScraps: [],
      createdAt: new Date().toISOString(),
    };

    const newUser: UserAccount = {
      id: newUserId,
      name: data.name,
      avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(data.name)}&backgroundColor=e2ebe1`,
      roleDescription: 'Penulis ZAINORA',
      book: newBook,
      photos: [],
      schedules: [],
      allowedViewerIds: [],
      permissionRequests: [],
      sentRequests: [],
    };

    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      fetchOnlineState();
    } catch (e) {
      setUsers(prev => [...prev, newUser]);
    }

    setCurrentUserId(newUserId);
    setViewingBookId(newBook.id);
    setActivePageNumber(1);
    setNotificationMessage(`Profil & Buku "${data.bookTitle}" berhasil dibuat!`);
  }, [fetchOnlineState]);

  // Delete Book (Owner only)
  const deleteBook = useCallback(async (bookId: string): Promise<boolean> => {
    if (!currentUserId) return false;
    const book = users.find(u => u.book.id === bookId)?.book;
    if (!book || book.ownerId !== currentUserId) {
      setNotificationMessage('Peringatan: Anda tidak dapat menghapus buku orang lain.');
      return false;
    }

    try {
      await fetch('/api/books/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, ownerId: currentUserId }),
      });
      fetchOnlineState();
    } catch (e) {
      // Local fallback
      setUsers(prev => prev.map(u => {
        if (u.id === currentUserId) {
          return {
            ...u,
            book: {
              ...u.book,
              pages: [{
                id: `page_${Date.now()}_empty`,
                pageNumber: 1,
                title: 'Halaman 1',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                snippets: [],
              }],
              tornScraps: [],
            },
          };
        }
        return u;
      }));
    }

    setActivePageNumber(1);
    setNotificationMessage('Isi buku Anda telah dikosongkan.');
    return true;
  }, [currentUserId, users, fetchOnlineState]);

  // Book Page Actions
  const addSnippetToPage = useCallback(async (pageId: string, snippet: Omit<TextSnippet, 'id' | 'updatedAt'>) => {
    if (!viewingBook) return;
    const newSnippet: TextSnippet = {
      ...snippet,
      id: `snip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      updatedAt: new Date().toISOString(),
    };

    try {
      await fetch('/api/books/snippet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: viewingBook.id,
          pageId,
          snippet: newSnippet,
          action: 'add',
        }),
      });
      fetchOnlineState();
    } catch (e) {
      setUsers(prev => prev.map(u => {
        if (u.book.id !== viewingBook.id) return u;
        return {
          ...u,
          book: {
            ...u.book,
            pages: u.book.pages.map(p => p.id === pageId ? { ...p, snippets: [...p.snippets, newSnippet] } : p),
          },
        };
      }));
    }
  }, [viewingBook, fetchOnlineState]);

  const updateSnippet = useCallback(async (pageId: string, snippetId: string, text: string) => {
    if (!viewingBook) return;
    try {
      await fetch('/api/books/snippet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: viewingBook.id,
          pageId,
          snippet: { id: snippetId, text },
          action: 'update',
        }),
      });
      fetchOnlineState();
    } catch (e) {
      setUsers(prev => prev.map(u => {
        if (u.book.id !== viewingBook.id) return u;
        return {
          ...u,
          book: {
            ...u.book,
            pages: u.book.pages.map(p => p.id === pageId ? { ...p, snippets: p.snippets.map(s => s.id === snippetId ? { ...s, text } : s) } : p),
          },
        };
      }));
    }
  }, [viewingBook, fetchOnlineState]);

  const deleteSnippet = useCallback(async (pageId: string, snippetId: string) => {
    if (!viewingBook) return;
    try {
      await fetch('/api/books/snippet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: viewingBook.id,
          pageId,
          snippet: { id: snippetId },
          action: 'delete',
        }),
      });
      fetchOnlineState();
    } catch (e) {
      setUsers(prev => prev.map(u => {
        if (u.book.id !== viewingBook.id) return u;
        return {
          ...u,
          book: {
            ...u.book,
            pages: u.book.pages.map(p => p.id === pageId ? { ...p, snippets: p.snippets.filter(s => s.id !== snippetId) } : p),
          },
        };
      }));
    }
  }, [viewingBook, fetchOnlineState]);

  const addNewPage = useCallback(async (bookId: string) => {
    const book = users.find(u => u.book.id === bookId)?.book;
    if (!book) return;
    const nextNum = (book.pages[book.pages.length - 1]?.pageNumber || 0) + 1;
    const newPage: BookPage = {
      id: `page_${Date.now()}_${nextNum}`,
      pageNumber: nextNum,
      title: `Halaman ${nextNum}`,
      snippets: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await fetch('/api/books/page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, newPage }),
      });
      fetchOnlineState();
    } catch (e) {
      setUsers(prev => prev.map(u => {
        if (u.book.id !== bookId) return u;
        return {
          ...u,
          book: {
            ...u.book,
            pages: [...u.book.pages, newPage],
            totalPages: Math.max(u.book.totalPages, nextNum),
          },
        };
      }));
    }

    setActivePageNumber(nextNum);
    setNotificationMessage('Halaman baru berhasil ditambahkan!');
  }, [users, fetchOnlineState]);

  // Tear Page with sound and online sync
  const tearActivePage = useCallback(async (bookId: string, pageId: string) => {
    playPageTearSound();

    try {
      await fetch('/api/books/tear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, pageId }),
      });
      fetchOnlineState();
    } catch (e) {
      setUsers(prev => prev.map(u => {
        if (u.book.id !== bookId) return u;
        const page = u.book.pages.find(p => p.id === pageId);
        if (!page) return u;
        const torn = { ...page, isTorn: true, tornAt: new Date().toISOString() };
        const remain = u.book.pages.filter(p => p.id !== pageId).map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
        return {
          ...u,
          book: {
            ...u.book,
            pages: remain.length > 0 ? remain : [{
              id: `page_${Date.now()}_fresh`,
              pageNumber: 1,
              title: 'Halaman 1',
              snippets: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }],
            tornScraps: [torn, ...(u.book.tornScraps || [])],
          },
        };
      }));
    }

    setActivePageNumber(prev => Math.max(1, prev - 1));
    setNotificationMessage('Halaman telah disobek dan tersimpan di arsip sobekan.');
  }, [fetchOnlineState]);

  // ART / Gallery Actions with Collaborator Tags
  const addPhoto = useCallback(async (url: string, caption: string, collaborators: string[] = []) => {
    if (!currentUserId || !currentUser) return;
    const newPhotoId = `photo_${Date.now()}`;
    const newPhoto: PhotoItem = {
      id: newPhotoId,
      ownerId: currentUserId,
      ownerName: currentUser.name,
      url,
      caption: caption || 'Momen visual',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      rotation: Math.floor(Math.random() * 10) - 5,
      zIndex: Date.now() % 100,
      collaborators,
    };

    try {
      await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo: newPhoto, ownerId: currentUserId }),
      });
      fetchOnlineState();
    } catch (e) {
      setUsers(prev => prev.map(u => {
        if (u.id === currentUserId) {
          return { ...u, photos: [newPhoto, ...u.photos] };
        }
        return u;
      }));
    }

    setLastAddedPhotoId(newPhotoId);
    setNotificationMessage('Foto polaroid berhasil ditambahkan ke Galeri Visual!');
  }, [currentUserId, currentUser, fetchOnlineState]);

  const deletePhoto = useCallback(async (photoId: string): Promise<boolean> => {
    if (!currentUserId) return false;

    try {
      const res = await fetch(`/api/photos/${photoId}?ownerId=${currentUserId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchOnlineState();
        setNotificationMessage('Foto polaroid dihapus.');
        return true;
      }
      const data = await res.json();
      setNotificationMessage(data.error || 'Gagal menghapus foto');
      return false;
    } catch (e) {
      let deleted = false;
      setUsers(prev => prev.map(u => {
        if (u.id === currentUserId && u.photos.some(p => p.id === photoId)) {
          deleted = true;
          return { ...u, photos: u.photos.filter(p => p.id !== photoId) };
        }
        return u;
      }));
      return deleted;
    }
  }, [currentUserId, fetchOnlineState]);

  // The Time / Schedule Actions
  const addSchedule = useCallback(async (item: Omit<ScheduleItem, 'id' | 'ownerId' | 'alarmTriggered' | 'createdAt'>) => {
    if (!currentUserId) return;
    const newSchedule: ScheduleItem = {
      ...item,
      id: `sched_${Date.now()}`,
      ownerId: currentUserId,
      alarmTriggered: false,
      createdAt: new Date().toISOString(),
    };

    try {
      await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: newSchedule, ownerId: currentUserId }),
      });
      fetchOnlineState();
    } catch (e) {
      setUsers(prev => prev.map(u => u.id === currentUserId ? { ...u, schedules: [newSchedule, ...u.schedules] } : u));
    }

    setNotificationMessage(`Jadwal "${item.title}" ditambahkan ke The Time!`);
  }, [currentUserId, fetchOnlineState]);

  const toggleScheduleAlarm = useCallback(async (id: string) => {
    if (!currentUser || !currentUserId) return;
    const sched = currentUser.schedules?.find(s => s.id === id);
    if (!sched) return;

    try {
      await fetch('/api/schedules/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId: id,
          ownerId: currentUserId,
          updates: { alarmEnabled: !sched.alarmEnabled },
        }),
      });
      fetchOnlineState();
    } catch (e) {
      setUsers(prev => prev.map(u => u.id === currentUserId ? {
        ...u,
        schedules: u.schedules.map(s => s.id === id ? { ...s, alarmEnabled: !s.alarmEnabled } : s),
      } : u));
    }
  }, [currentUser, currentUserId, fetchOnlineState]);

  const toggleScheduleComplete = useCallback(async (id: string) => {
    if (!currentUser || !currentUserId) return;
    const sched = currentUser.schedules?.find(s => s.id === id);
    if (!sched) return;

    try {
      await fetch('/api/schedules/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId: id,
          ownerId: currentUserId,
          updates: { completed: !sched.completed },
        }),
      });
      fetchOnlineState();
    } catch (e) {
      setUsers(prev => prev.map(u => u.id === currentUserId ? {
        ...u,
        schedules: u.schedules.map(s => s.id === id ? { ...s, completed: !s.completed } : s),
      } : u));
    }
  }, [currentUser, currentUserId, fetchOnlineState]);

  const deleteSchedule = useCallback(async (id: string): Promise<boolean> => {
    if (!currentUserId) return false;

    try {
      const res = await fetch(`/api/schedules/${id}?ownerId=${currentUserId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchOnlineState();
        setNotificationMessage('Jadwal berhasil dihapus.');
        return true;
      }
      return false;
    } catch (e) {
      let deleted = false;
      setUsers(prev => prev.map(u => {
        if (u.id === currentUserId) {
          deleted = true;
          return { ...u, schedules: u.schedules.filter(s => s.id !== id) };
        }
        return u;
      }));
      return deleted;
    }
  }, [currentUserId, fetchOnlineState]);

  // Alarm Sound Loop
  useEffect(() => {
    const checkAlarms = () => {
      if (ringingAlarm || !currentUser) return;

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
      const currentDay = String(now.getDate()).padStart(2, '0');
      const todayStr = `${currentYear}-${currentMonth}-${currentDay}`;
      const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      for (const sched of (currentUser.schedules || [])) {
        if (
          sched.alarmEnabled && 
          !sched.alarmTriggered && 
          !sched.completed && 
          sched.date === todayStr &&
          sched.time === currentTimeStr
        ) {
          setRingingAlarm(sched);
          startAlarmChime();
          // Update triggered status
          if (currentUserId) {
            fetch('/api/schedules/update', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                scheduleId: sched.id,
                ownerId: currentUserId,
                updates: { alarmTriggered: true },
              }),
            }).catch(() => {});
          }
          break;
        }
      }
    };

    const interval = setInterval(checkAlarms, 6000);
    return () => clearInterval(interval);
  }, [currentUser, currentUserId, ringingAlarm]);

  const dismissAlarm = useCallback(() => {
    stopAlarmChime();
    setRingingAlarm(null);
  }, []);

  const snoozeAlarm = useCallback((minutes: number) => {
    stopAlarmChime();
    if (!ringingAlarm || !currentUserId) return;

    const [h, m] = ringingAlarm.time.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + minutes);
    const newTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

    fetch('/api/schedules/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scheduleId: ringingAlarm.id,
        ownerId: currentUserId,
        updates: { time: newTime, alarmTriggered: false, alarmEnabled: true },
      }),
    }).catch(() => {});

    setRingingAlarm(null);
    setNotificationMessage(`Alarm ditunda ${minutes} menit hingga ${newTime}.`);
  }, [ringingAlarm, currentUserId]);

  const testAlarm = useCallback(() => {
    const mockSched: ScheduleItem = {
      id: 'test_alarm',
      ownerId: currentUserId || 'guest',
      title: 'Uji Lonceng Alarm The Time',
      description: 'Tes notifikasi audio dan pop-up pengingat ZAINORA Archive.',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      category: 'penting',
      alarmEnabled: true,
      alarmTriggered: true,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setRingingAlarm(mockSched);
    startAlarmChime();
  }, [currentUserId]);

  const pendingRequestsCount = useMemo(() => {
    return currentUser?.permissionRequests?.filter(r => r.status === 'pending').length || 0;
  }, [currentUser]);

  return (
    <AppContext.Provider
      value={{
        users,
        currentUserId,
        currentUser,
        activeTab,
        setActiveTab,
        switchUser,
        createUserAccount,
        viewingBook,
        setViewingBook,
        canViewBook,
        canModifyBook,
        requestBookAccess,
        respondPermissionRequest,
        deleteBook,
        activePageNumber,
        setActivePageNumber,
        addSnippetToPage,
        updateSnippet,
        deleteSnippet,
        addNewPage,
        tearActivePage,
        addPhoto,
        deletePhoto,
        canModifyPhoto,
        lastAddedPhotoId,
        addSchedule,
        toggleScheduleAlarm,
        toggleScheduleComplete,
        deleteSchedule,
        testAlarm,
        ringingAlarm,
        dismissAlarm,
        snoozeAlarm,
        pendingRequestsCount,
        notificationMessage,
        clearNotification,
        isOnline,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
