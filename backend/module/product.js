import mongoose from 'mongoose';

const BADGES = ['New', 'Limited', 'Bestseller', 'Sale'];
const AUDIENCES = ['Women', 'Men'];
const CATEGORIES = ['Sets', 'Dresses', 'Outerwear', 'Tops'];

const productSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 64,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 120,
    },
    audience: {
      type: String,
      required: true,
      enum: AUDIENCES,
    },
    category: {
      type: String,
      required: true,
      enum: CATEGORIES,
    },
    details: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000,
    },
    material: {
      type: String,
      default: '',
      trim: true,
      maxlength: 240,
    },
    fit: {
      type: String,
      default: '',
      trim: true,
      maxlength: 240,
    },
    sizes: {
      type: [String],
      default: [],
    },
    colors: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
      default: undefined,
      min: 0,
    },
    label: {
      type: String,
      required: true,
      enum: BADGES,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
    alt: {
      type: String,
      required: true,
      trim: true,
      maxlength: 240,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    versionKey: false,
    toJSON: {
      transform(_document, product) {
        product.id = product._id;
        delete product._id;
        if (product.originalPrice === undefined) delete product.originalPrice;
        return product;
      },
    },
  },
);

productSchema.index({ audience: 1, category: 1 });
productSchema.index({ label: 1 });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export const productEnums = { BADGES, AUDIENCES, CATEGORIES };

export default Product;
