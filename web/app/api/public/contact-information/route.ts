import { NextResponse } from 'next/server';
import { settingRepository } from '@/repositories/settingRepository';

const SETTING_KEY = 'contact_information';

const DEFAULT_CONTACT_INFORMATION = {
  headquarters: {
    name: 'Geely Ethiopia Headquarters',
    address: {
      street: 'Bole Medhane Alem Road',
      area: 'Bole Sub-city, Woreda 03',
      city: 'Addis Ababa',
      region: 'Addis Ababa',
      country: 'Ethiopia',
      postalCode: '1000',
    },
    coordinates: {
      latitude: 9.0174,
      longitude: 38.7453,
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
    general: 'info@geely-ethiopia.com',
    sales: 'sales@geely-ethiopia.com',
    service: 'service@geely-ethiopia.com',
    support: 'support@geely-ethiopia.com',
    careers: 'careers@geely-ethiopia.com',
  },
  whatsapp: '+251 911 000 000',
  website: 'https://www.geely-ethiopia.com',
};

export async function GET() {
  try {
    const setting = await settingRepository.findByKey(SETTING_KEY);

    if (!setting) {
      return NextResponse.json(DEFAULT_CONTACT_INFORMATION);
    }

    const contact = JSON.parse(setting.value);
    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error fetching contact information:', error);
    return NextResponse.json(DEFAULT_CONTACT_INFORMATION);
  }
}
