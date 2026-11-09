import { Request, Response } from 'express';
import { dbStore } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { ServiceRepairRecord } from '../types/tms';

export const getAllServiceRecords = (req: Request, res: Response): void => {
  res.json({
    success: true,
    data: dbStore.serviceRecords,
  });
};

export const addServiceRecord = (req: AuthenticatedRequest, res: Response): void => {
  const serviceData: Partial<ServiceRepairRecord> = req.body;

  if (!serviceData.vehicleId || !serviceData.expenseAmount) {
    res.status(400).json({ success: false, message: 'Vehicle and expense amount are required.' });
    return;
  }

  const vehicle = dbStore.vehicles.find((v) => v.id === serviceData.vehicleId);
  if (!vehicle) {
    res.status(404).json({ success: false, message: 'Vehicle not found.' });
    return;
  }

  const newRecord: ServiceRepairRecord = {
    id: `srv-${Date.now()}`,
    vehicleId: vehicle.id,
    vehicleNumber: vehicle.number,
    driverId: serviceData.driverId || vehicle.assignedDriverId || 'drv-1',
    driverName: serviceData.driverName || vehicle.assignedDriverName || 'Driver',
    currentOdometer: Number(serviceData.currentOdometer) || vehicle.currentOdometer,
    activityType: serviceData.activityType || 'General Servicing',
    date: serviceData.date || new Date().toISOString().split('T')[0],
    workshopName: serviceData.workshopName || 'Authorized Service Station',
    workDescription: serviceData.workDescription || 'Maintenance inspection',
    expenseAmount: Number(serviceData.expenseAmount),
    paidBy: serviceData.paidBy || 'company_account',
    invoiceNumber: serviceData.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
    receiptPhotoUrl: serviceData.receiptPhotoUrl,
    recordedAt: new Date().toISOString(),
    syncStatus: 'synced',
  };

  dbStore.serviceRecords.unshift(newRecord);

  // Update vehicle ODO and last service ODO
  if (newRecord.currentOdometer > vehicle.currentOdometer) {
    vehicle.currentOdometer = newRecord.currentOdometer;
  }
  vehicle.lastServiceOdo = newRecord.currentOdometer;

  res.status(201).json({
    success: true,
    message: `Service recorded for ${vehicle.number}: ${newRecord.activityType} (₹${newRecord.expenseAmount.toLocaleString('en-IN')})`,
    data: newRecord,
  });
};

