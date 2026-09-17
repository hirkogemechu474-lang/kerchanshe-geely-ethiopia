import { sign, verify } from 'jsonwebtoken';
import { env } from '../config/env';

const SECRET = env.auth.jwtSecret;

export type LinkType = 'agreement' | 'payment' | 'handover' | 'handover-countersign' | 'quotation' | 'invoice' | 'delivery-schedule' | 'receipt';

export function signLinkToken(typ: LinkType, id: string, ttl: string | number = '48h'): string {
  return sign({ typ, id }, SECRET, { expiresIn: ttl } as any);
}

export function verifyLinkToken(token: string | null | undefined, typ: LinkType | LinkType[], id: string): boolean {
  if (!token) return false;
  try {
    const decoded = verify(token, SECRET) as { typ?: string; id?: string };
    const allowed = Array.isArray(typ) ? typ : [typ];
    return allowed.includes(decoded.typ as LinkType) && decoded.id === id;
  } catch {
    return false;
  }
}
