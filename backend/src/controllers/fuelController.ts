import { Request, Response } from 'express';
import { dbStore } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { FuelRecord } from '../types/tms';

export const getAllFuelRecords = (req: Request, res: Response): void => {
  res.json({
    success: true,
    data: dbStore.fuelRecords,
  });
};

export const addFuelRecord = (req: AuthenticatedRequest, res: Response): void => {
  const fuelData: Partial<FuelRecord> = req.body;

  if (!fuelData.vehicleId || !fuelData.fuelQuantity || !fuelData.odometerReading) {
    res.status(400).json({ success: false, message: 'Vehicle, quantity and odometer are required.' });
    return;
  }

  const vehicle = dbStore.vehicles.find((v) => v.id === fuelData.vehicleId);
  if (!vehicle) {
    res.status(404).json({ success: false, message: 'Vehicle not found.' });
    return;
  }

  const newRecord: FuelRecord = {
    id: `fuel-${Date.now()}`,
    vehicleId: vehicle.id,
    vehicleNumber: vehicle.number,
    driverId: fuelData.driverId || vehicle.assignedDriverId || 'drv-1',
    driverName: fuelData.driverName || vehicle.assignedDriverName || 'Driver',
    fuelType: fuelData.fuelType || 'diesel',
    odometerReading: Number(fuelData.odometerReading),
    fuelQuantity: Number(fuelData.fuelQuantity),
    unit: fuelData.fuelType === 'cng' ? 'KG' : 'Litres',
    pricePerUnit: Number(fuelData.pricePerUnit) || 94.5,
    totalAmount: Number(fuelData.totalAmount) || Number(fuelData.fuelQuantity) * (Number(fuelData.pricePerUnit) || 94.5),
    fillType: fuelData.fillType || 'full_tank',
    fuelStation: fuelData.fuelStation || 'Indian Oil Highway Depot',
    paymentMethod: fuelData.paymentMethod || 'company_account',
    receiptPhotoUrl: fuelData.receiptPhotoUrl,
    recordedAt: new Date().toISOString(),
    syncStatus: 'synced',
  };

  dbStore.fuelRecords.unshift(newRecord);

  // Update vehicle ODO if reading is higher
  if (newRecord.odometerReading > vehicle.currentOdometer) {
    vehicle.currentOdometer = newRecord.odometerReading;
  }

  res.status(201).json({
    success: true,
    message: `Fuel entry logged for ${vehicle.number}: ${newRecord.fuelQuantity} ${newRecord.unit} (₹${newRecord.totalAmount.toLocaleString('en-IN')})`,
    data: newRecord,
  });
};

