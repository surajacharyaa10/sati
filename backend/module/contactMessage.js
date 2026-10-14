import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema(
  {
    from_name: {
      type: String,
      required: true,
      trim: true,
    },
    from_email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    from_phone: {
      type: String,
      trim: true,
      default: '',
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['unread', 'read', 'replied'],
      default: 'unread',
    },
  },
  { timestamps: true, versionKey: false }
);

const ContactMessage =
  mongoose.models.ContactMessage ||
  mongoose.model('ContactMessage', contactMessageSchema);

export default ContactMessage;
