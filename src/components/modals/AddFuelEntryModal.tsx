import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  X,
  Truck,
  Camera,
  Check,
  ChevronDown,
  AlertCircle,
  Fuel,
} from 'lucide-react';
import { useTMS } from '../../context/TMSContext';
import { FuelType, FuelFillType, FuelPaymentMethod } from '../../types/tms';
import { readFileAsDataURL } from '../../utils/fileUploadHelper';
import { ModalPortal } from '../common/ModalPortal';

interface AddFuelEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultVehicleId?: string;
  onSuccess?: () => void;
}

export const AddFuelEntryModal: React.FC<AddFuelEntryModalProps> = ({
  isOpen,
  onClose,
  defaultVehicleId = 'veh-1',
  onSuccess,
}) => {
  const { vehicles, drivers, addFuelRecord } = useTMS();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(defaultVehicleId);
  const [fuelType, setFuelType] = useState<FuelType>('diesel');
  const [fuelOdo, setFuelOdo] = useState<number>(89780);
  const [fuelFillType, setFuelFillType] = useState<FuelFillType>('full_tank');
  const [fuelQty, setFuelQty] = useState<string>('50.00');
  const [fuelStation, setFuelStation] = useState<string>('BPCL Nashik');
  const [fuelPricePerLitre, setFuelPricePerLitre] = useState<string>('98.50');
  const [fuelPaymentMethod, setFuelPaymentMethod] = useState<FuelPaymentMethod>('company_account');
  const [fuelReceiptPhoto, setFuelReceiptPhoto] = useState<string | null>(
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=60'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync selected vehicle details when defaultVehicleId or vehicles list change
  const currentVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  useEffect(() => {
    if (defaultVehicleId) {
      setSelectedVehicleId(defaultVehicleId);
    }
  }, [defaultVehicleId]);

  useEffect(() => {
    if (currentVehicle) {
      setFuelOdo(currentVehicle.currentOdometer || 89780);
      if (currentVehicle.fuelType) {
        setFuelType(currentVehicle.fuelType as FuelType);
      }
    }
  }, [currentVehicle?.id]);

  if (!isOpen) return null;

  // Auto calculated Total Amount: Quantity * Price
  const qtyNumber = parseFloat(fuelQty) || 0;
  const priceNumber = parseFloat(fuelPricePerLitre) || 0;
  const computedTotal = qtyNumber * priceNumber;
  const formattedTotal = computedTotal.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await readFileAsDataURL(file);
      setFuelReceiptPhoto(res.dataUrl);
    } catch (err: any) {
      alert(err.message || 'Failed to upload receipt photo.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!currentVehicle) {
      setValidationError('Please select a valid vehicle.');
      return;
    }

    if (isNaN(fuelOdo) || fuelOdo <= 0) {
      setValidationError('Please enter a valid odometer reading in KM.');
      return;
    }

    // Monotonic ODO validation rule: prevent accidental rollback
    if (fuelOdo < currentVehicle.currentOdometer) {
      setValidationError(
        `Accidental ODO rollback prevented: Current entry (${fuelOdo.toLocaleString(
          'en-IN'
        )} KM) cannot be lower than the vehicle's last recorded odometer (${currentVehicle.currentOdometer.toLocaleString(
          'en-IN'
        )} KM).`
      );
      return;
    }

    if (qtyNumber <= 0) {
      setValidationError('Fuel quantity must be greater than zero.');
      return;
    }

    if (priceNumber <= 0) {
      setValidationError('Price per unit must be greater than zero.');
      return;
    }

    if (!fuelStation.trim()) {
      setValidationError('Please specify the fuel station.');
      return;
    }

    setIsSubmitting(true);

    try {
      const assignedDriver =
        drivers.find((d) => d.id === currentVehicle.assignedDriverId) || drivers[0];

      const res = await addFuelRecord({
        vehicleId: currentVehicle.id,
        vehicleNumber: currentVehicle.number,
        driverId: assignedDriver?.id || 'drv-1',
        driverName: assignedDriver?.fullName || 'Sukhwinder Singh',
        fuelType,
        odometerReading: fuelOdo,
        fuelQuantity: qtyNumber,
        unit: fuelType === 'diesel' ? 'Litres' : 'KG',
        pricePerUnit: priceNumber,
        totalAmount: Math.round(computedTotal),
        fillType: fuelFillType,
        fuelStation: fuelStation.trim(),
        paymentMethod: fuelPaymentMethod,
        receiptPhotoUrl: fuelReceiptPhoto || undefined,
        notes: `${qtyNumber} ${fuelType === 'diesel' ? 'Litres' : 'KG'} @ ₹${priceNumber} (${
          fuelFillType === 'full_tank' ? 'Full Tank' : 'Partial Fill'
        })`,
      });

      if (res.success) {
        onSuccess?.();
        onClose();
      } else {
        setValidationError(res.message || 'Failed to submit fuel entry.');
      }
    } catch (err: any) {
      setValidationError(err.message || 'An unexpected error occurred while saving fuel entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-2xl border border-[#DCE8F2] shadow-2xl max-w-xl w-full p-5 space-y-4 text-xs my-auto max-h-[92vh] overflow-y-auto">
        {/* Modal Header matching Showcase Screen 5 */}
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE8F2]">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-[#F8FAFC] border border-[#DCE8F2] text-[#384959] flex items-center justify-center hover:bg-[#BDDDFC]/30 transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <h3 className="font-heading text-sm font-extrabold text-[#384959]">Add Fuel Entry</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#6A89A7] hover:text-[#384959] p-1 rounded-lg hover:bg-[#F3F7FB] transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Diesel / CNG Toggle Pills matching Screen 5 */}
        <div className="flex rounded-xl bg-[#F8FAFC] p-1 border border-[#DCE8F2]">
          <button
            type="button"
            onClick={() => setFuelType('diesel')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-heading font-extrabold transition-all cursor-pointer ${
              fuelType === 'diesel'
                ? 'bg-[#0284c7] text-white shadow-xs'
                : 'text-[#6A89A7] hover:text-[#384959]'
            }`}
          >
            Diesel
          </button>
          <button
            type="button"
            onClick={() => setFuelType('cng')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-heading font-extrabold transition-all cursor-pointer ${
              fuelType === 'cng'
                ? 'bg-[#0284c7] text-white shadow-xs'
                : 'text-[#6A89A7] hover:text-[#384959]'
            }`}
          >
            CNG
          </button>
        </div>

        {/* Vehicle Selection Card matching Screen 5 */}
        <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl border border-[#DCE8F2]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-10 rounded-lg bg-white border border-[#DCE8F2] flex items-center justify-center overflow-hidden shadow-2xs shrink-0">
              <Truck className="w-6 h-6 text-[#384959]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-black text-xs text-[#384959]">
                  {currentVehicle?.number || 'MH-12-RN-4892'}
                </span>
                <span className="text-[10px] bg-[#BDDDFC]/50 text-[#384959] px-1.5 py-0.2 rounded font-bold font-sans">
                  Active
                </span>
              </div>
              <span className="block text-[11px] text-[#6A89A7] font-medium">
                {currentVehicle?.model || 'Tata Signa (Truck)'}
              </span>
            </div>
          </div>

          {/* Quick Vehicle Switcher dropdown */}
          <div className="relative">
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="bg-white border border-[#DCE8F2] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#384959] focus:outline-none focus:border-[#88BDF2] cursor-pointer"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.number} ({v.model.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="font-medium">{validationError}</div>
          </div>
        )}

        {/* 2-Column Form Fields Grid matching Screen 5 exactly */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Current ODO */}
            <div>
              <label className="font-heading font-extrabold text-[#384959] block mb-1">
                Current ODO (KM) *
              </label>
              <input
                type="number"
                required
                min={currentVehicle?.currentOdometer || 0}
                value={fuelOdo}
                onChange={(e) => setFuelOdo(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl font-bold font-mono text-[#384959] focus:outline-none focus:border-[#88BDF2] focus:bg-white transition-all shadow-2xs"
                placeholder="89780"
              />
              <span className="text-[10px] text-[#6A89A7] mt-0.5 block">
                Last recorded: {currentVehicle?.currentOdometer?.toLocaleString('en-IN') || 89780} KM
              </span>
            </div>

            {/* Fill Type */}
            <div>
              <label className="font-heading font-extrabold text-[#384959] block mb-1">
                Fill Type *
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFuelFillType('full_tank')}
                  className={`flex-1 py-2 px-2 rounded-xl font-heading font-extrabold text-center border transition-all cursor-pointer ${
                    fuelFillType === 'full_tank'
                      ? 'bg-[#1e3a5f] text-white border-[#1e3a5f] shadow-2xs'
                      : 'bg-[#F8FAFC] text-[#6A89A7] border-[#DCE8F2] hover:bg-white'
                  }`}
                >
                  Full Tank
                </button>
                <button
                  type="button"
                  onClick={() => setFuelFillType('partial_fill')}
                  className={`flex-1 py-2 px-2 rounded-xl font-heading font-extrabold text-center border transition-all cursor-pointer ${
                    fuelFillType === 'partial_fill'
                      ? 'bg-[#1e3a5f] text-white border-[#1e3a5f] shadow-2xs'
                      : 'bg-[#F8FAFC] text-[#6A89A7] border-[#DCE8F2] hover:bg-white'
                  }`}
                >
                  Partial Fill
                </button>
              </div>
            </div>

            {/* Fuel Quantity */}
            <div>
              <label className="font-heading font-extrabold text-[#384959] block mb-1">
                Fuel Quantity ({fuelType === 'diesel' ? 'Litres' : 'KG'}) *
              </label>
              <input
                type="text"
                required
                value={fuelQty}
                onChange={(e) => setFuelQty(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl font-bold font-mono text-[#384959] focus:outline-none focus:border-[#88BDF2] focus:bg-white transition-all shadow-2xs"
                placeholder="50.00"
              />
            </div>

            {/* Fuel Station */}
            <div>
              <label className="font-heading font-extrabold text-[#384959] block mb-1">
                Fuel Station *
              </label>
              <select
                value={fuelStation}
                onChange={(e) => setFuelStation(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2] focus:bg-white transition-all shadow-2xs cursor-pointer"
              >
                <option value="BPCL Nashik">BPCL Nashik</option>
                <option value="HPCL Highway Surat">HPCL Highway Surat</option>
                <option value="Indian Oil Vapi">Indian Oil Vapi</option>
                <option value="Shell Mumbai-Surat Highway">Shell Mumbai-Surat Highway</option>
                <option value="Nayara Energy Valsad">Nayara Energy Valsad</option>
              </select>
            </div>

            {/* Price per Litre */}
            <div>
              <label className="font-heading font-extrabold text-[#384959] block mb-1">
                Price per {fuelType === 'diesel' ? 'Litre' : 'KG'} (₹) *
              </label>
              <input
                type="text"
                required
                value={fuelPricePerLitre}
                onChange={(e) => setFuelPricePerLitre(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl font-bold font-mono text-[#384959] focus:outline-none focus:border-[#88BDF2] focus:bg-white transition-all shadow-2xs"
                placeholder="98.50"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="font-heading font-extrabold text-[#384959] block mb-1">
                Payment Method *
              </label>
              <select
                value={fuelPaymentMethod}
                onChange={(e) => setFuelPaymentMethod(e.target.value as FuelPaymentMethod)}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2] focus:bg-white transition-all shadow-2xs cursor-pointer"
              >
                <option value="company_account">Company Card</option>
                <option value="driver_cash">Cash</option>
                <option value="fuel_card">FASTag / Fuel Card</option>
                <option value="credit_mandi">Driver Advance</option>
                <option value="upi">UPI / NetBanking</option>
              </select>
            </div>
          </div>

          {/* Row 4: Total Amount & Receipt Photo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            {/* Total Amount (Automatic live calculation) */}
            <div>
              <label className="font-heading font-extrabold text-[#6A89A7] block mb-1">
                Total Amount (₹)
              </label>
              <div className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl font-mono font-black text-sm text-[#384959] flex items-center justify-between shadow-2xs">
                <span>₹{formattedTotal}</span>
                <span className="text-[10px] text-[#6A89A7] font-sans font-medium">
                  {qtyNumber} × ₹{priceNumber}
                </span>
              </div>
            </div>

            {/* Receipt Photo with Add Photo Button & preview */}
            <div>
              <label className="font-heading font-extrabold text-[#384959] block mb-1">
                Receipt Photo
              </label>
              <div className="flex items-center gap-2.5">
                {fuelReceiptPhoto && (
                  <div className="relative w-14 h-12 rounded-xl border border-[#DCE8F2] overflow-hidden group shadow-2xs shrink-0">
                    <img
                      src={fuelReceiptPhoto}
                      alt="Receipt preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFuelReceiptPhoto(null)}
                      className="absolute top-1 right-1 w-4 h-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center text-[9px] shadow cursor-pointer transition-colors"
                      title="Remove photo"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 border-2 border-dashed border-[#88BDF2] hover:bg-[#BDDDFC]/20 rounded-xl text-[#384959] font-heading font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-[#6A89A7]" />
                  <span>Add Photo</span>
                </button>
              </div>
            </div>
          </div>

          {/* Modal Footer with solid green Submit button matching Screen 5 */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE8F2]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-heading font-extrabold text-[#6A89A7] hover:bg-[#F3F7FB] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-heading font-extrabold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Submit Fuel Entry'}</span>
            </button>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
};
