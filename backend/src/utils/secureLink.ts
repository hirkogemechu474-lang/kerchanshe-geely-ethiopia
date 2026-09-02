import { sign, verify } from 'jsonwebtoken';
import { env } from '../config/env';

const SECRET = env.auth.jwtSecret;

export type LinkType = 'agreement' | 'payment' | 'handover' | 'quotation';

export function signLinkToken(typ: LinkType, id: string, ttl: string | number = '48h'): string {
  return sign({ typ, id }, SECRET, { expiresIn: ttl } as any);
}

export function verifyLinkToken(token: string | null | undefined, typ: LinkType, id: string): boolean {
  if (!token) return false;
  try {
    const decoded = verify(token, SECRET) as { typ?: string; id?: string };
    return decoded.typ === typ && decoded.id === id;
  } catch {
    return false;
  }
}
