import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      enum: ['Nepal', 'UK'],
      default: 'Nepal',
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    currency: {
      type: String,
      enum: ['NPR', 'GBP'],
      default: 'NPR',
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600, // Automatically delete documents after 10 minutes (600 seconds)
    },
  },
  { versionKey: false },
);

const Otp = mongoose.models.Otp || mongoose.model('Otp', otpSchema);

export default Otp;
