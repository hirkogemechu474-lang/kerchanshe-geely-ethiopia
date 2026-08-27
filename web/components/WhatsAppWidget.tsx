'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X, Clock, CheckCircle } from 'lucide-react';
import { openWhatsAppChat, getWhatsAppBusinessStatus, trackWhatsAppClick } from '@/lib/whatsapp';
import type { WhatsAppPrefilledOptions } from '@/lib/whatsapp';

interface WhatsAppWidgetProps {
  defaultOptions?: WhatsAppPrefilledOptions;
  showStatus?: boolean;
  autoOpen?: boolean;
  delay?: number;
}

export function WhatsAppWidget({
  defaultOptions = { inquiryType: 'general' },
  showStatus = true,
  autoOpen = false,
  delay = 5000,
}: WhatsAppWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState(getWhatsAppBusinessStatus());
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/public/contact-information')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.whatsapp) setWhatsappNumber(d.whatsapp);
      })
      .catch(() => {});

    // Check if user has dismissed the widget
    const dismissed = localStorage.getItem('whatsapp-widget-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismiss = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    // Show widget if not dismissed in last 7 days
    if (daysSinceDismiss > 7) {
      setTimeout(() => {
        setIsVisible(true);
        if (autoOpen) {
          setTimeout(() => setIsOpen(true), 1000);
        }
      }, delay);
    } else {
      setIsVisible(true);
    }

    // Update status every minute
    const interval = setInterval(() => {
      setStatus(getWhatsAppBusinessStatus());
    }, 60000);

    return () => clearInterval(interval);
  }, [autoOpen, delay]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('whatsapp-widget-dismissed', Date.now().toString());
  };

  const handleStartChat = (inquiryType: WhatsAppPrefilledOptions['inquiryType']) => {
    trackWhatsAppClick('widget', { ...defaultOptions, inquiryType });
    openWhatsAppChat({
      ...defaultOptions,
      inquiryType,
      ...(whatsappNumber ? { phone: whatsappNumber } : {}),
    });
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all animate-bounce-slow"
          aria-label="Open WhatsApp chat"
        >
          <MessageCircle size={28} />
          {status.available && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
          )}
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-midnight-surface rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-green-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white dark:bg-midnight-surface rounded-full flex items-center justify-center">
                <MessageCircle className="text-green-600" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Geely Ethiopia</h3>
                {showStatus && (
                  <div className="flex items-center gap-1 text-sm text-green-100">
                    {status.available ? (
                      <>
                        <CheckCircle size={14} />
                        <span>Online</span>
                      </>
                    ) : (
                      <>
                        <Clock size={14} />
                        <span>Offline</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="text-white hover:text-green-200 transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Status Message */}
            <div className={`mb-4 p-3 rounded-lg ${status.available ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-700'}`}>
              <p className="text-sm font-medium mb-1">{status.message}</p>
              {status.hours && (
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  <Clock size={12} />
                  {status.hours}
                </p>
              )}
            </div>

            {/* Welcome Message */}
            <div className="mb-6">
              <h4 className="font-bold text-navy dark:text-ice mb-2">How can we help you?</h4>
              <p className="text-sm text-steel dark:text-steel-light">
                Choose a topic below or start a general conversation with our team.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <QuickActionButton
                icon="🚗"
                title="Book a Test Drive"
                description="Schedule your test drive"
                onClick={() => handleStartChat('test-drive')}
              />
              <QuickActionButton
                icon="💰"
                title="Request a Quote"
                description="Get pricing information"
                onClick={() => handleStartChat('quote')}
              />
              <QuickActionButton
                icon="🏦"
                title="Financing Options"
                description="Explore payment plans"
                onClick={() => handleStartChat('financing')}
              />
              <QuickActionButton
                icon="🔧"
                title="Service & Parts"
                description="Book service or order parts"
                onClick={() => handleStartChat('service')}
              />
              <QuickActionButton
                icon="💬"
                title="General Inquiry"
                description="Ask us anything"
                onClick={() => handleStartChat('general')}
              />
            </div>

            {/* Dismiss Option */}
            <button
              onClick={handleDismiss}
              className="w-full mt-4 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Don't show this again for 7 days
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Quick Action Button Component
function QuickActionButton({
  icon,
  title,
  description,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-all text-left group"
    >
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <div className="font-semibold text-navy dark:text-ice group-hover:text-green-600 transition-colors">
          {title}
        </div>
        <div className="text-xs text-steel dark:text-steel-light">{description}</div>
      </div>
      <MessageCircle size={16} className="text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

// Simpler inline WhatsApp CTA
export function WhatsAppInlineCTA({
  title = "Need help? Chat with us on WhatsApp",
  description = "Our team is available to answer your questions",
  inquiryType = 'general',
  vehicleModel,
  dealerId,
}: {
  title?: string;
  description?: string;
  inquiryType?: WhatsAppPrefilledOptions['inquiryType'];
  vehicleModel?: string;
  dealerId?: string;
}) {
  const status = getWhatsAppBusinessStatus();
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/public/contact-information')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.whatsapp) setWhatsappNumber(d.whatsapp);
      })
      .catch(() => {});
  }, []);

  const handleClick = () => {
    trackWhatsAppClick('inline-cta', { inquiryType, vehicleModel, dealerId });
    openWhatsAppChat({
      inquiryType,
      vehicleModel,
      dealerId,
      ...(whatsappNumber ? { phone: whatsappNumber } : {}),
    });
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6 flex items-center gap-4">
      <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 relative">
        <MessageCircle className="text-white" size={32} />
        {status.available && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-navy dark:text-ice text-lg mb-1">{title}</h3>
        <p className="text-steel dark:text-steel-light text-sm">{description}</p>
        {status.available && (
          <p className="text-green-700 text-xs font-semibold mt-1 flex items-center gap-1">
            <CheckCircle size={12} />
            Team is online now
          </p>
        )}
      </div>
      <button
        onClick={handleClick}
        className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap"
      >
        <MessageCircle size={20} />
        Start Chat
      </button>
    </div>
  );
}
