import { requirePermission } from '@/lib/auth/middleware';
import Link from 'next/link';
import { ArrowLeft, MapPin, Users, Car, Star, Clock, Phone, Mail, Edit, Globe, Image as ImageIcon } from 'lucide-react';
import { serverApiClient } from '@/lib/serverApiClient';
import { notFound } from 'next/navigation';
import { Card, CardTitle, LinkButton, StatTile, Badge } from '@/components/admin/ui';



export default async function DealerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  await requirePermission('canViewDealers');

  const client = await serverApiClient();
  let dealer;
  try {
    const res = await client.get(`/dealers/${id}`);
    dealer = res.data;
  } catch (error: any) {
    if (error?.response?.status === 404) notFound();
    throw error;
  }

  if (!dealer) {
    notFound();
  }

  const services: string[] = Array.isArray(dealer.services) ? (dealer.services as string[]) : [];
  const workingHours: any =
    dealer.workingHours && typeof dealer.workingHours === 'object'
      ? dealer.workingHours
      : {};
  const contact: any =
    dealer.contact && typeof dealer.contact === 'object' ? dealer.contact : {};
  const address: any =
    dealer.address && typeof dealer.address === 'object' ? dealer.address : {};
  const gallery: string[] = Array.isArray(dealer.gallery) ? (dealer.gallery as string[]) : [];
  const facilities: any =
    dealer.facilities && typeof dealer.facilities === 'object' ? dealer.facilities : {};

  const addressLines = [
    address.street,
    address.area,
    address.city || dealer.city,
    address.region || dealer.region,
    address.country || dealer.country,
  ].filter(Boolean);

  const facilityLabels: { key: string; label: string }[] = [
    { key: 'showroom', label: 'Showroom' },
    { key: 'serviceCenter', label: 'Service Center' },
    { key: 'partsShop', label: 'Parts Shop' },
    { key: 'testDriveArea', label: 'Test Drive Area' },
    { key: 'customerLounge', label: 'Customer Lounge' },
  ];

  const activeFacilities = facilityLabels.filter((f) => facilities[f.key]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dealers" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-4">
            {dealer.logo && (
              <img
                src={dealer.logo}
                alt={`${dealer.name} logo`}
                className="w-14 h-14 rounded-lg object-contain bg-gray-50 border border-gray-200 p-1"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{dealer.name}</h1>
              <p className="mt-1 text-sm text-gray-500">{dealer.city}, {dealer.region}, {dealer.country}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={dealer.active ? 'green' : 'gray'}>{dealer.active ? 'Published' : 'Unpublished'}</Badge>
          <LinkButton href={`/admin/dealers/${dealer.id}/edit`}>
            <Edit className="w-4 h-4" />
            Edit Dealer
          </LinkButton>
        </div>
      </div>

      {/* Description */}
      {dealer.description && (
        <Card>
          <CardTitle className="text-lg mb-3">Description</CardTitle>
          <p className="text-gray-700 whitespace-pre-line">{dealer.description}</p>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatTile label="Location" value={dealer.city} icon={MapPin} />
        <StatTile label="Total Sales" value={dealer.salesCount} icon={Car} />
        <StatTile label="Staff Members" value={dealer.staffCount} icon={Users} />
        <StatTile label="Customer Rating" value={dealer.rating.toFixed(1)} icon={Star} />
      </div>

      {/* Gallery */}
      {gallery.length > 0 && (
        <Card>
          <CardTitle className="text-lg mb-4 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-gray-400" />
            Gallery
          </CardTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {gallery.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`${dealer.name} gallery ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
              />
            ))}
          </div>
        </Card>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card>
          <CardTitle className="text-lg mb-4">Contact Information</CardTitle>
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <span className="text-gray-700">{addressLines.join(', ') || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">{contact.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">{contact.email || 'N/A'}</span>
            </div>
            {dealer.website && (
              <div className="flex items-center gap-3 text-sm">
                <Globe className="w-4 h-4 text-gray-400" />
                <a href={dealer.website} target="_blank" rel="noopener noreferrer" className="text-geely-blue hover:underline">
                  {dealer.website}
                </a>
              </div>
            )}
            <div className="flex items-start gap-3 text-sm">
              <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
              <div className="text-gray-700">
                <div>Mon-Fri: {workingHours.weekdays || workingHours.weekday || 'N/A'}</div>
                <div>Sat: {workingHours.saturday || 'N/A'}</div>
                <div>Sun: {workingHours.sunday || 'N/A'}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Services Offered */}
        <Card>
          <CardTitle className="text-lg mb-4">Services Offered</CardTitle>
          <div className="flex flex-wrap gap-2">
            {services.length > 0 ? (
              services.map((service, index) => (
                <Badge key={index} tone="blue">{service}</Badge>
              ))
            ) : (
              <span className="text-gray-500 text-sm">No services listed</span>
            )}
          </div>

          {activeFacilities.length > 0 && (
            <>
              <CardTitle className="text-lg mt-6 mb-3">Facilities</CardTitle>
              <div className="flex flex-wrap gap-2">
                {activeFacilities.map((f) => (
                  <Badge key={f.key} tone="green">{f.label}</Badge>
                ))}
                {facilities.parking && (
                  <Badge tone="green">Parking: {facilities.parking}</Badge>
                )}
              </div>
            </>
          )}
        </Card>

        {/* Map Location */}
        <Card>
          <CardTitle className="text-lg mb-4">Map Location</CardTitle>
          {dealer.latitude && dealer.longitude ? (
            <>
              <div className="h-[220px] rounded-lg overflow-hidden border border-gray-200 mb-3">
                <iframe
                  src={`https://www.google.com/maps?q=${dealer.latitude},${dealer.longitude}&output=embed`}
                  title={`${dealer.name} location map`}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <p className="text-sm text-gray-600">
                Coordinates: {dealer.latitude.toFixed(5)}, {dealer.longitude.toFixed(5)}
              </p>
            </>
          ) : (
            <p className="text-gray-500 text-sm">No map coordinates set. Edit the dealer to add a location.</p>
          )}
        </Card>

        {/* Status */}
        <Card>
          <CardTitle className="text-lg mb-4">Status</CardTitle>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Published</span>
              <Badge tone={dealer.active ? 'green' : 'red'}>{dealer.active ? 'Yes' : 'No'}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Featured</span>
              <Badge tone={dealer.featured ? 'orange' : 'gray'}>{dealer.featured ? 'Yes' : 'No'}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Created</span>
              <span className="text-sm text-gray-900">
                {new Date(dealer.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Updated</span>
              <span className="text-sm text-gray-900">
                {new Date(dealer.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
