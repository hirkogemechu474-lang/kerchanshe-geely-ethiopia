import { Router, Request, Response } from 'express';
import { requireAdminApiSession } from '../middleware/auth';
import { complaintService } from '../services/customer/complaint.service';

const router = Router();

// GET /api/complaints/dashboard - Get complaint dashboard metrics
router.get('/dashboard', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const result = await complaintService.getDashboard();
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('Get complaint dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/complaints - List complaints with filters
router.get('/', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { status, category, priority, assignedTo, page, pageSize } = req.query;
    const result = await complaintService.list({
      status: status as string,
      category: category as string,
      priority: priority as string,
      assignedTo: assignedTo as string,
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    });
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('List complaints error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/complaints - Create a complaint
router.post('/', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const result = await complaintService.create(req.body);
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.status(201).json(result.data);
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/complaints/:id - Get complaint details
router.get('/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const result = await complaintService.getById(req.params.id);
    if (!result.ok) { res.status(404).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/complaints/:id/status - Update complaint status
router.post('/:id/status', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { status, note } = req.body;
    if (!status) { res.status(400).json({ error: 'status is required' }); return; }
    const result = await complaintService.updateStatus(req.params.id, status, req.adminSession!.user.id, note);
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('Update complaint status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/complaints/:id/notes - Add a note to a complaint
router.post('/:id/notes', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { noteType, content, isPublic } = req.body;
    if (!content) { res.status(400).json({ error: 'content is required' }); return; }
    const result = await complaintService.addNote(req.params.id, {
      noteType: noteType || 'INTERNAL',
      content,
      createdBy: req.adminSession!.user.id,
      isPublic,
    });
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.status(201).json(result.data);
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as complaintRoutes };