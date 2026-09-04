'use client';

import { useState } from 'react';
import { CheckCircle, Send, Loader2, Mail } from 'lucide-react';

export default function TestDriveApproveButton({ testDriveId }: { testDriveId: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleApprove = async () => {
    if (!confirm('Approve this test drive and send confirmation email to the customer?')) return;

    setStatus('loading');
    try {
      const res = await fetch(`/api/test-drives/${testDriveId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Failed to approve');
        return;
      }

      setStatus('success');
      if (data.emailSent) {
        setMessage('Test drive approved! Confirmation email sent to customer.');
      } else {
        setMessage('Test drive approved, but email failed to send: ' + (data.emailError || 'Unknown error'));
      }

      // Reload after 2s to reflect updated status
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
        <CheckCircle className="w-4 h-4" />
        <span>{message}</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-red-600 text-sm">{message}</span>
        <button
          onClick={() => setStatus('idle')}
          className="text-sm text-gray-500 underline hover:text-gray-700"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleApprove}
      disabled={status === 'loading'}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
    >
      {status === 'loading' ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Approving...
        </>
      ) : (
        <>
          <Mail className="w-4 h-4" />
          Approve & Send Email
        </>
      )}
    </button>
  );
}
