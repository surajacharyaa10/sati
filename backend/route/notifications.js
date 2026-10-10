import express from 'express';
import {
  getAllNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  deleteNotification,
} from '../services/notificationService.js';
import { authenticate, requireAdmin } from '../services/session.js';
import { notificationUpload, saveNotificationImage } from '../services/notificationImage.js';

const router = express.Router();

// ── Public: list active notifications (used by the client storefront) ──────
router.get('/', async (req, res, next) => {
  try {
    const notifications = await getAllNotifications({ activeOnly: true });
    return res.json(notifications);
  } catch (error) {
    return next(error);
  }
});

// ── Admin: list ALL notifications (including inactive) ─────────────────────
router.get('/all', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const notifications = await getAllNotifications({ activeOnly: false });
    return res.json(notifications);
  } catch (error) {
    return next(error);
  }
});

// ── Admin: upload a notification image ────────────────────────────────────
router.post(
  '/upload',
  authenticate,
  requireAdmin,
  notificationUpload.single('image'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }
      const result = await saveNotificationImage(req.file.buffer);
      return res.json({ url: result.url });
    } catch (error) {
      if (error.code === 'INVALID_IMAGE') {
        return res.status(400).json({ error: error.message });
      }
      return next(error);
    }
  },
);

// ── Admin: create a notification ──────────────────────────────────────────
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { title, text, image, imageAlt, type, active } = req.body;
    if (!title || !text) {
      return res.status(400).json({ error: 'title and text are required' });
    }
    const notification = await createNotification({ title, text, image, imageAlt, type, active });
    return res.status(201).json(notification);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    return next(error);
  }
});

// ── Admin: get a single notification ─────────────────────────────────────
router.get('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const notification = await getNotificationById(req.params.id);
    if (!notification) return res.status(404).json({ error: 'Not found' });
    return res.json(notification);
  } catch (error) {
    return next(error);
  }
});

// ── Admin: update a notification ──────────────────────────────────────────
router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { title, text, image, imageAlt, type, active } = req.body;
    const notification = await updateNotification(req.params.id, {
      title, text, image, imageAlt, type, active,
    });
    if (!notification) return res.status(404).json({ error: 'Not found' });
    return res.json(notification);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    return next(error);
  }
});

// ── Admin: delete a notification ──────────────────────────────────────────
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const notification = await deleteNotification(req.params.id);
    if (!notification) return res.status(404).json({ error: 'Not found' });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

export default router;
