import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectDB from './services/db.js';
import authRoutes from './route/auth.js';
import userRoutes from './route/user.js';
import productRoutes from './route/products.js';
import collectionRoutes from './route/collections.js';
import wishlistRoutes from './route/wishlist.js';
import cartRoutes from './route/cart.js';
import orderRoutes from './route/orders.js';
import journalRoutes from './route/journal.js';
import notificationRoutes from './route/notifications.js';
import chatRoutes from './route/chat.js';

dotenv.config();

const app = express();

const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  process.env.ADMIN_ORIGIN,
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()) : []),
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    try {
      const url = new URL(origin);
      if (
        url.hostname.endsWith('.vercel.app') ||
        url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1'
      ) {
        return callback(null, true);
      }
    } catch {
      // ignore parse errors
    }
    return callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Global error handler for unhandled async rejections in Express 5
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = Number(process.env.API_PORT) || 5001;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});

export default app;
