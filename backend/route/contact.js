import express from 'express';
import SiteContact from '../module/siteContact.js';
import ContactMessage from '../module/contactMessage.js';
import { authenticate, requireAdmin } from '../services/session.js';
import { sendContactNotificationEmail } from '../services/emailService.js';

const router = express.Router();

const DEFAULT_CONTACT = {
  address: 'Thamel 327, Kathmandu, Nepal',
  phone: '+977 9801475272',
  gmail: 'surajacharya239@gmail.com',
  availabilityStatus: 'Available for Bespoke Consultation & Orders',
  availabilityDescription:
    'Our atelier is open for bespoke fittings, custom tailoring, and global order fulfillment. Reach out directly or send us an inquiry.',
  socialLinks: {
    instagram: 'https://instagram.com/sati_atelier',
    facebook: 'https://facebook.com/sati.atelier',
    tiktok: 'https://tiktok.com/@sati_atelier',
    whatsapp: '+9779801475272',
    pinterest: 'https://pinterest.com/sati_atelier',
    youtube: '',
  },
};

// GET /api/contact - Public: retrieve current contact & social media info
router.get('/', async (_req, res, next) => {
  try {
    let contact = await SiteContact.findOne().lean();
    if (!contact) {
      contact = await SiteContact.create(DEFAULT_CONTACT);
    }
    return res.json(contact);
  } catch (error) {
    return next(error);
  }
});

// PUT /api/contact - Admin: update contact & social media settings
router.put('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const {
      address,
      phone,
      gmail,
      availabilityStatus,
      availabilityDescription,
      socialLinks,
    } = req.body;

    const updateData = {};
    if (address !== undefined) updateData.address = String(address).trim();
    if (phone !== undefined) updateData.phone = String(phone).trim();
    if (gmail !== undefined) updateData.gmail = String(gmail).trim().toLowerCase();
    if (availabilityStatus !== undefined)
      updateData.availabilityStatus = String(availabilityStatus).trim();
    if (availabilityDescription !== undefined)
      updateData.availabilityDescription = String(availabilityDescription).trim();

    if (socialLinks && typeof socialLinks === 'object') {
      updateData.socialLinks = {
        instagram: String(socialLinks.instagram || '').trim(),
        facebook: String(socialLinks.facebook || '').trim(),
        tiktok: String(socialLinks.tiktok || '').trim(),
        whatsapp: String(socialLinks.whatsapp || '').trim(),
        pinterest: String(socialLinks.pinterest || '').trim(),
        youtube: String(socialLinks.youtube || '').trim(),
      };
    }

    let contact = await SiteContact.findOneAndUpdate(
      {},
      { $set: updateData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.json(contact);
  } catch (error) {
    return next(error);
  }
});

// POST /api/contact/send - Public: Submit contact form, call EmailJS from backend, save in DB
router.post('/send', async (req, res, next) => {
  try {
    const { from_name, from_email, from_phone, message } = req.body;

    if (!from_name || !from_name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!from_email || !from_email.trim() || !from_email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    // 1. Store message in database
    const savedMessage = await ContactMessage.create({
      from_name: from_name.trim(),
      from_email: from_email.trim(),
      from_phone: (from_phone || '').trim(),
      message: message.trim(),
      status: 'unread',
    });

    // 2. Fetch site contact email for recipient
    const siteContact = await SiteContact.findOne().lean();
    const recipientEmail = siteContact?.gmail || process.env.ADMIN_EMAIL || 'surajacharya239@gmail.com';

    // 3. Call EmailJS REST API from backend
    const serviceId = process.env.EMAILJS_SERVICE_ID || 'service_6azqnjb';
    const templateId = process.env.EMAILJS_TEMPLATE_ID || 'template_ie0803q';
    const publicKey = process.env.EMAILJS_PUBLIC_KEY || 'hhvE1Wq3yZ6l1CahC';

    let emailJsSuccess = false;
    try {
      const emailJsResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SatiAtelier-Backend/1.0',
        },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: {
            from_name: from_name.trim(),
            from_email: from_email.trim(),
            from_phone: (from_phone || 'Not provided').trim(),
            message: message.trim(),
            reply_to: from_email.trim(),
            to_email: recipientEmail,
            to_name: 'SATI Atelier',
          },
        }),
      });

      if (emailJsResponse.ok) {
        emailJsSuccess = true;
      } else {
        const errorText = await emailJsResponse.text();
        console.warn('EmailJS response was not OK:', errorText);
      }
    } catch (emailErr) {
      console.warn('Failed calling EmailJS REST API:', emailErr.message);
    }

    // 4. Send fallback / notification email via nodemailer
    try {
      await sendContactNotificationEmail({
        from_name: from_name.trim(),
        from_email: from_email.trim(),
        from_phone: (from_phone || '').trim(),
        message: message.trim(),
        recipientEmail,
      });
    } catch (nodemailerErr) {
      console.warn('Nodemailer notification warning:', nodemailerErr.message);
    }

    return res.json({
      success: true,
      message: 'Message sent successfully!',
      data: {
        id: savedMessage._id,
        emailJsSent: emailJsSuccess,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/contact/messages - Admin: view all submitted contact messages
router.get('/messages', authenticate, requireAdmin, async (_req, res, next) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 }).lean();
    return res.json(messages);
  } catch (error) {
    return next(error);
  }
});

// PATCH /api/contact/messages/:id - Admin: update message status
router.patch('/messages/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['unread', 'read', 'replied'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const updated = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Message not found' });
    }
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/contact/messages/:id - Admin: delete a contact message
router.delete('/messages/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const deleted = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Message not found' });
    }
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

export default router;
