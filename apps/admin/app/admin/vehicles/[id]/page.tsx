import { requirePermission } from '@/lib/auth/middleware';
import { serverApiClient } from '@/lib/serverApiClient';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { withBasePath } from '@/lib/basePath';
import {
  ArrowLeft,
  Car,
  Clock3,
  DollarSign,
  Edit,
  Gauge,
  Image as ImageIcon,
  Package,
  ShieldCheck,
  Tag,
  Video,
  Warehouse,
} from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

function formatPrice(price: number | null | undefined) {
  const value = typeof price === 'number' ? price : 0;
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 0,
  }).format(value);
}

function getImageUrl(vehicle: { heroImageUrl: string | null; images: any }) {
  return (
    vehicle.heroImageUrl ||
    (Array.isArray(vehicle.images) && vehicle.images[0]) ||
    null
  );
}

function getSpec(specifications: any, path: string, fallback = '—') {
  const keys = path.split('.');
  let value = specifications || {};

  for (const key of keys) {
    value = value?.[key];
    if (value === undefined || value === null || value === '') {
      return fallback;
    }
  }

  // A path that resolves to an object/array (rather than a leaf scalar) is
  // a data-shape mismatch, not a renderable value — e.g. a vehicle whose
  // specifications JSON has a whole `performance`/`engine` section nested
  // one level deeper than this path expects. Rendering it directly as JSX
  // text throws "Objects are not valid as a React child"; fall back instead.
  if (typeof value === 'object' && value !== null) {
    return fallback;
  }

  return value ?? fallback;
}

function toDisplayArray(value: any): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) return [value];
  return [];
}

function isVideoUrl(url: string): boolean {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext)) || 
         lowerUrl.includes('youtube.com') || 
         lowerUrl.includes('youtu.be') ||
         lowerUrl.includes('vimeo.com');
}

function getYouTubeEmbedUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }
  return null;
}

function getVimeoEmbedUrl(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  if (match) {
    return `https://player.vimeo.com/video/${match[1]}`;
  }
  return null;
}

export default async function VehicleDetailsPage({ params }: Props) {
  await requirePermission('canViewVehicles');

  const { id } = await params;

  const client = await serverApiClient();

  let vehicle: any;
  try {
    const { data } = await client.get(`/vehicles/${id}`);
    vehicle = data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      notFound();
    }
    throw error;
  }

  const imageUrl = getImageUrl(vehicle);
  const displayPrice = vehicle.finalPrice ?? vehicle.basePrice;
  const images = toDisplayArray(vehicle.images);
    const videos = toDisplayArray(vehicle.heroVideoUrl ? [vehicle.heroVideoUrl] : []);
  const engineType = getSpec(vehicle.specifications, 'engine.type');
  const enginePower = getSpec(vehicle.specifications, 'engine.power');
  const transmission = getSpec(vehicle.specifications, 'engine.transmission');
  const drivetrain = getSpec(vehicle.specifications, 'engine.drivetrain');
  const fuelType = getSpec(vehicle.specifications, 'engine.fuelType');
  const fuelEconomy = getSpec(
    vehicle.specifications,
    'engine.fuelEconomy',
    getSpec(vehicle.specifications, 'engine.range')
  );
  const seating = getSpec(vehicle.specifications, 'dimensions.seatingCapacity');
  const warranty = getSpec(
    vehicle.specifications,
    'warranty.basic',
    getSpec(vehicle.specifications, 'warranty.powertrain')
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/vehicles" className="rounded-lg p-2 transition-colors hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="text-sm uppercase tracking-wide text-gray-500">{vehicle.category}</div>
            <h1 className="text-3xl font-bold text-gray-900">{vehicle.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {vehicle.model} {vehicle.year} · {vehicle.slug}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/admin/vehicles/${vehicle.id}/edit`}
            className="flex items-center gap-2 rounded-lg bg-geely-blue px-4 py-2 text-white transition-colors hover:bg-navy"
          >
            <Edit className="h-4 w-4" />
            Edit Vehicle
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <DollarSign className="mb-3 h-8 w-8 text-green-600" />
          <div className="text-2xl font-bold text-gray-900">{formatPrice(displayPrice)}</div>
          <p className="text-sm text-gray-500">Current Price</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <Package className="mb-3 h-8 w-8 text-geely-blue" />
          <div className="text-2xl font-bold text-gray-900">{vehicle.stock}</div>
          <p className="text-sm text-gray-500">Units in Stock</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <ShieldCheck className="mb-3 h-8 w-8 text-purple-600" />
          <div className="text-2xl font-bold text-gray-900">{vehicle.status}</div>
          <p className="text-sm text-gray-500">Publication Status</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <Clock3 className="mb-3 h-8 w-8 text-orange-500" />
          <div className="text-2xl font-bold text-gray-900">{vehicle.isFeatured ? 'Featured' : 'Standard'}</div>
          <p className="text-sm text-gray-500">Homepage Visibility</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Vehicle Details</h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Car className="mt-1 h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Model</div>
                  <div className="font-medium text-gray-900">{vehicle.model}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Tag className="mt-1 h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">SKU</div>
                  <div className="font-medium text-gray-900">{vehicle.sku || '—'}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Warehouse className="mt-1 h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Warehouse</div>
                  <div className="font-medium text-gray-900">{vehicle.warehouse || '—'}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Gauge className="mt-1 h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Stock Status</div>
                  <div className="font-medium text-gray-900">
                    {vehicle.stock === 0 ? 'Out of Stock' : vehicle.stock <= 5 ? 'Low Stock' : 'In Stock'}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ImageIcon className="mt-1 h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Images</div>
                  <div className="font-medium text-gray-900">
                    {Array.isArray(vehicle.images) ? vehicle.images.length : 0} image(s)
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Video className="mt-1 h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Videos</div>
                  <div className="font-medium text-gray-900">
                    {videos.length} video(s)
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <DollarSign className="mt-1 h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Tax Rate</div>
                  <div className="font-medium text-gray-900">{vehicle.taxRate}%</div>
                </div>
              </div>
            </div>
          </div>

          {vehicle.description && (
            <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
              {vehicle.description}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Main Media</h2>
          <div className="overflow-hidden rounded-lg bg-gray-100">
            {videos.length > 0 ? (
              // Show first video if available
              (() => {
                const videoUrl = videos[0];
                const youtubeEmbed = getYouTubeEmbedUrl(videoUrl);
                const vimeoEmbed = getVimeoEmbedUrl(videoUrl);
                
                if (youtubeEmbed || vimeoEmbed) {
                  return (
                    <iframe
                      src={youtubeEmbed || vimeoEmbed || ''}
                      className="w-full h-64"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  );
                } else {
                  return (
                    <video
                      controls
                      className="w-full h-64 object-cover"
                      src={withBasePath(videoUrl)}
                    >
                      Your browser does not support the video tag.
                    </video>
                  );
                }
              })()
            ) : imageUrl ? (
              <img src={withBasePath(imageUrl)} alt={vehicle.name} className="h-64 w-full object-cover" />
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-gray-500">
                No media available
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Specifications</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
              <span className="text-gray-500">Engine</span>
              <span className="font-medium text-gray-900">{engineType}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
              <span className="text-gray-500">Power</span>
              <span className="font-medium text-gray-900">{enginePower}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
              <span className="text-gray-500">Transmission</span>
              <span className="font-medium text-gray-900">{transmission}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
              <span className="text-gray-500">Drivetrain</span>
              <span className="font-medium text-gray-900">{drivetrain}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
              <span className="text-gray-500">Fuel Type</span>
              <span className="font-medium text-gray-900">{fuelType}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
              <span className="text-gray-500">Fuel Economy / Range</span>
              <span className="font-medium text-gray-900">{fuelEconomy}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Seating Capacity</span>
              <span className="font-medium text-gray-900">{seating}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Warranty</h2>
          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
            {warranty}
          </div>
          <h3 className="mt-6 mb-3 text-base font-semibold text-gray-900">Media Gallery</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Display Videos First */}
            {videos.map((videoUrl, index) => {
              const youtubeEmbed = getYouTubeEmbedUrl(videoUrl);
              const vimeoEmbed = getVimeoEmbedUrl(videoUrl);
              
              return (
                <div key={`video-${index}`} className="overflow-hidden rounded-lg bg-gray-100 relative">
                  {youtubeEmbed || vimeoEmbed ? (
                    <iframe
                      src={youtubeEmbed || vimeoEmbed || ''}
                      className="w-full h-24"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      controls
                      className="w-full h-24 object-cover"
                      src={withBasePath(videoUrl)}
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                  <div className="absolute top-1 right-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded">
                    VIDEO
                  </div>
                </div>
              );
            })}
            
            {/* Display Images */}
            {images.length > 0 ? (
              images.slice(0, 6 - videos.length).map((src, index) => (
                <div key={`image-${index}`} className="overflow-hidden rounded-lg bg-gray-100">
                  <img src={withBasePath(src)} alt={`${vehicle.name} ${index + 1}`} className="h-24 w-full object-cover" />
                </div>
              ))
            ) : videos.length === 0 ? (
              <div className="col-span-3 rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                No gallery media available
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Test Drives</h2>
          {vehicle.testDrives.length > 0 ? (
            <div className="space-y-3">
              {vehicle.testDrives.map((testDrive) => (
                <div key={testDrive.id} className="rounded-lg border border-gray-100 p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-900">{testDrive.customerName}</div>
                    <span className="text-xs text-gray-500">{testDrive.status}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(testDrive.preferredDate).toLocaleDateString()} at {testDrive.preferredTime}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No test drives recorded for this vehicle.</p>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Vehicle Information</h2>
          <div className="space-y-3">
            {vehicle.brand && (
              <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500">Brand</span>
                <span className="text-sm font-medium text-gray-900">{vehicle.brand.name}</span>
              </div>
            )}
            {vehicle.vehicleCategory && (
              <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500">Category</span>
                <span className="text-sm font-medium text-gray-900">{vehicle.vehicleCategory.name}</span>
              </div>
            )}
            <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
              <span className="text-sm text-gray-500">Total Test Drives</span>
              <span className="text-sm font-medium text-gray-900">{vehicle._count.testDrives}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
              <span className="text-sm text-gray-500">Year</span>
              <span className="text-sm font-medium text-gray-900">{vehicle.year}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-sm text-gray-500">Active Status</span>
              <span className="text-sm font-medium text-gray-900">{vehicle.isActive ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
