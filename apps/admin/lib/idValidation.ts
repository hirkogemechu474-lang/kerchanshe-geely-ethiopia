// Ethiopian ID document formats: TIN is 10 digits, the Fayda National ID is
// 16 digits, passports are alphanumeric (6-9 chars), and driver's licenses
// have no fixed national format so we only bound their length.
export const ID_DOCUMENT_PATTERNS: Record<string, RegExp> = {
  national_id: /^\d{16}$/,
  passport: /^[A-Za-z0-9]{6,9}$/,
  drivers_license: /^[A-Za-z0-9]{6,15}$/,
};

export const TIN_PATTERN = /^\d{10}$/;

const ID_DOCUMENT_MESSAGES: Record<string, string> = {
  national_id: "National ID must be exactly 16 digits",
  passport: "Passport number must be 6-9 letters/digits",
  drivers_license: "Driver's license number must be 6-15 letters/digits",
};

export function validateIdDocumentNumber(value: string, docType: string): string | null {
  const pattern = ID_DOCUMENT_PATTERNS[docType];
  const trimmed = value.trim();
  if (!pattern) return validateGenericIdOrLicense(value);
  return pattern.test(trimmed) ? null : ID_DOCUMENT_MESSAGES[docType];
}

export function validateGenericIdOrLicense(value: string): string | null {
  const trimmed = value.trim();
  const matches = Object.values(ID_DOCUMENT_PATTERNS).some((pattern) => pattern.test(trimmed));
  return matches ? null : "Enter a valid National ID (16 digits), passport (6-9 characters), or driver's license number (6-15 characters)";
}

export function validateTin(value: string): string | null {
  if (!value || !value.trim()) return null;
  return TIN_PATTERN.test(value.trim()) ? null : "TIN must be exactly 10 digits";
}
