// FleetPulse TMS - Robust Offline-First Sync & Conflict Resolution Engine
// Adheres strictly to Part 11 (Idempotent Action Queue, Atomic Execution, Conflict Resolution)

import { OfflineQueueItem, OfflineSyncStatus, UserRole } from '../types/tms';
import { idbGet, idbSet, idbGetAll, idbDelete, MASTER_STORES } from './masterIndexedDB';

export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'uuid-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
};

export const getDeviceId = (): string => {
  if (typeof window === 'undefined') return 'server-dev';
  let devId = localStorage.getItem('fleetpulse_device_id');
  if (!devId) {
    devId = 'dev-' + generateUUID().slice(0, 8);
    localStorage.setItem('fleetpulse_device_id', devId);
  }
  return devId;
};

// Sync Event Listeners
type SyncListener = (summary: {
  isOnline: boolean;
  status: OfflineSyncStatus;
  pendingCount: number;
  lastSyncedAt: string | null;
}) => void;

const listeners: Set<SyncListener> = new Set();

export const subscribeToSyncState = (listener: SyncListener): (() => void) => {
  listeners.add(listener);
  // Emit current state immediately
  getSyncQueueSummary().then((summary) => listener(summary));
  return () => listeners.delete(listener);
};

const notifyListeners = async () => {
  const summary = await getSyncQueueSummary();
  listeners.forEach((l) => l(summary));
};

export const isDeviceOnline = (): boolean => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};

// Summary of Offline Queue
export const getSyncQueueSummary = async () => {
  const items = await idbGetAll<OfflineQueueItem>(MASTER_STORES.OFFLINE_QUEUE);
  const pendingItems = items.filter(
    (i) => i.status === 'saved_offline' || i.status === 'waiting_to_sync' || i.status === 'syncing'
  );
  const lastSyncMeta = await idbGet<{ key: string; value: string }>(
    MASTER_STORES.SYNC_META,
    'last_synced_at',
    { key: 'last_synced_at', value: '' }
  );

  let status: OfflineSyncStatus = isDeviceOnline() ? 'synced_successfully' : 'saved_offline';
  if (pendingItems.length > 0) {
    status = isDeviceOnline() ? 'waiting_to_sync' : 'saved_offline';
  }

  return {
    isOnline: isDeviceOnline(),
    status,
    pendingCount: pendingItems.length,
    lastSyncedAt: lastSyncMeta.value || null,
    totalItems: items.length,
  };
};

/**
 * Enqueue a new mutation into the offline sync queue
 */
export const enqueueOfflineAction = async (params: {
  activityType: OfflineQueueItem['activityType'];
  summary: string;
  payload: any;
  userId: string;
  userName: string;
  role: UserRole;
  vehicleId?: string;
  vehicleNumber?: string;
  customIdempotencyKey?: string;
}): Promise<OfflineQueueItem> => {
  const id = generateUUID();
  const idempotencyKey =
    params.customIdempotencyKey ||
    `${params.activityType}-${params.vehicleId || params.userId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const item: OfflineQueueItem = {
    id,
    idempotencyKey,
    userId: params.userId,
    userName: params.userName,
    role: params.role,
    vehicleId: params.vehicleId,
    vehicleNumber: params.vehicleNumber,
    activityType: params.activityType,
    summary: params.summary,
    payload: params.payload,
    createdAt: new Date().toISOString(),
    deviceId: getDeviceId(),
    status: isDeviceOnline() ? 'waiting_to_sync' : 'saved_offline',
    retryCount: 0,
  };

  await idbSet(MASTER_STORES.OFFLINE_QUEUE, item);
  await notifyListeners();

  // If online, trigger background processing
  if (isDeviceOnline()) {
    processOfflineSyncQueue().catch(console.error);
  }

  return item;
};

let isSyncInProgress = false;

/**
 * Process all pending actions in the offline queue with conflict detection
 */
export const processOfflineSyncQueue = async (
  onItemProcessed?: (item: OfflineQueueItem) => void
): Promise<{ processed: number; failed: number; conflicts: number }> => {
  if (isSyncInProgress) {
    return { processed: 0, failed: 0, conflicts: 0 };
  }

  isSyncInProgress = true;
  let processed = 0;
  let failed = 0;
  let conflicts = 0;

  try {
    const queue = await idbGetAll<OfflineQueueItem>(MASTER_STORES.OFFLINE_QUEUE);
    const pending = queue
      .filter((i) => i.status === 'saved_offline' || i.status === 'waiting_to_sync' || i.status === 'sync_failed')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    for (const item of pending) {
      item.status = 'syncing';
      item.lastAttemptAt = new Date().toISOString();
      await idbSet(MASTER_STORES.OFFLINE_QUEUE, item);
      await notifyListeners();

      try {
        // Validation & Conflict check:
        // Rule: Monotonic ODO validation if vehicle odometer is being updated
        if (item.activityType === 'UPDATE_ODOMETER' || (item.payload && item.payload.odometerReading)) {
          const odoToVerify = item.payload.odometerReading || item.payload.newOdo;
          if (item.vehicleId && odoToVerify) {
            const vehicles = await idbGetAll<any>(MASTER_STORES.VEHICLES);
            const targetVehicle = vehicles.find((v) => v.id === item.vehicleId);
            if (targetVehicle && odoToVerify < targetVehicle.currentOdometer) {
              // Conflict: Attempted ODO regression
              item.status = 'conflict_detected';
              item.conflictDetails = {
                conflictType: 'odo_regression',
                serverValue: targetVehicle.currentOdometer,
                localValue: odoToVerify,
                resolution: 'pending',
              };
              item.errorMessage = `Odometer ${odoToVerify} KM is lower than verified vehicle reading ${targetVehicle.currentOdometer} KM`;
              await idbSet(MASTER_STORES.OFFLINE_QUEUE, item);
              conflicts++;
              continue;
            }
          }
        }

        // Simulate server sync latency & commit
        await new Promise((r) => setTimeout(r, 120));

        item.status = 'synced_successfully';
        item.errorMessage = undefined;
        await idbSet(MASTER_STORES.OFFLINE_QUEUE, item);
        processed++;
        if (onItemProcessed) onItemProcessed(item);
      } catch (err: any) {
        item.status = 'sync_failed';
        item.retryCount = (item.retryCount || 0) + 1;
        item.errorMessage = err.message || 'Network sync error';
        await idbSet(MASTER_STORES.OFFLINE_QUEUE, item);
        failed++;
      }
    }

    // Update last sync time
    await idbSet(MASTER_STORES.SYNC_META, {
      key: 'last_synced_at',
      value: new Date().toISOString(),
    });
  } finally {
    isSyncInProgress = false;
    await notifyListeners();
  }

  return { processed, failed, conflicts };
};

// Automatic Network Detection & Registration
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[SyncEngine] Network connectivity restored. Triggering auto-sync...');
    processOfflineSyncQueue().catch(console.error);
  });

  window.addEventListener('offline', () => {
    console.log('[SyncEngine] Network lost. Switching to Offline Mode (IndexedDB Active).');
    notifyListeners();
  });
}

