import { financingRepository } from '@/repositories/financingRepository';

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 80) || Math.random().toString(36).slice(2, 10)
  );
}

function toDecimal(v: unknown, d: number): string {
  if (v === undefined || v === null || v === '') return d.toString();
  return Number(v).toFixed(d.constructor === Number ? d : 2);
}

export type FinancingResult<T extends object> =
  | ({ ok: true } & T)
  | { ok: false; httpStatus: 400 | 404 | 409 | 500; error: string; details?: string };

// ── Programs ───────────────────────────────────────────────────────────
export async function listPrograms(filters: { bankId?: string; vehicleId?: string; status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' }) {
  return financingRepository.findManyPrograms({
    ...(filters.bankId ? { bankId: filters.bankId } : {}),
    ...(filters.vehicleId ? { OR: [{ vehicleId: filters.vehicleId }, { appliesToAllVehicles: true }] } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  });
}

export async function createProgram(b: any): Promise<FinancingResult<{ program: any }>> {
  if (!b.bankId) return { ok: false, httpStatus: 400, error: 'Bank is required' };
  if (!b.name || String(b.name).trim().length < 2) {
    return { ok: false, httpStatus: 400, error: 'Program name is required (min 2 chars)' };
  }
  if (!(Number(b.tenureMonths) > 0)) {
    return { ok: false, httpStatus: 400, error: 'Tenure (months) must be greater than 0' };
  }

  const status = b.status === 'PUBLISHED' || b.status === 'ARCHIVED' ? b.status : 'DRAFT';

  const data = {
    name: String(b.name).trim(),
    slug: b.slug?.trim() || slugify(String(b.name).trim()),
    bank: { connect: { id: String(b.bankId) } },
    interestRate: toDecimal(b.interestRate, 3),
    downPaymentPercent: toDecimal(b.downPaymentPercent, 2),
    minDownPaymentPercent: toDecimal(b.minDownPaymentPercent ?? 10, 2),
    maxDownPaymentPercent: toDecimal(b.maxDownPaymentPercent ?? 70, 2),
    tenureMonths: Number(b.tenureMonths),
    minTenureMonths: Number(b.minTenureMonths ?? 12),
    maxTenureMonths: Number(b.maxTenureMonths ?? 84),
    processingFeePercent: toDecimal(b.processingFeePercent ?? 2.5, 2),
    processingFeeMin: b.processingFeeMin ? toDecimal(b.processingFeeMin, 2) : null,
    processingFeeMax: b.processingFeeMax ? toDecimal(b.processingFeeMax, 2) : null,
    insurancePercent: toDecimal(b.insurancePercent ?? 5, 2),
    vehicle: b.vehicleId ? { connect: { id: b.vehicleId } } : undefined,
    vehicleCategory: b.vehicleCategoryId ? { connect: { id: b.vehicleCategoryId } } : undefined,
    appliesToAllVehicles: b.appliesToAllVehicles !== undefined ? !!b.appliesToAllVehicles : true,
    applyEnabled: b.applyEnabled !== undefined ? !!b.applyEnabled : true,
    applyUrl: b.applyUrl || null,
    applyLabel: b.applyLabel || null,
    directPayEnabled: !!b.directPayEnabled,
    directPayUrl: b.directPayUrl || null,
    directPayLabel: b.directPayLabel || null,
    visitShowroomEnabled: b.visitShowroomEnabled !== undefined ? !!b.visitShowroomEnabled : true,
    visitShowroomUrl: b.visitShowroomUrl || null,
    visitShowroomLabel: b.visitShowroomLabel || null,
    scheduleEnabled: b.scheduleEnabled !== undefined ? !!b.scheduleEnabled : true,
    scheduleUrl: b.scheduleUrl || null,
    badgeText: b.badgeText || null,
    highlightBadge: !!b.highlightBadge,
    finePrint: b.finePrint || null,
    eligibilityNote: b.eligibilityNote || null,
    status,
    publishedAt: status === 'PUBLISHED' ? new Date() : null,
    displayOrder: Number(b.displayOrder) || 0,
  };

  const existing = await financingRepository.findProgramBySlug(data.slug);
  if (existing) {
    return { ok: false, httpStatus: 409, error: `Program slug "${data.slug}" already exists` };
  }

  const program = await financingRepository.createProgram(data);
  return { ok: true, program };
}

export async function getProgram(id: string) {
  return financingRepository.findProgramById(id);
}

const DECIMAL_FIELDS = [
  'interestRate',
  'downPaymentPercent',
  'minDownPaymentPercent',
  'maxDownPaymentPercent',
  'processingFeePercent',
  'processingFeeMin',
  'processingFeeMax',
  'insurancePercent',
] as const;

export async function updateProgram(id: string, b: any) {
  const data: Record<string, unknown> = {};

  const stringFields = [
    'name', 'slug', 'vehicleId', 'vehicleCategoryId',
    'applyUrl', 'applyLabel', 'directPayUrl', 'directPayLabel',
    'visitShowroomUrl', 'visitShowroomLabel', 'scheduleUrl',
    'badgeText', 'finePrint', 'eligibilityNote',
  ];
  stringFields.forEach((f) => {
    if (b[f] !== undefined) data[f] = b[f] === '' ? null : String(b[f]);
  });
  if (b.bankId !== undefined) data.bankId = String(b.bankId);

  const intFields = ['tenureMonths', 'minTenureMonths', 'maxTenureMonths', 'displayOrder'];
  intFields.forEach((f) => {
    if (b[f] !== undefined && b[f] !== null && b[f] !== '') {
      data[f] = Number(b[f]);
    }
  });

  const boolFields = [
    'appliesToAllVehicles',
    'applyEnabled',
    'directPayEnabled',
    'visitShowroomEnabled',
    'scheduleEnabled',
    'highlightBadge',
  ];
  boolFields.forEach((f) => {
    if (b[f] !== undefined) data[f] = !!b[f];
  });

  if (b.status !== undefined) {
    const allowed = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
    if (allowed.includes(b.status)) {
      data.status = b.status;
      data.publishedAt = b.status === 'PUBLISHED' ? new Date() : null;
    }
  }

  DECIMAL_FIELDS.forEach((f) => {
    if (b[f] !== undefined) {
      if (f === 'interestRate') data[f] = Number(b[f]).toFixed(3);
      else if (f.endsWith('Min') || f.endsWith('Max')) {
        if (b[f] === null || b[f] === '') data[f] = null;
        else data[f] = Number(b[f]).toFixed(2);
      } else data[f] = Number(b[f]).toFixed(2);
    }
  });

  return financingRepository.updateProgram(id, data as any);
}

export async function deleteProgram(id: string) {
  return financingRepository.deleteProgram(id);
}

// ── Banks ──────────────────────────────────────────────────────────────
export async function listBanks() {
  return financingRepository.findAllBanks();
}

export async function createBank(body: any): Promise<FinancingResult<{ bank: any }>> {
  const {
    name,
    slug,
    logoUrl,
    websiteUrl,
    phoneNumber,
    email,
    branchAddress,
    shortDescription,
    isActive = true,
    displayOrder = 0,
  } = body ?? {};

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return { ok: false, httpStatus: 400, error: 'Bank name is required (min 2 chars)' };
  }

  const data = {
    name: name.trim(),
    slug: slug?.trim() || slugify(name.trim()),
    logoUrl: logoUrl || null,
    websiteUrl: websiteUrl || null,
    phoneNumber: phoneNumber || null,
    email: email || null,
    branchAddress: branchAddress || null,
    shortDescription: shortDescription || null,
    isActive: !!isActive,
    displayOrder: Number(displayOrder) || 0,
  };

  const existing = await financingRepository.findBankBySlug(data.slug);
  if (existing) {
    return { ok: false, httpStatus: 409, error: `A bank with slug "${data.slug}" already exists — choose a different name or slug.` };
  }

  const bank = await financingRepository.createBank(data);
  return { ok: true, bank };
}

export async function getBank(id: string) {
  return financingRepository.findBankById(id);
}

export async function updateBank(id: string, body: any) {
  const fields: string[] = [
    'name', 'slug', 'logoUrl', 'websiteUrl', 'phoneNumber',
    'email', 'branchAddress', 'shortDescription', 'isActive', 'displayOrder',
  ];
  const data: Record<string, unknown> = {};
  fields.forEach((f) => {
    if (body[f] !== undefined) data[f] = body[f];
  });
  if (typeof data.name === 'string') data.name = data.name.trim();
  if (typeof data.slug === 'string') data.slug = slugify(data.slug.trim() || (data.name as string));
  if (data.isActive !== undefined) data.isActive = !!data.isActive;
  if (data.displayOrder !== undefined) data.displayOrder = Number(data.displayOrder) || 0;

  return financingRepository.updateBank(id, data as any);
}

export async function deleteBank(id: string) {
  return financingRepository.deleteBank(id);
}
