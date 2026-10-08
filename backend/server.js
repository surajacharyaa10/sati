import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './services/db.js';
import userRoutes from './route/user.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const PORT = 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});