'use client';

import { useState } from 'react';
import { Button } from '@/components/admin/ui';
import { withBasePath } from '@/lib/basePath';

// Same rule the backend enforces (validateStaffPassword in
// backend/src/services/auth/passwordReset.service.ts) — checked here only so
// people see the problem before submitting; the server is the real gate.
function passwordProblem(pw: string): string | null {
  if (pw.length < 10) return 'At least 10 characters.';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Include at least one letter and one number.';
  return null;
}

export default function ChangePasswordForm({ forced }: { forced: boolean }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const problem = next ? passwordProblem(next) : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (next !== confirm) { setError('The new passwords do not match.'); return; }
    const p = passwordProblem(next);
    if (p) { setError(p); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/auth/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Password could not be changed.');
      setDone(true);
      // Full navigation so the server re-reads the session (mustChangePassword is now false).
      setTimeout(() => { window.location.href = withBasePath('/admin/analytics'); }, forced ? 800 : 1500);
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  };

  if (done) return <p className="text-sm font-medium text-green-600">Password changed. Taking you to the dashboard…</p>;

  const field = 'w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm';
  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="cp-current">Current (temporary) password</label>
        <input id="cp-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={field} required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="cp-new">New password</label>
        <input id="cp-new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={field} required />
        <p className={`mt-1 text-xs ${problem ? 'text-orange-600' : 'text-gray-500'}`}>
          {problem ?? 'At least 10 characters with a letter and a number.'}
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="cp-confirm">Confirm new password</label>
        <input id="cp-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={field} required />
      </div>
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      <Button type="submit" disabled={busy || !current || !next || !confirm}>
        {busy ? 'Saving…' : 'Change password'}
      </Button>
    </form>
  );
}
