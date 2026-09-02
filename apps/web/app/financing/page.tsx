"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, CreditCard, ShieldCheck } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { withBasePath } from "@/lib/publicPath";

interface Vehicle {
  id: string;
  name: string;
  basePrice: number;
  finalPrice?: number | null;
  hidePrice?: boolean;
  heroImageUrl?: string | null;
}

interface Bank {
  id: string;
  name: string;
  logoUrl?: string | null;
}

const formatETB = (value: number) => `ETB ${Math.round(value).toLocaleString("en-US")}`;

export default function PurchasePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);

  useEffect(() => {
    async function load() {
      const [vehiclesResponse, banksResponse] = await Promise.all([
        fetch("/api/public/vehicles"),
        fetch("/api/public/financing-banks"),
      ]);
      const vehiclesData = await vehiclesResponse.json().catch(() => []);
      const banksData = await banksResponse.json().catch(() => []);
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : vehiclesData?.vehicles || []);
      setBanks(Array.isArray(banksData) ? banksData.filter((bank: { _count?: { financingPrograms?: number } }) => (bank._count?.financingPrograms ?? 1) > 0) : []);
    }
    void load();
  }, []);

  return (
    <MainLayout>
      <section className="bg-navy text-white py-20">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10">
          <div className="max-w-3xl">
            <div className="text-[13px] tracking-[0.2em] text-gold font-bold mb-3 uppercase">BUY YOUR GEELY</div>
            <h1 className="disp text-4xl md:text-6xl font-bold mb-5">Own Your Geely Directly</h1>
            <p className="text-[#d8e4f5] text-lg leading-relaxed mb-8">Choose your vehicle, select a supported bank, and complete your purchase with secure online bank payment.</p>
            <Link href="/financing/apply" className="inline-flex items-center gap-2 bg-gold text-[#2c2308] font-bold px-8 py-4 rounded-lg hover:bg-opacity-90 transition-all">Purchase Vehicle <CreditCard size={20} /></Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-ice dark:bg-midnight transition-colors">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10">
          <div className="text-center mb-10">
            <h2 className="disp text-3xl md:text-4xl font-bold text-navy dark:text-ice mb-3">A Simple Purchase Journey</h2>
            <p className="text-steel dark:text-steel-light max-w-2xl mx-auto">From selecting your Geely to receiving your delivery confirmation, every step is clear and secure.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              ["1", "Choose Your Vehicle", "Select the Geely model, color, and quantity you want to purchase."],
              ["2", "Select Your Bank", "Choose from supported Ethiopian banks configured by our team."],
              ["3", "Pay and Confirm", "Authenticate through your bank and receive your purchase reference."],
            ].map(([step, title, description]) => (
              <div key={step} className="bg-white dark:bg-midnight-surface rounded-xl border border-line dark:border-midnight-line p-7">
                <div className="w-11 h-11 rounded-full bg-geely-blue text-white flex items-center justify-center font-bold text-lg mb-5">{step}</div>
                <h3 className="font-bold text-navy dark:text-ice text-lg mb-2">{title}</h3>
                <p className="text-sm text-steel dark:text-steel-light leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <div className="text-xs tracking-widest text-geely-blue font-bold mb-2 uppercase">AVAILABLE VEHICLES</div>
              <h2 className="disp text-3xl md:text-4xl font-bold text-navy dark:text-ice">Select Your Geely</h2>
            </div>
            <Link href="/financing/apply" className="hidden md:inline-block text-geely-blue font-bold hover:underline">Purchase now →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {vehicles.map((vehicle) => {
              const price = vehicle.finalPrice ?? vehicle.basePrice;
              return (
                <div key={vehicle.id} className="bg-white dark:bg-midnight-surface rounded-xl border border-line dark:border-midnight-line overflow-hidden hover:shadow-lg transition-all">
                  <div className="h-44 bg-gradient-to-br from-[#dfe8f5] to-[#c7d6ec] flex items-center justify-center">
                    {vehicle.heroImageUrl ? <img src={withBasePath(vehicle.heroImageUrl)} alt={vehicle.name} className="w-full h-full object-cover" /> : <span className="text-steel dark:text-steel-light text-sm">{vehicle.name}</span>}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-navy dark:text-ice mb-2">{vehicle.name}</h3>
                    <div className="text-geely-blue font-bold mb-4">
                      {vehicle.hidePrice ? "Price on request" : formatETB(price)}
                    </div>
                    <Link href={`/financing/apply?vehicle=${vehicle.id}`} className="block text-center bg-geely-blue text-white font-bold text-sm py-3 rounded-lg hover:bg-navy transition-all">Purchase This Vehicle</Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-navy text-white py-14">
        <div className="max-w-[1000px] mx-auto px-6 md:px-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div><ShieldCheck className="text-gold mx-auto mb-3" size={30} /><h3 className="font-bold mb-1">Secure Bank Payment</h3><p className="text-sm text-[#b9cbe4]">Payment is authenticated through your selected bank.</p></div>
          <div><CheckCircle className="text-gold mx-auto mb-3" size={30} /><h3 className="font-bold mb-1">Purchase Confirmation</h3><p className="text-sm text-[#b9cbe4]">Receive a transaction ID and purchase reference.</p></div>
          <div><CreditCard className="text-gold mx-auto mb-3" size={30} /><h3 className="font-bold mb-1">Delivery Support</h3><p className="text-sm text-[#b9cbe4]">Our sales team coordinates the next delivery steps.</p></div>
        </div>
        {banks.length > 0 && <p className="text-center text-xs text-[#b9cbe4] mt-8">Supported banks are shown during vehicle purchase.</p>}
      </section>
    </MainLayout>
  );
}
