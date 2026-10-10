import mongoose from 'mongoose';

const journalSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    category: { type: String, required: true },
    title: { type: String, required: true },
    summary: { type: String, required: true },
    readTime: { type: String, required: true },
    image: { type: String, required: true },
    alt: { type: String, required: true },
    paragraphs: [{ type: String }],
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model('Journal', journalSchema);