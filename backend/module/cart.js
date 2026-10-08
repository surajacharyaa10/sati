import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 99,
    },
    size: {
      type: String,
      default: undefined,
      trim: true,
      maxlength: 20,
    },
    color: {
      type: String,
      default: undefined,
      trim: true,
      maxlength: 40,
    },
  },
  { _id: false },
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_document, cart) {
        delete cart.__v;
        delete cart._id;
        return cart;
      },
    },
  },
);

const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);

export default Cart;
