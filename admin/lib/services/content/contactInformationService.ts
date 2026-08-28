import { settingRepository } from '@/repositories/settingRepository';

const CONTACT_SETTING_KEYS = [
  'contact.phone.primary',
  'contact.phone.sales',
  'contact.phone.service',
  'contact.phone.parts',
  'contact.phone.emergency',
  'contact.email.general',
  'contact.email.sales',
  'contact.email.service',
  'contact.email.support',
  'contact.email.careers',
  'contact.whatsapp',
  'contact.website',
  'contact.headquarters.name',
  'contact.headquarters.address',
  'contact.hours.workdays',
  'contact.hours.saturday',
  'contact.hours.sunday',
  'contact.hours.note',
];

const DEFAULT_CONTACT_INFO = {
  headquarters: {
    name: 'Geely Ethiopia — Kerchanshe Auto HQ',
    address: {
      street: 'Sarbet Area',
      area: 'Bole Sub-city',
      city: 'Addis Ababa',
      region: 'Addis Ababa',
      country: 'Ethiopia',
      postalCode: '1000',
    },
  },
  phone: {
    primary: '+251 11 000 0000',
    sales: '+251 11 000 0001',
    service: '+251 11 000 0002',
    parts: '+251 11 000 0003',
    emergency: '+251 911 000 000',
  },
  email: {
    general: 'info@geelyethiopia.com',
    sales: 'sales@geelyethiopia.com',
    service: 'service@geelyethiopia.com',
    support: 'support@geelyethiopia.com',
    careers: 'careers@geelyethiopia.com',
  },
  whatsapp: '+251 911 000 000',
  website: 'https://geelyethiopia.com',
  hours: {
    workdays: 'Mon–Fri · 08:30 AM – 06:00 PM',
    saturday: 'Saturday · 09:00 AM – 01:00 PM',
    sunday: 'Sunday · Closed',
    note: 'Public holidays: Closed or by appointment',
  },
};

const FALLBACK_CONTACT_INFO = {
  headquarters: DEFAULT_CONTACT_INFO.headquarters,
  phone: DEFAULT_CONTACT_INFO.phone,
  email: {
    general: 'info@geelyethiopia.com',
    sales: 'sales@geelyethiopia.com',
    service: 'service@geelyethiopia.com',
    support: 'support@geelyethiopia.com',
  },
  whatsapp: '+251 911 000 000',
};

export async function getContactInformation() {
  try {
    const contactSettings = await settingRepository.findManyByKeys(CONTACT_SETTING_KEYS);

    // Transform flat settings into structured object
    const contactInfo: any = JSON.parse(JSON.stringify(DEFAULT_CONTACT_INFO));

    contactSettings.forEach((setting) => {
      const parts = setting.key.split('.');
      let current = contactInfo;

      // Navigate to the nested property
      for (let i = 1; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }

      // Set the value
      const lastKey = parts[parts.length - 1];
      try {
        // Try to parse JSON values (like address object)
        current[lastKey] = JSON.parse(setting.value);
      } catch {
        // If not JSON, use as string
        current[lastKey] = setting.value;
      }
    });

    return contactInfo;
  } catch (error) {
    console.error('Error fetching contact information:', error);
    return FALLBACK_CONTACT_INFO;
  }
}
