import express from 'express';
import {
  getAllJournalPosts,
  getJournalPostBySlug,
  createJournalPost,
  updateJournalPost,
  deleteJournalPost,
} from '../services/journalService.js';
import { authenticate, requireAdmin } from '../services/session.js';
import { journalUpload, saveJournalImage } from '../services/journalImage.js';

const router = express.Router();

// Public routes
router.get('/', async (req, res, next) => {
  try {
    const posts = await getAllJournalPosts();
    return res.json(posts);
  } catch (error) {
    return next(error);
  }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const post = await getJournalPostBySlug(req.params.slug);
    if (!post) return res.status(404).json({ error: 'Not found' });
    return res.json(post);
  } catch (error) {
    return next(error);
  }
});

// Admin routes (require authentication + admin role)
router.post('/upload', authenticate, requireAdmin, journalUpload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    const result = await saveJournalImage(req.file.buffer);
    return res.json({ url: result.url });
  } catch (error) {
    if (error.code === 'INVALID_IMAGE') {
      return res.status(400).json({ error: error.message });
    }
    return next(error);
  }
});

router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { slug, category, title, summary, readTime, image, alt, paragraphs } = req.body;
    if (!slug || !category || !title || !summary || !readTime || !image || !alt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const post = await createJournalPost({ slug, category, title, summary, readTime, image, alt, paragraphs });
    return res.status(201).json(post);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Slug already exists' });
    }
    return next(error);
  }
});

router.put('/:slug', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { category, title, summary, readTime, image, alt, paragraphs } = req.body;
    const post = await updateJournalPost(req.params.slug, { category, title, summary, readTime, image, alt, paragraphs });
    if (!post) return res.status(404).json({ error: 'Not found' });
    return res.json(post);
  } catch (error) {
    return next(error);
  }
});

router.delete('/:slug', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const post = await deleteJournalPost(req.params.slug);
    if (!post) return res.status(404).json({ error: 'Not found' });
    return res.json(post);
  } catch (error) {
    return next(error);
  }
});

export default router;