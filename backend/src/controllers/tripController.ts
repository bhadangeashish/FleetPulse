import { Request, Response } from 'express';
import { dbStore } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { Trip, TripDestination, ReturnLoad } from '../types/tms';

export const getAllTrips = (req: Request, res: Response): void => {
  res.json({
    success: true,
    data: dbStore.trips,
  });
};

export const getTripById = (req: Request, res: Response): void => {
  const { id } = req.params;
  const trip = dbStore.trips.find((t) => t.id === id);
  if (!trip) {
    res.status(404).json({ success: false, message: 'Trip not found.' });
    return;
  }
  res.json({ success: true, data: trip });
};

export const addTrip = (req: AuthenticatedRequest, res: Response): void => {
  const tripData: Partial<Trip> & { overrideCapacityWarning?: boolean } = req.body;

  if (!tripData.vehicleId || !tripData.driverId) {
    res.status(400).json({ success: false, message: 'Vehicle and Driver are required to dispatch a trip.' });
    return;
  }

  const vehicle = dbStore.vehicles.find((v) => v.id === tripData.vehicleId);
  const driver = dbStore.drivers.find((d) => d.id === tripData.driverId);

  if (!vehicle || !driver) {
    res.status(400).json({ success: false, message: 'Assigned Vehicle or Driver not found.' });
    return;
  }

  const newTrip: Trip = {
    id: `TRP-MH-GJ-${new Date().getFullYear()}-${String(dbStore.trips.length + 1).padStart(2, '0')}`,
    createdAt: new Date().toISOString(),
    outDate: tripData.outDate || new Date().toISOString().split('T')[0],
    vehicleId: vehicle.id,
    vehicleNumber: vehicle.number,
    vehicleStateCode: vehicle.stateCode,
    driverId: driver.id,
    driverName: driver.fullName,
    startingLocation: tripData.startingLocation || 'Pune APMC Market (Maharashtra)',
    destinations: tripData.destinations || [],
    totalFruitValue: Number(tripData.totalFruitValue) || 0,
    totalWeightKg: Number(tripData.totalWeightKg) || 0,
    isOverloaded: Boolean(tripData.isOverloaded),
    adminOverride: Boolean(tripData.overrideCapacityWarning),
    status: 'approved',
    startOdometer: vehicle.currentOdometer,
  };

  dbStore.trips.unshift(newTrip);
  vehicle.status = 'in_transit';
  driver.status = 'on_trip';

  res.status(201).json({
    success: true,
    message: `Trip ${newTrip.id} dispatched successfully.`,
    data: newTrip,
  });
};

export const updateTripDestinations = (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const { destinations } = req.body;

  const trip = dbStore.trips.find((t) => t.id === id);
  if (!trip) {
    res.status(404).json({ success: false, message: 'Trip not found.' });
    return;
  }

  trip.destinations = destinations || [];
  trip.totalFruitValue = (trip.destinations as TripDestination[]).reduce(
    (sum, d) => sum + (Number(d.destinationTotalAmount) || 0),
    0
  );

  res.json({
    success: true,
    message: `Destinations updated for ${trip.id}. New cargo value: ₹${trip.totalFruitValue.toLocaleString('en-IN')}`,
    data: trip,
  });
};

export const addReturnLoad = (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const returnLoadData: Partial<ReturnLoad> = req.body;

  const trip = dbStore.trips.find((t) => t.id === id);
  if (!trip) {
    res.status(404).json({ success: false, message: 'Trip not found.' });
    return;
  }

  const newReturnLoad: ReturnLoad = {
    id: `RET-${Date.now()}`,
    tripId: trip.id,
    loadingPartyName: returnLoadData.loadingPartyName || 'Surat Textile Hub',
    loadingCity: returnLoadData.loadingCity || 'Surat',
    deliveryCity: returnLoadData.deliveryCity || 'Pune',
    goodsDescription: returnLoadData.goodsDescription || 'Industrial Cargo',
    quantity: Number(returnLoadData.quantity) || 10,
    weightKg: Number(returnLoadData.weightKg) || 5000,
    loadRentCharge: Number(returnLoadData.loadRentCharge) || 12000,
    settledAmount: Number(returnLoadData.settledAmount) || Number(returnLoadData.loadRentCharge) || 12000,
    isSettled: Boolean(returnLoadData.isSettled),
    lrNumber: returnLoadData.lrNumber || `LR-${Date.now().toString().slice(-6)}`,
    hasStampedLR: Boolean(returnLoadData.hasStampedLR),
    lrSubmittedToParty: Boolean(returnLoadData.lrSubmittedToParty),
    paymentStatus: returnLoadData.paymentStatus || 'pending',
    dueDate: returnLoadData.dueDate || new Date().toISOString().split('T')[0],
    vehicleNumber: trip.vehicleNumber,
    driverName: trip.driverName,
  };

  trip.returnLoad = newReturnLoad;

  res.json({
    success: true,
    message: `Return load ${newReturnLoad.lrNumber} attached to ${trip.id}.`,
    data: trip,
  });
};

