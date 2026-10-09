import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      required: true,
      enum: ['arrivals', 'women', 'men', 'sale'],
      unique: true,
    },
    eyebrow: {
      type: String,
      required: true,
      trim: true,
      maxlength: 64,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 400,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
    imageAlt: {
      type: String,
      required: true,
      trim: true,
      maxlength: 240,
    },
    imageLabel: {
      type: String,
      required: true,
      trim: true,
      maxlength: 64,
    },
    tone: {
      type: String,
      required: true,
      enum: ['cream', 'orange'],
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    versionKey: false,
    toJSON: {
      transform(_doc, collection) {
        collection.id = collection._id;
        delete collection._id;
        return collection;
      },
    },
  },
);

collectionSchema.index({ kind: 1 });

const Collection =
  mongoose.models.Collection || mongoose.model('Collection', collectionSchema);

export default Collection;