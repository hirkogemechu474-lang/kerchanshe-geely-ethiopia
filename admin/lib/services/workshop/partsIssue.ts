import type { Prisma } from '@prisma/client';

/** Thrown for any parts-issue business-rule violation; carries the HTTP status the route should return. */
export class PartsIssueError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/** FR-401/402: reserve stock against a job card. Unit price is snapshotted from the catalog at request time. */
export async function requestJobCardPart(
  tx: Prisma.TransactionClient,
  params: { jobCardId: string; sparePartId: string; quantity: number; isWarranty: boolean; requestedById: string }
) {
  const { jobCardId, sparePartId, quantity, isWarranty, requestedById } = params;
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new PartsIssueError('Quantity must be a positive integer.');
  }

  const sparePart = await tx.sparePart.findUnique({ where: { id: sparePartId } });
  if (!sparePart) {
    throw new PartsIssueError('Spare part not found.', 404);
  }

  const line = await tx.jobCardPart.create({
    data: { jobCardId, sparePartId, quantity, unitPrice: sparePart.price, isWarranty, requestedById },
  });

  await tx.sparePart.update({
    where: { id: sparePartId },
    data: { reservedQty: { increment: quantity } },
  });

  return line;
}

/** FR-401: physically issue (barcode scan) a requested/backordered line, decrementing on-hand stock. */
export async function issueJobCardPart(tx: Prisma.TransactionClient, lineId: string, issuedById: string) {
  const line = await tx.jobCardPart.findUnique({ where: { id: lineId }, include: { sparePart: true } });
  if (!line) {
    throw new PartsIssueError('Part line not found.', 404);
  }
  if (line.status !== 'REQUESTED' && line.status !== 'BACKORDERED') {
    throw new PartsIssueError(`Cannot issue a line in status ${line.status}.`, 409);
  }
  if (line.sparePart.stock < line.quantity) {
    throw new PartsIssueError('Insufficient stock to issue this quantity.', 409);
  }

  await tx.sparePart.update({
    where: { id: line.sparePartId },
    data: { stock: { decrement: line.quantity }, reservedQty: { decrement: line.quantity } },
  });

  return tx.jobCardPart.update({
    where: { id: lineId },
    data: { status: 'ISSUED', issuedById, issuedAt: new Date() },
  });
}

/** Stock insufficient at issue time: flags the line so the advisor can move the job card to Parts Waiting. */
export async function backorderJobCardPart(tx: Prisma.TransactionClient, lineId: string) {
  const line = await tx.jobCardPart.findUnique({ where: { id: lineId } });
  if (!line) {
    throw new PartsIssueError('Part line not found.', 404);
  }
  if (line.status !== 'REQUESTED') {
    throw new PartsIssueError(`Cannot backorder a line in status ${line.status}.`, 409);
  }
  return tx.jobCardPart.update({ where: { id: lineId }, data: { status: 'BACKORDERED' } });
}

/** Releases the reserved quantity back to available stock without ever having decremented on-hand stock. */
export async function cancelJobCardPart(tx: Prisma.TransactionClient, lineId: string) {
  const line = await tx.jobCardPart.findUnique({ where: { id: lineId } });
  if (!line) {
    throw new PartsIssueError('Part line not found.', 404);
  }
  if (line.status === 'ISSUED' || line.status === 'CANCELLED') {
    throw new PartsIssueError(`Cannot cancel a line in status ${line.status}.`, 409);
  }

  await tx.sparePart.update({
    where: { id: line.sparePartId },
    data: { reservedQty: { decrement: line.quantity } },
  });

  return tx.jobCardPart.update({ where: { id: lineId }, data: { status: 'CANCELLED' } });
}
