import express from 'express';
import { authenticate } from '../services/session.js';
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  toggleWishlistItem,
} from '../services/wishlistService.js';

const router = express.Router();

router.use(authenticate);

router.get('/me', async (req, res, next) => {
  try {
    res.json(await getWishlist(req.authUserId));
  } catch (error) {
    next(error);
  }
});

router.post('/me', async (req, res, next) => {
  const { productId } = req.body ?? {};
  if (typeof productId !== 'string' || !productId.trim()) {
    return res.status(400).json({ error: 'productId required' });
  }

  try {
    res.json(await addToWishlist(req.authUserId, productId.trim()));
  } catch (error) {
    next(error);
  }
});

router.post('/me/toggle', async (req, res, next) => {
  const { productId } = req.body ?? {};
  if (typeof productId !== 'string' || !productId.trim()) {
    return res.status(400).json({ error: 'productId required' });
  }

  try {
    res.json(await toggleWishlistItem(req.authUserId, productId.trim()));
  } catch (error) {
    next(error);
  }
});

router.delete('/me/:productId', async (req, res, next) => {
  try {
    res.json(await removeFromWishlist(req.authUserId, req.params.productId));
  } catch (error) {
    next(error);
  }
});

export default router;
