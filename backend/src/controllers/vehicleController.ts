import { Request, Response } from 'express';
import { dbStore } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { Vehicle, VehicleDocument } from '../types/tms';

export const getAllVehicles = (req: Request, res: Response): void => {
  res.json({
    success: true,
    data: dbStore.vehicles,
  });
};

export const getVehicleById = (req: Request, res: Response): void => {
  const { id } = req.params;
  const vehicle = dbStore.vehicles.find((v) => v.id === id);
  if (!vehicle) {
    res.status(404).json({ success: false, message: 'Vehicle not found.' });
    return;
  }
  res.json({ success: true, data: vehicle });
};

export const addVehicle = (req: AuthenticatedRequest, res: Response): void => {
  const vehicleData: Partial<Vehicle> = req.body;

  if (!vehicleData.number) {
    res.status(400).json({ success: false, message: 'Vehicle registration number is required.' });
    return;
  }

  const existing = dbStore.vehicles.find((v) => v.number.toLowerCase() === vehicleData.number?.toLowerCase());
  if (existing) {
    res.status(400).json({ success: false, message: 'A vehicle with this registration number already exists.' });
    return;
  }

  const newVehicle: Vehicle = {
    id: `veh-${Date.now()}`,
    number: vehicleData.number.toUpperCase().trim(),
    stateCode: (vehicleData.stateCode as 'MH' | 'GJ') || 'MH',
    type: vehicleData.type || '16-Ton Cargo Carrier',
    model: vehicleData.model || 'Tata Signa',
    capacityKg: Number(vehicleData.capacityKg) || 16000,
    capacityMt: Number(vehicleData.capacityMt) || 16,
    currentOdometer: Number(vehicleData.currentOdometer) || 0,
    status: vehicleData.status || 'active',
    currentLocation: vehicleData.currentLocation || 'Pune APMC Yard',
    documents: vehicleData.documents || [],
    maintenanceReminders: vehicleData.maintenanceReminders || [],
  };

  dbStore.vehicles.unshift(newVehicle);
  res.status(201).json({
    success: true,
    message: `Vehicle ${newVehicle.number} added successfully.`,
    data: newVehicle,
  });
};

export const updateVehicle = (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const vehicle = dbStore.vehicles.find((v) => v.id === id);
  if (!vehicle) {
    res.status(404).json({ success: false, message: 'Vehicle not found.' });
    return;
  }

  Object.assign(vehicle, req.body);
  res.json({
    success: true,
    message: 'Vehicle updated successfully.',
    data: vehicle,
  });
};

export const updateVehicleOdometer = (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const { reading, notes } = req.body;
  const numReading = Number(reading);

  const vehicle = dbStore.vehicles.find((v) => v.id === id);
  if (!vehicle) {
    res.status(404).json({ success: false, message: 'Vehicle not found.' });
    return;
  }

  if (numReading < vehicle.currentOdometer) {
    res.status(400).json({
      success: false,
      message: `Invalid ODO: New reading (${numReading.toLocaleString()} KM) cannot be lower than verified reading (${vehicle.currentOdometer.toLocaleString()} KM).`,
    });
    return;
  }

  vehicle.currentOdometer = numReading;
  if (!vehicle.odometerHistory) vehicle.odometerHistory = [];
  vehicle.odometerHistory.push({
    id: `odo-${Date.now()}`,
    reading: numReading,
    recordedAt: new Date().toISOString(),
    recordedBy: req.user?.fullName || 'Dispatcher',
    notes,
  });

  res.json({
    success: true,
    message: `Odometer updated to ${numReading.toLocaleString()} KM for ${vehicle.number}.`,
    data: vehicle,
  });
};

