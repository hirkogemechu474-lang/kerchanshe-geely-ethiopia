import { serviceBayRepository } from '@/repositories/serviceBayRepository';

export async function listBays() {
  return serviceBayRepository.findAll();
}

export type CreateBayResult =
  | { ok: true; bay: any }
  | { ok: false; httpStatus: 400 | 409 | 500; error: string };

export async function createBay(body: any): Promise<CreateBayResult> {
  const { name, bayType } = body;
  if (!name) {
    return { ok: false, httpStatus: 400, error: 'Name is required' };
  }

  try {
    const bay = await serviceBayRepository.create({ name, bayType: bayType || 'GENERAL' });
    return { ok: true, bay };
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return { ok: false, httpStatus: 409, error: 'A bay with this name already exists' };
    }
    console.error('Error creating bay:', error);
    return { ok: false, httpStatus: 500, error: 'Failed to create bay' };
  }
}

export async function updateBay(id: string, body: any) {
  const { name, bayType, status, isActive } = body;
  return serviceBayRepository.update(id, {
    ...(name !== undefined && { name }),
    ...(bayType !== undefined && { bayType }),
    ...(status !== undefined && { status }),
    ...(isActive !== undefined && { isActive }),
  });
}

export async function deactivateBay(id: string) {
  return serviceBayRepository.deactivate(id);
}
