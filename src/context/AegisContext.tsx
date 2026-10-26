/**
 * AEGIS GRID — Core Application Context & Simulation Engine
 * Upgraded with Google Maps Platform, Live Location Sharing, 3D Character States,
 * Emergency SOS System, Sound-Event Detection, and Two-Step Verification (2FA).
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Participant,
  Task,
  MapMarker,
  Alert,
  Message,
  ActivityEvent,
  SyncQueueItem,
  UserProfile,
  AppSettings,
  TaskStatus,
  MessagePriority,
  DemoRole,
  TeamCommunity,
  EmergencyEvent,
  TwoFactorAuthState,
  SoundDetectionConfig,
  CharacterAnimationState,
  UniformColor,
} from '../types';
import { aegisDB } from '../services/db';
import {
  INITIAL_USER_PROFILE,
  INITIAL_SETTINGS,
  INITIAL_TEAMS,
  INITIAL_PARTICIPANTS,
  INITIAL_TASKS,
  INITIAL_MAP_MARKERS,
  INITIAL_EMERGENCIES,
  INITIAL_2FA_STATE,
} from '../services/seedData';
import { emergencyAudio } from '../services/emergencyAudio';
import { soundDetector, SoundDetectionMetrics } from '../services/soundDetector';
import { verifyTotpCode } from '../services/totp';

export type AppView =
  | 'overview'
  | 'map'
  | 'comms'
  | 'community'
  | 'team'
  | 'tasks'
  | 'alerts'
  | 'analytics'
  | 'reports'
  | 'settings';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
}

interface AegisContextType {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;

  // Google Maps API Key
  apiKey: string;

  // Data Entities
  teams: TeamCommunity[];
  participants: Participant[];
  tasks: Task[];
  messages: Message[];
  mapMarkers: MapMarker[];
  alerts: Alert[];
  activities: ActivityEvent[];
  syncQueue: SyncQueueItem[];
  emergencies: EmergencyEvent[];
  activeEmergency: EmergencyEvent | null;

  // Real-time Map Center & Selection
  mapCenter: { lat: number; lng: number };
  setMapCenter: (pos: { lat: number; lng: number }) => void;
  selectedMarkerId: string | null;
  setSelectedMarkerId: (id: string | null) => void;
  selectedTeammateId: string | null;
  setSelectedTeammateId: (id: string | null) => void;

  // Live Location Sharing
  liveUserPosition: { lat: number; lng: number; accuracy: number; timestamp: string } | null;
  isLiveSharing: boolean;
  startLocationSharing: () => Promise<boolean>;
  pauseLocationSharing: () => void;
  stopLocationSharing: () => void;
  userLocationConsent: boolean;
  setUserLocationConsent: (c: boolean) => void;

  // Connectivity
  isSimulatedOffline: boolean;
  toggleSimulatedOffline: () => void;
  isBrowserOnline: boolean;
  lastSyncTime: string;

  // Simulation Controls
  isSimulationRunning: boolean;
  toggleSimulationRunning: () => void;
  simulationSpeed: 1 | 2 | 5;
  setSimulationSpeed: (speed: 1 | 2 | 5) => void;
  appUptimeSeconds: number;
  triggerManualEvent: (type: 'message' | 'checkin' | 'alert' | 'linkDisruption') => Promise<void>;
  resetToSeedData: () => Promise<void>;

  // Messaging & Audio Messages
  sendMessage: (channelId: string, content: string, priority?: MessagePriority, teamId?: string, recipientId?: string) => Promise<boolean>;
  sendAudioMessage: (channelId: string, audioBase64: string, durationSec: number, priority?: MessagePriority, recipientId?: string) => Promise<boolean>;
  retryPendingMessage: (messageId: string) => Promise<void>;
  discardPendingMessage: (messageId: string) => Promise<void>;
  clearConversation: (channelId: string) => Promise<void>;

  // Team Registration
  registerTeam: (teamData: Omit<TeamCommunity, 'id' | 'createdAt' | 'memberCount'>) => Promise<void>;
  registerTeamMember: (memberData: Omit<Participant, 'id' | 'lastCheckIn' | 'batteryPct' | 'signalDbm' | 'gridCoordinates' | 'lat' | 'lng' | 'heading' | 'speedKmh' | 'gpsAccuracyM' | 'locationSharingEnabled' | 'animationState' | 'uniformColor' | 'inEmergency'>) => Promise<void>;
  joinTeam: (teamId: string) => Promise<void>;

  // Tasks
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'history'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTaskStatus: (id: string, newStatus: TaskStatus) => Promise<void>;

  // Map Markers & Annotations
  addMapAnnotation: (annotation: Omit<MapMarker, 'id' | 'updatedAt' | 'isUserCreated'>) => Promise<void>;
  removeMapMarker: (id: string) => Promise<void>;

  // Emergency SOS System
  triggerEmergencySOS: (customMessage?: string) => Promise<void>;
  acknowledgeEmergency: (emergencyId: string) => Promise<void>;
  resolveEmergency: (emergencyId: string, resolutionNote?: string) => Promise<void>;
  cancelEmergency: (emergencyId: string, cancelReason?: string) => Promise<void>;

  // Sound-Event Detection
  isSoundDetectionActive: boolean;
  toggleSoundDetection: () => Promise<boolean>;
  distressModalOpen: boolean;
  soundDistressMetrics: SoundDetectionMetrics | null;
  confirmSoundEmergency: () => Promise<void>;
  dismissSoundAlert: () => void;

  // Two-Step Verification (2FA)
  twoFactorState: TwoFactorAuthState;
  enable2FA: (secret: string, code: string) => Promise<boolean>;
  disable2FA: () => Promise<void>;
  verify2FACode: (code: string) => Promise<boolean>;
  revokeSession: (sessionId: string) => Promise<void>;

  // Alerts & Notifications
  acknowledgeAlert: (id: string) => Promise<void>;
  dismissAlert: (id: string) => Promise<void>;
  clearResolvedAlerts: () => Promise<void>;

  // Operatives & Health
  participantCheckIn: (participantId: string, statusNote?: string) => Promise<void>;
  updateParticipantAnimationState: (participantId: string, state: CharacterAnimationState) => Promise<void>;
  updateParticipantUniformColor: (participantId: string, color: UniformColor) => Promise<void>;
  processSyncQueue: () => Promise<void>;

  // UI Toast
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, message: string) => void;
  dismissToast: (id: string) => void;
}

const AegisContext = createContext<AegisContextType | undefined>(undefined);

export const AegisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBQIEm-3cs5OuwyHRFFisRN65Mvi8oCrGs';

  const [currentView, setCurrentView] = useState<AppView>('map'); // Default to full-screen map workspace
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);

  const [teams, setTeams] = useState<TeamCommunity[]>(INITIAL_TEAMS);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyEvent[]>(INITIAL_EMERGENCIES);
  const [twoFactorState, setTwoFactorState] = useState<TwoFactorAuthState>(INITIAL_2FA_STATE);

  // Map Navigation & Selection
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 35.3314, lng: -120.6985 });
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [selectedTeammateId, setSelectedTeammateId] = useState<string | null>(null);

  // Live Location Tracking
  const [liveUserPosition, setLiveUserPosition] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: string;
  } | null>(null);
  const [isLiveSharing, setIsLiveSharing] = useState<boolean>(false);
  const [userLocationConsent, setUserLocationConsent] = useState<boolean>(true);
  const watchIdRef = useRef<number | null>(null);

  // Sound-Event Detection
  const [isSoundDetectionActive, setIsSoundDetectionActive] = useState<boolean>(false);
  const [distressModalOpen, setDistressModalOpen] = useState<boolean>(false);
  const [soundDistressMetrics, setSoundDistressMetrics] = useState<SoundDetectionMetrics | null>(null);

  // Connectivity
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [isBrowserOnline, setIsBrowserOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toISOString());

  // Simulation
  const [isSimulationRunning, setIsSimulationRunning] = useState(true);
  const [simulationSpeedState, setSimulationSpeedState] = useState<1 | 2 | 5>(1);
  const [appUptimeSeconds, setAppUptimeSeconds] = useState(0);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastMessage['type'], title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Compute active emergency (first active or in_progress event)
  const activeEmergency = emergencies.find((e) => e.status === 'active' || e.status === 'in_progress') || null;

  // Initialize DB and Load State
  useEffect(() => {
    let mounted = true;
    const initializeData = async () => {
      await aegisDB.init();
      if (!mounted) return;

      const loadedProfile = await aegisDB.get<UserProfile>('profile', 'current');
      if (loadedProfile) setUserProfile(loadedProfile);

      const loadedSettings = await aegisDB.get<AppSettings>('settings', 'current');
      if (loadedSettings) setSettings(loadedSettings);

      const loaded2fa = await aegisDB.get<TwoFactorAuthState>('auth2fa', 'current');
      if (loaded2fa) setTwoFactorState(loaded2fa);

      const loadedTeams = await aegisDB.getAll<TeamCommunity>('teams');
      if (loadedTeams.length > 0) setTeams(loadedTeams);

      const loadedParticipants = await aegisDB.getAll<Participant>('participants');
      let participantsModified = false;
      const sanitizedParticipants = (loadedParticipants.length > 0 ? loadedParticipants : INITIAL_PARTICIPANTS).map((p) => {
        const seed = INITIAL_PARTICIPANTS.find((s) => s.id === p.id);
        const hasLat = typeof p.lat === 'number' && !isNaN(p.lat);
        const hasLng = typeof p.lng === 'number' && !isNaN(p.lng);
        const hasAnimationState = Boolean(p.animationState);
        const hasUniformColor = Boolean(p.uniformColor);
        if (!hasLat || !hasLng || !hasAnimationState || !hasUniformColor) {
          participantsModified = true;
        }
        return {
          ...p,
          lat: hasLat ? p.lat : (seed?.lat ?? 35.3314),
          lng: hasLng ? p.lng : (seed?.lng ?? -120.6985),
          heading: typeof p.heading === 'number' ? p.heading : (seed?.heading ?? 0),
          speedKmh: typeof p.speedKmh === 'number' ? p.speedKmh : (seed?.speedKmh ?? 0),
          gpsAccuracyM: typeof p.gpsAccuracyM === 'number' ? p.gpsAccuracyM : (seed?.gpsAccuracyM ?? 5),
          animationState: p.animationState || seed?.animationState || 'idle',
          uniformColor: p.uniformColor || seed?.uniformColor || 'camo_green',
          inEmergency: Boolean(p.inEmergency ?? seed?.inEmergency ?? false),
        };
      });
      setParticipants(sanitizedParticipants);
      if (participantsModified) {
        for (const sp of sanitizedParticipants) {
          await aegisDB.put('participants', sp);
        }
      }

      const loadedTasks = await aegisDB.getAll<Task>('tasks');
      setTasks(loadedTasks.length > 0 ? loadedTasks : INITIAL_TASKS);

      const loadedMarkers = await aegisDB.getAll<MapMarker>('mapMarkers');
      let markersModified = false;
      const sanitizedMarkers = (loadedMarkers.length > 0 ? loadedMarkers : INITIAL_MAP_MARKERS).map((m) => {
        const seed = INITIAL_MAP_MARKERS.find((s) => s.id === m.id);
        const hasLat = typeof m.lat === 'number' && !isNaN(m.lat);
        const hasLng = typeof m.lng === 'number' && !isNaN(m.lng);
        if (!hasLat || !hasLng) {
          markersModified = true;
        }
        return {
          ...m,
          lat: hasLat ? m.lat : (seed?.lat ?? 35.3314),
          lng: hasLng ? m.lng : (seed?.lng ?? -120.6985),
        };
      });
      setMapMarkers(sanitizedMarkers);
      if (markersModified) {
        for (const sm of sanitizedMarkers) {
          await aegisDB.put('mapMarkers', sm);
        }
      }

      const loadedAlerts = await aegisDB.getAll<Alert>('alerts');
      setAlerts(loadedAlerts);

      const loadedMessages = await aegisDB.getAll<Message>('messages');
      setMessages(loadedMessages);

      const loadedActivities = await aegisDB.getAll<ActivityEvent>('activities');
      setActivities(loadedActivities);

      const loadedEmergencies = await aegisDB.getAll<EmergencyEvent>('emergencies');
      if (loadedEmergencies.length > 0) setEmergencies(loadedEmergencies);

      const loadedSync = await aegisDB.getAll<SyncQueueItem>('syncQueue');
      setSyncQueue(loadedSync);
    };

    initializeData();

    // Browser Online/Offline Listeners
    const handleOnline = () => {
      setIsBrowserOnline(true);
      addToast('success', 'Network Restored', 'Connected to server.');
    };
    const handleOffline = () => {
      setIsBrowserOnline(false);
      addToast('warning', 'Network Lost', 'Switched to offline local IndexedDB storage.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      mounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addToast]);

  // App Uptime Counter
  useEffect(() => {
    const timer = setInterval(() => {
      setAppUptimeSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update Settings
  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await aegisDB.put('settings', { ...updated, id: 'current' } as any);
  };

  // Update User Profile
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    const updated = { ...userProfile, ...updates };
    setUserProfile(updated);
    await aegisDB.put('profile', { ...updated, id: 'current' } as any);
    addToast('success', 'Profile Updated', 'Operator identity saved locally.');
  };

  // Toggle Simulated Offline
  const toggleSimulatedOffline = () => {
    setIsSimulatedOffline((prev) => {
      const next = !prev;
      addToast(
        next ? 'warning' : 'success',
        next ? 'Offline Mode Active' : 'Online Mode Active',
        next ? 'Network simulated offline. All updates cached in local IndexedDB.' : 'Local queue synchronizing with server.'
      );
      if (!next) {
        processSyncQueue();
      }
      return next;
    });
  };

  // Live Location Sharing with Consent
  const startLocationSharing = async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      addToast('error', 'GPS Unavailable', 'Geolocation is not supported by your browser.');
      return false;
    }

    try {
      // First get current position to verify permission
      await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      // Start continuous watch
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newPos = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
            timestamp: new Date().toISOString(),
          };
          setLiveUserPosition(newPos);

          // Update user's participant record if user has one
          setParticipants((prev) =>
            prev.map((p) =>
              p.id === 'p-01' || p.isRegisteredByUser
                ? {
                    ...p,
                    lat: newPos.lat,
                    lng: newPos.lng,
                    gpsAccuracyM: newPos.accuracy,
                    lastCheckIn: newPos.timestamp,
                    locationSharingEnabled: true,
                  }
                : p
            )
          );
        },
        (err) => {
          console.warn('Geolocation watch error:', err);
          setIsLiveSharing(false);
          addToast('warning', 'GPS Signal Lost', 'Unable to receive precise GPS coordinates.');
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
      );

      watchIdRef.current = watchId;
      setIsLiveSharing(true);
      addToast('success', 'Location Sharing Live', 'Live GPS position is now shared with authorized teammates.');
      return true;
    } catch (err) {
      console.warn('Geolocation permission denied:', err);
      addToast('warning', 'Permission Required', 'Browser location permission was not granted.');
      setIsLiveSharing(false);
      return false;
    }
  };

  const pauseLocationSharing = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsLiveSharing(false);
    addToast('info', 'Location Sharing Paused', 'Your coordinates are temporarily withheld.');
  };

  const stopLocationSharing = () => {
    pauseLocationSharing();
    setLiveUserPosition(null);
    addToast('info', 'Location Sharing Ended', 'Location sharing disabled.');
  };

  // Sound-Event Detection Opt-in Toggle
  const toggleSoundDetection = async (): Promise<boolean> => {
    if (isSoundDetectionActive) {
      soundDetector.stop();
      setIsSoundDetectionActive(false);
      addToast('info', 'Sound Detection Disabled', 'Microphone listener stopped.');
      return false;
    } else {
      const started = await soundDetector.start(
        settings.soundDetection.sensitivity,
        settings.soundDetection.thresholdDb,
        (metrics) => {
          // Distress sound detected callback
          setSoundDistressMetrics(metrics);
          setDistressModalOpen(true);
          emergencyAudio.playRadioPing();

          // Auto-escalation if configured
          if (settings.soundDetection.autoEscalate) {
            setTimeout(() => {
              // Only escalate if modal is still open
              setDistressModalOpen((isOpen) => {
                if (isOpen) {
                  triggerEmergencySOS(`Automated Distress Sound Escalation (Confidence: ${metrics.confidencePct}%)`);
                  return false;
                }
                return false;
              });
            }, settings.soundDetection.escalateDelaySeconds * 1000);
          }
        }
      );

      if (started) {
        setIsSoundDetectionActive(true);
        addToast('success', 'Sound Detection Active', 'Listening locally on-device for sudden distress sounds.');
        return true;
      } else {
        addToast('error', 'Microphone Access Denied', 'Please permit microphone access in your browser settings.');
        return false;
      }
    }
  };

  const confirmSoundEmergency = async () => {
    setDistressModalOpen(false);
    const conf = soundDistressMetrics?.confidencePct || 85;
    await triggerEmergencySOS(`Sound-Event Triggered Alert: Loud distress noise detected (Confidence: ${conf}%)`);
  };

  const dismissSoundAlert = () => {
    setDistressModalOpen(false);
    setSoundDistressMetrics(null);
    addToast('info', 'Alert Dismissed', 'Sound event marked as false positive.');
  };

  // Emergency SOS Trigger
  const triggerEmergencySOS = async (customMessage?: string) => {
    const requesterId = userProfile.id;
    const requesterName = userProfile.displayName;
    const requesterCallsign = userProfile.callsign;

    // Latest location
    const lat = liveUserPosition?.lat || 35.3314;
    const lng = liveUserPosition?.lng || -120.6985;
    const accuracy = liveUserPosition?.accuracy || 5;

    const newEmergency: EmergencyEvent = {
      id: `emg-${Date.now()}`,
      requesterId,
      requesterName,
      requesterCallsign,
      requesterRole: userProfile.role,
      lat,
      lng,
      accuracyM: accuracy,
      timestamp: new Date().toISOString(),
      status: 'active',
      message: customMessage || 'URGENT: Emergency assistance requested at current GPS position.',
      acknowledgedBy: [requesterCallsign],
      timeline: [
        {
          id: `et-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: requesterCallsign,
          action: 'Emergency SOS Broadcast',
          note: customMessage || 'SOS initiated by operator',
        },
      ],
    };

    // 1. Play siren audio alert
    emergencyAudio.playEmergencyAlert();

    // 2. Save emergency event
    setEmergencies((prev) => [newEmergency, ...prev]);
    await aegisDB.put('emergencies', newEmergency);

    // 3. Update requester character to emergency red state
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === 'p-01' || p.callsign === requesterCallsign
          ? {
              ...p,
              inEmergency: true,
              animationState: 'emergency',
              emergencyMessage: newEmergency.message,
              emergencyTimestamp: newEmergency.timestamp,
            }
          : p
      )
    );

    // 4. Center map on emergency
    setMapCenter({ lat, lng });

    // 5. Send urgent message to all channels
    await sendMessage('all-community', `🚨 EMERGENCY SOS: ${requesterCallsign} needs assistance at [${lat.toFixed(4)}, ${lng.toFixed(4)}]. ${newEmergency.message}`, 'urgent');

    // 6. Create system critical alert
    const newAlert: Alert = {
      id: `alt-sos-${Date.now()}`,
      type: 'emergency',
      title: `ACTIVE EMERGENCY: ${requesterCallsign}`,
      message: newEmergency.message,
      severity: 'Critical',
      timestamp: newEmergency.timestamp,
      read: false,
      acknowledged: false,
      resolved: false,
      sourceEntityId: newEmergency.id,
    };
    setAlerts((prev) => [newAlert, ...prev]);
    await aegisDB.put('alerts', newAlert);

    // 7. Log activity
    const activity: ActivityEvent = {
      id: `act-sos-${Date.now()}`,
      timestamp: newEmergency.timestamp,
      category: 'Emergency',
      description: `Emergency SOS triggered by ${requesterCallsign} (${requesterName})`,
      actor: requesterCallsign,
      severity: 'critical',
    };
    setActivities((prev) => [activity, ...prev]);
    await aegisDB.put('activities', activity);

    addToast('error', 'EMERGENCY SOS ACTIVE', 'Teammates notified. Red emergency beacon transmitting.');
  };

  const acknowledgeEmergency = async (emergencyId: string) => {
    const now = new Date().toISOString();
    setEmergencies((prev) =>
      prev.map((e) => {
        if (e.id === emergencyId) {
          return {
            ...e,
            status: 'in_progress',
            acknowledgedBy: Array.from(new Set([...(e.acknowledgedBy || []), userProfile.callsign])),
            timeline: [
              ...e.timeline,
              {
                id: `et-${Date.now()}`,
                timestamp: now,
                actor: userProfile.callsign,
                action: 'Acknowledged',
                note: 'Rescue team mobilized and en route',
              },
            ],
          };
        }
        return e;
      })
    );

    addToast('success', 'Emergency Acknowledged', 'Status set to In Progress.');
  };

  const resolveEmergency = async (emergencyId: string, resolutionNote?: string) => {
    const now = new Date().toISOString();
    setEmergencies((prev) =>
      prev.map((e) => {
        if (e.id === emergencyId) {
          return {
            ...e,
            status: 'resolved',
            timeline: [
              ...e.timeline,
              {
                id: `et-${Date.now()}`,
                timestamp: now,
                actor: userProfile.callsign,
                action: 'Emergency Resolved',
                note: resolutionNote || 'Teammate safe and accounted for',
              },
            ],
          };
        }
        return e;
      })
    );

    // Reset participant emergency state
    setParticipants((prev) =>
      prev.map((p) => ({
        ...p,
        inEmergency: false,
        animationState: p.animationState === 'emergency' ? 'idle' : p.animationState,
      }))
    );

    addToast('info', 'Emergency Resolved', 'Incident marked resolved and archived.');
  };

  const cancelEmergency = async (emergencyId: string, cancelReason?: string) => {
    const now = new Date().toISOString();
    setEmergencies((prev) =>
      prev.map((e) => {
        if (e.id === emergencyId) {
          return {
            ...e,
            status: 'cancelled',
            timeline: [
              ...e.timeline,
              {
                id: `et-${Date.now()}`,
                timestamp: now,
                actor: userProfile.callsign,
                action: 'Cancelled (False Alarm)',
                note: cancelReason || 'False alarm cleared by operator',
              },
            ],
          };
        }
        return e;
      })
    );

    // Reset participant emergency state
    setParticipants((prev) =>
      prev.map((p) => ({
        ...p,
        inEmergency: false,
        animationState: p.animationState === 'emergency' ? 'idle' : p.animationState,
      }))
    );

    addToast('warning', 'False Alarm Cancelled', 'Emergency alert cancelled with auditable log.');
  };

  // Two-Step Verification (2FA) Methods
  const enable2FA = async (secret: string, code: string): Promise<boolean> => {
    const isValid = await verifyTotpCode(secret, code);
    if (!isValid) {
      addToast('error', 'Invalid Code', 'The 6-digit verification code did not match.');
      return false;
    }

    const updatedState: TwoFactorAuthState = {
      ...twoFactorState,
      enabled: true,
      secret,
      verified: true,
      lastVerifiedAt: new Date().toISOString(),
    };

    setTwoFactorState(updatedState);
    await aegisDB.put('auth2fa', { ...updatedState, id: 'current' } as any);
    addToast('success', 'Two-Factor Authentication Enabled', 'Your account is secured with 2FA.');
    return true;
  };

  const disable2FA = async () => {
    const updatedState: TwoFactorAuthState = {
      ...twoFactorState,
      enabled: false,
      verified: false,
    };
    setTwoFactorState(updatedState);
    await aegisDB.put('auth2fa', { ...updatedState, id: 'current' } as any);
    addToast('info', '2FA Disabled', 'Two-factor authentication has been turned off.');
  };

  const verify2FACode = async (code: string): Promise<boolean> => {
    const isValid = await verifyTotpCode(twoFactorState.secret, code);
    return isValid;
  };

  const revokeSession = async (sessionId: string) => {
    const updated = {
      ...twoFactorState,
      activeSessions: twoFactorState.activeSessions.filter((s) => s.id !== sessionId),
    };
    setTwoFactorState(updated);
    await aegisDB.put('auth2fa', { ...updated, id: 'current' } as any);
    addToast('info', 'Session Revoked', 'The device session has been terminated.');
  };

  // Send Text Message
  const sendMessage = async (
    channelId: string,
    content: string,
    priority: MessagePriority = 'normal',
    teamId?: string,
    recipientId?: string
  ): Promise<boolean> => {
    if (!content.trim()) return false;

    const newMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      channelId,
      senderId: userProfile.id,
      senderCallsign: userProfile.callsign,
      senderRole: userProfile.role,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      status: isSimulatedOffline || !isBrowserOnline ? 'pending' : 'delivered',
      priority,
      teamId,
      recipientId,
    };

    setMessages((prev) => [...prev, newMsg]);
    await aegisDB.put('messages', newMsg);

    if (isSimulatedOffline || !isBrowserOnline) {
      const syncItem: SyncQueueItem = {
        id: `sync-msg-${newMsg.id}`,
        entityType: 'message',
        entityId: newMsg.id,
        payload: newMsg,
        queuedAt: new Date().toISOString(),
        attempts: 0,
        status: 'pending',
      };
      setSyncQueue((prev) => [...prev, syncItem]);
      await aegisDB.put('syncQueue', syncItem);
    } else {
      emergencyAudio.playRadioPing();
    }

    return true;
  };

  // Send Audio Message
  const sendAudioMessage = async (
    channelId: string,
    audioBase64: string,
    durationSec: number,
    priority: MessagePriority = 'normal',
    recipientId?: string
  ): Promise<boolean> => {
    const newMsg: Message = {
      id: `msg-audio-${Date.now()}`,
      channelId,
      senderId: userProfile.id,
      senderCallsign: userProfile.callsign,
      senderRole: userProfile.role,
      content: `🎙️ Voice Note (${Math.round(durationSec)}s)`,
      timestamp: new Date().toISOString(),
      status: isSimulatedOffline || !isBrowserOnline ? 'pending' : 'delivered',
      priority,
      recipientId,
      audioDataUrl: audioBase64,
      audioDurationSec: durationSec,
    };

    setMessages((prev) => [...prev, newMsg]);
    await aegisDB.put('messages', newMsg);
    emergencyAudio.playRadioPing();
    addToast('success', 'Voice Note Transmitted', `Audio clip sent (${Math.round(durationSec)}s)`);
    return true;
  };

  const retryPendingMessage = async (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, status: 'delivered' } : m))
    );
    setSyncQueue((prev) => prev.filter((s) => s.entityId !== messageId));
    await aegisDB.delete('syncQueue', `sync-msg-${messageId}`);
    addToast('success', 'Message Transmitted', 'Pending message delivered.');
  };

  const discardPendingMessage = async (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    setSyncQueue((prev) => prev.filter((s) => s.entityId !== messageId));
    await aegisDB.delete('messages', messageId);
    await aegisDB.delete('syncQueue', `sync-msg-${messageId}`);
  };

  const clearConversation = async (channelId: string) => {
    const toKeep = messages.filter((m) => m.channelId !== channelId);
    setMessages(toKeep);
    addToast('info', 'Channel Cleared', 'Messages removed from local display.');
  };

  // Team Registration
  const registerTeam = async (teamData: Omit<TeamCommunity, 'id' | 'createdAt' | 'memberCount'>) => {
    const id = `team-${Date.now()}`;
    const newTeam: TeamCommunity = {
      ...teamData,
      id,
      memberCount: 1,
      createdAt: new Date().toISOString(),
      isCustom: true,
    };

    setTeams((prev) => [...prev, newTeam]);
    await aegisDB.put('teams', newTeam);
    await updateUserProfile({ registeredTeamId: id, assignedGroup: teamData.name });
    addToast('success', 'Squad Registered', `${teamData.name} created.`);
  };

  const registerTeamMember = async (
    memberData: Omit<Participant, 'id' | 'lastCheckIn' | 'batteryPct' | 'signalDbm' | 'gridCoordinates' | 'lat' | 'lng' | 'heading' | 'speedKmh' | 'gpsAccuracyM' | 'locationSharingEnabled' | 'animationState' | 'uniformColor' | 'inEmergency'>
  ) => {
    const id = `p-${Date.now()}`;
    const newParticipant: Participant = {
      ...memberData,
      id,
      availability: 'Available',
      lastCheckIn: new Date().toISOString(),
      batteryPct: 100,
      signalDbm: -65,
      lat: 35.3314 + (Math.random() - 0.5) * 0.02,
      lng: -120.6985 + (Math.random() - 0.5) * 0.02,
      heading: Math.floor(Math.random() * 360),
      speedKmh: 0,
      gpsAccuracyM: 4.0,
      locationSharingEnabled: true,
      animationState: 'idle',
      uniformColor: 'camo_green',
      inEmergency: false,
      gridCoordinates: { sector: '7-DELTA', easting: 4400, northing: 8800, elevationM: 330 },
      isRegisteredByUser: true,
    };

    setParticipants((prev) => [...prev, newParticipant]);
    await aegisDB.put('participants', newParticipant);
    addToast('success', 'Teammate Registered', `${newParticipant.callsign} added to squad.`);
  };

  const joinTeam = async (teamId: string) => {
    const targetTeam = teams.find((t) => t.id === teamId);
    if (!targetTeam) return;
    await updateUserProfile({ registeredTeamId: teamId, assignedGroup: targetTeam.name });
    addToast('success', 'Joined Squad', `You are now assigned to ${targetTeam.name}.`);
  };

  // Task Actions
  const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'history'>) => {
    const id = `tsk-${Date.now()}`;
    const newTask: Task = {
      ...taskData,
      id,
      createdAt: new Date().toISOString(),
      history: [
        {
          id: `h-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: userProfile.callsign,
          note: `Task created with priority ${taskData.priority}`,
        },
      ],
    };
    setTasks((prev) => [newTask, ...prev]);
    await aegisDB.put('tasks', newTask);
    addToast('success', 'Task Created', newTask.title);
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    const existing = tasks.find((t) => t.id === id);
    if (existing) {
      await aegisDB.put('tasks', { ...existing, ...updates });
    }
  };

  const deleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await aegisDB.delete('tasks', id);
    addToast('info', 'Task Deleted', 'Task removed from board.');
  };

  const moveTaskStatus = async (id: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            status: newStatus,
            history: [
              ...t.history,
              {
                id: `h-${Date.now()}`,
                timestamp: new Date().toISOString(),
                actor: userProfile.callsign,
                note: `Status moved to ${newStatus}`,
              },
            ],
          };
        }
        return t;
      })
    );
  };

  // Map Annotations
  const addMapAnnotation = async (annotation: Omit<MapMarker, 'id' | 'updatedAt' | 'isUserCreated'>) => {
    const id = `m-custom-${Date.now()}`;
    const newMarker: MapMarker = {
      ...annotation,
      id,
      updatedAt: new Date().toISOString(),
      isUserCreated: true,
    };
    setMapMarkers((prev) => [...prev, newMarker]);
    await aegisDB.put('mapMarkers', newMarker);
    addToast('success', 'Map Note Placed', newMarker.title);
  };

  const removeMapMarker = async (id: string) => {
    setMapMarkers((prev) => prev.filter((m) => m.id !== id));
    await aegisDB.delete('mapMarkers', id);
    addToast('info', 'Marker Removed', 'Map note deleted.');
  };

  // Alerts
  const acknowledgeAlert = async (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    );
  };

  const dismissAlert = async (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, resolved: true, read: true } : a))
    );
  };

  const clearResolvedAlerts = async () => {
    setAlerts((prev) => prev.filter((a) => !a.resolved));
    addToast('info', 'Alerts Cleared', 'Resolved alerts cleared.');
  };

  // Operative check-in
  const participantCheckIn = async (participantId: string, statusNote?: string) => {
    const now = new Date().toISOString();
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id === participantId) {
          return {
            ...p,
            lastCheckIn: now,
            statusNote: statusNote || p.statusNote,
            batteryPct: Math.max(10, p.batteryPct - 1),
          };
        }
        return p;
      })
    );
    emergencyAudio.playRadioPing();
    addToast('success', 'Check-In Ping Sent', 'Teammate check-in registered.');
  };

  const updateParticipantAnimationState = async (participantId: string, state: CharacterAnimationState) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === participantId ? { ...p, animationState: state } : p))
    );
  };

  const updateParticipantUniformColor = async (participantId: string, color: UniformColor) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === participantId ? { ...p, uniformColor: color } : p))
    );
  };

  // Sync Queue
  const processSyncQueue = async () => {
    if (isSimulatedOffline || !isBrowserOnline) return;
    setSyncQueue([]);
    setLastSyncTime(new Date().toISOString());
  };

  const triggerManualEvent = async (type: 'message' | 'checkin' | 'alert' | 'linkDisruption') => {
    if (type === 'message') {
      const p = participants[Math.floor(Math.random() * participants.length)];
      if (p) {
        await sendMessage('all-community', `Radio check from ${p.callsign}: Sector clear, position steady.`);
      }
    } else if (type === 'checkin') {
      const p = participants[Math.floor(Math.random() * participants.length)];
      if (p) {
        await participantCheckIn(p.id, 'Routine scheduled check-in completed.');
      }
    } else if (type === 'alert') {
      const newAlert: Alert = {
        id: `alt-manual-${Date.now()}`,
        type: 'info',
        title: 'Tactical Notice',
        message: 'Weather update: Dry conditions with clear satellite reception.',
        severity: 'Informational',
        timestamp: new Date().toISOString(),
        read: false,
        acknowledged: false,
        resolved: false,
      };
      setAlerts((prev) => [newAlert, ...prev]);
      addToast('info', newAlert.title, newAlert.message);
    } else if (type === 'linkDisruption') {
      toggleSimulatedOffline();
    }
  };

  const resetToSeedData = async () => {
    await aegisDB.resetToDefaults();
    window.location.reload();
  };

  const toggleSimulationRunning = () => setIsSimulationRunning((prev) => !prev);
  const setSimulationSpeed = (speed: 1 | 2 | 5) => {
    setSimulationSpeedState(speed);
    updateSettings({ simulationSpeed: speed });
  };

  return (
    <AegisContext.Provider
      value={{
        currentView,
        setCurrentView,
        userProfile,
        updateUserProfile,
        settings,
        updateSettings,

        apiKey,

        teams,
        participants,
        tasks,
        messages,
        mapMarkers,
        alerts,
        activities,
        syncQueue,
        emergencies,
        activeEmergency,

        mapCenter,
        setMapCenter,
        selectedMarkerId,
        setSelectedMarkerId,
        selectedTeammateId,
        setSelectedTeammateId,

        liveUserPosition,
        isLiveSharing,
        startLocationSharing,
        pauseLocationSharing,
        stopLocationSharing,
        userLocationConsent,
        setUserLocationConsent,

        isSimulatedOffline,
        toggleSimulatedOffline,
        isBrowserOnline,
        lastSyncTime,

        isSimulationRunning,
        toggleSimulationRunning,
        simulationSpeed: simulationSpeedState,
        setSimulationSpeed,
        appUptimeSeconds,
        triggerManualEvent,
        resetToSeedData,

        sendMessage,
        sendAudioMessage,
        retryPendingMessage,
        discardPendingMessage,
        clearConversation,

        registerTeam,
        registerTeamMember,
        joinTeam,

        createTask,
        updateTask,
        deleteTask,
        moveTaskStatus,

        addMapAnnotation,
        removeMapMarker,

        triggerEmergencySOS,
        acknowledgeEmergency,
        resolveEmergency,
        cancelEmergency,

        isSoundDetectionActive,
        toggleSoundDetection,
        distressModalOpen,
        soundDistressMetrics,
        confirmSoundEmergency,
        dismissSoundAlert,

        twoFactorState,
        enable2FA,
        disable2FA,
        verify2FACode,
        revokeSession,

        acknowledgeAlert,
        dismissAlert,
        clearResolvedAlerts,

        participantCheckIn,
        updateParticipantAnimationState,
        updateParticipantUniformColor,
        processSyncQueue,

        toasts,
        addToast,
        dismissToast,
      }}
    >
      {children}
    </AegisContext.Provider>
  );
};

export const useAegis = () => {
  const context = useContext(AegisContext);
  if (!context) {
    throw new Error('useAegis must be used within an AegisProvider');
  }
  return context;
};
