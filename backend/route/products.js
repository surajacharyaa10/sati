import express from 'express';
import { getAllProducts, getProductById } from '../services/productService.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json(getAllProducts());
});

router.get('/:id', (req, res) => {
  const product = getProductById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
});

export default router;
