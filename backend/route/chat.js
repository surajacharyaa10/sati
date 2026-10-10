import express from 'express';
import { authenticate, requireAdmin } from '../services/session.js';
import Inquiry from '../module/inquiry.js';

const router = express.Router();

// POST /api/chat  – AI product assistant (public)
// Body: { messages: [{role, content}], productContext: {name, ...} }
router.post('/', async (req, res, next) => {
  try {
    const { messages, productContext } = req.body ?? {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      // Graceful fallback: let the client handle it locally
      return res.status(503).json({ error: 'AI service not configured' });
    }

    // Build a product-scoped system prompt
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
- For highly specific queries like custom tailoring or bulk orders, suggest submitting a "Store Support" inquiry.
- Keep responses concise (2-4 sentences or short bullet points). Use markdown for emphasis.
- Never hallucinate product details; only use what is given above.
- Be warm, premium, and professional in tone.`
      : `You are a helpful assistant for SATI fashion brand. Be concise and professional.`;

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-10), // Keep last 10 messages for context window
        ],
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

// GET /api/chat/inquiries  – Admin: list ALL inquiries (paginated)
router.get('/inquiries', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? '50', 10)));
    const status = req.query.status; // optional filter

    const filter = {};
    if (status && ['pending', 'reviewed', 'resolved'].includes(status)) {
      filter.status = status;
    }

    const [inquiries, total] = await Promise.all([
      Inquiry.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Inquiry.countDocuments(filter),
    ]);

    return res.json({ inquiries, total, page, limit });
  } catch (error) {
    return next(error);
  }
});

// PATCH /api/chat/inquiries/:id  – Admin: update inquiry status
router.patch('/inquiries/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body ?? {};
    if (!['pending', 'reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });
    return res.json(inquiry);
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/chat/inquiries/:id  – Admin: delete inquiry
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
