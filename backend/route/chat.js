import express from 'express';
import { authenticate, requireAdmin } from '../services/session.js';
import Inquiry from '../module/inquiry.js';
import ChatSession from '../module/chatSession.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// AI ROUTE  (unchanged)
// POST /api/chat  – AI product assistant (public)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { messages, productContext } = req.body ?? {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'AI service not configured' });
    }

    const systemPrompt = productContext
      ? `You are a friendly, knowledgeable shopping assistant for SATI — a premium fashion brand.
You are helping a customer exclusively about the following product:

Product: ${productContext.name}
Category: ${productContext.category ?? 'N/A'}
Audience: ${productContext.audience ?? 'N/A'}
Material: ${productContext.material ?? 'N/A'}
Fit: ${productContext.fit ?? 'N/A'}
Sizes: ${(productContext.sizes ?? []).join(', ')}
Colors: ${(productContext.colors ?? []).join(', ')}
Price: ₹${productContext.price ?? 'N/A'}
${productContext.originalPrice ? `Original Price: ₹${productContext.originalPrice}` : ''}
Description: ${productContext.description ?? ''}
Details: ${productContext.details ?? ''}

Rules:
- Only answer questions relevant to THIS product or general SATI store policies (shipping, returns).
- For complex queries (custom tailoring, bulk orders), suggest switching to "Live Chat with Admin".
- Keep responses concise (2-4 sentences or short bullet points). Use markdown for emphasis.
- Never hallucinate product details; only use what is given above.
- Be warm, premium, and professional in tone.`
      : `You are a helpful assistant for SATI fashion brand. Be concise and professional.`;

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: systemPrompt }, ...messages.slice(-10)],
        max_tokens: 350,
        temperature: 0.7,
      }),
    });

    if (!groqResponse.ok) {
      const errBody = await groqResponse.json().catch(() => ({}));
      console.error('Groq API error:', groqResponse.status, errBody);
      return res.status(502).json({ error: 'AI service error. Please try again.' });
    }

    const data = await groqResponse.json();
    const reply = data.choices?.[0]?.message?.content ?? '';
    return res.json({ reply });
  } catch (error) {
    return next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// LIVE CHAT SESSIONS  (customer-facing, no auth required)
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/chat/sessions
// Create a new live-chat session with the first customer message.
// Body: { productId, productName, customerName, customerEmail, message, userId? }
// Returns the full session (incl. _id which the client stores as sessionId)
router.post('/sessions', async (req, res, next) => {
  try {
    const { productId, productName, customerName, customerEmail, message, userId } =
      req.body ?? {};

    if (!productId || !customerName || !customerEmail || !message) {
      return res.status(400).json({
        error: 'productId, customerName, customerEmail, and message are required',
      });
    }

    const session = await ChatSession.create({
      productId: String(productId).trim(),
      productName: String(productName ?? productId).trim(),
      customerName: String(customerName).trim(),
      customerEmail: String(customerEmail).trim().toLowerCase(),
      userId: userId || null,
      messages: [
        {
          sender: 'customer',
          text: String(message).trim(),
        },
      ],
      lastActivity: new Date(),
    });

    return res.status(201).json(session);
  } catch (error) {
    return next(error);
  }
});

// GET /api/chat/sessions/:id
// Poll for session messages (customer long-polls every 3s).
// Optional query: ?after=<ISO timestamp> returns only new messages
router.get('/sessions/:id', async (req, res, next) => {
  try {
    const session = await ChatSession.findById(req.params.id).lean();
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Mark admin messages as read if customer is polling
    await ChatSession.updateMany(
      { _id: req.params.id, 'messages.sender': 'admin', 'messages.readByCustomer': false },
      { $set: { 'messages.$[msg].readByCustomer': true } },
      { arrayFilters: [{ 'msg.sender': 'admin', 'msg.readByCustomer': false }] }
    );

    return res.json(session);
  } catch (error) {
    return next(error);
  }
});

// POST /api/chat/sessions/:id/messages
// Customer sends a follow-up message to an existing session.
// Body: { text }
router.post('/sessions/:id/messages', async (req, res, next) => {
  try {
    const { text } = req.body ?? {};
    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: 'text is required' });
    }

    const session = await ChatSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.status === 'closed') {
      return res.status(400).json({ error: 'This chat session is closed' });
    }

    session.messages.push({ sender: 'customer', text: String(text).trim() });
    session.lastActivity = new Date();
    await session.save();

    return res.json(session);
  } catch (error) {
    return next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// LIVE CHAT SESSIONS  (admin-only)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/chat/sessions  – Admin: list all sessions
router.get('/sessions', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const status = req.query.status; // 'active' | 'closed' | undefined = all
    const filter = {};
    if (status && ['active', 'closed'].includes(status)) filter.status = status;

    const sessions = await ChatSession.find(filter)
      .sort({ lastActivity: -1 })
      .limit(200)
      .lean();

    return res.json(sessions);
  } catch (error) {
    return next(error);
  }
});

// POST /api/chat/sessions/:id/reply  – Admin: reply to a session
// Body: { text }
router.post('/sessions/:id/reply', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { text } = req.body ?? {};
    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: 'text is required' });
    }

    const session = await ChatSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.status === 'closed') {
      return res.status(400).json({ error: 'Session is closed' });
    }

    session.messages.push({ sender: 'admin', text: String(text).trim() });
    session.lastAdminReply = new Date();
    session.lastActivity = new Date();
    await session.save();

    return res.json(session);
  } catch (error) {
    return next(error);
  }
});

// PATCH /api/chat/sessions/:id  – Admin: close / reopen a session
// Body: { status: 'active' | 'closed' }
router.patch('/sessions/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body ?? {};
    if (!['active', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'status must be "active" or "closed"' });
    }
    const session = await ChatSession.findByIdAndUpdate(
      req.params.id,
      { status, lastActivity: new Date() },
      { new: true }
    );
    if (!session) return res.status(404).json({ error: 'Session not found' });
    return res.json(session);
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/chat/sessions/:id  – Admin: delete a session
router.delete('/sessions/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const session = await ChatSession.findByIdAndDelete(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// OLD INQUIRY ENDPOINTS (kept for backward compat)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/chat/inquiries  – Admin: list static form inquiries
router.get('/inquiries', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? '50', 10)));
    const status = req.query.status;

    const filter = {};
    if (status && ['pending', 'reviewed', 'resolved'].includes(status)) filter.status = status;

    const [inquiries, total] = await Promise.all([
      Inquiry.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Inquiry.countDocuments(filter),
    ]);

    return res.json({ inquiries, total, page, limit });
  } catch (error) {
    return next(error);
  }
});

router.patch('/inquiries/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body ?? {};
    if (!['pending', 'reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });
    return res.json(inquiry);
  } catch (error) {
    return next(error);
  }
});

router.delete('/inquiries/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

export default router;
