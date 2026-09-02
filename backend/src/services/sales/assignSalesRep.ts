import { userRepository, quotationRepository, salesOrderRepository } from '../../repositories';

export async function assignSalesRep(params: {
  targetType: 'quotation' | 'order';
  targetId: string;
  salesRepName?: string;
  salesRepId?: string;
}): Promise<{ ok: boolean; data?: any; error?: string }> {
  try {
    let resolvedRepId = params.salesRepId;

    if (!resolvedRepId && params.salesRepName) {
      const rep = await userRepository.findActiveSalesRepByName(params.salesRepName);
      if (!rep) return { ok: false, error: `Sales representative "${params.salesRepName}" not found.` };
      resolvedRepId = rep.id;
    }

    if (!resolvedRepId) {
      return { ok: false, error: 'No sales representative specified.' };
    }

    const rep = await userRepository.findByIdSlim(resolvedRepId);
    if (!rep) return { ok: false, error: 'Sales representative not found.' };

    if (params.targetType === 'quotation') {
      const quotation = await quotationRepository.findById(params.targetId);
      if (!quotation) return { ok: false, error: 'Quotation not found.' };

      const updated = await quotationRepository.update(params.targetId, {
        assignedTo: resolvedRepId,
      });

      return { ok: true, data: updated };
    } else {
      const order = await salesOrderRepository.findById(params.targetId);
      if (!order) return { ok: false, error: 'Order not found.' };

      const updated = await salesOrderRepository.update(params.targetId, {
        assignedTo: resolvedRepId,
      });

      return { ok: true, data: updated };
    }
  } catch (error: any) {
    console.error('[ASSIGN SALES REP ERROR]', error.message);
    return { ok: false, error: 'Failed to assign sales representative.' };
  }
}
