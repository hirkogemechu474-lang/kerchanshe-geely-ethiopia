import { NextResponse } from 'next/server';
import { settingRepository } from '@/repositories/settingRepository';

const SETTING_KEY = 'business_settings';

const DEFAULT_BUSINESS_SETTINGS = {
  companyName: 'Geely Ethiopia',
  companyLegalName: 'Geely Motors Ethiopia PLC',
  tagline: 'Driving Ethiopia Forward',
  description: 'Official Geely Motors dealership in Ethiopia, offering a wide range of quality vehicles, financing options, and after-sales services.',
  established: '2020',
  vatNumber: 'ET-1234567890',
  tinNumber: '1234567890',
  tradeLicenseNumber: 'TLC-2024-98765432',
  businessHours: {
    weekdays: 'Monday - Friday: 8:00 AM - 6:00 PM',
    saturday: 'Saturday: 9:00 AM - 5:00 PM',
    sunday: 'Sunday: Closed',
    holidays: 'Public Holidays: Closed',
  },
  currency: 'ETB',
  language: 'en',
  timezone: 'Africa/Addis_Ababa',
  country: 'Ethiopia',
  region: 'Addis Ababa',
};

export async function GET() {
  try {
    const setting = await settingRepository.findByKey(SETTING_KEY);

    if (!setting) {
      return NextResponse.json(DEFAULT_BUSINESS_SETTINGS);
    }

    const settings = JSON.parse(setting.value);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching business settings:', error);
    return NextResponse.json(DEFAULT_BUSINESS_SETTINGS);
  }
}
