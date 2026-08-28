import { partRequestRepository } from '@/repositories/partRequestRepository';
import { sendStatusEmail } from '@/lib/status-email';

const PAGE_SIZE = 25;
const VALID_STATUSES = ['new', 'contacted', 'in_progress', 'quoted', 'closed'];

// Status counts ignore the search/status filter itself so the stat tiles
// always reflect the whole table, not just the current view.
export async function listPartRequests(q: string, status: string, page: number) {
  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
      { company: { contains: q, mode: 'insensitive' } },
      { address: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (status) where.status = status;

  const [requests, total, statusCounts] = await partRequestRepository.findPage(where, (page - 1) * PAGE_SIZE, PAGE_SIZE);

  const countFor = (s: string) => statusCounts.find((c) => c.status === s)?._count ?? 0;

  return {
    requests,
    total,
    page,
    pageSize: PAGE_SIZE,
    stats: {
      total: statusCounts.reduce((sum, c) => sum + c._count, 0),
      new: countFor('new'),
      quoted: countFor('quoted'),
      closed: countFor('closed'),
    },
  };
}

export async function getPartRequest(id: string) {
  return partRequestRepository.findById(id);
}

export type UpdatePartRequestStatusResult =
  | { ok: true; request: any }
  | { ok: false; httpStatus: 400 | 404; error: string };

export async function updatePartRequest(id: string, body: { status?: string; notes?: string }): Promise<UpdatePartRequestStatusResult> {
  const data: any = {};

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return { ok: false, httpStatus: 400, error: 'Invalid status' };
    }
    data.status = body.status;
  }
  if (body.notes !== undefined) data.notes = body.notes;

  let request;
  try {
    request = await partRequestRepository.update(id, data);
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return { ok: false, httpStatus: 404, error: 'Part request not found' };
    }
    throw error;
  }

  if (body.status && ['quoted', 'closed'].includes(body.status)) {
    try {
      await sendStatusEmail({
        to: request.email,
        name: request.name,
        entityType: 'Parts Request',
        status: body.status,
        reference: request.id,
      });
    } catch (error) {
      console.error('[status-email] part request', error);
    }
  }

  return { ok: true, request };
}

export async function deletePartRequest(id: string): Promise<{ ok: true } | { ok: false; httpStatus: 404; error: string }> {
  try {
    await partRequestRepository.delete(id);
    return { ok: true };
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return { ok: false, httpStatus: 404, error: 'Part request not found' };
    }
    throw error;
  }
}
