'use client';

import { Fragment, useEffect, useMemo, useState, useCallback } from 'react';
import { Check, X, Lock, RotateCcw, Search, Loader2 } from 'lucide-react';
import { Card, Button } from '@/components/admin/ui';
import { roleLabel } from '@/lib/auth/permissionGroups';
import { ADMIN_ROLES } from '@/lib/auth/types';

interface PermissionGroup {
  label: string;
  keys: { key: string; label: string }[];
}

interface MatrixData {
  roles: string[];
  lockedRole: string;
  permissionGroups: PermissionGroup[];
  effective: Record<string, Record<string, boolean>>;
  overrides: Record<string, Record<string, boolean>>;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

function PermissionCell({
  role,
  permKey,
  allowed,
  isOverride,
  locked,
  onToggle,
  onReset,
  busy,
}: {
  role: string;
  permKey: string;
  allowed: boolean;
  isOverride: boolean;
  locked: boolean;
  onToggle: () => void;
  onReset: () => void;
  busy: boolean;
}) {
  if (locked) {
    return (
      <span title="super_admin always has full access and can't be edited" className="inline-flex text-gray-300 dark:text-gray-600">
        <Lock className="w-3.5 h-3.5" />
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 group">
      <button
        type="button"
        onClick={onToggle}
        disabled={busy}
        title={`${allowed ? 'Revoke' : 'Grant'} for ${roleLabel(role)}`}
        className="disabled:opacity-40"
      >
        {allowed ? (
          <Check className={`w-4 h-4 ${isOverride ? 'text-blue-600' : 'text-green-600'}`} />
        ) : (
          <X className="w-4 h-4 text-gray-300 dark:text-gray-600" />
        )}
      </button>
      {isOverride && (
        <button
          type="button"
          onClick={onReset}
          disabled={busy}
          title="Reset to default"
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 disabled:opacity-40"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function AssignRoleWidget() {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [query, setQuery] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/users')
      .then((res) => res.json())
      .then((data) => setUsers(data.users ?? []));
  }, []);

  const results = useMemo(() => {
    if (!users || !query.trim()) return [];
    const q = query.trim().toLowerCase();
    return users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)).slice(0, 8);
  }, [users, query]);

  const assignRole = async (userId: string, role: string) => {
    setSavingId(userId);
    setMessage('');
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update role');
      setUsers((prev) => (prev ? prev.map((u) => (u.id === userId ? { ...u, role } : u)) : prev));
      setMessage(`Updated ${data.user.name}'s role to ${roleLabel(role)}.`);
    } catch (err: any) {
      setMessage(err.message || 'Failed to update role');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Card className="space-y-3">
      <div>
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Find a user &amp; assign a role</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Search by name or email, then pick a role. The same action is also available from each user's own profile at Admin Users.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users…"
          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg pl-9 pr-3 py-2 text-sm"
        />
      </div>

      {message && <p className="text-xs text-gray-500 dark:text-gray-400">{message}</p>}

      {!users ? (
        <p className="text-sm text-gray-400">Loading users…</p>
      ) : query.trim() && results.length === 0 ? (
        <p className="text-sm text-gray-400">No users match &quot;{query}&quot;.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {results.map((u) => (
            <li key={u.id} className="py-2.5 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{u.name}{!u.isActive && <span className="ml-2 text-xs text-red-500">(inactive)</span>}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={u.role}
                  onChange={(e) => assignRole(u.id, e.target.value)}
                  disabled={savingId === u.id}
                  className="border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-2 py-1.5 text-sm"
                >
                  {!ADMIN_ROLES.includes(u.role as (typeof ADMIN_ROLES)[number]) && (
                    <option value={u.role}>{roleLabel(u.role)} (portal)</option>
                  )}
                  {ADMIN_ROLES.map((r) => (
                    <option key={r} value={r}>{roleLabel(r)}</option>
                  ))}
                </select>
                {savingId === u.id && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function RolesPermissionsManager() {
  const [data, setData] = useState<MatrixData | null>(null);
  const [busyCell, setBusyCell] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/users/admin/role-permissions');
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cellKey = (role: string, key: string) => `${role}:${key}`;

  const toggle = async (role: string, key: string, current: boolean) => {
    setBusyCell(cellKey(role, key));
    setError('');
    try {
      const res = await fetch('/api/admin/users/admin/role-permissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, permissionKey: key, value: !current }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed to update permission');
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyCell(null);
    }
  };

  const reset = async (role: string, key: string) => {
    setBusyCell(cellKey(role, key));
    setError('');
    try {
      const res = await fetch(`/api/admin/role-permissions?role=${role}&permissionKey=${key}`, { method: 'DELETE' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed to reset permission');
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyCell(null);
    }
  };

  const resetRole = async (role: string) => {
    if (!confirm(`Reset ${roleLabel(role)} back to its default permissions? This clears every custom override for this role.`)) return;
    setError('');
    try {
      const res = await fetch(`/api/admin/role-permissions?role=${role}`, { method: 'DELETE' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed to reset role');
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!data) return <div className="text-gray-400 text-sm">Loading permissions…</div>;

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      <AssignRoleWidget />

      <Card padding="none" className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60">
              <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 sticky left-0 bg-gray-50 dark:bg-gray-900/60">Permission</th>
              {data.roles.map((role) => (
                <th key={role} className="text-center px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  <div className="flex flex-col items-center gap-1">
                    {roleLabel(role)}
                    {role !== data.lockedRole && (
                      <button
                        type="button"
                        onClick={() => resetRole(role)}
                        className="text-[10px] font-normal text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 normal-case"
                      >
                        Reset all
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.permissionGroups.map((group) => (
              <Fragment key={group.label}>
                <tr className="bg-gray-50/70 dark:bg-gray-900/40">
                  <td colSpan={data.roles.length + 1} className="px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {group.label}
                  </td>
                </tr>
                {group.keys.map(({ key, label }) => (
                  <tr key={key} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800">{label}</td>
                    {data.roles.map((role) => (
                      <td key={role} className="text-center px-4 py-2.5">
                        <PermissionCell
                          role={role}
                          permKey={key}
                          allowed={data.effective[role]?.[key] ?? false}
                          isOverride={data.overrides[role]?.[key] !== undefined}
                          locked={role === data.lockedRole}
                          busy={busyCell === cellKey(role, key)}
                          onToggle={() => toggle(role, key, data.effective[role]?.[key] ?? false)}
                          onReset={() => reset(role, key)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </Card>

      <p className="text-xs text-gray-400">
        Blue checks are custom overrides; green checks are the role's default. Hover an override to reset just that cell, or use &quot;Reset all&quot; for the whole role.
      </p>
    </div>
  );
}
