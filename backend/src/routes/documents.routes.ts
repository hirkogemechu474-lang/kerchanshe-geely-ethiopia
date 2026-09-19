import { Router, Request, Response } from 'express';
import { requireAdminApiSession, requirePermission } from '../middleware/auth';
import { documentSignatureRepository } from '../repositories';

const router = Router();

router.use(requireAdminApiSession);

// Was session-only — any authenticated staff member could read every order's
// signature records and record a sales-agent sign-off. Both
// OrderApprovalPanel.tsx and OrderHandoverPanel.tsx are only ever rendered
// inside OrderDetail.tsx behind `permissions.canManageQuotations` for the
// mutating action, with the surrounding orders/quotations pages themselves
// gated at canViewQuotations for read access — mirrored here.
//
// GET /sign?documentType=&entityId= — every recorded role's signature for a
// document, consumed by OrderApprovalPanel.tsx and OrderHandoverPanel.tsx to
// find the 'sales_agent' and 'manager' entries. 'manager'/'customer' rows
// are dual-written by the existing countersign/customer-sign flows
// elsewhere (orders.routes.ts, agreement.routes.ts, handover.routes.ts,
// orderAgreement.service.ts, orderHandover.service.ts) — this route itself
// only ever writes 'sales_agent'.
router.get('/sign', requirePermission('canViewQuotations'), async (req: Request, res: Response) => {
  try {
    const documentType = (req.query.documentType as string) || '';
    const entityId = (req.query.entityId as string) || '';
    if (!documentType || !entityId) {
      res.status(400).json({ error: 'documentType and entityId are required.' });
      return;
    }
    const signatures = await documentSignatureRepository.findMany(documentType, entityId);
    res.json({ signatures });
  } catch (error) {
    console.error('Get document signatures error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /sign { documentType, entityId } — records the plain in-app
// acknowledgement behind OrderApprovalPanel.tsx's "Sign as Sales Agent"
// button. No `role` in the body: this action always represents the
// authenticated sales-agent-side actor, so the role is hardcoded here
// rather than trusted from the client. No drawn signature captured —
// signatureUrl stays null for this role.
router.post('/sign', requirePermission('canManageQuotations'), async (req: Request, res: Response) => {
  try {
    const { documentType, entityId } = req.body || {};
    if (!documentType || !entityId) {
      res.status(400).json({ error: 'documentType and entityId are required.' });
      return;
    }
    const signature = await documentSignatureRepository.upsert(documentType, entityId, 'sales_agent', {
      signedByName: req.adminSession!.user.name,
      signedByUserId: req.adminSession!.user.id,
    });
    res.json({ signature });
  } catch (error) {
    console.error('Record document signature error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as documentsRoutes };
