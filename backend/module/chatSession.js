import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ['customer', 'admin'],
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
    // optional: read receipt for admin messages
    readByCustomer: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, _id: true, versionKey: false }
);

const chatSessionSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      index: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 150,
    },
    userId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'closed'],
      default: 'active',
      index: true,
    },
    messages: [messageSchema],
    // track last admin reply time so we can show "Admin replied" badge
    lastAdminReply: {
      type: Date,
      default: null,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
);

chatSessionSchema.index({ lastActivity: -1 });

const ChatSession =
  mongoose.models.ChatSession ||
  mongoose.model('ChatSession', chatSessionSchema);

export default ChatSession;
