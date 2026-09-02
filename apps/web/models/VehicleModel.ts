export class VehicleModel {
  id: string;
  name: string;
  slug: string;

  constructor(data: any) {
    this.id = data.id || '';
    this.name = data.name || '';
    this.slug = data.slug || '';
  }
}
