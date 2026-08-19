'use client';

import { MessageCircle } from 'lucide-react';
import { openWhatsAppChat, trackWhatsAppClick, type WhatsAppPrefilledOptions } from '@/lib/whatsapp';

interface WhatsAppButtonProps extends WhatsAppPrefilledOptions {
  variant?: 'primary' | 'secondary' | 'text' | 'floating';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showIcon?: boolean;
  className?: string;
  trackingContext?: string;
}

export function WhatsAppButton({
  variant = 'primary',
  size = 'md',
  label,
  showIcon = true,
  className = '',
  trackingContext = 'generic',
  ...whatsappOptions
}: WhatsAppButtonProps) {
  const handleClick = () => {
    trackWhatsAppClick(trackingContext, whatsappOptions);
    openWhatsAppChat(whatsappOptions);
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  // Variant classes
  const variantClasses = {
    primary: 'bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all',
    secondary: 'bg-white hover:bg-gray-50 text-green-600 font-semibold border-2 border-green-600 rounded-lg transition-all',
    text: 'text-green-600 hover:text-green-700 font-semibold hover:underline',
    floating: 'bg-green-600 hover:bg-green-700 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all fixed bottom-6 right-6 z-50',
  };

  // Default labels
  const defaultLabels = {
    primary: 'Chat on WhatsApp',
    secondary: 'WhatsApp Us',
    text: 'Send WhatsApp',
    floating: '',
  };

  const buttonLabel = label || defaultLabels[variant];

  if (variant === 'floating') {
    return (
      <button
        onClick={handleClick}
        className={`${variantClasses.floating} p-4 ${className}`}
        aria-label="Chat on WhatsApp"
        title="Chat on WhatsApp"
      >
        <MessageCircle size={28} />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`${variantClasses[variant]} ${sizeClasses[size]} flex items-center justify-center gap-2 ${className}`}
    >
      {showIcon && <MessageCircle size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />}
      {buttonLabel}
    </button>
  );
}

// Floating WhatsApp button with status indicator
export function WhatsAppFloatingButton(props: Omit<WhatsAppButtonProps, 'variant'>) {
  return <WhatsAppButton {...props} variant="floating" />;
}

// WhatsApp quick action (text link style)
export function WhatsAppLink(props: Omit<WhatsAppButtonProps, 'variant'>) {
  return <WhatsAppButton {...props} variant="text" size="sm" />;
}
