"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Mail, MapPin, Phone, Send, MessageCircle } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { useCRMSubmit } from "@/hooks/useCRMSubmit";

const FALLBACK_CONTACT = {
  phone: "+251 11 000 0000",
  email: "info@geelyethiopia.com",
  whatsapp: "+251 99 338 9874",
};

export default function ContactPage() {
  const { submitLead, loading } = useCRMSubmit();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contact, setContact] = useState(FALLBACK_CONTACT);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    nationalId: "",
    subject: "General enquiry",
    message: "",
    consentGiven: false,
  });

  useEffect(() => {
    fetch("/api/public/contact-information")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setContact({
          phone: d.phone?.primary || FALLBACK_CONTACT.phone,
          email: d.email?.general || FALLBACK_CONTACT.email,
          whatsapp: d.whatsapp || FALLBACK_CONTACT.whatsapp,
        });
      })
      .catch(() => {});
  }, []);

  function update(field: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await submitLead({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        nationalId: form.nationalId,
        leadType: "contact",
        message: `${form.subject}: ${form.message}`,
        consentGiven: form.consentGiven,
      });
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to send your enquiry.");
    }
  }

  return (
    <MainLayout>
      <section className="bg-navy text-white py-16">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <p className="text-gold text-xs font-bold tracking-[0.16em] mb-3">CONTACT & SUPPORT</p>
          <h1 className="disp text-5xl font-bold mb-4">How can we help?</h1>
          <p className="max-w-2xl text-blue-100">Speak with the Geely Ethiopia team about vehicles, finance, service, parts, or dealership support.</p>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="space-y-5">
            <h2 className="disp text-3xl font-bold text-navy dark:text-ice">Get in touch</h2>
            <p className="text-steel dark:text-steel-light">Our team will review your message and respond during business hours.</p>
            <a href={`tel:${contact.phone.replace(/[^0-9+]/g, "")}`} className="flex items-center gap-3 text-navy dark:text-ice hover:text-geely-blue"><Phone className="text-geely-blue" size={20} /> {contact.phone}</a>
            <a href={`mailto:${contact.email}`} className="flex items-center gap-3 text-navy dark:text-ice hover:text-geely-blue"><Mail className="text-geely-blue" size={20} /> {contact.email}</a>
            <a href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-navy dark:text-ice hover:text-geely-blue"><MessageCircle className="text-geely-blue" size={20} /> WhatsApp support</a>
            <div className="flex items-start gap-3 text-steel dark:text-steel-light"><MapPin className="text-geely-blue mt-0.5" size={20} /><span>Kerchanshe Group Geely showroom, Sarbet, Addis Ababa</span></div>
            <div className="pt-4 flex flex-wrap gap-3">
              <Link href="/test-drive" className="bg-geely-blue text-white px-4 py-2 rounded font-semibold">Book a test drive</Link>
              <Link href="/dealers" className="border border-line dark:border-midnight-line text-navy dark:text-ice px-4 py-2 rounded font-semibold">Find a dealer</Link>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-midnight-surface border border-line dark:border-midnight-line rounded-xl p-6 lg:p-8">
            {submitted ? (
              <div className="py-14 text-center">
                <div className="text-4xl mb-4">✓</div>
                <h2 className="text-2xl font-bold text-navy dark:text-ice mb-2">Message received</h2>
                <p className="text-steel dark:text-steel-light">Thank you. A Geely Ethiopia representative will contact you shortly.</p>
                <button onClick={() => { setSubmitted(false); setForm((current) => ({ ...current, message: "" })); }} className="mt-6 text-geely-blue font-semibold">Send another message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input required value={form.firstName} onChange={(e) => update("firstName", e.target.value)} placeholder="First name *" className="border border-line dark:border-midnight-line dark:bg-midnight dark:text-ice rounded-lg px-4 py-3" />
                  <input required value={form.lastName} onChange={(e) => update("lastName", e.target.value)} placeholder="Last name *" className="border border-line dark:border-midnight-line dark:bg-midnight dark:text-ice rounded-lg px-4 py-3" />
                  <input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="Email address *" className="border border-line dark:border-midnight-line dark:bg-midnight dark:text-ice rounded-lg px-4 py-3" />
                  <input required type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="Phone number *" className="border border-line dark:border-midnight-line dark:bg-midnight dark:text-ice rounded-lg px-4 py-3" />
                  <input required value={form.nationalId} onChange={(e) => update("nationalId", e.target.value)} placeholder="National ID / Driver's License *" className="border border-line dark:border-midnight-line dark:bg-midnight dark:text-ice rounded-lg px-4 py-3 md:col-span-2" />
                </div>
                <select value={form.subject} onChange={(e) => update("subject", e.target.value)} className="w-full border border-line dark:border-midnight-line dark:bg-midnight dark:text-ice rounded-lg px-4 py-3">
                  <option>General enquiry</option><option>Vehicle sales</option><option>Financing</option><option>Service and parts</option><option>Dealership support</option>
                </select>
                <textarea required rows={6} value={form.message} onChange={(e) => update("message", e.target.value)} placeholder="How can we help? *" className="w-full border border-line dark:border-midnight-line dark:bg-midnight dark:text-ice rounded-lg px-4 py-3" />
                <label className="flex items-start gap-3 text-sm text-steel dark:text-steel-light"><input required type="checkbox" checked={form.consentGiven} onChange={(e) => update("consentGiven", e.target.checked)} className="mt-1" /> I agree that Geely Ethiopia may use my details to respond to this enquiry.</label>
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <button disabled={loading} className="inline-flex items-center gap-2 bg-geely-blue text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50"><Send size={17} />{loading ? "Sending..." : "Send enquiry"}</button>
              </form>
            )}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
