// FleetPulse TMS - Fuel Consumption & Certified Mileage Calculation Engine
// Adheres strictly to Part 5 & 6 (Separate Diesel Litres & CNG KG, Full-Tank-to-Full-Tank cycles)

import { FuelRecord, FuelType, FuelAverageStats } from '../types/tms';

/**
 * Calculates certified fuel average using consecutive full-tank-to-full-tank cycles.
 * Avoids misleading spikes from partial top-ups by carrying over fuel volume until the next full tank.
 */
export const calculateVehicleFuelAverage = (
  vehicleId: string,
  vehicleNumber: string,
  fuelType: FuelType,
  records: FuelRecord[]
): FuelAverageStats => {
  // Filter for this vehicle and fuel type, sorted chronologically ascending
  const vehicleRecords = records
    .filter((r) => r.vehicleId === vehicleId && r.fuelType === fuelType)
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

  const totalFuelQuantity = vehicleRecords.reduce((sum, r) => sum + r.fuelQuantity, 0);
  const totalExpenditure = vehicleRecords.reduce((sum, r) => sum + r.totalAmount, 0);

  if (vehicleRecords.length === 0) {
    return {
      vehicleId,
      vehicleNumber,
      fuelType,
      latestAverage: 0,
      monthlyAverage: 0,
      totalDistanceRun: 0,
      totalFuelQuantity: 0,
      totalExpenditure: 0,
      costPerKm: 0,
      hasVerifiedCycle: false,
      cycleStatusMessage: 'No refueling records entered yet.',
    };
  }

  // Find all Full-Tank indexes
  const fullTankIndices: number[] = [];
  vehicleRecords.forEach((r, idx) => {
    if (r.fillType === 'full_tank') {
      fullTankIndices.push(idx);
    }
  });

  // Calculate distance between earliest and latest record
  const startOdo = vehicleRecords[0].odometerReading;
  const endOdo = vehicleRecords[vehicleRecords.length - 1].odometerReading;
  const totalDistanceRun = Math.max(0, endOdo - startOdo);

  // If fewer than 2 full tanks are verified, full cycle calculation cannot be guaranteed
  if (fullTankIndices.length < 2) {
    return {
      vehicleId,
      vehicleNumber,
      fuelType,
      latestAverage: 0,
      monthlyAverage: 0,
      totalDistanceRun,
      totalFuelQuantity: Number(totalFuelQuantity.toFixed(2)),
      totalExpenditure: Math.round(totalExpenditure),
      costPerKm: totalDistanceRun > 0 ? Number((totalExpenditure / totalDistanceRun).toFixed(2)) : 0,
      hasVerifiedCycle: false,
      cycleStatusMessage: 'Cycle Pending (Requires 2 verified full-tank fills for certified average)',
    };
  }

  // Calculate averages across each verified full-tank cycle
  const cycleAverages: number[] = [];

  for (let i = 0; i < fullTankIndices.length - 1; i++) {
    const idx1 = fullTankIndices[i];
    const idx2 = fullTankIndices[i + 1];

    const odo1 = vehicleRecords[idx1].odometerReading;
    const odo2 = vehicleRecords[idx2].odometerReading;
    const distanceDelta = odo2 - odo1;

    // Fuel consumed in cycle = fuel filled at idx2 + any partial fills between idx1 and idx2
    let fuelConsumedInCycle = vehicleRecords[idx2].fuelQuantity;
    for (let p = idx1 + 1; p < idx2; p++) {
      fuelConsumedInCycle += vehicleRecords[p].fuelQuantity;
    }

    if (distanceDelta > 0 && fuelConsumedInCycle > 0) {
      const cycleAvg = distanceDelta / fuelConsumedInCycle;
      cycleAverages.push(cycleAvg);
    }
  }

  const latestAverage = cycleAverages.length > 0
    ? Number(cycleAverages[cycleAverages.length - 1].toFixed(2))
    : 0;

  // Monthly average (from cycles recorded in the last 30 days, or overall mean)
  const meanAverage = cycleAverages.length > 0
    ? Number((cycleAverages.reduce((sum, val) => sum + val, 0) / cycleAverages.length).toFixed(2))
    : 0;

  const costPerKm = totalDistanceRun > 0
    ? Number((totalExpenditure / totalDistanceRun).toFixed(2))
    : 0;

  return {
    vehicleId,
    vehicleNumber,
    fuelType,
    latestAverage,
    monthlyAverage: meanAverage,
    totalDistanceRun,
    totalFuelQuantity: Number(totalFuelQuantity.toFixed(2)),
    totalExpenditure: Math.round(totalExpenditure),
    costPerKm,
    hasVerifiedCycle: cycleAverages.length > 0,
    cycleStatusMessage: cycleAverages.length > 0
      ? `Verified Full-to-Full Cycle (${cycleAverages.length} Cycles Computed)`
      : 'Cycle verification in progress',
  };
};

