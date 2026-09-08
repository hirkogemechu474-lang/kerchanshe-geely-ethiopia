import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { Model3DViewer } from "@/components/Model3DViewer";
import { withBasePath } from "@/lib/publicPath";
import { Metadata } from "next";

export const revalidate = 60;

function publicMediaUrl(url: string | null | undefined) {
  return withBasePath(url);
}

async function getVehicle(id: string) {
  try {
    const { data: vehicle } = await apiClient.get(`/public/vehicles/${id}`);
    if (!vehicle || vehicle.status !== "published") return null;
    return vehicle;
  } catch {
    return null;
  }
}

async function getShowcase(vehicleId: string) {
  try {
    const { data } = await apiClient.get(`/public/showcase?vehicleId=${encodeURIComponent(vehicleId)}`);
    const showcases = Array.isArray(data) ? data : [];
    return showcases[0] ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const vehicle = await getVehicle(id);
  if (!vehicle) return {};
  return {
    title: `${vehicle.name} — Interactive 3D Viewer`,
    // A utility view of content already indexed on the vehicle's own page.
    robots: { index: false, follow: true },
  };
}

// Dedicated, full-page 3D viewer — opened from the vehicle page's "3D Model"
// tab so the drag-to-rotate model gets a proper immersive presentation
// instead of the small embedded preview there.
export default async function Vehicle3DViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = await getVehicle(id);
  if (!vehicle) notFound();

  const showcase = await getShowcase(vehicle.slug || id);
  const modelUrl = publicMediaUrl(showcase?.modelUrl) || null;
  if (!modelUrl) notFound();

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gradient-to-b from-slate-950 to-slate-900">
      <header className="flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <Link
          href={`/models/${vehicle.slug}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition-colors hover:text-white"
        >
          <ArrowLeft size={18} />
          Back to {vehicle.name}
        </Link>
        <div className="text-right">
          <div className="text-[11px] font-bold uppercase tracking-widest text-white/40">
            Interactive 3D
          </div>
          <div className="text-lg font-bold text-white">{vehicle.name}</div>
        </div>
      </header>

      <div className="relative flex-1">
        <Model3DViewer src={modelUrl} alt={`${vehicle.name} 3D model`} className="h-full w-full" />
      </div>

      <p className="px-4 pb-6 text-center text-xs text-white/40 sm:px-8">
        Drag to rotate &middot; Scroll or pinch to zoom
      </p>
    </div>
  );
}
