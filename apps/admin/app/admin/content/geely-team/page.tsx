'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Image as ImageIcon, Plus, RefreshCw, Save, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import ImageUploader from '@/components/admin/ImageUploader';

type TeamMember = { id: string; name: string; role: string; bio: string; imageUrl: string; displayOrder: number; isActive: boolean };
const emptyMember = (): TeamMember => ({ id: crypto.randomUUID(), name: '', role: '', bio: '', imageUrl: '', displayOrder: 0, isActive: true });

export default function GeelyTeamContentPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/content/geely-team').then((res) => res.json()).then((data) => setMembers(data.members || [])).finally(() => setLoading(false));
  }, []);

  const update = (index: number, changes: Partial<TeamMember>) => setMembers((current) => current.map((member, i) => i === index ? { ...member, ...changes } : member));
  const save = async () => {
    setSaving(true); setMessage('');
    try {
      const res = await fetch('/api/admin/content/geely-team', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ members }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setMembers(data.members); setMessage('Geely Team saved successfully.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Save failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center text-gray-500"><RefreshCw className="mr-2 h-5 w-5 animate-spin" />Loading Geely Team…</div>;

  return <div className="mx-auto max-w-5xl space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div><Link href="/admin/content/hero" className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"><ArrowLeft className="h-4 w-4" />Content Management</Link><h1 className="text-3xl font-bold text-gray-900">Geely Team</h1><p className="mt-1 text-sm text-gray-500">Manage the team section shown below the news page.</p></div>
      <button onClick={save} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-geely-blue px-5 py-2.5 font-semibold text-white hover:bg-navy disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save Team'}</button>
    </div>
    {message && <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">{message}</div>}
    <div className="space-y-5">
      {members.map((member, index) => <div key={member.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2 font-semibold text-gray-900"><Users className="h-5 w-5 text-geely-blue" />Team member {index + 1}</div><button type="button" onClick={() => setMembers((current) => current.filter((_, i) => i !== index))} className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" />Remove</button></div>
        <div className="grid gap-5 md:grid-cols-[180px_1fr]">
          <div>{member.imageUrl ? <img src={member.imageUrl} alt={member.name || 'Team member'} className="mb-2 h-40 w-full rounded-xl object-cover" /> : <div className="mb-2 flex h-40 items-center justify-center rounded-xl bg-gray-100 text-gray-400"><ImageIcon className="h-8 w-8" /></div>}<ImageUploader label="Team image" value={member.imageUrl} onChange={(value) => update(index, { imageUrl: value })} category="team" aspect="square" /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-gray-700">Name<input value={member.name} onChange={(e) => update(index, { name: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal" placeholder="Full name" /></label>
            <label className="text-sm font-semibold text-gray-700">Role<input value={member.role} onChange={(e) => update(index, { role: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal" placeholder="Sales Manager" /></label>
            <label className="text-sm font-semibold text-gray-700">Display order<input type="number" value={member.displayOrder} onChange={(e) => update(index, { displayOrder: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal" /></label>
            <label className="flex items-center gap-2 pt-7 text-sm font-semibold text-gray-700"><input type="checkbox" checked={member.isActive} onChange={(e) => update(index, { isActive: e.target.checked })} className="h-4 w-4" />Show on website</label>
            <label className="text-sm font-semibold text-gray-700 sm:col-span-2">Short bio<textarea value={member.bio} onChange={(e) => update(index, { bio: e.target.value })} rows={3} className="mt-1 w-full resize-y rounded-lg border border-gray-300 px-3 py-2 font-normal" placeholder="A short description of this team member's responsibility" /></label>
          </div>
        </div>
      </div>)}
    </div>
    <button type="button" onClick={() => setMembers((current) => [...current, { ...emptyMember(), displayOrder: current.length }])} className="inline-flex items-center gap-2 rounded-xl border border-dashed border-geely-blue px-4 py-3 font-semibold text-geely-blue hover:bg-blue-50"><Plus className="h-4 w-4" />Add team member</button>
  </div>;
}
