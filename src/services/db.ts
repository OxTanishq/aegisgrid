/**
 * AEGIS GRID — IndexedDB Local Data Store
 * Provides offline-first persistence for all tactical coordination & emergency entities.
 */

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
  TeamCommunity,
  EmergencyEvent,
  TwoFactorAuthState,
} from '../types';
import {
  INITIAL_USER_PROFILE,
  INITIAL_SETTINGS,
  INITIAL_TEAMS,
  INITIAL_PARTICIPANTS,
  INITIAL_TASKS,
  INITIAL_MAP_MARKERS,
  INITIAL_ALERTS,
  INITIAL_MESSAGES,
  INITIAL_ACTIVITIES,
  INITIAL_EMERGENCIES,
  INITIAL_2FA_STATE,
} from './seedData';

const DB_NAME = 'aegis_grid_db';
const DB_VERSION = 3;

export type StoreName =
  | 'profile'
  | 'teams'
  | 'participants'
  | 'tasks'
  | 'messages'
  | 'mapMarkers'
  | 'alerts'
  | 'activities'
  | 'syncQueue'
  | 'settings'
  | 'emergencies'
  | 'auth2fa';

class AegisDatabase {
  private db: IDBDatabase | null = null;
  private memoryFallback: Record<string, any[]> = {};
  private isMemoryMode = false;

  public async init(): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      this.isMemoryMode = true;
      this.seedMemory();
      return;
    }

    return new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const stores: StoreName[] = [
            'profile',
            'teams',
            'participants',
            'tasks',
            'messages',
            'mapMarkers',
            'alerts',
            'activities',
            'syncQueue',
            'settings',
            'emergencies',
            'auth2fa',
          ];

          stores.forEach((storeName) => {
            if (!db.objectStoreNames.contains(storeName)) {
              db.createObjectStore(storeName, { keyPath: 'id' });
            }
          });
        };

        request.onsuccess = async (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          await this.checkAndSeedIfEmpty();
          resolve();
        };

        request.onerror = () => {
          console.warn('AEGIS GRID: IndexedDB open failed, falling back to in-memory store.');
          this.isMemoryMode = true;
          this.seedMemory();
          resolve();
        };
      } catch (err) {
        console.warn('AEGIS GRID: IndexedDB error:', err);
        this.isMemoryMode = true;
        this.seedMemory();
        resolve();
      }
    });
  }

  private seedMemory() {
    this.memoryFallback = {
      profile: [{ ...INITIAL_USER_PROFILE, id: 'current' }],
      settings: [{ ...INITIAL_SETTINGS, id: 'current' }],
      auth2fa: [{ ...INITIAL_2FA_STATE, id: 'current' }],
      teams: [...INITIAL_TEAMS],
      participants: [...INITIAL_PARTICIPANTS],
      tasks: [...INITIAL_TASKS],
      mapMarkers: [...INITIAL_MAP_MARKERS],
      alerts: [...INITIAL_ALERTS],
      messages: [...INITIAL_MESSAGES],
      activities: [...INITIAL_ACTIVITIES],
      emergencies: [...INITIAL_EMERGENCIES],
      syncQueue: [],
    };
  }

  private async checkAndSeedIfEmpty(): Promise<void> {
    if (!this.db) return;
    try {
      const participants = await this.getAll<Participant>('participants');
      const teams = await this.getAll<TeamCommunity>('teams');
      const markers = await this.getAll<MapMarker>('mapMarkers');
      const needsMigration =
        participants.length === 0 ||
        teams.length === 0 ||
        participants.some((p) => p.lat === undefined || !p.animationState || !p.uniformColor) ||
        markers.some((m) => m.lat === undefined || m.lng === undefined);

      if (needsMigration) {
        await this.resetToDefaults();
      }
    } catch {
      await this.resetToDefaults();
    }
  }

  public async resetToDefaults(): Promise<void> {
    if (this.isMemoryMode || !this.db) {
      this.seedMemory();
      return;
    }

    const clearStore = (storeName: StoreName) => {
      return new Promise<void>((resolve) => {
        try {
          if (!this.db!.objectStoreNames.contains(storeName)) {
            resolve();
            return;
          }
          const tx = this.db!.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          const req = store.clear();
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    };

    const putBatch = <T>(storeName: StoreName, items: T[]) => {
      return new Promise<void>((resolve) => {
        try {
          if (!this.db!.objectStoreNames.contains(storeName)) {
            resolve();
            return;
          }
          const tx = this.db!.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          items.forEach((item) => store.put(item));
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    };

    const stores: StoreName[] = [
      'profile',
      'teams',
      'participants',
      'tasks',
      'messages',
      'mapMarkers',
      'alerts',
      'activities',
      'syncQueue',
      'settings',
      'emergencies',
      'auth2fa',
    ];

    for (const s of stores) {
      await clearStore(s);
    }

    await putBatch('profile', [{ ...INITIAL_USER_PROFILE, id: 'current' }]);
    await putBatch('settings', [{ ...INITIAL_SETTINGS, id: 'current' }]);
    await putBatch('auth2fa', [{ ...INITIAL_2FA_STATE, id: 'current' }]);
    await putBatch('teams', INITIAL_TEAMS);
    await putBatch('participants', INITIAL_PARTICIPANTS);
    await putBatch('tasks', INITIAL_TASKS);
    await putBatch('mapMarkers', INITIAL_MAP_MARKERS);
    await putBatch('alerts', INITIAL_ALERTS);
    await putBatch('messages', INITIAL_MESSAGES);
    await putBatch('activities', INITIAL_ACTIVITIES);
    await putBatch('emergencies', INITIAL_EMERGENCIES);
  }

  public async getAll<T>(storeName: StoreName): Promise<T[]> {
    if (this.isMemoryMode || !this.db) {
      return (this.memoryFallback[storeName] as T[]) || [];
    }

    return new Promise((resolve) => {
      try {
        if (!this.db!.objectStoreNames.contains(storeName)) {
          resolve((this.memoryFallback[storeName] as T[]) || []);
          return;
        }
        const tx = this.db!.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve((request.result as T[]) || []);
        request.onerror = () => resolve((this.memoryFallback[storeName] as T[]) || []);
      } catch {
        resolve((this.memoryFallback[storeName] as T[]) || []);
      }
    });
  }

  public async get<T>(storeName: StoreName, id: string): Promise<T | null> {
    if (this.isMemoryMode || !this.db) {
      const items = (this.memoryFallback[storeName] as any[]) || [];
      return (items.find((item) => item.id === id) as T) || null;
    }

    return new Promise((resolve) => {
      try {
        if (!this.db!.objectStoreNames.contains(storeName)) {
          resolve(null);
          return;
        }
        const tx = this.db!.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.get(id);
        request.onsuccess = () => resolve((request.result as T) || null);
        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  public async put<T extends { id: string }>(storeName: StoreName, item: T): Promise<void> {
    if (this.isMemoryMode || !this.db) {
      if (!this.memoryFallback[storeName]) this.memoryFallback[storeName] = [];
      const idx = this.memoryFallback[storeName].findIndex((x) => x.id === item.id);
      if (idx >= 0) {
        this.memoryFallback[storeName][idx] = item;
      } else {
        this.memoryFallback[storeName].push(item);
      }
      return;
    }

    return new Promise((resolve) => {
      try {
        if (!this.db!.objectStoreNames.contains(storeName)) {
          if (!this.memoryFallback[storeName]) this.memoryFallback[storeName] = [];
          this.memoryFallback[storeName].push(item);
          resolve();
          return;
        }
        const tx = this.db!.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = () => {
          if (!this.memoryFallback[storeName]) this.memoryFallback[storeName] = [];
          this.memoryFallback[storeName].push(item);
          resolve();
        };
      } catch {
        if (!this.memoryFallback[storeName]) this.memoryFallback[storeName] = [];
        this.memoryFallback[storeName].push(item);
        resolve();
      }
    });
  }

  public async delete(storeName: StoreName, id: string): Promise<void> {
    if (this.isMemoryMode || !this.db) {
      if (this.memoryFallback[storeName]) {
        this.memoryFallback[storeName] = this.memoryFallback[storeName].filter((x) => x.id !== id);
      }
      return;
    }

    return new Promise((resolve) => {
      try {
        if (!this.db!.objectStoreNames.contains(storeName)) {
          resolve();
          return;
        }
        const tx = this.db!.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  public async exportAllData(): Promise<Record<string, any>> {
    const stores: StoreName[] = [
      'profile',
      'teams',
      'participants',
      'tasks',
      'messages',
      'mapMarkers',
      'alerts',
      'activities',
      'syncQueue',
      'settings',
      'emergencies',
      'auth2fa',
    ];

    const dump: Record<string, any> = {
      platform: 'AEGIS GRID',
      version: '3.0.0-PRO',
      exportTimestamp: new Date().toISOString(),
      disclaimer: 'SYNTHETIC NON-OPERATIONAL DEMONSTRATION DATA ONLY',
    };

    for (const s of stores) {
      dump[s] = await this.getAll(s);
    }
    return dump;
  }
}

export const aegisDB = new AegisDatabase();
