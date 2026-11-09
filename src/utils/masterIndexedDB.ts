// FleetPulse TMS - Master IndexedDB Unified Engine
// Manages complete offline storage for Admin, User, and Driver portals

const DB_NAME = 'fleetpulse_master_offline_db';
const DB_VERSION = 3;

export const MASTER_STORES = {
  VEHICLES: 'vehicles',
  DRIVERS: 'drivers',
  TRIPS: 'trips',
  ODOMETER_EVENTS: 'odometer_events',
  FUEL_RECORDS: 'fuel_records',
  SERVICE_RECORDS: 'service_repair_records',
  PARTY_PAYMENTS: 'party_payments',
  PARTIES: 'parties',
  USER_ACCOUNTS: 'user_accounts',
  OFFLINE_QUEUE: 'offline_queue',
  OFFLINE_PHOTOS: 'offline_photos',
  SYNC_META: 'sync_meta',
} as const;

export type MasterStoreName = typeof MASTER_STORES[keyof typeof MASTER_STORES];

let dbInstance: IDBDatabase | null = null;
let dbOpenPromise: Promise<IDBDatabase> | null = null;

export const isIDBSupported = (): boolean => {
  try {
    return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
  } catch {
    return false;
  }
};

// Fallback in localStorage if IndexedDB is blocked in sandboxed iframe
const FALLBACK_PREFIX = 'fleetpulse_idb_fallback_';

const fallbackGet = <T>(store: string, key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(`${FALLBACK_PREFIX}${store}_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const fallbackSet = (store: string, key: string, value: any): void => {
  try {
    localStorage.setItem(`${FALLBACK_PREFIX}${store}_${key}`, JSON.stringify(value));
  } catch (e) {
    console.warn('[IDB Fallback] localStorage quota exceeded:', e);
  }
};

const fallbackGetAll = <T>(store: string): T[] => {
  try {
    const prefix = `${FALLBACK_PREFIX}${store}_`;
    const results: T[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        const val = localStorage.getItem(k);
        if (val) results.push(JSON.parse(val));
      }
    }
    return results;
  } catch {
    return [];
  }
};

/**
 * Open master IndexedDB database connection with all 12 object stores
 */
export const getMasterDB = async (): Promise<IDBDatabase> => {
  if (!isIDBSupported()) {
    throw new Error('IndexedDB not supported or accessible.');
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

        // 1. Vehicles Store
        if (!db.objectStoreNames.contains(MASTER_STORES.VEHICLES)) {
          db.createObjectStore(MASTER_STORES.VEHICLES, { keyPath: 'id' });
        }

        // 2. Drivers Store
        if (!db.objectStoreNames.contains(MASTER_STORES.DRIVERS)) {
          db.createObjectStore(MASTER_STORES.DRIVERS, { keyPath: 'id' });
        }

        // 3. Trips Store
        if (!db.objectStoreNames.contains(MASTER_STORES.TRIPS)) {
          const tripStore = db.createObjectStore(MASTER_STORES.TRIPS, { keyPath: 'id' });
          tripStore.createIndex('status', 'status', { unique: false });
          tripStore.createIndex('vehicleId', 'vehicleId', { unique: false });
        }

        // 4. Odometer Events Store
        if (!db.objectStoreNames.contains(MASTER_STORES.ODOMETER_EVENTS)) {
          const odoStore = db.createObjectStore(MASTER_STORES.ODOMETER_EVENTS, { keyPath: 'id' });
          odoStore.createIndex('vehicleId', 'vehicleId', { unique: false });
          odoStore.createIndex('recordedAt', 'recordedAt', { unique: false });
          odoStore.createIndex('activityType', 'activityType', { unique: false });
        }

        // 5. Fuel Records Store
        if (!db.objectStoreNames.contains(MASTER_STORES.FUEL_RECORDS)) {
          const fuelStore = db.createObjectStore(MASTER_STORES.FUEL_RECORDS, { keyPath: 'id' });
          fuelStore.createIndex('vehicleId', 'vehicleId', { unique: false });
          fuelStore.createIndex('recordedAt', 'recordedAt', { unique: false });
          fuelStore.createIndex('fuelType', 'fuelType', { unique: false });
        }

        // 6. Service & Repair Records Store
        if (!db.objectStoreNames.contains(MASTER_STORES.SERVICE_RECORDS)) {
          const servStore = db.createObjectStore(MASTER_STORES.SERVICE_RECORDS, { keyPath: 'id' });
          servStore.createIndex('vehicleId', 'vehicleId', { unique: false });
          servStore.createIndex('date', 'date', { unique: false });
        }

        // 7. Party Payments Store
        if (!db.objectStoreNames.contains(MASTER_STORES.PARTY_PAYMENTS)) {
          const payStore = db.createObjectStore(MASTER_STORES.PARTY_PAYMENTS, { keyPath: 'id' });
          payStore.createIndex('partyId', 'partyId', { unique: false });
          payStore.createIndex('status', 'status', { unique: false });
        }

        // 8. Parties Store
        if (!db.objectStoreNames.contains(MASTER_STORES.PARTIES)) {
          db.createObjectStore(MASTER_STORES.PARTIES, { keyPath: 'id' });
        }

        // 9. User Accounts Store
        if (!db.objectStoreNames.contains(MASTER_STORES.USER_ACCOUNTS)) {
          db.createObjectStore(MASTER_STORES.USER_ACCOUNTS, { keyPath: 'id' });
        }

        // 10. Offline Queue Store (with unique idempotencyKey index)
        if (!db.objectStoreNames.contains(MASTER_STORES.OFFLINE_QUEUE)) {
          const queueStore = db.createObjectStore(MASTER_STORES.OFFLINE_QUEUE, { keyPath: 'id' });
          queueStore.createIndex('status', 'status', { unique: false });
          queueStore.createIndex('createdAt', 'createdAt', { unique: false });
          queueStore.createIndex('idempotencyKey', 'idempotencyKey', { unique: true });
        }

        // 11. Offline Photos & Attachments Store
        if (!db.objectStoreNames.contains(MASTER_STORES.OFFLINE_PHOTOS)) {
          db.createObjectStore(MASTER_STORES.OFFLINE_PHOTOS, { keyPath: 'id' });
        }

        // 12. Sync Meta Store
        if (!db.objectStoreNames.contains(MASTER_STORES.SYNC_META)) {
          db.createObjectStore(MASTER_STORES.SYNC_META, { keyPath: 'key' });
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
        console.warn('[MasterIDB] IndexedDB open error, falling back:', err);
        reject(err);
      };
    } catch (err) {
      reject(err);
    }
  });

  return dbOpenPromise;
};

// Generic IDB operations
export const idbGet = async <T>(storeName: MasterStoreName, key: string, fallback: T): Promise<T> => {
  try {
    const db = await getMasterDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result !== undefined ? req.result : fallback);
      req.onerror = () => resolve(fallbackGet(storeName, key, fallback));
    });
  } catch {
    return fallbackGet(storeName, key, fallback);
  }
};

export const idbSet = async <T>(storeName: MasterStoreName, item: T): Promise<boolean> => {
  try {
    const db = await getMasterDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.put(item);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => {
        const key = (item as any)?.id || (item as any)?.key || 'default';
        fallbackSet(storeName, key, item);
        resolve(true);
      };
    });
  } catch {
    const key = (item as any)?.id || (item as any)?.key || 'default';
    fallbackSet(storeName, key, item);
    return true;
  }
};

export const idbGetAll = async <T>(storeName: MasterStoreName): Promise<T[]> => {
  try {
    const db = await getMasterDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve(fallbackGetAll<T>(storeName));
    });
  } catch {
    return fallbackGetAll<T>(storeName);
  }
};

export const idbDelete = async (storeName: MasterStoreName, key: string): Promise<boolean> => {
  try {
    const db = await getMasterDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.delete(key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    try {
      localStorage.removeItem(`${FALLBACK_PREFIX}${storeName}_${key}`);
      return true;
    } catch {
      return false;
    }
  }
};

export const idbClear = async (storeName: MasterStoreName): Promise<boolean> => {
  try {
    const db = await getMasterDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.clear();
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
};

/**
 * Seed initial sample offline records matching the showcase reference image:
 * 1. Trip Record (1/1)
 * 2. Fuel Entry (1/1)
 * 3. Service Record (1/1)
 * 4. Other Records (0/1)
 */
export const seedInitialOfflineRecordsIfEmpty = async (): Promise<number> => {
  try {
    const existing = await idbGetAll<any>(MASTER_STORES.OFFLINE_QUEUE);
    if (existing && existing.length > 0) {
      return existing.length;
    }

    const initialItems = [
      {
        id: 'queue-trip-01',
        idempotencyKey: 'TRP-MH-GJ-2026-01-INITIAL',
        userId: 'drv-1',
        userName: 'Sukhwinder Singh',
        role: 'driver',
        vehicleId: 'veh-1',
        vehicleNumber: 'MH-12-RN-4892',
        activityType: 'SAVE_TRIP',
        summary: 'Trip Record (1/1): Pune APMC to Surat Fruit Delivery (150 Boxes)',
        payload: {
          id: 'TRP-MH-GJ-2026-01',
          vehicleNumber: 'MH-12-RN-4892',
          startingLocation: 'Pune APMC',
          destination: 'Surat',
          loadType: 'Fruit / Goods',
          boxes: 150,
          startOdometer: 89950,
        },
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        deviceId: 'dev-pwa-01',
        status: 'saved_offline',
        retryCount: 0,
      },
      {
        id: 'queue-fuel-01',
        idempotencyKey: 'LOG-REFUEL-MH-12-RN-4892-89780-INITIAL',
        userId: 'drv-1',
        userName: 'Sukhwinder Singh',
        role: 'driver',
        vehicleId: 'veh-1',
        vehicleNumber: 'MH-12-RN-4892',
        activityType: 'LOG_REFUEL',
        summary: 'Fuel Entry (1/1): 50.00 L Diesel @ BPCL Nashik (₹4,925.00, ODO 89,780 KM)',
        payload: {
          fuelType: 'diesel',
          quantity: 50.0,
          rate: 98.5,
          totalAmount: 4925.0,
          fuelStation: 'BPCL Nashik',
          odometerReading: 89780,
          fillType: 'full_tank',
        },
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        deviceId: 'dev-pwa-01',
        status: 'saved_offline',
        retryCount: 0,
      },
      {
        id: 'queue-serv-01',
        idempotencyKey: 'LOG-SERVICE-MH-12-RN-4892-89780-INITIAL',
        userId: 'drv-1',
        userName: 'Sukhwinder Singh',
        role: 'driver',
        vehicleId: 'veh-1',
        vehicleNumber: 'MH-12-RN-4892',
        activityType: 'LOG_SERVICE',
        summary: 'Service Record (1/1): General Servicing @ National Tyre Care (₹14,800)',
        payload: {
          activityType: 'General Servicing',
          workshopName: 'National Tyre Care, Surat',
          currentOdometer: 89780,
          expenseAmount: 14800,
          workDescription: 'Engine oil, oil filter, air filter, general checkup',
        },
        createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
        deviceId: 'dev-pwa-01',
        status: 'saved_offline',
        retryCount: 0,
      },
    ];

    for (const item of initialItems) {
      await idbSet(MASTER_STORES.OFFLINE_QUEUE, item);
    }

    // Set initial last sync date matching reference image (05 Nov 2026, 06:20 PM)
    await idbSet(MASTER_STORES.SYNC_META, {
      key: 'last_synced_at',
      value: '2026-11-05T18:20:00.000Z',
    });

    return initialItems.length;
  } catch (err) {
    console.warn('[MasterIDB] Failed to seed initial offline records:', err);
    return 0;
  }
};
