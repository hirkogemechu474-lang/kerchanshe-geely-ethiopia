import { settingRepository } from '../../repositories';

// Single source of truth for the seller identity/contact/bank details printed
// on all 4 sales documents (Quotation/Agreement/Invoice/Handover). Reads the
// same `business_settings` / `contact_information` Setting rows the admin
// Business Settings and Contact Information pages already edit (see
// backend/src/routes/settings.routes.ts) plus a new `bank_details` Setting,
// with sensible fallbacks so PDFs render correctly even before an admin
// fills these in — "Kerchanshe Trading PLC" is the correct legal name per
// the company's own draft documents, not the old hardcoded
// "Kerchanshe Auto (Geely Ethiopia)" this replaces.
export interface CompanyInfo {
  legalName: string;
  tin: string;
  vatNumber: string;
  tradeLicenseNumber: string;
  address: string;
  phone: string;
  email: string;
  bank: {
    name: string;
    accountNumber: string;
    accountName: string;
    branch: string;
  };
}

const FALLBACK: CompanyInfo = {
  legalName: 'Kerchanshe Trading PLC',
  tin: '',
  vatNumber: '',
  tradeLicenseNumber: '',
  address: 'Bole, Addis Ababa, Ethiopia',
  phone: '',
  email: '',
  bank: { name: '', accountNumber: '', accountName: 'Kerchanshe Trading PLC', branch: '' },
};

async function readJsonSetting(key: string): Promise<Record<string, any>> {
  try {
    const setting = await settingRepository.findByKey(key);
    if (!setting?.value) return {};
    return JSON.parse(setting.value) ?? {};
  } catch {
    return {};
  }
}

function formatContactAddress(contact: Record<string, any>): string | null {
  const addr = contact?.headquarters?.address;
  if (!addr) return null;
  const parts = [addr.street, addr.area, addr.city, addr.region, addr.country].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

export async function getCompanyInfo(): Promise<CompanyInfo> {
  const [business, contact, bank] = await Promise.all([
    readJsonSetting('business_settings'),
    readJsonSetting('contact_information'),
    readJsonSetting('bank_details'),
  ]);

  return {
    legalName: business.companyLegalName || business.companyName || FALLBACK.legalName,
    tin: business.tinNumber || FALLBACK.tin,
    vatNumber: business.vatNumber || FALLBACK.vatNumber,
    tradeLicenseNumber: business.tradeLicenseNumber || FALLBACK.tradeLicenseNumber,
    address: formatContactAddress(contact) || FALLBACK.address,
    phone: contact?.phone?.primary || contact?.phone?.sales || FALLBACK.phone,
    email: contact?.email?.general || contact?.email?.sales || FALLBACK.email,
    bank: {
      name: bank.bankName || FALLBACK.bank.name,
      accountNumber: bank.accountNumber || FALLBACK.bank.accountNumber,
      accountName: bank.accountName || FALLBACK.bank.accountName,
      branch: bank.branch || FALLBACK.bank.branch,
    },
  };
}
