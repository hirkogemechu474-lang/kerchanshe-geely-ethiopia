'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/admin/ui';

// Job title (e.g. "Sales Manager", "General Manager") printed alongside this
// user's name and signature on approved documents (quotations, agreements,
// invoices, handover notes — see backend/src/services/pdf/pdfLayout.ts's
// drawSignatureBlock). Previously only settable by an admin editing someone
// else via Users management (EditUserForm.tsx); this lets a user set their
// own without needing that permission.
export default function ProfileTitleForm({ userId, initialTitle }: { userId: string; initialTitle: string }) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save title');
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save title');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor="profile-title" className="block text-xs font-medium text-gray-600">Job title</label>
      <div className="flex gap-2">
        <input
          id="profile-title"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setSaved(false); }}
          placeholder="e.g. Sales Manager, General Manager"
          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-transparent focus:ring-2 focus:ring-geely-blue"
        />
        {title !== initialTitle && (
          <Button variant="secondary" onClick={save} disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        )}
      </div>
      <p className="text-xs text-gray-400">Printed alongside your name and signature on approved documents.</p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {saved && <p className="text-xs text-green-600">Saved.</p>}
    </div>
  );
}
