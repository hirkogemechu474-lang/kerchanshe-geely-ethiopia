export interface LeadFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  message?: string;
  source?: string;
}

export interface QuoteFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  vehicleId?: string;
  vehicleName?: string;
  message?: string;
}

export interface TestDriveFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  vehicleId?: string;
  preferredDate?: string;
  preferredTime?: string;
  dealershipId?: string;
}
