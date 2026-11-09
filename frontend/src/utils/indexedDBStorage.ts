import { Trip, ReturnLoad, TripDestination } from '../types/tms';

export interface SyncQueueItem {
  id?: number;
  actionType:
    | 'SAVE_TRIP'
    | 'UPDATE_DESTINATIONS'
    | 'SAVE_RETURN_LOAD'
    | 'UPDATE_ODOMETER'
    | 'UPLOAD_STAMPED_LR'
    | 'SAVE_DRIVER_DAILY_WORK';
  summary: string;
  payload: any;
  timestamp: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  error?: string;
  retryCount?: number;
}

export interface OfflinePhotoRecord {
  id: string;
  tripId?: string;
  loadId?: string;
  photoName: string;
  dataUrl: string;
  timestamp: string;
  synced: boolean;
}

export interface OfflineStorageSummary {
  isSupported: boolean;
  isFallback: boolean;
  tripsCount: number;
  loadsCount: number;
  pendingCount: number;
  photosCount: number;
  lastSyncedAt: string | null;
}

const DB_NAME = 'transpulse_driver_offline_db';
const DB_VERSION = 1;

const STORES = {
  TRIPS: 'driver_trips',
  LOADS: 'driver_loads',
  SYNC_QUEUE: 'sync_queue',
  PHOTOS: 'offline_photos',
  META: 'device_meta',
} as const;

// Safe check for IndexedDB availability
const isIDBSupported = (): boolean => {
  try {
    return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
  } catch {
    return false;
  }
};

let dbInstance: IDBDatabase | null = null;
let dbOpenPromise: Promise<IDBDatabase> | null = null;

// Fallback in-memory / localStorage cache in case IndexedDB is restricted
const FALLBACK_PREFIX = 'transpulse_fallback_';

const fallbackGet = <T>(key: string, defaultValue: T): T => {
  try {
    const raw = localStorage.getItem(FALLBACK_PREFIX + key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const fallbackSet = (key: string, value: any): void => {
  try {
    localStorage.setItem(FALLBACK_PREFIX + key, JSON.stringify(value));
  } catch {
    // quota exceeded or blocked
  }
};

/**
 * Initialize or retrieve the open IndexedDB instance.
 */
export const getDatabase = async (): Promise<IDBDatabase> => {
  if (!isIDBSupported()) {
    throw new Error('IndexedDB is not supported or accessible in this environment.');
  }

  if (dbInstance) {
    return dbInstance;
  }

  if (dbOpenPromise) {
    return dbOpenPromise;
  }

  dbOpenPromise = new Promise((resolve, reject) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store 1: driver_trips
        if (!db.objectStoreNames.contains(STORES.TRIPS)) {
          db.createObjectStore(STORES.TRIPS, { keyPath: 'id' });
        }

        // Store 2: driver_loads
        if (!db.objectStoreNames.contains(STORES.LOADS)) {
          db.createObjectStore(STORES.LOADS, { keyPath: 'id' });
        }

        // Store 3: sync_queue
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const queueStore = db.createObjectStore(STORES.SYNC_QUEUE, {
            keyPath: 'id',
            autoIncrement: true,
          });
          queueStore.createIndex('status', 'status', { unique: false });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store 4: offline_photos
        if (!db.objectStoreNames.contains(STORES.PHOTOS)) {
          db.createObjectStore(STORES.PHOTOS, { keyPath: 'id' });
        }

        // Store 5: device_meta
        if (!db.objectStoreNames.contains(STORES.META)) {
          db.createObjectStore(STORES.META, { keyPath: 'key' });
        }
      };

      request.onsuccess = (event: Event) => {
        dbInstance = (event.target as IDBOpenDBRequest).result;
        dbInstance.onversionchange = () => {
          dbInstance?.close();
          dbInstance = null;
          dbOpenPromise = null;
        };
        resolve(dbInstance);
      };

      request.onerror = (event: Event) => {
        const err = (event.target as IDBOpenDBRequest).error;
        console.warn('IndexedDB open error, will use fallback:', err);
        reject(err);
      };

      request.onblocked = () => {
        console.warn('IndexedDB open blocked by another tab.');
      };
    } catch (err) {
      reject(err);
    }
  });

  return dbOpenPromise;
};

// ==========================================
// 1. TRIP OPERATIONS
// ==========================================

export const saveTripOffline = async (trip: Trip): Promise<void> => {
  try {
    const db = await getDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.TRIPS, 'readwrite');
      const store = tx.objectStore(STORES.TRIPS);
      const req = store.put(trip);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fallback
    const existing = fallbackGet<Trip[]>('trips', []);
    const idx = existing.findIndex((t) => t.id === trip.id);
    if (idx >= 0) {
      existing[idx] = trip;
    } else {
      existing.unshift(trip);
    }
    fallbackSet('trips', existing);
  }
};

export const getOfflineTrips = async (): Promise<Trip[]> => {
  try {
    const db = await getDatabase();
    return await new Promise<Trip[]>((resolve, reject) => {
      const tx = db.transaction(STORES.TRIPS, 'readonly');
      const store = tx.objectStore(STORES.TRIPS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return fallbackGet<Trip[]>('trips', []);
  }
};

export const deleteOfflineTrip = async (tripId: string): Promise<void> => {
  try {
    const db = await getDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.TRIPS, 'readwrite');
      const store = tx.objectStore(STORES.TRIPS);
      const req = store.delete(tripId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    const existing = fallbackGet<Trip[]>('trips', []);
    fallbackSet(
      'trips',
      existing.filter((t) => t.id !== tripId)
    );
  }
};

// ==========================================
// 2. RETURN LOAD OPERATIONS
// ==========================================

export const saveReturnLoadOffline = async (load: ReturnLoad): Promise<void> => {
  try {
    const db = await getDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.LOADS, 'readwrite');
      const store = tx.objectStore(STORES.LOADS);
      const req = store.put(load);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    const existing = fallbackGet<ReturnLoad[]>('loads', []);
    const idx = existing.findIndex((l) => l.id === load.id);
    if (idx >= 0) {
      existing[idx] = load;
    } else {
      existing.unshift(load);
    }
    fallbackSet('loads', existing);
  }
};

export const getOfflineReturnLoads = async (): Promise<ReturnLoad[]> => {
  try {
    const db = await getDatabase();
    return await new Promise<ReturnLoad[]>((resolve, reject) => {
      const tx = db.transaction(STORES.LOADS, 'readonly');
      const store = tx.objectStore(STORES.LOADS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return fallbackGet<ReturnLoad[]>('loads', []);
  }
};

// ==========================================
// 3. OFFLINE SYNC QUEUE OPERATIONS
// ==========================================

export const queueOfflineMutation = async (
  actionType: SyncQueueItem['actionType'],
  summary: string,
  payload: any
): Promise<number> => {
  const item: SyncQueueItem = {
    actionType,
    summary,
    payload,
    timestamp: new Date().toISOString(),
    status: 'pending',
    retryCount: 0,
  };

  try {
    const db = await getDatabase();
    return await new Promise<number>((resolve, reject) => {
      const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const req = store.add(item);
      req.onsuccess = () => resolve(req.result as number);
      req.onerror = () => reject(req.error);
    });
  } catch {
    const queue = fallbackGet<SyncQueueItem[]>('sync_queue', []);
    const fakeId = Date.now();
    queue.push({ ...item, id: fakeId });
    fallbackSet('sync_queue', queue);
    return fakeId;
  }
};

export const getSyncQueue = async (): Promise<SyncQueueItem[]> => {
  try {
    const db = await getDatabase();
    return await new Promise<SyncQueueItem[]>((resolve, reject) => {
      const tx = db.transaction(STORES.SYNC_QUEUE, 'readonly');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return fallbackGet<SyncQueueItem[]>('sync_queue', []);
  }
};

export const getPendingQueue = async (): Promise<SyncQueueItem[]> => {
  const all = await getSyncQueue();
  return all.filter((item) => item.status === 'pending' || item.status === 'failed');
};

export const markQueueItemStatus = async (
  id: number,
  status: SyncQueueItem['status'],
  error?: string
): Promise<void> => {
  try {
    const db = await getDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const item: SyncQueueItem = getReq.result;
        if (item) {
          item.status = status;
          if (error) item.error = error;
          if (status === 'failed') item.retryCount = (item.retryCount || 0) + 1;
          const putReq = store.put(item);
          putReq.onsuccess = () => resolve();
          putReq.onerror = () => reject(putReq.error);
        } else {
          resolve();
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch {
    const queue = fallbackGet<SyncQueueItem[]>('sync_queue', []);
    const idx = queue.findIndex((q) => q.id === id);
    if (idx >= 0) {
      queue[idx].status = status;
      if (error) queue[idx].error = error;
      if (status === 'failed') queue[idx].retryCount = (queue[idx].retryCount || 0) + 1;
      fallbackSet('sync_queue', queue);
    }
  }
};

export const clearSyncedQueue = async (): Promise<void> => {
  try {
    const db = await getDatabase();
    const items = await getSyncQueue();
    const syncedIds = items.filter((i) => i.status === 'synced').map((i) => i.id!);

    if (syncedIds.length === 0) return;

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      let remaining = syncedIds.length;
      syncedIds.forEach((id) => {
        const req = store.delete(id);
        req.onsuccess = () => {
          remaining -= 1;
          if (remaining === 0) resolve();
        };
        req.onerror = () => reject(req.error);
      });
    });
  } catch {
    const queue = fallbackGet<SyncQueueItem[]>('sync_queue', []);
    fallbackSet(
      'sync_queue',
      queue.filter((q) => q.status !== 'synced')
    );
  }
};

// ==========================================
// 4. OFFLINE PHOTO / STAMPED LR STORAGE
// ==========================================

export const saveOfflinePhoto = async (photo: OfflinePhotoRecord): Promise<void> => {
  try {
    const db = await getDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.PHOTOS, 'readwrite');
      const store = tx.objectStore(STORES.PHOTOS);
      const req = store.put(photo);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    const photos = fallbackGet<OfflinePhotoRecord[]>('photos', []);
    const idx = photos.findIndex((p) => p.id === photo.id);
    if (idx >= 0) {
      photos[idx] = photo;
    } else {
      photos.unshift(photo);
    }
    fallbackSet('photos', photos);
  }
};

export const getOfflinePhoto = async (id: string): Promise<OfflinePhotoRecord | null> => {
  try {
    const db = await getDatabase();
    return await new Promise<OfflinePhotoRecord | null>((resolve, reject) => {
      const tx = db.transaction(STORES.PHOTOS, 'readonly');
      const store = tx.objectStore(STORES.PHOTOS);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    const photos = fallbackGet<OfflinePhotoRecord[]>('photos', []);
    return photos.find((p) => p.id === id) || null;
  }
};

// ==========================================
// 5. METADATA & SYSTEM STATS
// ==========================================

export const setMetaValue = async (key: string, value: any): Promise<void> => {
  try {
    const db = await getDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.META, 'readwrite');
      const store = tx.objectStore(STORES.META);
      const req = store.put({ key, value, updatedAt: new Date().toISOString() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    fallbackSet(`meta_${key}`, value);
  }
};

export const getMetaValue = async <T>(key: string): Promise<T | null> => {
  try {
    const db = await getDatabase();
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORES.META, 'readonly');
      const store = tx.objectStore(STORES.META);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return fallbackGet<T | null>(`meta_${key}`, null);
  }
};

export const getOfflineStorageSummary = async (): Promise<OfflineStorageSummary> => {
  const supported = isIDBSupported();
  let isFallback = !supported;
  let tripsCount = 0;
  let loadsCount = 0;
  let pendingCount = 0;
  let photosCount = 0;

  try {
    if (supported) {
      const [trips, loads, queue, photos] = await Promise.all([
        getOfflineTrips(),
        getOfflineReturnLoads(),
        getSyncQueue(),
        (async () => {
          try {
            const db = await getDatabase();
            return await new Promise<any[]>((resolve) => {
              const tx = db.transaction(STORES.PHOTOS, 'readonly');
              const store = tx.objectStore(STORES.PHOTOS);
              const req = store.getAll();
              req.onsuccess = () => resolve(req.result || []);
              req.onerror = () => resolve([]);
            });
          } catch {
            return [];
          }
        })(),
      ]);

      tripsCount = trips.length;
      loadsCount = loads.length;
      pendingCount = queue.filter((q) => q.status === 'pending' || q.status === 'failed').length;
      photosCount = photos.length;
    } else {
      isFallback = true;
      tripsCount = fallbackGet<any[]>('trips', []).length;
      loadsCount = fallbackGet<any[]>('loads', []).length;
      pendingCount = fallbackGet<SyncQueueItem[]>('sync_queue', []).filter(
        (q) => q.status === 'pending' || q.status === 'failed'
      ).length;
      photosCount = fallbackGet<any[]>('photos', []).length;
    }
  } catch {
    isFallback = true;
  }

  const lastSyncedAt = await getMetaValue<string>('last_synced_at');

  return {
    isSupported: supported,
    isFallback,
    tripsCount,
    loadsCount,
    pendingCount,
    photosCount,
    lastSyncedAt,
  };
};
