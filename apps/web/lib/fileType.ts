export function isPdfUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.toLowerCase().endsWith('.pdf');
}

export function getFileExtension(url: string): string {
  const parts = url.split('.');
  if (parts.length > 1) {
    return parts[parts.length - 1].toLowerCase();
  }
  return '';
}

export function isImageFile(url: string): boolean {
  const ext = getFileExtension(url);
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(ext);
}

export function isVideoFile(url: string): boolean {
  const ext = getFileExtension(url);
  return ['mp4', 'webm', 'ogg', 'mov'].includes(ext);
}
