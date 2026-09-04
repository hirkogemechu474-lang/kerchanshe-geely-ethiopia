// WhatsApp Business integration utilities

// WhatsApp business numbers for Geely Ethiopia
export const WHATSAPP_NUMBERS = {
  main: '+251993389874',
  sales: '+251993389874',
  service: '+251993389874',
  parts: '+251993389874',
  // Dealer-specific numbers
  dealers: {
    'addis-ababa-bole': '+251110001000',
    'addis-ababa-megenagna': '+251110001001',
    'bahir-dar': '+251110002000',
    'hawassa': '+251110003000',
    'mekelle': '+251110004000',
    'dire-dawa': '+251110005000',
  }
} as const;

export type WhatsAppDepartment = 'main' | 'sales' | 'service' | 'parts';

interface WhatsAppMessageOptions {
  phone: string;
  message: string;
  openInNewTab?: boolean;
}

export interface WhatsAppPrefilledOptions {
  department?: WhatsAppDepartment;
  dealerId?: string;
  vehicleModel?: string;
  userName?: string;
  inquiryType?: 'test-drive' | 'quote' | 'financing' | 'service' | 'parts' | 'general';
  customMessage?: string;
  phone?: string;
}

// Format phone number for WhatsApp (remove spaces, dashes, parentheses)
export function formatWhatsAppNumber(phone: string): string {
  // Remove all non-digit characters except +
  let formatted = phone.replace(/[^\d+]/g, '');
  
  // Ensure it starts with +
  if (!formatted.startsWith('+')) {
    formatted = '+' + formatted;
  }
  
  return formatted;
}

// Generate WhatsApp chat link
export function getWhatsAppLink(options: WhatsAppMessageOptions): string {
  const { phone, message, openInNewTab = true } = options;
  const formattedPhone = formatWhatsAppNumber(phone);
  const encodedMessage = encodeURIComponent(message);
  
  // Use api.whatsapp.com for opening in new tab, wa.me for same tab
  const baseUrl = openInNewTab 
    ? 'https://api.whatsapp.com/send'
    : 'https://wa.me';
  
  return `${baseUrl}?phone=${formattedPhone.replace('+', '')}&text=${encodedMessage}`;
}

// Generate prefilled message for different scenarios
export function generateWhatsAppMessage(options: WhatsAppPrefilledOptions): string {
  const { 
    department, 
    dealerId, 
    vehicleModel, 
    userName, 
    inquiryType,
    customMessage 
  } = options;

  if (customMessage) {
    return customMessage;
  }

  const greeting = userName ? `Hello, I'm ${userName}.` : 'Hello,';
  const parts: string[] = [greeting];

  switch (inquiryType) {
    case 'test-drive':
      parts.push(
        `I'm interested in scheduling a test drive${vehicleModel ? ` for the ${vehicleModel}` : ''}.`,
        'Could you please provide me with available dates and locations?'
      );
      break;

    case 'quote':
      parts.push(
        `I would like to request a price quote${vehicleModel ? ` for the ${vehicleModel}` : ''}.`,
        'Could you share the pricing details and available options?'
      );
      break;

    case 'financing':
      parts.push(
        `I'm interested in financing options${vehicleModel ? ` for the ${vehicleModel}` : ''}.`,
        'Could you provide information about loan terms and interest rates?'
      );
      break;

    case 'service':
      parts.push(
        'I need to schedule a service appointment for my Geely vehicle.',
        'Could you help me with available service slots?'
      );
      break;

    case 'parts':
      parts.push(
        'I need to inquire about genuine Geely parts.',
        'Could you assist me with availability and pricing?'
      );
      break;

    case 'general':
    default:
      parts.push(
        `I'm interested in learning more about Geely vehicles${vehicleModel ? `, specifically the ${vehicleModel}` : ''}.`,
        'Could you provide me with more information?'
      );
      break;
  }

  if (dealerId) {
    parts.push(`\nI would prefer to visit the ${dealerId.replace(/-/g, ' ')} location.`);
  }

  parts.push('\nThank you!');

  return parts.join(' ');
}

// Get WhatsApp number based on context
export function getWhatsAppNumber(options: WhatsAppPrefilledOptions): string {
  const { department, dealerId, phone } = options;

  // Explicit phone override (e.g. from CMS contact settings)
  if (phone) {
    return phone;
  }

  // Dealer-specific number
  if (dealerId && WHATSAPP_NUMBERS.dealers[dealerId as keyof typeof WHATSAPP_NUMBERS.dealers]) {
    return WHATSAPP_NUMBERS.dealers[dealerId as keyof typeof WHATSAPP_NUMBERS.dealers];
  }

  // Department-specific number
  if (department && WHATSAPP_NUMBERS[department]) {
    return WHATSAPP_NUMBERS[department];
  }

  // Default to main number
  return WHATSAPP_NUMBERS.main;
}

// Open WhatsApp chat
export function openWhatsAppChat(options: WhatsAppPrefilledOptions & { openInNewTab?: boolean }) {
  const { openInNewTab = true, ...messageOptions } = options;
  
  const phone = getWhatsAppNumber(messageOptions);
  const message = generateWhatsAppMessage(messageOptions);
  const link = getWhatsAppLink({ phone, message, openInNewTab });

  if (typeof window !== 'undefined') {
    window.open(link, openInNewTab ? '_blank' : '_self', 'noopener,noreferrer');
  }

  return link;
}

// Track WhatsApp click event (for analytics)
export function trackWhatsAppClick(context: string, options: WhatsAppPrefilledOptions) {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', 'whatsapp_click', {
      event_category: 'Engagement',
      event_label: context,
      inquiry_type: options.inquiryType || 'general',
      vehicle_model: options.vehicleModel || 'none',
      dealer_id: options.dealerId || 'none',
    });
  }

  console.log('[WhatsApp] Click tracked:', { context, ...options });
}

// Check if device has WhatsApp installed (mobile only)
export function hasWhatsAppInstalled(): boolean {
  if (typeof navigator === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  
  // We can't reliably detect WhatsApp installation, but we know mobile users likely have it
  return isMobile;
}

// Get WhatsApp share link (for sharing vehicles)
export function getWhatsAppShareLink(options: {
  title: string;
  url: string;
  description?: string;
}): string {
  const { title, url, description } = options;
  
  const message = description 
    ? `${title}\n\n${description}\n\n${url}`
    : `${title}\n\n${url}`;
  
  const encodedMessage = encodeURIComponent(message);
  
  return `https://api.whatsapp.com/send?text=${encodedMessage}`;
}

// WhatsApp Business API status message
export function getWhatsAppBusinessStatus(): {
  available: boolean;
  message: string;
  hours?: string;
} {
  // Get current time in Ethiopia (EAT - UTC+3)
  const now = new Date();
  const ethiopiaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Addis_Ababa' }));
  const hour = ethiopiaTime.getHours();
  const day = ethiopiaTime.getDay(); // 0 = Sunday, 6 = Saturday

  // Business hours: Monday-Friday 8:00-18:00, Saturday 9:00-17:00, Sunday closed
  const isWeekday = day >= 1 && day <= 5;
  const isSaturday = day === 6;
  const isSunday = day === 0;

  if (isSunday) {
    return {
      available: false,
      message: 'Our team is currently offline (Sunday). We will respond on Monday.',
      hours: 'Monday-Friday: 8:00 AM - 6:00 PM, Saturday: 9:00 AM - 5:00 PM',
    };
  }

  if (isWeekday && hour >= 8 && hour < 18) {
    return {
      available: true,
      message: 'Our team is online! We typically respond within minutes.',
      hours: 'Today: 8:00 AM - 6:00 PM',
    };
  }

  if (isSaturday && hour >= 9 && hour < 17) {
    return {
      available: true,
      message: 'Our team is online! We typically respond within minutes.',
      hours: 'Today: 9:00 AM - 5:00 PM',
    };
  }

  // Outside business hours
  return {
    available: false,
    message: 'Our team is currently offline. Send us a message and we will respond during business hours.',
    hours: isWeekday 
      ? 'Tomorrow: 8:00 AM - 6:00 PM'
      : isSaturday 
      ? 'Monday: 8:00 AM - 6:00 PM'
      : 'Monday-Friday: 8:00 AM - 6:00 PM',
  };
}
