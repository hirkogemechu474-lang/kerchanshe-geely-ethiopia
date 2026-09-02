import { customerRepository } from '../../repositories';

export const customerService = {
  async search(q?: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const customers = await customerRepository.search(q);
      return { ok: true, data: customers };
    } catch (error: any) {
      console.error('[CUSTOMER SEARCH ERROR]', error.message);
      return { ok: false, error: 'Failed to search customers.' };
    }
  },

  async getById(id: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const customer = await customerRepository.findById(id);
      if (!customer) return { ok: false, error: 'Customer not found.' };
      return { ok: true, data: customer };
    } catch (error: any) {
      console.error('[CUSTOMER GET ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch customer.' };
    }
  },

  async create(data: { fullName: string; phone: string; email?: string; address?: string }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const existing = await customerRepository.findByPhone(data.phone);
      if (existing) return { ok: false, error: 'Customer with this phone already exists.' };

      const customer = await customerRepository.create({
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        address: data.address,
      });

      return { ok: true, data: customer };
    } catch (error: any) {
      console.error('[CUSTOMER CREATE ERROR]', error.message);
      return { ok: false, error: 'Failed to create customer.' };
    }
  },

  async update(id: string, data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const customer = await customerRepository.update(id, data);
      return { ok: true, data: customer };
    } catch (error: any) {
      console.error('[CUSTOMER UPDATE ERROR]', error.message);
      return { ok: false, error: 'Failed to update customer.' };
    }
  },

  async addVehicle(customerId: string, data: {
    vin?: string;
    plateNo?: string;
    model: string;
    color?: string;
    warrantyEndDate?: Date;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const vehicle = await customerRepository.createVehicle({
        customer: { connect: { id: customerId } },
        vin: data.vin,
        plateNo: data.plateNo || '',
        model: data.model,
        color: data.color,
        warrantyEndDate: data.warrantyEndDate,
      });

      return { ok: true, data: vehicle };
    } catch (error: any) {
      console.error('[CUSTOMER ADD VEHICLE ERROR]', error.message);
      return { ok: false, error: 'Failed to add vehicle.' };
    }
  },

  async updateVehicle(vehicleId: string, data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const vehicle = await customerRepository.updateVehicle(vehicleId, data);
      return { ok: true, data: vehicle };
    } catch (error: any) {
      return { ok: false, error: 'Failed to update vehicle.' };
    }
  },

  async getCounts(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const [totalCustomers, totalVehicles, underWarranty] = await Promise.all([
        customerRepository.countCustomers(),
        customerRepository.countVehicles(),
        customerRepository.countVehiclesUnderWarranty(),
      ]);

      return {
        ok: true,
        data: { totalCustomers, totalVehicles, underWarranty },
      };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch customer counts.' };
    }
  },
};
