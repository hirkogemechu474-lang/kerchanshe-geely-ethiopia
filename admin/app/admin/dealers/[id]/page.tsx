import { requirePermission } from '@/lib/auth/middleware';
import Link from 'next/link';
import { ArrowLeft, MapPin, Users, Car, Star, Clock, Phone, Mail, Edit, Globe, Image as ImageIcon } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';



export default async function DealerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  await requirePermission('canViewDealers');

  const dealer = await prisma.dealer.findUnique({
    where: { id: id },
  });

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
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            dealer.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {dealer.active ? 'Published' : 'Unpublished'}
          </span>
          <Link
            href={`/admin/dealers/${dealer.id}/edit`}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit Dealer
          </Link>
        </div>
      </div>

      {/* Description */}
      {dealer.description && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
          <p className="text-gray-700 whitespace-pre-line">{dealer.description}</p>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <MapPin className="w-8 h-8 text-blue-600 mb-3" />
          <div className="text-2xl font-bold text-gray-900">{dealer.city}</div>
          <p className="text-sm text-gray-500">Location</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Car className="w-8 h-8 text-green-600 mb-3" />
          <div className="text-2xl font-bold text-gray-900">{dealer.salesCount}</div>
          <p className="text-sm text-gray-500">Total Sales</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Users className="w-8 h-8 text-purple-600 mb-3" />
          <div className="text-2xl font-bold text-gray-900">{dealer.staffCount}</div>
          <p className="text-sm text-gray-500">Staff Members</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Star className="w-8 h-8 text-yellow-500 mb-3 fill-current" />
          <div className="text-2xl font-bold text-gray-900">{dealer.rating.toFixed(1)}</div>
          <p className="text-sm text-gray-500">Customer Rating</p>
        </div>
      </div>

      {/* Gallery */}
      {gallery.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-gray-400" />
            Gallery
          </h2>
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
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
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
                <a href={dealer.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
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
        </div>

        {/* Services Offered */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Services Offered</h2>
          <div className="flex flex-wrap gap-2">
            {services.length > 0 ? (
              services.map((service, index) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {service}
                </span>
              ))
            ) : (
              <span className="text-gray-500 text-sm">No services listed</span>
            )}
          </div>

          {activeFacilities.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Facilities</h2>
              <div className="flex flex-wrap gap-2">
                {activeFacilities.map((f) => (
                  <span key={f.key} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    {f.label}
                  </span>
                ))}
                {facilities.parking && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    Parking: {facilities.parking}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Map Location */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Map Location</h2>
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
        </div>

        {/* Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Published</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                dealer.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {dealer.active ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Featured</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                dealer.featured ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {dealer.featured ? 'Yes' : 'No'}
              </span>
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
        </div>
      </div>
    </div>
  );
}
