/**
 * WhatsApp Business integration utilities.
 * Moved from lib/whatsapp.ts — import from @/utils/whatsapp
 */
export {
  WHATSAPP_NUMBERS,
  formatWhatsAppNumber,
  getWhatsAppLink,
  generateWhatsAppMessage,
  getWhatsAppNumber,
  openWhatsAppChat,
  trackWhatsAppClick,
  hasWhatsAppInstalled,
  getWhatsAppShareLink,
  getWhatsAppBusinessStatus,
} from '@/lib/whatsapp';

export type { WhatsAppDepartment } from '@/lib/whatsapp';
