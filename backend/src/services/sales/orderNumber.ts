import { salesOrderRepository } from '../../repositories';

export async function generateOrderNumber(): Promise<string> {
  return salesOrderRepository.nextOrderNo();
}

export function parseOrderNumber(orderNo: string): { prefix: string; number: number } | null {
  const match = orderNo.match(/^SO-(\d+)$/);
  if (!match) return null;
  return { prefix: 'SO', number: parseInt(match[1], 10) };
}

export function formatOrderNumber(number: number): string {
  return `SO-${number}`;
}
