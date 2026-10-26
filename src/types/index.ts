/**
 * AEGIS GRID — Type Definitions
 * Advanced Military Map Awareness & Emergency Response Platform
 * Non-operational demonstration environment with synthetic data and fictional operations.
 */

export type DemoRole = 'Coordinator' | 'Team Member' | 'Observer';

export type TacticalGroup =
  | 'Alpha Recon'
  | 'Bravo Logistics'
  | 'Delta Medical'
  | 'Echo Comms'
  | string;

export type AvailabilityStatus = 'Available' | 'On Mission' | 'Restricted Comms' | 'Standby';

export type TaskStatus = 'Open' | 'In Progress' | 'Blocked' | 'Completed';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type MessageStatus = 'delivered' | 'pending' | 'failed';

export type MessagePriority = 'normal' | 'priority' | 'urgent';

export type AlertSeverity = 'Informational' | 'Warning' | 'Critical';

export type AlertType = 'info' | 'connectivity' | 'freshness' | 'storage' | 'task' | 'system' | 'emergency';

export type EventCategory = 'Comm' | 'Task' | 'Position' | 'Alert' | 'System' | 'Sync' | 'Emergency' | 'Security';

export type CharacterAnimationState =
  | 'idle'
  | 'walking'
  | 'running'
  | 'resting'
  | 'off_duty'
  | 'helping'
  | 'emergency';

export type UniformColor =
  | 'camo_green'
  | 'desert_tan'
  | 'urban_navy'
  | 'stealth_black'
  | 'medic_white';

export interface Participant {
  id: string;
  callsign: string;
  name: string;
  role: DemoRole;
  group: string;
  availability: AvailabilityStatus;
  lastCheckIn: string; // ISO 8601 string
  batteryPct: number;
  signalDbm: number;
  lat: number;
  lng: number;
  heading: number;
  speedKmh: number;
  gpsAccuracyM: number;
  locationSharingEnabled: boolean;
  locationSharedUntil?: string;
  animationState: CharacterAnimationState;
  uniformColor: UniformColor;
  inEmergency: boolean;
  emergencyMessage?: string;
  emergencyTimestamp?: string;
  gridCoordinates: {
    sector: string;
    easting: number;
    northing: number;
    elevationM: number;
  };
  statusNote: string;
  isRegisteredByUser?: boolean;
}

export interface TeamCommunity {
  id: string;
  name: string;
  description: string;
  motto: string;
  leaderCallsign: string;
  channelId: string;
  memberCount: number;
  color: string;
  createdAt: string;
  isCustom?: boolean;
}

export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  senderCallsign: string;
  senderRole: DemoRole;
  content: string;
  timestamp: string; // ISO 8601 string
  status: MessageStatus;
  priority: MessagePriority;
  retryCount?: number;
  teamId?: string;
  recipientId?: string; // For 1-on-1 private messaging
  audioDataUrl?: string; // Base64 audio recording
  audioDurationSec?: number;
  isEmergency?: boolean;
}

export interface TaskHistoryEntry {
  id: string;
  timestamp: string;
  actor: string;
  note: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId: string;
  assigneeCallsign: string;
  createdAt: string;
  dueDate?: string;
  history: TaskHistoryEntry[];
}

export interface MapMarker {
  id: string;
  type: 'team' | 'waypoint' | 'resource' | 'annotation' | 'emergency';
  title: string;
  category: string;
  lat: number;
  lng: number;
  x?: number; // legacy fallback percentage
  y?: number; // legacy fallback percentage
  status: 'nominal' | 'alert' | 'standby' | 'active';
  details: string;
  participantId?: string;
  updatedAt: string;
  isUserCreated?: boolean;
}

export interface EmergencyEvent {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterCallsign: string;
  requesterRole: DemoRole;
  lat: number;
  lng: number;
  accuracyM: number;
  timestamp: string;
  status: 'active' | 'in_progress' | 'resolved' | 'cancelled';
  message: string;
  soundTriggered?: boolean;
  soundConfidence?: number;
  acknowledgedBy?: string[];
  timeline: {
    id: string;
    timestamp: string;
    actor: string;
    action: string;
    note?: string;
  }[];
}

export interface SoundDetectionConfig {
  enabled: boolean;
  sensitivity: number; // 0 to 100
  thresholdDb: number; // e.g. -18 dB
  autoEscalate: boolean;
  escalateDelaySeconds: number;
}

export interface DeviceSession {
  id: string;
  deviceName: string;
  browser: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface TwoFactorAuthState {
  enabled: boolean;
  secret: string; // Base32 TOTP secret
  verified: boolean;
  lastVerifiedAt?: string;
  backupCodes: { codeHash: string; plainCodeSnippet: string; used: boolean }[];
  activeSessions: DeviceSession[];
}

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  severity: AlertSeverity;
  timestamp: string;
  read: boolean;
  acknowledged: boolean;
  resolved: boolean;
  sourceEntityId?: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  category: EventCategory;
  description: string;
  actor: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface SyncQueueItem {
  id: string;
  entityType: 'message' | 'task' | 'annotation' | 'checkin' | 'emergency' | 'location';
  entityId: string;
  payload: any;
  queuedAt: string;
  attempts: number;
  status: 'pending' | 'syncing' | 'failed';
}

export interface UserProfile {
  id: string;
  displayName: string;
  callsign: string;
  role: DemoRole;
  assignedGroup: string;
  initialLaunchComplete: boolean;
  registeredTeamId?: string;
  uniformColor: UniformColor;
  animationState: CharacterAnimationState;
  sharingConsent: boolean;
  sharingDurationHours: number;
}

export interface FreshnessThresholds {
  freshMin: number;
  agingMin: number;
  staleMin: number;
}

export interface AppSettings {
  reducedMotion: boolean;
  density: 'comfortable' | 'compact';
  simulationSpeed: 1 | 2 | 5;
  autoGenerateEvents: boolean;
  browserNotifications: boolean;
  freshnessThresholds: FreshnessThresholds;
  mapType: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  soundDetection: SoundDetectionConfig;
}

export interface DataIntegrityIssue {
  id: string;
  entityType: string;
  severity: 'warning' | 'error';
  description: string;
  autoFixable: boolean;
  fixAction?: () => void;
}

export interface StorageEstimateInfo {
  usageBytes: number;
  quotaBytes: number;
  usagePct: number;
}
