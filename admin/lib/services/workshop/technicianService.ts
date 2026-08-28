import { technicianRepository } from '@/repositories/technicianRepository';

export async function listTechnicians() {
  return technicianRepository.findAll();
}

export type CreateTechnicianResult =
  | { ok: true; technician: any }
  | { ok: false; httpStatus: 400; error: string };

export async function createTechnician(body: any): Promise<CreateTechnicianResult> {
  const { name, phone, skillLevel, certificationLevel } = body;
  if (!name) {
    return { ok: false, httpStatus: 400, error: 'Name is required' };
  }

  const technician = await technicianRepository.create({
    name,
    phone: phone || null,
    skillLevel: skillLevel || 'JUNIOR',
    certificationLevel: certificationLevel || null,
  });

  return { ok: true, technician };
}

export async function updateTechnician(id: string, body: any) {
  const { name, phone, skillLevel, certificationLevel, isActive } = body;
  return technicianRepository.update(id, {
    ...(name !== undefined && { name }),
    ...(phone !== undefined && { phone }),
    ...(skillLevel !== undefined && { skillLevel }),
    ...(certificationLevel !== undefined && { certificationLevel }),
    ...(isActive !== undefined && { isActive }),
  });
}

export async function deactivateTechnician(id: string) {
  return technicianRepository.deactivate(id);
}
