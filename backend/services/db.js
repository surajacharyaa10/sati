import mongoose from 'mongoose';
import { seedCollectionsIfEmpty } from './collectionService.js';
import { seedJournalIfEmpty } from './journalService.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('MongoDB connected successfully');

    // Seed collections and journal if empty
    await seedCollectionsIfEmpty();
    await seedJournalIfEmpty();
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

export default connectDB;