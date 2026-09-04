'use client';

import Link from 'next/link';
import { ArrowRight, CarFront, MapPin, MessageCircle, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { type VehicleRecord } from '@/services/vehicleService';
import { withBasePath } from '@/lib/publicPath';

type ModelFilter = 'ALL' | 'SUV' | 'SEDAN' | 'NEV';

function vehicleImage(vehicle: VehicleRecord) {
  if (vehicle.heroImageUrl) return withBasePath(vehicle.heroImageUrl);
  if (Array.isArray(vehicle.images) && typeof vehicle.images[0] === 'string') return withBasePath(vehicle.images[0]);
  return null;
}

export default function ConfigureLandingPage() {
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [filter, setFilter] = useState<ModelFilter>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch('/api/public/vehicles')
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : data?.vehicles || [];
        setVehicles(list);
      })
      .catch(() => setVehicles([]))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const visibleVehicles = useMemo(() => {
    if (filter === 'ALL') return vehicles;
    return vehicles.filter((vehicle) => {
      const category = `${vehicle.category} ${vehicle.vehicleCategory?.name || ''}`.toUpperCase();
      return filter === 'NEV' ? /ELECTRIC|EV|NEV|HYBRID/.test(category) : category.includes(filter);
    });
  }, [filter, vehicles]);

  return (
    <MainLayout>
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(42,117,188,.45),transparent_35%)]" />
        <div className="relative mx-auto grid max-w-[1400px] gap-10 px-6 py-20 md:grid-cols-[1fr_1.15fr] md:px-10 md:py-28">
          <div className="flex flex-col justify-center">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-gold">Geely Ethiopia digital showroom</p>
            <h1 className="disp mb-6 text-5xl font-bold leading-[.98] md:text-7xl">Find your next Geely.</h1>
            <p className="mb-8 max-w-xl text-lg leading-relaxed text-blue-100">Explore our models, compare the details that matter, and build the vehicle that fits your life in Ethiopia.</p>
            <div className="flex flex-wrap gap-3">
              <a href="#models" className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 font-bold text-[#2c2308]">Explore models <ArrowRight size={18} /></a>
              <Link href="/dealers" className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-6 py-3 font-bold hover:bg-white dark:hover:bg-midnight-surface dark:hover:bg-midnight-surface dark:hover:bg-midnight-surface/10"><MapPin size={18} /> Find a dealer</Link>
            </div>
          </div>
          <div className="relative flex min-h-[290px] items-center justify-center rounded-2xl border border-white/15 bg-white dark:bg-midnight-surface/5 p-6 backdrop-blur-sm md:min-h-[410px]">
            {vehicles[0] && vehicleImage(vehicles[0]) ? <img src={vehicleImage(vehicles[0])!} alt={vehicles[0].name} className="max-h-[360px] w-full object-contain" /> : <CarFront size={150} className="text-white/30" />}
            <div className="absolute bottom-5 left-5 rounded-lg bg-black/30 px-4 py-3 backdrop-blur"><p className="text-xs uppercase tracking-widest text-blue-200">Featured model</p><p className="font-bold">{vehicles[0]?.name || 'Geely models'}</p></div>
          </div>
        </div>
      </section>

      <section id="models" className="mx-auto max-w-[1400px] px-6 py-16 md:px-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div><p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-geely-blue">Digital showroom</p><h2 className="disp text-4xl font-bold text-navy dark:text-ice md:text-5xl">Choose your model</h2></div>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter models">
            {(['ALL', 'SUV', 'SEDAN', 'NEV'] as ModelFilter[]).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-full px-4 py-2 text-xs font-bold tracking-wider transition ${filter === item ? 'bg-navy text-white' : 'border border-line dark:border-midnight-line bg-white dark:bg-midnight-surface text-steel dark:text-steel-light hover:border-geely-blue'}`}>{item}</button>)}
          </div>
        </div>
        {loading ? <div className="rounded-xl border border-line dark:border-midnight-line bg-white dark:bg-midnight-surface p-10 text-center text-steel dark:text-steel-light">Loading models…</div> : visibleVehicles.length === 0 ? <div className="rounded-xl border border-line dark:border-midnight-line bg-white dark:bg-midnight-surface p-10 text-center text-steel dark:text-steel-light">No models are currently available in this category.</div> : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{visibleVehicles.map((vehicle) => { const image = vehicleImage(vehicle); return <article key={vehicle.id} className="group overflow-hidden rounded-2xl border border-line dark:border-midnight-line bg-white dark:bg-midnight-surface shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className="flex h-56 items-center justify-center bg-gradient-to-br from-[#edf4fb] to-white p-5">{image ? <img src={image} alt={vehicle.name} className="h-full w-full object-contain transition duration-500 group-hover:scale-105" /> : <CarFront size={90} className="text-geely-blue/30" />}</div><div className="p-6"><div className="mb-2 flex items-center justify-between gap-3"><span className="text-xs font-bold uppercase tracking-widest text-geely-blue">{vehicle.category || 'Geely'}</span>{vehicle.isFeatured && <span className="rounded-full bg-gold/20 px-2 py-1 text-[10px] font-bold text-[#8a6500]">Featured</span>}</div><h3 className="mb-2 text-2xl font-bold text-navy dark:text-ice">{vehicle.name}</h3><p className="mb-5 line-clamp-2 min-h-10 text-sm text-steel dark:text-steel-light">{vehicle.description || 'Discover Geely design, technology, and everyday confidence.'}</p><div className="mb-5 flex items-end justify-between gap-3"><Link href={`/models/${vehicle.slug}`} className="text-sm font-bold text-geely-blue hover:underline">Discover</Link></div><Link href={`/configurator?vehicle=${encodeURIComponent(vehicle.id)}`} className="flex items-center justify-center gap-2 rounded-lg bg-geely-blue py-3 font-bold text-white transition hover:bg-navy">Configure this model <ArrowRight size={17} /></Link></div></article>; })}</div>}
      </section>

      <section className="bg-navy text-white"><div className="mx-auto grid max-w-[1400px] gap-8 px-6 py-16 md:grid-cols-3 md:px-10"><div><Zap className="mb-4 text-gold" size={30} /><h3 className="mb-2 text-xl font-bold">Discover Geely</h3><p className="text-sm leading-relaxed text-blue-100">Smart technology, thoughtful design, and confidence for every Ethiopian road.</p></div><div><MapPin className="mb-4 text-gold" size={30} /><h3 className="mb-2 text-xl font-bold">Find your nearest dealer</h3><p className="mb-3 text-sm leading-relaxed text-blue-100">Visit a showroom, speak with our team, and experience your preferred model.</p><Link href="/dealers" className="text-sm font-bold text-gold hover:underline">Find a dealer →</Link></div><div><MessageCircle className="mb-4 text-gold" size={30} /><h3 className="mb-2 text-xl font-bold">Need help choosing?</h3><p className="mb-3 text-sm leading-relaxed text-blue-100">Our team can help with pricing, financing, test drives, and vehicle availability.</p><Link href="/contact" className="text-sm font-bold text-gold hover:underline">Contact us →</Link></div></div></section>
    </MainLayout>
  );
}
