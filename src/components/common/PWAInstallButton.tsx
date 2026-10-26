import React, { useEffect, useState } from 'react';
import { Download, CheckCircle2, Smartphone, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-[#9FE870] font-mono px-2 py-1 rounded bg-[#9FE870]/10 border border-[#9FE870]/20">
        <CheckCircle2 className="w-3.5 h-3.5" />
        PWA Active
      </span>
    );
  }

  return (
    <>
      {deferredPrompt ? (
        <button
          onClick={handleInstallClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#080D12] bg-[#48DDF2] hover:bg-[#48DDF2]/90 rounded transition-colors shadow-sm focus:outline-none focus:ring-1 focus:ring-[#48DDF2]"
          title="Install AEGIS GRID to Home Screen / Desktop"
        >
          <Download className="w-3.5 h-3.5" />
          Install App
        </button>
      ) : isIOS ? (
        <button
          onClick={() => setShowIOSModal(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#8495A5] hover:text-[#F3F7FA] border border-[#17232D] hover:border-[#48DDF2]/40 rounded transition-colors"
        >
          <Smartphone className="w-3.5 h-3.5" />
          iOS Install
        </button>
      ) : null}

      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#111922] border border-[#17232D] rounded-xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#17232D]">
              <h4 className="text-sm font-semibold text-[#F3F7FA]">Install on Apple iOS</h4>
              <button
                onClick={() => setShowIOSModal(false)}
                className="text-[#8495A5] hover:text-[#F3F7FA] p-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4 space-y-3 text-xs text-[#8495A5]">
              <p>
                1. Tap the <strong className="text-[#48DDF2]">Share button</strong> in the Safari bottom toolbar.
              </p>
              <p>
                2. Scroll down the action sheet and select <strong className="text-[#9FE870]">Add to Home Screen</strong>.
              </p>
              <p>
                3. Tap <strong className="text-[#F3F7FA]">Add</strong> in the top right corner. AEGIS GRID will run as an offline standalone web app.
              </p>
            </div>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2 text-xs font-medium bg-[#17232D] hover:bg-[#1f2f3d] text-[#F3F7FA] rounded transition-colors"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}
    </>
  );
};
