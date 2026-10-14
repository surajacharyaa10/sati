import mongoose from 'mongoose';

const siteContactSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      default: 'Thamel 327, Kathmandu, Nepal',
      trim: true,
    },
    phone: {
      type: String,
      default: '+977 9801475272',
      trim: true,
    },
    gmail: {
      type: String,
      default: 'surajacharya239@gmail.com',
      trim: true,
      lowercase: true,
    },
    availabilityStatus: {
      type: String,
      default: 'Available for bespoke consultation & orders',
      trim: true,
    },
    availabilityDescription: {
      type: String,
      default: 'Our atelier is open for bespoke fittings, styling consultations, and global order fulfillment.',
      trim: true,
    },
    socialLinks: {
      instagram: {
        type: String,
        default: 'https://instagram.com/sati_atelier',
        trim: true,
      },
      facebook: {
        type: String,
        default: 'https://facebook.com/sati.atelier',
        trim: true,
      },
      tiktok: {
        type: String,
        default: 'https://tiktok.com/@sati_atelier',
        trim: true,
      },
      whatsapp: {
        type: String,
        default: '+9779801475272',
        trim: true,
      },
      pinterest: {
        type: String,
        default: 'https://pinterest.com/sati_atelier',
        trim: true,
      },
      youtube: {
        type: String,
        default: '',
        trim: true,
      },
    },
  },
  { timestamps: true, versionKey: false }
);

const SiteContact =
  mongoose.models.SiteContact || mongoose.model('SiteContact', siteContactSchema);

export default SiteContact;
