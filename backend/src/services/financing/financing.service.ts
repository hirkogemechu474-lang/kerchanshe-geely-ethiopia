import { financingRepository } from '../../repositories';

export const financingService = {
  async listPrograms(params?: { bankId?: string; vehicleId?: string; categoryId?: string }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const where: any = {};
      if (params?.bankId) where.bankId = params.bankId;
      if (params?.vehicleId) where.vehicleId = params.vehicleId;
      if (params?.categoryId) where.vehicleCategoryId = params.categoryId;

      const programs = await financingRepository.findManyPrograms(where);
      return { ok: true, data: programs };
    } catch (error: any) {
      console.error('[FINANCING PROGRAMS ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch financing programs.' };
    }
  },

  async getProgramBySlug(slug: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const program = await financingRepository.findProgramBySlug(slug);
      if (!program) return { ok: false, error: 'Program not found.' };
      return { ok: true, data: program };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch program.' };
    }
  },

  async createProgram(data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const program = await financingRepository.createProgram(data);
      return { ok: true, data: program };
    } catch (error: any) {
      console.error('[FINANCING PROGRAM CREATE ERROR]', error.message);
      return { ok: false, error: 'Failed to create program.' };
    }
  },

  async updateProgram(id: string, data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const program = await financingRepository.updateProgram(id, data);
      return { ok: true, data: program };
    } catch (error: any) {
      console.error('[FINANCING PROGRAM UPDATE ERROR]', error.message);
      return { ok: false, error: 'Failed to update program.' };
    }
  },

  async deleteProgram(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await financingRepository.deleteProgram(id);
      return { ok: true };
    } catch (error: any) {
      console.error('[FINANCING PROGRAM DELETE ERROR]', error.message);
      return { ok: false, error: 'Failed to delete program.' };
    }
  },

  async listBanks(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const banks = await financingRepository.findAllBanks();
      return { ok: true, data: banks };
    } catch (error: any) {
      console.error('[FINANCING BANKS ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch banks.' };
    }
  },

  async createBank(data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const bank = await financingRepository.createBank(data);
      return { ok: true, data: bank };
    } catch (error: any) {
      console.error('[FINANCING BANK CREATE ERROR]', error.message);
      return { ok: false, error: 'Failed to create bank.' };
    }
  },

  async updateBank(id: string, data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const bank = await financingRepository.updateBank(id, data);
      return { ok: true, data: bank };
    } catch (error: any) {
      console.error('[FINANCING BANK UPDATE ERROR]', error.message);
      return { ok: false, error: 'Failed to update bank.' };
    }
  },

  async deleteBank(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await financingRepository.deleteBank(id);
      return { ok: true };
    } catch (error: any) {
      console.error('[FINANCING BANK DELETE ERROR]', error.message);
      return { ok: false, error: 'Failed to delete bank.' };
    }
  },

  async getPublishedPrograms(params: { vehicleId?: string; bankId?: string; categoryId?: string }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const programs = await financingRepository.findPublishedPrograms(params);
      return { ok: true, data: programs };
    } catch (error: any) {
      console.error('[PUBLISHED PROGRAMS ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch published programs.' };
    }
  },

  async getActiveBanksWithProgramCount(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const banks = await financingRepository.findActiveBanksWithProgramCount();
      return { ok: true, data: banks };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch banks.' };
    }
  },
};
