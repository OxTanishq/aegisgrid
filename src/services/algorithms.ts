/**
 * AEGIS GRID — Operational Analytics & Data Quality Algorithms
 * Real calculations executed over the synthetic application state.
 */

import {
  Participant,
  Task,
  Message,
  ActivityEvent,
  SyncQueueItem,
  FreshnessThresholds,
  DataIntegrityIssue,
  AvailabilityStatus,
} from '../types';

export interface TeamAvailabilityMetrics {
  total: number;
  byStatus: Record<AvailabilityStatus, number>;
  percentageByStatus: Record<AvailabilityStatus, number>;
  avgBatteryPct: number;
  avgSignalDbm: number;
  operationalReadinessPct: number; // (Available + On Mission) / Total
}

export function calculateTeamAvailability(participants: Participant[]): TeamAvailabilityMetrics {
  const total = participants.length;
  const byStatus: Record<AvailabilityStatus, number> = {
    Available: 0,
    'On Mission': 0,
    'Restricted Comms': 0,
    Standby: 0,
  };

  if (total === 0) {
    return {
      total: 0,
      byStatus,
      percentageByStatus: {
        Available: 0,
        'On Mission': 0,
        'Restricted Comms': 0,
        Standby: 0,
      },
      avgBatteryPct: 0,
      avgSignalDbm: 0,
      operationalReadinessPct: 0,
    };
  }

  let totalBattery = 0;
  let totalSignal = 0;

  participants.forEach((p) => {
    if (byStatus[p.availability] !== undefined) {
      byStatus[p.availability]++;
    }
    totalBattery += p.batteryPct || 0;
    totalSignal += p.signalDbm || 0;
  });

  const percentageByStatus: Record<AvailabilityStatus, number> = {
    Available: Math.round((byStatus.Available / total) * 100),
    'On Mission': Math.round((byStatus['On Mission'] / total) * 100),
    'Restricted Comms': Math.round((byStatus['Restricted Comms'] / total) * 100),
    Standby: Math.round((byStatus.Standby / total) * 100),
  };

  const operationalReadyCount = byStatus.Available + byStatus['On Mission'];
  const operationalReadinessPct = Math.round((operationalReadyCount / total) * 100);

  return {
    total,
    byStatus,
    percentageByStatus,
    avgBatteryPct: Math.round(totalBattery / total),
    avgSignalDbm: Math.round(totalSignal / total),
    operationalReadinessPct,
  };
}

export interface MessageDeliveryMetrics {
  totalMessages: number;
  deliveredCount: number;
  pendingCount: number;
  failedCount: number;
  deliverySuccessRatePct: number;
  estimatedAvgLatencyMs: number;
}

export function calculateMessageDeliveryAnalytics(
  messages: Message[],
  syncQueue: SyncQueueItem[]
): MessageDeliveryMetrics {
  const totalMessages = messages.length;
  if (totalMessages === 0) {
    return {
      totalMessages: 0,
      deliveredCount: 0,
      pendingCount: 0,
      failedCount: 0,
      deliverySuccessRatePct: 100,
      estimatedAvgLatencyMs: 0,
    };
  }

  let delivered = 0;
  let pending = 0;
  let failed = 0;

  messages.forEach((m) => {
    if (m.status === 'delivered') delivered++;
    else if (m.status === 'pending') pending++;
    else if (m.status === 'failed') failed++;
  });

  // Include queued messages
  const queuedMessagesCount = syncQueue.filter((q) => q.entityType === 'message' && q.status === 'pending').length;
  const effectivePending = pending + queuedMessagesCount;

  const finishedCount = delivered + failed;
  const successRate = finishedCount > 0 ? Math.round((delivered / finishedCount) * 100) : 100;

  // Model realistic mesh packet roundtrip latency: ~120ms baseline + jitter based on failed/pending count
  const estimatedLatency = 140 + failed * 80 + effectivePending * 45;

  return {
    totalMessages: totalMessages + queuedMessagesCount,
    deliveredCount: delivered,
    pendingCount: effectivePending,
    failedCount: failed,
    deliverySuccessRatePct: successRate,
    estimatedAvgLatencyMs: estimatedLatency,
  };
}

export interface TaskCompletionMetrics {
  totalTasks: number;
  openCount: number;
  inProgressCount: number;
  blockedCount: number;
  completedCount: number;
  completionRatePct: number;
  priorityBreakdown: {
    Critical: { total: number; completed: number };
    High: { total: number; completed: number };
    Medium: { total: number; completed: number };
    Low: { total: number; completed: number };
  };
}

export function calculateTaskCompletion(tasks: Task[]): TaskCompletionMetrics {
  const total = tasks.length;
  const metrics: TaskCompletionMetrics = {
    totalTasks: total,
    openCount: 0,
    inProgressCount: 0,
    blockedCount: 0,
    completedCount: 0,
    completionRatePct: 0,
    priorityBreakdown: {
      Critical: { total: 0, completed: 0 },
      High: { total: 0, completed: 0 },
      Medium: { total: 0, completed: 0 },
      Low: { total: 0, completed: 0 },
    },
  };

  if (total === 0) return metrics;

  tasks.forEach((t) => {
    if (t.status === 'Open') metrics.openCount++;
    else if (t.status === 'In Progress') metrics.inProgressCount++;
    else if (t.status === 'Blocked') metrics.blockedCount++;
    else if (t.status === 'Completed') metrics.completedCount++;

    if (metrics.priorityBreakdown[t.priority]) {
      metrics.priorityBreakdown[t.priority].total++;
      if (t.status === 'Completed') {
        metrics.priorityBreakdown[t.priority].completed++;
      }
    }
  });

  metrics.completionRatePct = Math.round((metrics.completedCount / total) * 100);
  return metrics;
}

export interface FreshnessBreakdown {
  freshCount: number;
  agingCount: number;
  staleCount: number;
  staleParticipants: Participant[];
  agingParticipants: Participant[];
  freshParticipants: Participant[];
  overallFreshnessScorePct: number;
}

export function calculateDataFreshness(
  participants: Participant[],
  thresholds: FreshnessThresholds
): FreshnessBreakdown {
  const now = Date.now();
  const freshMs = thresholds.freshMin * 60 * 1000;
  const agingMs = thresholds.agingMin * 60 * 1000;

  const fresh: Participant[] = [];
  const aging: Participant[] = [];
  const stale: Participant[] = [];

  participants.forEach((p) => {
    const checkInTime = new Date(p.lastCheckIn).getTime();
    const ageMs = isNaN(checkInTime) ? Infinity : now - checkInTime;

    if (ageMs <= freshMs) {
      fresh.push(p);
    } else if (ageMs <= agingMs) {
      aging.push(p);
    } else {
      stale.push(p);
    }
  });

  const total = participants.length;
  const score = total > 0 ? Math.round(((fresh.length * 1.0 + aging.length * 0.5) / total) * 100) : 100;

  return {
    freshCount: fresh.length,
    agingCount: aging.length,
    staleCount: stale.length,
    freshParticipants: fresh,
    agingParticipants: aging,
    staleParticipants: stale,
    overallFreshnessScorePct: score,
  };
}

export interface ActivityIntervalBucket {
  label: string;
  count: number;
  commCount: number;
  taskCount: number;
  positionCount: number;
  otherCount: number;
}

export function calculateActivityTrends(events: ActivityEvent[]): ActivityIntervalBucket[] {
  const now = Date.now();
  const buckets: ActivityIntervalBucket[] = [
    { label: '0-10m', count: 0, commCount: 0, taskCount: 0, positionCount: 0, otherCount: 0 },
    { label: '10-20m', count: 0, commCount: 0, taskCount: 0, positionCount: 0, otherCount: 0 },
    { label: '20-40m', count: 0, commCount: 0, taskCount: 0, positionCount: 0, otherCount: 0 },
    { label: '40-60m', count: 0, commCount: 0, taskCount: 0, positionCount: 0, otherCount: 0 },
    { label: '60m+', count: 0, commCount: 0, taskCount: 0, positionCount: 0, otherCount: 0 },
  ];

  events.forEach((ev) => {
    const t = new Date(ev.timestamp).getTime();
    const ageMins = (now - t) / (60 * 1000);

    let bucketIdx = 4;
    if (ageMins <= 10) bucketIdx = 0;
    else if (ageMins <= 20) bucketIdx = 1;
    else if (ageMins <= 40) bucketIdx = 2;
    else if (ageMins <= 60) bucketIdx = 3;

    const b = buckets[bucketIdx];
    b.count++;
    if (ev.category === 'Comm') b.commCount++;
    else if (ev.category === 'Task') b.taskCount++;
    else if (ev.category === 'Position') b.positionCount++;
    else b.otherCount++;
  });

  return buckets;
}

export function validateDataQuality(
  participants: Participant[],
  tasks: Task[],
  messages: Message[]
): DataIntegrityIssue[] {
  const issues: DataIntegrityIssue[] = [];
  const participantIds = new Set(participants.map((p) => p.id));
  const seenParticipantIds = new Set<string>();

  // 1. Participant validation
  participants.forEach((p) => {
    if (!p.id) {
      issues.push({
        id: `p-missing-id-${Math.random()}`,
        entityType: 'Participant',
        severity: 'error',
        description: `Participant record is missing a unique ID: ${p.name || 'Unknown'}`,
        autoFixable: false,
      });
    }
    if (seenParticipantIds.has(p.id)) {
      issues.push({
        id: `p-dup-id-${p.id}`,
        entityType: 'Participant',
        severity: 'error',
        description: `Duplicate participant ID found: ${p.id} (${p.callsign})`,
        autoFixable: true,
      });
    }
    seenParticipantIds.add(p.id);

    if (p.batteryPct < 0 || p.batteryPct > 100) {
      issues.push({
        id: `p-batt-${p.id}`,
        entityType: 'Participant',
        severity: 'warning',
        description: `Out-of-range battery percentage (${p.batteryPct}%) for ${p.callsign}`,
        autoFixable: true,
      });
    }

    if (isNaN(new Date(p.lastCheckIn).getTime())) {
      issues.push({
        id: `p-time-${p.id}`,
        entityType: 'Participant',
        severity: 'error',
        description: `Invalid ISO-8601 timestamp in check-in for ${p.callsign}`,
        autoFixable: true,
      });
    }
  });

  // 2. Task validation
  const seenTaskIds = new Set<string>();
  tasks.forEach((t) => {
    if (!t.id) {
      issues.push({
        id: `t-missing-id-${Math.random()}`,
        entityType: 'Task',
        severity: 'error',
        description: `Task has missing ID: "${t.title}"`,
        autoFixable: false,
      });
    }
    if (seenTaskIds.has(t.id)) {
      issues.push({
        id: `t-dup-id-${t.id}`,
        entityType: 'Task',
        severity: 'error',
        description: `Duplicate task ID detected: ${t.id}`,
        autoFixable: true,
      });
    }
    seenTaskIds.add(t.id);

    if (t.assigneeId && !participantIds.has(t.assigneeId)) {
      issues.push({
        id: `t-orphan-${t.id}`,
        entityType: 'Task',
        severity: 'warning',
        description: `Task "${t.title}" assigned to non-existent participant (${t.assigneeId})`,
        autoFixable: true,
      });
    }
  });

  // 3. Message validation
  messages.forEach((m) => {
    if (!m.id) {
      issues.push({
        id: `m-missing-id-${Math.random()}`,
        entityType: 'Message',
        severity: 'error',
        description: 'Message record with missing ID found in local log',
        autoFixable: false,
      });
    }
    if (isNaN(new Date(m.timestamp).getTime())) {
      issues.push({
        id: `m-bad-ts-${m.id}`,
        entityType: 'Message',
        severity: 'warning',
        description: `Message ${m.id} has unparseable timestamp`,
        autoFixable: true,
      });
    }
  });

  return issues;
}

/**
 * Calculates Haversine straight-line distance in meters between two coordinates.
 */
export function calculateHaversineDistanceM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Formats distance into human-readable meters or kilometers.
 */
export function formatDistance(distanceM: number): string {
  if (distanceM < 1000) {
    return `${Math.round(distanceM)} m`;
  }
  return `${(distanceM / 1000).toFixed(2)} km`;
}

/**
 * Calculates compass bearing from point 1 to point 2 (0 - 360 degrees).
 */
export function calculateBearingDegrees(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return Math.round((brng + 360) % 360);
}

/**
 * Estimates walking travel time (assumes 4.8 km/h).
 */
export function estimateWalkingMinutes(distanceM: number): number {
  const km = distanceM / 1000;
  return Math.max(1, Math.round((km / 4.8) * 60));
}

/**
 * Estimates driving travel time on tactical roads (assumes 35 km/h).
 */
export function estimateDrivingMinutes(distanceM: number): number {
  const km = distanceM / 1000;
  return Math.max(1, Math.round((km / 35) * 60));
}

