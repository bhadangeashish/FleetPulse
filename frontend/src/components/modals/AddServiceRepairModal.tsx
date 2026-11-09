import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  X,
  Truck,
  Camera,
  Check,
  AlertCircle,
  Calendar,
  Wrench,
} from 'lucide-react';
import { useTMS } from '../../context/TMSContext';
import { ServiceActivityType } from '../../types/tms';
import { readFileAsDataURL } from '../../utils/fileUploadHelper';
import { ModalPortal } from '../common/ModalPortal';

interface AddServiceRepairModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultVehicleId?: string;
  onSuccess?: () => void;
}

export const AddServiceRepairModal: React.FC<AddServiceRepairModalProps> = ({
  isOpen,
  onClose,
  defaultVehicleId = 'veh-1',
  onSuccess,
}) => {
  const { vehicles, drivers, addServiceRecord } = useTMS();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(defaultVehicleId);
  const [serviceActivityType, setServiceActivityType] =
    useState<ServiceActivityType>('General Servicing');
  const [serviceDate, setServiceDate] = useState<string>('2026-11-06');
  const [serviceWorkshop, setServiceWorkshop] = useState<string>('National Tyre Care, Surat');
  const [serviceExpense, setServiceExpense] = useState<string>('14800');
  const [serviceWorkDetails, setServiceWorkDetails] = useState<string>(
    'Engine oil, Oil filter, Air filter, General checkup'
  );
  const [serviceInvoiceNo, setServiceInvoiceNo] = useState<string>('NTC/2026/4587');
  const [servicePaidBy, setServicePaidBy] = useState<'Company' | 'Driver' | 'FASTag / Fleet Account' | 'UPI'>(
    'Company'
  );
  const [serviceReceiptPhoto, setServiceReceiptPhoto] = useState<string | null>(
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=60'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  useEffect(() => {
    if (defaultVehicleId) {
      setSelectedVehicleId(defaultVehicleId);
    }
  }, [defaultVehicleId]);

  if (!isOpen) return null;

  const expenseNumber = parseFloat(serviceExpense) || 0;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await readFileAsDataURL(file);
      setServiceReceiptPhoto(res.dataUrl);
    } catch (err: any) {
      alert(err.message || 'Failed to upload invoice photo.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!currentVehicle) {
      setValidationError('Please select a valid vehicle.');
      return;
    }

    if (!serviceWorkshop.trim()) {
      setValidationError('Please specify the workshop or garage name.');
      return;
    }

    if (expenseNumber <= 0) {
      setValidationError('Expense amount must be greater than zero.');
      return;
    }

    if (!serviceDate) {
      setValidationError('Please select a valid service date.');
      return;
    }

    setIsSubmitting(true);

    try {
      const assignedDriver =
        drivers.find((d) => d.id === currentVehicle.assignedDriverId) || drivers[0];

      const res = await addServiceRecord({
        vehicleId: currentVehicle.id,
        vehicleNumber: currentVehicle.number,
        driverId: assignedDriver?.id || 'drv-1',
        driverName: assignedDriver?.fullName || 'Sukhwinder Singh',
        currentOdometer: currentVehicle.currentOdometer || 89780,
        activityType: serviceActivityType,
        date: serviceDate,
        workshopName: serviceWorkshop.trim(),
        workDescription: serviceWorkDetails.trim() || `${serviceActivityType} maintenance performed`,
        expenseAmount: expenseNumber,
        paidBy: servicePaidBy === 'Company' ? 'company_account' : 'driver_cash',
        invoiceNumber: serviceInvoiceNo.trim() || `INV-${Date.now().toString().slice(-4)}`,
        receiptPhotoUrl: serviceReceiptPhoto || undefined,
        partsReplaced: serviceWorkDetails
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean),
      });

      if (res.success) {
        onSuccess?.();
        onClose();
      } else {
        setValidationError(res.message || 'Failed to submit service entry.');
      }
    } catch (err: any) {
      setValidationError(err.message || 'An unexpected error occurred while saving service record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-2xl border border-[#DCE8F2] shadow-2xl max-w-xl w-full p-5 space-y-4 text-xs my-auto max-h-[92vh] overflow-y-auto">
        {/* Modal Header matching Showcase Screen 6 */}
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
            <h3 className="font-heading text-sm font-extrabold text-[#384959]">
              Add Service / Repair
            </h3>
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

        {/* Vehicle Mini Card with ODO Badge matching Screen 6 */}
        <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl border border-[#DCE8F2]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-10 rounded-lg bg-white border border-[#DCE8F2] flex items-center justify-center overflow-hidden shadow-2xs shrink-0">
              <Truck className="w-6 h-6 text-[#384959]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-xs text-[#384959]">
                  {currentVehicle?.number || 'MH-12-RN-4892'}
                </span>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="bg-white border border-[#DCE8F2] rounded px-1.5 py-0.5 text-[10px] font-bold text-[#6A89A7] focus:outline-none cursor-pointer"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      Change: {v.number}
                    </option>
                  ))}
                </select>
              </div>
              <span className="block text-[11px] text-[#6A89A7] font-medium">
                {currentVehicle?.model || 'Tata Signa'}
              </span>
            </div>
          </div>

          {/* Current ODO Badge matching Screen 6 */}
          <span className="bg-white border border-[#DCE8F2] px-2.5 py-1 rounded-lg font-mono font-bold text-xs text-[#384959] shadow-2xs">
            Current ODO: {(currentVehicle?.currentOdometer || 89780).toLocaleString('en-IN')} KM
          </span>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="font-medium">{validationError}</div>
          </div>
        )}

        {/* Form Fields matching Screen 6 exactly */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Activity Type */}
            <div>
              <label className="font-heading font-extrabold text-[#384959] block mb-1">
                Activity Type *
              </label>
              <select
                value={serviceActivityType}
                onChange={(e) => setServiceActivityType(e.target.value as ServiceActivityType)}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2] focus:bg-white transition-all shadow-2xs cursor-pointer"
              >
                <option value="General Servicing">General Servicing</option>
                <option value="Periodic Maintenance">Periodic Maintenance</option>
                <option value="Engine Repair">Engine Repair</option>
                <option value="Brake System">Brake System</option>
                <option value="Tyre Replacement">Tyre Replacement</option>
                <option value="Suspension / Spring">Suspension / Spring</option>
                <option value="Electrical Repair">Electrical Repair</option>
                <option value="Reefer Cooling Unit Repair">Reefer Cooling Unit Repair</option>
              </select>
            </div>

            {/* Service Date */}
            <div>
              <label className="font-heading font-extrabold text-[#384959] block mb-1">
                Service Date *
              </label>
              <input
                type="date"
                required
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl font-bold font-mono text-[#384959] focus:outline-none focus:border-[#88BDF2] focus:bg-white transition-all shadow-2xs"
              />
            </div>

            {/* Workshop / Garage */}
            <div>
              <label className="font-heading font-extrabold text-[#384959] block mb-1">
                Workshop / Garage *
              </label>
              <input
                type="text"
                required
                value={serviceWorkshop}
                onChange={(e) => setServiceWorkshop(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2] focus:bg-white transition-all shadow-2xs"
                placeholder="National Tyre Care, Surat"
              />
            </div>

            {/* Expense Amount */}
            <div>
              <label className="font-heading font-extrabold text-[#384959] block mb-1">
                Expense Amount (₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={serviceExpense}
                onChange={(e) => setServiceExpense(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl font-bold font-mono text-[#384959] focus:outline-none focus:border-[#88BDF2] focus:bg-white transition-all shadow-2xs"
                placeholder="14800"
              />
            </div>
          </div>

          {/* Work Details (Full width) */}
          <div>
            <label className="font-heading font-extrabold text-[#384959] block mb-1">
              Work Details
            </label>
            <input
              type="text"
              value={serviceWorkDetails}
              onChange={(e) => setServiceWorkDetails(e.target.value)}
              className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl font-medium text-[#384959] focus:outline-none focus:border-[#88BDF2] focus:bg-white transition-all shadow-2xs"
              placeholder="Engine oil, Oil filter, Air filter, General checkup"
            />
          </div>

          {/* Row 4: Invoice No, Paid By, & Receipt Photo matching Screen 6 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="font-heading font-extrabold text-[#384959] block mb-1">
                Invoice No.
              </label>
              <input
                type="text"
                value={serviceInvoiceNo}
                onChange={(e) => setServiceInvoiceNo(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl font-mono text-[#384959] focus:outline-none focus:border-[#88BDF2] focus:bg-white transition-all shadow-2xs"
                placeholder="NTC/2026/4587"
              />
            </div>

            <div>
              <label className="font-heading font-extrabold text-[#384959] block mb-1">
                Paid By *
              </label>
              <select
                value={servicePaidBy}
                onChange={(e) => setServicePaidBy(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2] focus:bg-white transition-all shadow-2xs cursor-pointer"
              >
                <option value="Company">Company</option>
                <option value="Driver">Driver Cash</option>
                <option value="FASTag / Fleet Account">FASTag / Fleet Account</option>
                <option value="UPI">UPI / Bank Transfer</option>
              </select>
            </div>

            {/* Invoice / Receipt Photo */}
            <div>
              <label className="font-heading font-extrabold text-[#384959] block mb-1">
                Invoice / Receipt Photo
              </label>
              <div className="flex items-center gap-2">
                {serviceReceiptPhoto && (
                  <div className="relative w-12 h-10 rounded-xl border border-[#DCE8F2] overflow-hidden group shadow-2xs shrink-0">
                    <img
                      src={serviceReceiptPhoto}
                      alt="Invoice preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setServiceReceiptPhoto(null)}
                      className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center text-[8px] shadow cursor-pointer transition-colors"
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
                  className="px-2.5 py-2 border-2 border-dashed border-[#88BDF2] hover:bg-[#BDDDFC]/20 rounded-xl text-[#384959] font-heading font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-[#6A89A7]" />
                  <span>Add Photo</span>
                </button>
              </div>
            </div>
          </div>

          {/* Modal Footer with solid green Submit button matching Screen 6 */}
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
              <span>{isSubmitting ? 'Saving...' : 'Submit Service'}</span>
            </button>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
};
