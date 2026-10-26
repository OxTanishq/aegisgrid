/**
 * AEGIS GRID — Advanced Military Map Awareness & Emergency Response Platform
 * Full-screen interactive map, live location sharing, 3D army characters,
 * real-time communications, emergency SOS system, and two-step verification.
 */

import React, { useState, useEffect } from 'react';
import { AegisProvider, useAegis } from './context/AegisContext';
import { SimulationBanner } from './components/common/SimulationBanner';
import { TacticalHeader } from './components/common/TacticalHeader';
import { TacticalSidebar } from './components/common/TacticalSidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { LandingModal } from './components/common/LandingModal';
import { EmergencyModal } from './components/common/EmergencyModal';

import { OverviewView } from './components/views/OverviewView';
import { MapView } from './components/views/MapView';
import { CommsView } from './components/views/CommsView';
import { CommunityView } from './components/views/CommunityView';
import { TeamView } from './components/views/TeamView';
import { TaskBoardView } from './components/views/TaskBoardView';
import { AlertsView } from './components/views/AlertsView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { ReportsView } from './components/views/ReportsView';
import { SettingsView } from './components/views/SettingsView';
import {
  Navigation,
  Wifi,
  WifiOff,
  AlertTriangle,
  Clock,
  Compass,
  Radio,
  Shield,
  Volume2,
} from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    currentView,
    userProfile,
    settings,
    isSimulatedOffline,
    isBrowserOnline,
    lastSyncTime,
    liveUserPosition,
    isLiveSharing,
    emergencies,
    distressModalOpen,
    isSoundDetectionActive,
    mapCenter,
  } = useAegis();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showLandingModal, setShowLandingModal] = useState(!userProfile.initialLaunchComplete);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // Google Maps Quota Listener (Case A Demo Key requirement)
  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  const activeEmergencies = emergencies.filter((e) => e.status === 'active' || e.status === 'in_progress');

  const renderActiveView = () => {
    switch (currentView) {
      case 'map':
        return <MapView />;
      case 'overview':
        return <OverviewView />;
      case 'comms':
        return <CommsView />;
      case 'community':
        return <CommunityView />;
      case 'team':
        return <TeamView />;
      case 'tasks':
        return <TaskBoardView />;
      case 'alerts':
        return <AlertsView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <MapView />;
    }
  };

  return (
    <div
      className={`min-h-screen bg-[#080D12] text-[#F3F7FA] flex flex-col ${
        settings.density === 'compact' ? 'text-xs' : 'text-sm'
      }`}
    >
      {/* Google Maps Quota Warning Banner (if triggered) */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* 1. Simulation Top Strip */}
      <SimulationBanner />

      {/* 2. Tactical Navigation Top Bar */}
      <TacticalHeader onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

      {/* 3. Main Workspace Shell: Sidebar + Active View */}
      <div className="flex-1 flex overflow-hidden">
        <TacticalSidebar
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        <main className="flex-1 overflow-y-auto bg-[#080D12] relative flex flex-col">
          <div className="flex-1 relative">
            {renderActiveView()}
          </div>

          {/* 4. Compact Tactical Bottom Status Bar */}
          <footer className="h-8 bg-[#0b1118] border-t border-[#17232D] px-4 flex items-center justify-between text-[11px] font-mono text-[#8495A5] shrink-0 select-none z-20">
            {/* Left: GPS Accuracy & Sharing */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Navigation className={`w-3.5 h-3.5 ${isLiveSharing ? 'text-[#9FE870]' : 'text-[#8495A5]'}`} />
                <span>
                  GPS: {liveUserPosition ? `${liveUserPosition.accuracy}m accuracy` : 'Standby'}
                </span>
                {isLiveSharing && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9FE870] animate-pulse" />
                )}
              </div>

              <div className="hidden sm:flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#48DDF2]" />
                <span>
                  Center: {mapCenter.lat.toFixed(4)} N, {Math.abs(mapCenter.lng).toFixed(4)} W
                </span>
              </div>
            </div>

            {/* Center: Active SOS Status */}
            <div className="flex items-center gap-2">
              {activeEmergencies.length > 0 ? (
                <span className="flex items-center gap-1.5 text-[#FF6464] font-black animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{activeEmergencies.length} ACTIVE SOS EVENT(S)</span>
                </span>
              ) : (
                <span className="hidden md:inline text-[#9FE870]">
                  ● ALL SECTORS NOMINAL
                </span>
              )}

              {isSoundDetectionActive && (
                <span className="hidden lg:flex items-center gap-1 text-[#48DDF2] font-bold">
                  <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                  <span>MIC ACTIVE</span>
                </span>
              )}
            </div>

            {/* Right: Network & Sync */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                {isSimulatedOffline || !isBrowserOnline ? (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-[#FFBF69]" />
                    <span className="text-[#FFBF69] font-bold">OFFLINE (IndexedDB)</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-[#9FE870]" />
                    <span className="text-[#9FE870]">SYNCED</span>
                  </>
                )}
              </div>

              <span className="hidden sm:inline text-[#8495A5]">
                {new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </footer>
        </main>
      </div>

      {/* 5. Real-time Toast Alerts */}
      <ToastContainer />

      {/* 6. First-time Entry / Briefing Modal */}
      {showLandingModal && (
        <LandingModal onDismiss={() => setShowLandingModal(false)} />
      )}

      {/* 7. Emergency SOS & Sound-Event Confirmation Modal */}
      <EmergencyModal
        isOpen={isEmergencyModalOpen || distressModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AegisProvider>
      <AppContent />
    </AegisProvider>
  );
}
