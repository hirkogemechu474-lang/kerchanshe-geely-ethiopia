import { prisma } from '../../config/database';

export interface DiscountAuthority {
  maxDiscountPercent: number; // Maximum discount % this role can approve
  requiresManagerApproval: boolean; // Whether any discount needs manager sign-off
  managerApprovalRequiredOver: number; // Discount % that requires manager approval
}

export const discountAuthorities: DiscountAuthority[] = [
  { maxDiscountPercent: 5, requiresManagerApproval: false, managerApprovalRequiredOver: 0 },
  { maxDiscountPercent: 10, requiresManagerApproval: false, managerApprovalRequiredOver: 0 },
  { maxDiscountPercent: 15, requiresManagerApproval: true, managerApprovalRequiredOver: 10 },
  { maxDiscountPercent: 20, requiresManagerApproval: true, managerApprovalRequiredOver: 15 },
  { maxDiscountPercent: 100, requiresManagerApproval: true, managerApprovalRequiredOver: 20 },
];

export function getAuthorityForRole(role: string): DiscountAuthority {
  const roleMap: Record<string, DiscountAuthority> = {
    'sales_agent': discountAuthorities[0], // 5% max
    'sales_representative': discountAuthorities[1], // 10% max
    'sales_manager': discountAuthorities[2], // 15% max, needs own manager for above
    'finance': discountAuthorities[3], // 20% max
    'super_admin': discountAuthorities[4], // 100% max
  };
  return roleMap[role] || discountAuthorities[0];
}

export function checkDiscountAuthorization(
  agentRole: string,
  requestedDiscount: number
): { authorized: boolean; requiresManager: boolean; message: string } {
  const authority = getAuthorityForRole(agentRole);

  let authorized = requestedDiscount <= authority.maxDiscountPercent;
  let requiresManager = false;
  let msg = '';

  if (requestedDiscount > authority.managerApprovalRequiredOver) {
    requiresManager = true;
    authorized = false;
    msg = `Discount of ${requestedDiscount}% exceeds your ${authority.maxDiscountPercent}% limit and requires manager approval.`;
  } else if (requestedDiscount > 0) {
    msg = `Discount of ${requestedDiscount}% is within your ${authority.maxDiscountPercent}% authority.`;
    authorized = true;
  } else {
    msg = 'No discount requested.';
    authorized = true;
  }

  return { authorized, requiresManager, message: msg };
}