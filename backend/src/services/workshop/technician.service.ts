import { technicianRepository } from '../../repositories';

export const technicianService = {
  async list(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const technicians = await technicianRepository.findAll();
      return { ok: true, data: technicians };
    } catch (error: any) {
      console.error('[TECHNICIAN LIST ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch technicians.' };
    }
  },

  async create(data: { name: string; specialization?: string; phone?: string }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const technician = await technicianRepository.create({
        name: data.name,
        isActive: true,
        ...(data.specialization && { specialization: data.specialization }),
        ...(data.phone && { phone: data.phone }),
      });
      return { ok: true, data: technician };
    } catch (error: any) {
      console.error('[TECHNICIAN CREATE ERROR]', error.message);
      return { ok: false, error: 'Failed to create technician.' };
    }
  },

  async update(id: string, data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const technician = await technicianRepository.update(id, data);
      return { ok: true, data: technician };
    } catch (error: any) {
      console.error('[TECHNICIAN UPDATE ERROR]', error.message);
      return { ok: false, error: 'Failed to update technician.' };
    }
  },

  async deactivate(id: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const technician = await technicianRepository.deactivate(id);
      return { ok: true, data: technician };
    } catch (error: any) {
      console.error('[TECHNICIAN DEACTIVATE ERROR]', error.message);
      return { ok: false, error: 'Failed to deactivate technician.' };
    }
  },
};
