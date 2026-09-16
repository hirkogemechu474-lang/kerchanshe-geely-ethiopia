'use client';

import { useState } from 'react';
import { TableCard, THead, TBody, Tr, Th, Td, Badge, Button, EmptyTableRow } from '@/components/admin/ui';
import { roleLabel } from '@/types';
import { resolveDocumentUrl, isPdfUrl } from '@/lib/fileType';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
  signatureUrl: string | null;
  signatureUpdatedAt: string | null;
}

export default function StaffSignaturesTable({ users, webAppUrl }: { users: StaffUser[]; webAppUrl: string }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ id: string; text: string } | null>(null);

  const sendLink = async (user: StaffUser) => {
    setBusyId(user.id);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/signature-link`, { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Unable to send the signature link.');
      setNotice({
        id: user.id,
        text: data.notificationSent
          ? `Signature setup link emailed to ${user.email}.`
          : `Link created, but the email could not be sent${data.notificationError ? `: ${data.notificationError}` : ' — check SMTP settings.'}`,
      });
    } catch (err: any) {
      setNotice({ id: user.id, text: err.message });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <TableCard>
      <THead>
        <tr>
          <Th>Name</Th>
          <Th>Role</Th>
          <Th>Signature</Th>
          <Th className="text-right">Actions</Th>
        </tr>
      </THead>
      <TBody>
        {users.length === 0 ? (
          <EmptyTableRow colSpan={4} message="No users found" />
        ) : (
          users.map((user) => (
            <Tr key={user.id}>
              <Td>
                <div className="font-medium text-gray-900">{user.name}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </Td>
              <Td>
                <Badge tone="blue">{roleLabel(user.role)}</Badge>
              </Td>
              <Td>
                {user.signatureUrl ? (
                  <div className="flex items-center gap-2">
                    {isPdfUrl(user.signatureUrl) ? (
                      <span className="text-xs text-gray-500">Signature on file</span>
                    ) : (
                      <img
                        src={resolveDocumentUrl(user.signatureUrl, webAppUrl)}
                        alt={`${user.name}'s signature`}
                        className="h-8 w-20 object-contain border border-gray-200 rounded bg-white"
                      />
                    )}
                    {user.signatureUpdatedAt && (
                      <span className="text-xs text-gray-400">
                        {new Date(user.signatureUpdatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-orange-600">Not set up</span>
                )}
                {notice?.id === user.id && (
                  <p className="text-xs text-blue-700 mt-1">{notice.text}</p>
                )}
              </Td>
              <Td className="text-right">
                <Button variant="secondary" size="sm" onClick={() => sendLink(user)} disabled={busyId === user.id}>
                  {busyId === user.id ? 'Sending…' : user.signatureUrl ? 'Resend Link' : 'Send Signature Link'}
                </Button>
              </Td>
            </Tr>
          ))
        )}
      </TBody>
    </TableCard>
  );
}
