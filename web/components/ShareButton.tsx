'use client';

import { Share2 } from 'lucide-react';

export function ShareButton({ title }: { title: string }) {
  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url: window.location.href });
      } catch {
        // User cancelled share
      }
    } else {
      // Fallback: copy link to clipboard
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 text-[#d8e4f5] text-sm hover:text-white transition-colors"
    >
      <Share2 size={15} />
      Share
    </button>
  );
}
