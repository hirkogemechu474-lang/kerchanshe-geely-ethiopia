import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';
import { chatbotService } from '../services/chatbot/chatbot.service';

const router = Router();

// ── AI layer status ──────────────────────────────────────────────────────

router.get('/ai-status', requireAdminApiSession, async (req: Request, res: Response) => {
  res.json(chatbotService.getAiStatus());
});

// ── Knowledge base CRUD ─────────────────────────────────────────────────

router.get('/knowledge', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const entries = await prisma.chatbotKnowledge.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
    res.json(entries);
  } catch (error) {
    console.error('List chatbot knowledge error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/knowledge/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const entry = await prisma.chatbotKnowledge.findUnique({ where: { id: req.params.id } });
    if (!entry) { res.status(404).json({ error: 'Knowledge entry not found' }); return; }
    res.json(entry);
  } catch (error) {
    console.error('Get chatbot knowledge error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/knowledge', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { question, keywords, answer, category, isActive, priority, displayOrder } = req.body;
    const entry = await prisma.chatbotKnowledge.create({
      data: {
        question,
        keywords: Array.isArray(keywords) ? keywords : [],
        answer,
        category: category || null,
        isActive: isActive ?? true,
        priority: priority ?? 0,
        displayOrder: displayOrder ?? 0,
      },
    });
    res.status(201).json(entry);
  } catch (error) {
    console.error('Create chatbot knowledge error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/knowledge/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { question, keywords, answer, category, isActive, priority, displayOrder } = req.body;
    const entry = await prisma.chatbotKnowledge.update({
      where: { id: req.params.id },
      data: {
        question,
        keywords: Array.isArray(keywords) ? keywords : undefined,
        answer,
        category: category || null,
        isActive,
        priority,
        displayOrder,
      },
    });
    res.json(entry);
  } catch (error) {
    console.error('Update chatbot knowledge error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/knowledge/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    await prisma.chatbotKnowledge.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete chatbot knowledge error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Conversation logs ───────────────────────────────────────────────────

router.get('/conversations', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const unansweredOnly = req.query.unanswered === 'true';

    const where = unansweredOnly ? { messages: { some: { intent: 'fallback' } } } : {};

    const [items, total] = await Promise.all([
      prisma.chatbotConversation.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          _count: { select: { messages: true } },
        },
      }),
      prisma.chatbotConversation.count({ where }),
    ]);

    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('List chatbot conversations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/conversations/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const conversation = await prisma.chatbotConversation.findUnique({
      where: { id: req.params.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conversation) { res.status(404).json({ error: 'Conversation not found' }); return; }
    res.json(conversation);
  } catch (error) {
    console.error('Get chatbot conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as chatbotRoutes };
