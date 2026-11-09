import { Request, Response } from 'express';
import { dbStore } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { OfflineQueueItem } from '../types/tms';
import { BatchSyncItemResult, BatchSyncResponse } from '../types/api';

export const processBatchSync = (req: AuthenticatedRequest, res: Response): void => {
  const { deviceId, items } = req.body as { deviceId: string; items: OfflineQueueItem[] };

  if (!Array.isArray(items)) {
    res.status(400).json({ success: false, message: 'Invalid payload: items must be an array.' });
    return;
  }

  const results: BatchSyncItemResult[] = [];
  let succeeded = 0;
  let failed = 0;
  let conflicts = 0;

  for (const item of items) {
    // 1. Idempotency Check: Prevent duplicate record insertion
    if (dbStore.hasProcessedIdempotencyKey(item.idempotencyKey)) {
      results.push({
        clientItemId: item.id,
        idempotencyKey: item.idempotencyKey,
        status: 'ignored_duplicate',
        message: 'Already processed and acknowledged by server.',
      });
      succeeded++;
      continue;
    }

    try {
      // 2. Dispatch by activity type
      switch (item.activityType) {
        case 'LOG_REFUEL': {
          const payload = item.payload;
          if (payload) {
            const vehicle = dbStore.vehicles.find((v) => v.id === payload.vehicleId || v.number === payload.vehicleNumber);
            if (vehicle && payload.odometerReading > vehicle.currentOdometer) {
              vehicle.currentOdometer = payload.odometerReading;
            }
            dbStore.fuelRecords.unshift({
              ...payload,
              id: `fuel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              syncStatus: 'synced',
            });
          }
          break;
        }

        case 'LOG_SERVICE':
        case 'LOG_REPAIR': {
          const payload = item.payload;
          if (payload) {
            const vehicle = dbStore.vehicles.find((v) => v.id === payload.vehicleId || v.number === payload.vehicleNumber);
            if (vehicle && payload.currentOdometer > vehicle.currentOdometer) {
              vehicle.currentOdometer = payload.currentOdometer;
              vehicle.lastServiceOdo = payload.currentOdometer;
            }
            dbStore.serviceRecords.unshift({
              ...payload,
              id: `srv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              syncStatus: 'synced',
            });
          }
          break;
        }

        case 'UPDATE_ODOMETER': {
          const payload = item.payload;
          if (payload) {
            const vehicle = dbStore.vehicles.find((v) => v.id === payload.vehicleId || v.number === payload.vehicleNumber);
            if (vehicle) {
              if (payload.odometerReading >= vehicle.currentOdometer) {
                vehicle.currentOdometer = payload.odometerReading;
              } else {
                conflicts++;
                results.push({
                  clientItemId: item.id,
                  idempotencyKey: item.idempotencyKey,
                  status: 'conflict_detected',
                  message: `Server ODO (${vehicle.currentOdometer} KM) is ahead of submitted ODO (${payload.odometerReading} KM). Flagged for review.`,
                });
                continue;
              }
            }
          }
          break;
        }

        case 'SAVE_TRIP': {
          const payload = item.payload;
          if (payload) {
            dbStore.trips.unshift({
              ...payload,
              id: payload.id || `TRP-MH-GJ-${new Date().getFullYear()}-${String(dbStore.trips.length + 1).padStart(2, '0')}`,
              status: 'approved',
            });
          }
          break;
        }

        default:
          break;
      }

      // Record idempotency key
      dbStore.recordIdempotencyKey(item.idempotencyKey);
      succeeded++;
      results.push({
        clientItemId: item.id,
        idempotencyKey: item.idempotencyKey,
        status: 'synced',
        message: 'Successfully ingested into central TMS ledger.',
      });
    } catch (err: any) {
      failed++;
      results.push({
        clientItemId: item.id,
        idempotencyKey: item.idempotencyKey,
        status: 'failed',
        message: err.message || 'Processing failed.',
      });
    }
  }

  const response: BatchSyncResponse = {
    processed: items.length,
    succeeded,
    failed,
    conflicts,
    results,
  };

  res.json({
    success: true,
    data: response,
  });
};

