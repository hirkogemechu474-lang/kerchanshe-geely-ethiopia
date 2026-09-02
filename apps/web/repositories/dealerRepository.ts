export const dealerRepository = {
  async findAll() { return []; },
  async findById(id: string) { return null; },
  async findBySlug(slug: string) { return null; },
  async create(data: any) { return { id: 'mock-id', ...data }; },
  async update(id: string, data: any) { return { id, ...data }; },
  async delete(id: string) { return { id }; },
};
