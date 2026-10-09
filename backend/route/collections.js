import express from 'express';
import {
  getAllCollections,
  getCollectionByKind,
  upsertCollection,
  deleteCollection,
} from '../services/collectionService.js';

const router = express.Router();

const VALID_KINDS = ['arrivals', 'women', 'men', 'sale'];
const VALID_TONES = ['cream', 'orange'];

router.get('/', async (req, res, next) => {
  try {
    const collections = await getAllCollections();
    return res.json(collections);
  } catch (error) {
    return next(error);
  }
});

router.get('/:kind', async (req, res, next) => {
  try {
    if (!VALID_KINDS.includes(req.params.kind)) {
      return res.status(400).json({ error: 'Invalid collection kind' });
    }
    const collection = await getCollectionByKind(req.params.kind);
    if (!collection) return res.status(404).json({ error: 'Not found' });
    return res.json(collection);
  } catch (error) {
    return next(error);
  }
});

router.put('/:kind', async (req, res, next) => {
  try {
    if (!VALID_KINDS.includes(req.params.kind)) {
      return res.status(400).json({ error: 'Invalid collection kind' });
    }
    const { eyebrow, title, description, image, imageAlt, imageLabel, tone } = req.body;
    if (tone && !VALID_TONES.includes(tone)) {
      return res.status(400).json({ error: 'Invalid tone' });
    }
    const updated = await upsertCollection(req.params.kind, {
      ...(eyebrow !== undefined && { eyebrow }),
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(image !== undefined && { image }),
      ...(imageAlt !== undefined && { imageAlt }),
      ...(imageLabel !== undefined && { imageLabel }),
      ...(tone !== undefined && { tone }),
    });
    return res.json(updated);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    return next(error);
  }
});

router.delete('/:kind', async (req, res, next) => {
  try {
    if (!VALID_KINDS.includes(req.params.kind)) {
      return res.status(400).json({ error: 'Invalid collection kind' });
    }
    const removed = await deleteCollection(req.params.kind);
    if (!removed) return res.status(404).json({ error: 'Not found' });
    return res.json(removed);
  } catch (error) {
    return next(error);
  }
});

export default router;