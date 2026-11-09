import { Request, Response } from 'express';
import { dbStore } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { Driver } from '../types/tms';

export const getAllDrivers = (req: Request, res: Response): void => {
  res.json({
    success: true,
    data: dbStore.drivers,
  });
};

export const getDriverById = (req: Request, res: Response): void => {
  const { id } = req.params;
  const driver = dbStore.drivers.find((d) => d.id === id);
  if (!driver) {
    res.status(404).json({ success: false, message: 'Driver not found.' });
    return;
  }
  res.json({ success: true, data: driver });
};

export const addDriver = (req: AuthenticatedRequest, res: Response): void => {
  const driverData: Partial<Driver> = req.body;

  if (!driverData.fullName || !driverData.mobile) {
    res.status(400).json({ success: false, message: 'Driver full name and mobile number are required.' });
    return;
  }

  const newDriver: Driver = {
    id: `drv-${Date.now()}`,
    fullName: driverData.fullName.trim(),
    mobile: driverData.mobile.trim(),
    address: driverData.address || 'Pune Market Yard Transport Colony',
    licenseNumber: driverData.licenseNumber || 'MH-12-2020-0019283',
    licenseExpiry: driverData.licenseExpiry || '2030-12-31',
    aadhaarNumber: driverData.aadhaarNumber || 'XXXX-XXXX-9912',
    panNumber: driverData.panNumber || 'ABCDE1234F',
    status: driverData.status || 'active',
    assignedVehicleId: driverData.assignedVehicleId,
    assignedVehicleNumber: driverData.assignedVehicleNumber,
    assignedVehicleIds: driverData.assignedVehicleIds || (driverData.assignedVehicleId ? [driverData.assignedVehicleId] : []),
    tripsCompleted: 0,
    joinedDate: new Date().toISOString().split('T')[0],
  };

  dbStore.drivers.unshift(newDriver);
  res.status(201).json({
    success: true,
    message: `Driver ${newDriver.fullName} added successfully.`,
    data: newDriver,
  });
};

export const updateDriver = (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const driver = dbStore.drivers.find((d) => d.id === id);
  if (!driver) {
    res.status(404).json({ success: false, message: 'Driver not found.' });
    return;
  }

  Object.assign(driver, req.body);
  res.json({
    success: true,
    message: 'Driver updated successfully.',
    data: driver,
  });
};

