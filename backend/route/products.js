import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../services/productService.js';
import { productEnums } from '../module/product.js';
import { authenticate, requireAdmin } from '../services/session.js';
import { productUpload, saveProductImage } from '../services/productImage.js';

const router = express.Router();

const isEnum = (value, allowed) => typeof value === 'string' && allowed.includes(value);

// Public catalog
router.get('/', async (req, res, next) => {
  try {
    const { audience, category, label } = req.query;
    for (const [key, allowed] of [
      ['audience', productEnums.AUDIENCES],
      ['category', productEnums.CATEGORIES],
      ['label', productEnums.BADGES],
    ]) {
      if (key in req.query && !isEnum(req.query[key], allowed)) {
        return res.status(400).json({ error: `Invalid ${key} filter` });
      }
    }

    const products = await getAllProducts({ audience, category, label });
    return res.json(products);
  } catch (error) {
    return next(error);
  }
});

// Admin: upload a product photo
router.post('/upload', authenticate, requireAdmin, productUpload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    const result = await saveProductImage(req.file.buffer);
    return res.json({ url: result.url });
  } catch (error) {
    if (error.code === 'INVALID_IMAGE') {
      return res.status(400).json({ error: error.message });
    }
    return next(error);
  }
});

// Admin: create a product
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const created = await createProduct(req.body);
    return res.status(201).json(created);
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ error: error.message });
    }
    return next(error);
  }
});

// Public: single product
router.get('/:id', async (req, res, next) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Not found' });
    return res.json(product);
  } catch (error) {
    return next(error);
  }
});

// Admin: update a product
router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const updated = await updateProduct(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    return res.json(updated);
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ error: error.message });
    }
    return next(error);
  }
});

// Admin: delete a product
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const removed = await deleteProduct(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Not found' });
    return res.json(removed);
  } catch (error) {
    return next(error);
  }
});

export default router;