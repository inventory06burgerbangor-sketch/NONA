import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Increase body parser limit for photo uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Persistent DB File Path
const DB_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

// Initial state has NO dummy users as requested: "Kosongkan semua usernya, jangan Ada Dummy User."
let dbState: { users: any[] } = {
  users: [],
};

// Ensure data folder and load existing data if present
try {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.users)) {
      dbState = parsed;
    }
  } else {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2));
  }
} catch (e) {
  console.error('Error initializing db file:', e);
}

function persistState() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2));
  } catch (err) {
    console.error('Error persisting state:', err);
  }
}

// REST API for Real-time Online Sync
app.get('/api/state', (req, res) => {
  res.json({ users: dbState.users });
});

// Create User
app.post('/api/users', (req, res) => {
  const newUser = req.body;
  if (!newUser || !newUser.id) {
    return res.status(400).json({ error: 'Data user tidak valid' });
  }
  dbState.users.push(newUser);
  persistState();
  res.json({ success: true, user: newUser, users: dbState.users });
});

// Add / Update Book Page
app.post('/api/books/page', (req, res) => {
  const { bookId, newPage } = req.body;
  const user = dbState.users.find(u => u.book?.id === bookId);
  if (!user) return res.status(404).json({ error: 'Buku tidak ditemukan' });

  user.book.pages.push(newPage);
  user.book.totalPages = Math.max(user.book.totalPages, user.book.pages.length);
  persistState();
  res.json({ success: true, users: dbState.users });
});

// Add / Edit / Delete Snippet
app.post('/api/books/snippet', (req, res) => {
  const { bookId, pageId, snippet, action } = req.body;
  const user = dbState.users.find(u => u.book?.id === bookId);
  if (!user) return res.status(404).json({ error: 'Buku tidak ditemukan' });

  const page = user.book.pages.find((p: any) => p.id === pageId);
  if (!page) return res.status(404).json({ error: 'Halaman tidak ditemukan' });

  if (action === 'add') {
    page.snippets.push(snippet);
  } else if (action === 'update') {
    page.snippets = page.snippets.map((s: any) => s.id === snippet.id ? { ...s, ...snippet } : s);
  } else if (action === 'delete') {
    page.snippets = page.snippets.filter((s: any) => s.id !== snippet.id);
  }
  page.updatedAt = new Date().toISOString();
  persistState();
  res.json({ success: true, users: dbState.users });
});

// Tear Page
app.post('/api/books/tear', (req, res) => {
  const { bookId, pageId } = req.body;
  const user = dbState.users.find(u => u.book?.id === bookId);
  if (!user) return res.status(404).json({ error: 'Buku tidak ditemukan' });

  const pageIndex = user.book.pages.findIndex((p: any) => p.id === pageId);
  if (pageIndex === -1) return res.status(404).json({ error: 'Halaman tidak ditemukan' });

  const tornPage = { ...user.book.pages[pageIndex], isTorn: true, tornAt: new Date().toISOString() };
  user.book.pages.splice(pageIndex, 1);
  // Re-index remaining pages
  user.book.pages.forEach((p: any, idx: number) => {
    p.pageNumber = idx + 1;
  });
  if (!user.book.tornScraps) user.book.tornScraps = [];
  user.book.tornScraps.unshift(tornPage);

  persistState();
  res.json({ success: true, users: dbState.users });
});

// Delete / Reset Book (Owner only)
app.post('/api/books/delete', (req, res) => {
  const { bookId, ownerId } = req.body;
  const user = dbState.users.find(u => u.book?.id === bookId);
  if (!user) return res.status(404).json({ error: 'Buku tidak ditemukan' });
  if (user.id !== ownerId) return res.status(403).json({ error: 'Tidak berhak menghapus buku orang lain' });

  user.book.pages = [
    {
      id: `page_${Date.now()}_empty`,
      pageNumber: 1,
      title: 'Halaman 1',
      snippets: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];
  user.book.tornScraps = [];
  persistState();
  res.json({ success: true, users: dbState.users });
});

// Photos: Add with Collaborator Tags
app.post('/api/photos', (req, res) => {
  const { photo, ownerId } = req.body;
  const user = dbState.users.find(u => u.id === ownerId);
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

  if (!user.photos) user.photos = [];
  user.photos.unshift(photo);
  persistState();
  res.json({ success: true, users: dbState.users });
});

// Photos: Delete (Owner only)
app.delete('/api/photos/:id', (req, res) => {
  const photoId = req.params.id;
  const ownerId = req.query.ownerId as string;

  let deleted = false;
  dbState.users.forEach(u => {
    const idx = (u.photos || []).findIndex((p: any) => p.id === photoId);
    if (idx !== -1) {
      if (u.id === ownerId) {
        u.photos.splice(idx, 1);
        deleted = true;
      }
    }
  });

  if (!deleted) {
    return res.status(403).json({ error: 'Hanya pemilik foto yang dapat menghapus' });
  }

  persistState();
  res.json({ success: true, users: dbState.users });
});

// Schedules: Add
app.post('/api/schedules', (req, res) => {
  const { schedule, ownerId } = req.body;
  const user = dbState.users.find(u => u.id === ownerId);
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

  if (!user.schedules) user.schedules = [];
  user.schedules.unshift(schedule);
  persistState();
  res.json({ success: true, users: dbState.users });
});

// Schedules: Toggle Alarm / Complete
app.post('/api/schedules/update', (req, res) => {
  const { scheduleId, ownerId, updates } = req.body;
  const user = dbState.users.find(u => u.id === ownerId);
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

  user.schedules = (user.schedules || []).map((s: any) => s.id === scheduleId ? { ...s, ...updates } : s);
  persistState();
  res.json({ success: true, users: dbState.users });
});

// Schedules: Delete (Owner only)
app.delete('/api/schedules/:id', (req, res) => {
  const scheduleId = req.params.id;
  const ownerId = req.query.ownerId as string;

  const user = dbState.users.find(u => u.id === ownerId);
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

  user.schedules = (user.schedules || []).filter((s: any) => s.id !== scheduleId);
  persistState();
  res.json({ success: true, users: dbState.users });
});

// Permissions: Request
app.post('/api/permissions/request', (req, res) => {
  const { request } = req.body;
  const targetUser = dbState.users.find(u => u.id === request.targetOwnerId);
  const requester = dbState.users.find(u => u.id === request.requesterId);

  if (!targetUser || !requester) return res.status(404).json({ error: 'User tidak ditemukan' });

  if (!targetUser.permissionRequests) targetUser.permissionRequests = [];
  targetUser.permissionRequests.unshift(request);

  if (!requester.sentRequests) requester.sentRequests = [];
  requester.sentRequests.unshift(request);

  persistState();
  res.json({ success: true, users: dbState.users });
});

// Permissions: Respond
app.post('/api/permissions/respond', (req, res) => {
  const { requestId, targetOwnerId, approve } = req.body;
  const targetUser = dbState.users.find(u => u.id === targetOwnerId);
  if (!targetUser) return res.status(404).json({ error: 'User tidak ditemukan' });

  const reqObj = (targetUser.permissionRequests || []).find((r: any) => r.id === requestId);
  if (!reqObj) return res.status(404).json({ error: 'Permintaan tidak ditemukan' });

  reqObj.status = approve ? 'approved' : 'denied';
  reqObj.respondedAt = new Date().toISOString();

  if (approve) {
    if (!targetUser.allowedViewerIds) targetUser.allowedViewerIds = [];
    if (!targetUser.allowedViewerIds.includes(reqObj.requesterId)) {
      targetUser.allowedViewerIds.push(reqObj.requesterId);
    }
  }

  // Update in requester's sent requests
  const requester = dbState.users.find(u => u.id === reqObj.requesterId);
  if (requester && requester.sentRequests) {
    const sReq = requester.sentRequests.find((r: any) => r.id === requestId);
    if (sReq) {
      sReq.status = approve ? 'approved' : 'denied';
      sReq.respondedAt = reqObj.respondedAt;
    }
  }

  persistState();
  res.json({ success: true, users: dbState.users });
});

// Mount Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production build
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ZAINORA Archive server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
