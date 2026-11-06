import React, { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  Download,
  Filter,
  Search,
  Calendar,
  Truck,
  Building,
  User,
  CreditCard,
  FileCheck2,
  Clock,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  X,
  ChevronDown,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { useTMS } from '../context/TMSContext';
import { PartyPaymentRecord } from '../types/tms';

type ReportPreset =
  | 'pending'
  | 'paid'
  | 'partially_paid'
  | 'overdue'
  | 'city_wise'
  | 'party_wise'
  | 'load_wise'
  | 'date_wise'
  | 'lr_pending';

export const AdvancedReportsView: React.FC = () => {
  const {
    partyPayments,
    companyName,
    parties,
    vehicles,
    drivers,
    recordPartialPayment,
    userPermissions,
    role,
  } = useTMS();

  // Active Report Preset
  const [activePreset, setActivePreset] = useState<ReportPreset>('pending');

  // Filter States
  const [selectedCities, setSelectedCities] = useState<string[]>([]); // empty = all cities
  const [selectedParty, setSelectedParty] = useState<string>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
  const [selectedDriver, setSelectedDriver] = useState<string>('all');
  const [lrSearch, setLrSearch] = useState<string>('');
  const [dateRangeFrom, setDateRangeFrom] = useState<string>('2026-07-01');
  const [dateRangeTo, setDateRangeTo] = useState<string>('2026-11-30');
  const [loadingDateFrom, setLoadingDateFrom] = useState<string>('');
  const [loadingDateTo, setLoadingDateTo] = useState<string>('');
  const [deliveryDateFrom, setDeliveryDateFrom] = useState<string>('');
  const [deliveryDateTo, setDeliveryDateTo] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [lrStatusFilter, setLrStatusFilter] = useState<string>('all'); // 'all' | 'submitted' | 'pending'
  const [dueDateFilter, setDueDateFilter] = useState<string>('');

  // Partial Payment Modal State
  const [paymentToRecord, setPaymentToRecord] = useState<PartyPaymentRecord | null>(null);
  const [payAmountInput, setPayAmountInput] = useState<number>(0);
  const [payModeInput, setPayModeInput] = useState<'Cash' | 'NEFT' | 'RTGS' | 'UPI' | 'Cheque' | 'Bank Transfer'>('NEFT');
  const [payRefInput, setPayRefInput] = useState<string>('');
  const [payNotesInput, setPayNotesInput] = useState<string>('');
  const [payDateInput, setPayDateInput] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentFeedback, setPaymentFeedback] = useState<string | null>(null);

  // Available unique cities from records
  const allAvailableCities = useMemo(() => {
    const set = new Set<string>();
    partyPayments.forEach((p) => {
      if (p.loadingCity) set.add(p.loadingCity);
      if (p.deliveryCity) set.add(p.deliveryCity);
      // Also extract from route (e.g., "Surat (GJ) → Pune")
      const parts = p.route.split(/[→⇄-]/);
      parts.forEach((part) => {
        const clean = part.replace(/\(GJ\)|\(MH\)|\(\d+ Locations\)/g, '').trim();
        if (clean) set.add(clean);
      });
    });
    // Add prominent default transport hubs
    ['Surat', 'Vapi', 'Ahmedabad', 'Vadodara', 'Bharuch', 'Pune', 'Mumbai', 'Bhiwandi', 'Nashik', 'Solapur'].forEach((c) => set.add(c));
    return Array.from(set).sort();
  }, [partyPayments]);

  // Handle Preset Switching
  const handleSelectPreset = (preset: ReportPreset) => {
    setActivePreset(preset);
    switch (preset) {
      case 'pending':
        setPaymentStatusFilter('pending');
        setLrStatusFilter('all');
        break;
      case 'paid':
        setPaymentStatusFilter('settled');
        setLrStatusFilter('all');
        break;
      case 'partially_paid':
        setPaymentStatusFilter('partially_paid');
        setLrStatusFilter('all');
        break;
      case 'overdue':
        setPaymentStatusFilter('overdue');
        setLrStatusFilter('all');
        break;
      case 'lr_pending':
        setPaymentStatusFilter('all');
        setLrStatusFilter('pending');
        break;
      default:
        setPaymentStatusFilter('all');
        setLrStatusFilter('all');
        break;
    }
  };

  // City toggle
  const toggleCity = (city: string) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedCities([]);
    setSelectedParty('all');
    setSelectedVehicle('all');
    setSelectedDriver('all');
    setLrSearch('');
    setDateRangeFrom('2026-07-01');
    setDateRangeTo('2026-11-30');
    setLoadingDateFrom('');
    setLoadingDateTo('');
    setDeliveryDateFrom('');
    setDeliveryDateTo('');
    setPaymentStatusFilter('all');
    setLrStatusFilter('all');
    setDueDateFilter('');
  };

  // Filtered Records Execution
  const filteredRecords = useMemo(() => {
    return partyPayments.filter((p) => {
      // 1. Preset & Payment Status Filter
      if (paymentStatusFilter === 'pending' && (p.isSettled || p.status !== 'pending')) return false;
      if (paymentStatusFilter === 'settled' && !(p.isSettled || p.status === 'settled')) return false;
      if (paymentStatusFilter === 'partially_paid' && p.status !== 'partially_paid') return false;
      if (paymentStatusFilter === 'overdue' && (p.isSettled || p.status !== 'overdue')) return false;

      // 2. LR Status Filter
      if (lrStatusFilter === 'submitted' && !p.lrSubmittedToParty) return false;
      if (lrStatusFilter === 'pending' && p.lrSubmittedToParty) return false;

      // 3. City Filter (Single city, multiple cities, all cities)
      if (selectedCities.length > 0) {
        const matchesAnyCity = selectedCities.some(
          (city) =>
            p.route.toLowerCase().includes(city.toLowerCase()) ||
            (p.loadingCity && p.loadingCity.toLowerCase().includes(city.toLowerCase())) ||
            (p.deliveryCity && p.deliveryCity.toLowerCase().includes(city.toLowerCase()))
        );
        if (!matchesAnyCity) return false;
      }

      // 4. Party Filter
      if (selectedParty !== 'all' && p.partyName !== selectedParty) return false;

      // 5. Vehicle Filter
      if (selectedVehicle !== 'all' && p.vehicleNumber !== selectedVehicle) return false;

      // 6. Driver Filter
      if (selectedDriver !== 'all' && p.driverName && !p.driverName.includes(selectedDriver)) return false;

      // 7. LR Number Filter
      if (lrSearch && !p.lrNumber.toLowerCase().includes(lrSearch.toLowerCase())) return false;

      // 8. General Date Range Filter (Trip Date or Due Date)
      const dateToCheck = p.tripDate || p.loadingDate || p.dueDate;
      if (dateRangeFrom && dateToCheck && dateToCheck < dateRangeFrom) return false;
      if (dateRangeTo && dateToCheck && dateToCheck > dateRangeTo) return false;

      // 9. Specific Loading Date Range
      if (loadingDateFrom && p.loadingDate && p.loadingDate < loadingDateFrom) return false;
      if (loadingDateTo && p.loadingDate && p.loadingDate > loadingDateTo) return false;

      // 10. Specific Delivery Date Range
      if (deliveryDateFrom && p.deliveryDate && p.deliveryDate < deliveryDateFrom) return false;
      if (deliveryDateTo && p.deliveryDate && p.deliveryDate > deliveryDateTo) return false;

      // 11. Specific Due Date
      if (dueDateFilter && p.dueDate !== dueDateFilter) return false;

      return true;
    }).sort((a, b) => (b.tripDate || b.dueDate).localeCompare(a.tripDate || a.dueDate));
  }, [
    partyPayments,
    paymentStatusFilter,
    lrStatusFilter,
    selectedCities,
    selectedParty,
    selectedVehicle,
    selectedDriver,
    lrSearch,
    dateRangeFrom,
    dateRangeTo,
    loadingDateFrom,
    loadingDateTo,
    deliveryDateFrom,
    deliveryDateTo,
    dueDateFilter,
  ]);

  // Aggregate Summary Calculations (Master Prompt Section 10)
  const reportTotals = useMemo(() => {
    const totalLoads = filteredRecords.length;
    const totalWeightKg = filteredRecords.reduce((acc, p) => acc + (p.weightKg || 12000), 0);
    const totalTransportAmount = filteredRecords.reduce((acc, p) => acc + (p.settledAmount ?? p.chargeAmount), 0);
    const totalPaid = filteredRecords.reduce((acc, p) => acc + (p.amountPaid || 0), 0);
    const totalPending = filteredRecords.reduce((acc, p) => acc + (p.isSettled ? 0 : p.amountDue || 0), 0);

    return {
      totalLoads,
      totalWeightKg,
      totalWeightMt: (totalWeightKg / 1000).toFixed(1),
      totalTransportAmount,
      totalPaid,
      totalPending,
    };
  }, [filteredRecords]);

  // Export to CSV / Excel with UTF-8 BOM
  const handleExportCSV = () => {
    const headers = [
      'Party Name',
      'City / Route',
      'Loading Date',
      'Delivery Date',
      'Vehicle Number',
      'Driver Name',
      'LR Number',
      'Goods Description',
      'Load Weight (KG)',
      'Total Transport Amount (INR)',
      'Amount Paid (INR)',
      'Amount Pending (INR)',
      'Due Date',
      'Payment Status',
      'LR Submitted Status',
    ];

    const rows = filteredRecords.map((p) => {
      const city = p.deliveryCity || p.loadingCity || p.route;
      const totalAmt = p.settledAmount ?? p.chargeAmount;
      const pendingAmt = p.isSettled ? 0 : p.amountDue;
      return [
        `"${p.partyName.replace(/"/g, '""')}"`,
        `"${city.replace(/"/g, '""')}"`,
        `"${p.loadingDate || p.tripDate || ''}"`,
        `"${p.deliveryDate || ''}"`,
        `"${p.vehicleNumber}"`,
        `"${p.driverName || 'Assigned Driver'}"`,
        `"${p.lrNumber}"`,
        `"${(p.goodsDescription || 'General Freight Goods').replace(/"/g, '""')}"`,
        p.weightKg || 12000,
        totalAmt,
        p.amountPaid || 0,
        pendingAmt,
        `"${p.dueDate}"`,
        `"${p.isSettled ? 'PAID / SETTLED' : p.status.toUpperCase()}"`,
        `"${p.lrSubmittedToParty ? 'SUBMITTED' : 'PENDING'}"`,
      ];
    });

    // Summary Totals Row at the bottom
    const summaryRow = [
      '"TOTAL SUMMARY"',
      '""',
      '""',
      '""',
      `"Loads: ${reportTotals.totalLoads}"`,
      '""',
      '""',
      '""',
      reportTotals.totalWeightKg,
      reportTotals.totalTransportAmount,
      reportTotals.totalPaid,
      reportTotals.totalPending,
      '""',
      '""',
      '""',
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(',')), summaryRow.join(',')].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const cleanPreset = activePreset.toUpperCase();
    link.setAttribute(
      'download',
      `${companyName.replace(/\s+/g, '_')}_${cleanPreset}_Report_${dateRangeFrom}_to_${dateRangeTo}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOpenRecordPayment = (record: PartyPaymentRecord) => {
    setPaymentToRecord(record);
    setPayAmountInput(record.amountDue);
    setPayModeInput('NEFT');
    setPayRefInput('');
    setPayNotesInput('');
    setPayDateInput(new Date().toISOString().split('T')[0]);
    setPaymentFeedback(null);
  };

  const handleConfirmRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentToRecord) return;

    const res = recordPartialPayment(paymentToRecord.id, {
      amount: Number(payAmountInput),
      paymentDate: payDateInput,
      paymentMode: payModeInput,
      referenceNumber: payRefInput,
      notes: payNotesInput,
    });

    setPaymentFeedback(res.message);
    if (res.success) {
      setTimeout(() => {
        setPaymentToRecord(null);
        setPaymentFeedback(null);
      }, 1200);
    }
  };

  const presetTitles: Record<ReportPreset, { title: string; desc: string }> = {
    pending: { title: 'Pending Payment Report', desc: 'Identify which transport parties have uncleared freight balances.' },
    paid: { title: 'Paid Payment Report', desc: 'Completed and cleared freight shipments with zero outstanding balance.' },
    partially_paid: { title: 'Partially Paid Report', desc: 'Freight records with active installment disbursements.' },
    overdue: { title: 'Overdue Payment Report', desc: 'Critical outstanding payments past their contractual due date.' },
    city_wise: { title: 'City-Wise Freight Report', desc: 'Detailed transport breakdown filtered across single or multiple destination hubs.' },
    party_wise: { title: 'Party-Wise Transport Statement', desc: 'Consolidated commercial ledger for specific consignors and fruit buyers.' },
    load_wise: { title: 'Load-Wise Consignment Report', desc: 'Comprehensive freight record featuring all 15 statutory shipping data points.' },
    date_wise: { title: 'Date-Wise Dispatch Report', desc: 'Chronological timeline of loading dates and scheduled delivery clearances.' },
    lr_pending: { title: 'LR Pending Submission Report', desc: 'Delivered goods where Lorry Receipt has not yet been submitted to the party.' },
  };

  return (
    <div className="space-y-6">
      {/* Top Banner (Hidden in Print) */}
      <div className="print:hidden bg-white p-5 border border-[#DCE8F2] rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-heading text-lg font-black text-[#384959]">
              Dedicated Freight & Payment Reporting Hub
            </h1>
            <span className="bg-[#BDDDFC]/30 text-[#384959] border border-[#BDDDFC] text-xs font-bold px-2.5 py-0.5 rounded-full">
              Section 10 Standard
            </span>
          </div>
          <p className="text-xs text-[#6A89A7] mt-1 font-medium">
            Generate, preview, print and export load-wise freight receivables, city-wise distributions, and LR submission statuses.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-bold text-[#384959] bg-white hover:bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            title="Print or Save as PDF"
          >
            <Printer className="w-4 h-4 text-[#6A89A7]" />
            <span>Print / PDF</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#384959] to-[#2C3A47] hover:from-[#2C3A47] hover:to-[#384959] rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            title="Download formatted Excel/CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* 9 REPORT PRESET BUTTONS (Master Prompt Section 10) (Hidden in Print) */}
      <div className="print:hidden space-y-2">
        <span className="text-[11px] font-bold text-[#384959] uppercase tracking-wider block font-heading">
          Select Dedicated Report Type:
        </span>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'pending', label: '1. Pending Payment' },
              { id: 'paid', label: '2. Paid Payment' },
              { id: 'partially_paid', label: '3. Partially Paid' },
              { id: 'overdue', label: '4. Overdue Payment' },
              { id: 'city_wise', label: '5. City-Wise' },
              { id: 'party_wise', label: '6. Party-Wise' },
              { id: 'load_wise', label: '7. Load-Wise' },
              { id: 'date_wise', label: '8. Date-Wise' },
              { id: 'lr_pending', label: '9. LR Pending Submission' },
            ] as const
          ).map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                activePreset === preset.id
                  ? 'bg-[#384959] text-white border-[#384959] shadow-sm'
                  : 'bg-white text-slate-700 border-[#DCE8F2] hover:bg-[#F8FAFC] hover:border-[#DCE8F2]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* COMPREHENSIVE FILTER ACCORDION (Hidden in Print) */}
      <div className="print:hidden bg-white border border-[#DCE8F2] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DCE8F2] pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#6A89A7]" />
            <h3 className="font-heading font-extrabold text-xs text-[#384959] uppercase tracking-wide">
              Report Filter Matrix
            </h3>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-xs font-bold text-[#6A89A7] hover:text-[#384959] underline self-start sm:self-auto cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>

        {/* City Filter (One City, Multiple Cities, All Cities) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 font-heading">
              City Selection: {selectedCities.length === 0 ? <strong className="text-[#6A89A7]">All Cities</strong> : <strong className="text-[#6A89A7]">{selectedCities.length} Selected</strong>}
            </span>
            {selectedCities.length > 0 && (
              <button
                onClick={() => setSelectedCities([])}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Clear Cities
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allAvailableCities.map((city) => {
              const isSelected = selectedCities.includes(city);
              return (
                <button
                  key={city}
                  onClick={() => toggleCity(city)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-[#384959] text-white border-[#384959] shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-[#F8FAFC]'
                  }`}
                >
                  {city}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Party */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">Party / Customer:</label>
            <select
              value={selectedParty}
              onChange={(e) => setSelectedParty(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
            >
              <option value="all">All Transport Parties</option>
              {parties.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name} ({p.city})
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">Vehicle Rig:</label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
            >
              <option value="all">All Fleet Trucks</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.number}>
                  {v.number} ({v.type})
                </option>
              ))}
            </select>
          </div>

          {/* Driver */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">Assigned Driver:</label>
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
            >
              <option value="all">All Drivers</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.fullName}>
                  {d.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* LR Search */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">LR Number Search:</label>
            <input
              type="text"
              value={lrSearch}
              onChange={(e) => setLrSearch(e.target.value)}
              placeholder="e.g. LR-RT-01..."
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
            />
          </div>

          {/* Date Range From */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">Date Range (From):</label>
            <input
              type="date"
              value={dateRangeFrom}
              onChange={(e) => setDateRangeFrom(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
            />
          </div>

          {/* Date Range To */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">Date Range (To):</label>
            <input
              type="date"
              value={dateRangeTo}
              onChange={(e) => setDateRangeTo(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
            />
          </div>

          {/* Payment Status */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">Payment Status:</label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="settled">Paid / Settled</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* LR Submission Status */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">LR Submitted Status:</label>
            <select
              value={lrStatusFilter}
              onChange={(e) => setLrStatusFilter(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
            >
              <option value="all">All LR Statuses</option>
              <option value="submitted">LR Submitted to Party</option>
              <option value="pending">LR Pending Submission</option>
            </select>
          </div>
        </div>
      </div>

      {/* PRINT-ONLY OFFICIAL HEADER */}
      <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold font-heading text-slate-900 uppercase tracking-tight">
              {companyName}
            </h1>
            <p className="text-xs text-slate-600">
              Interstate Freight Transport & Logistics Management System
            </p>
            <h2 className="text-sm font-bold text-[#384959] mt-2">
              {presetTitles[activePreset].title}
            </h2>
          </div>
          <div className="text-right text-xs font-mono text-slate-600">
            <div>Generated: {new Date().toLocaleDateString('en-IN')}</div>
            <div>Period: {dateRangeFrom} to {dateRangeTo}</div>
            <div>Cities: {selectedCities.length === 0 ? 'All Cities' : selectedCities.join(', ')}</div>
          </div>
        </div>
      </div>

      {/* AUTOMATIC SUMMARY TOTALS BAR (Master Prompt Section 10) */}
      <div className="bg-gradient-to-r from-[#384959] to-[#2C3A47] text-white rounded-2xl p-5 shadow-sm border border-[#384959]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/20 pb-3 mb-3">
          <div>
            <span className="text-[10px] font-bold text-[#BDDDFC] uppercase tracking-wider font-mono">
              Aggregate Report Totals
            </span>
            <h2 className="text-base font-heading font-extrabold text-white">
              {presetTitles[activePreset].title}
            </h2>
          </div>
          <span className="text-xs text-[#BDDDFC] font-mono">
            {filteredRecords.length} Consignment{filteredRecords.length !== 1 ? 's' : ''} Included
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center sm:text-left">
          {/* Total Loads */}
          <div className="p-2 bg-white/10 rounded-xl">
            <span className="text-[10px] text-[#BDDDFC] block uppercase font-mono">Total Loads</span>
            <span className="text-xl font-mono font-black text-white">{reportTotals.totalLoads}</span>
          </div>

          {/* Total Weight */}
          <div className="p-2 bg-white/10 rounded-xl">
            <span className="text-[10px] text-[#BDDDFC] block uppercase font-mono">Total Weight</span>
            <span className="text-xl font-mono font-black text-white">
              {reportTotals.totalWeightMt} <span className="text-xs font-normal">MT</span>
            </span>
          </div>

          {/* Total Transport Amount */}
          <div className="p-2 bg-white/10 rounded-xl">
            <span className="text-[10px] text-[#BDDDFC] block uppercase font-mono">Total Freight</span>
            <span className="text-xl font-mono font-black text-white">
              ₹{reportTotals.totalTransportAmount.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Total Paid */}
          <div className="p-2 bg-emerald-500/20 border border-emerald-400/30 rounded-xl">
            <span className="text-[10px] text-emerald-200 block uppercase font-mono">Total Paid</span>
            <span className="text-xl font-mono font-black text-emerald-300">
              ₹{reportTotals.totalPaid.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Total Pending */}
          <div className="p-2 bg-rose-500/20 border border-rose-400/30 rounded-xl col-span-2 sm:col-span-1">
            <span className="text-[10px] text-rose-200 block uppercase font-mono">Total Pending</span>
            <span className="text-xl font-mono font-black text-rose-300">
              ₹{reportTotals.totalPending.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* LOAD-WISE RECORD TABLE (ALL 15 REQUIRED FIELDS) */}
      <div className="bg-white border border-[#DCE8F2] rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#DCE8F2] flex items-center justify-between">
          <span className="font-heading font-extrabold text-xs text-[#384959] uppercase tracking-wider">
            Consignment Ledger ({filteredRecords.length} Records)
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {presetTitles[activePreset].desc}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC]/70 border-b border-[#DCE8F2] text-[#384959] font-heading font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-3">Party Name</th>
                <th className="py-3 px-3">City / Hub</th>
                <th className="py-3 px-3">Dates</th>
                <th className="py-3 px-3">Vehicle & Driver</th>
                <th className="py-3 px-3">LR Number</th>
                <th className="py-3 px-3">Goods & Weight</th>
                <th className="py-3 px-3 text-right">Freight Amount</th>
                <th className="py-3 px-3 text-right">Amount Paid</th>
                <th className="py-3 px-3 text-right">Amount Pending</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3 text-center">LR Status</th>
                <th className="py-3 px-3 text-center">Payment Status</th>
                <th className="py-3 px-3 text-center print:hidden">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-10 text-slate-400">
                    No freight records match the active filter criteria. Try broadening your dates or resetting city filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((p) => {
                  const city = p.deliveryCity || p.loadingCity || p.route;
                  const totalAmt = p.settledAmount ?? p.chargeAmount;
                  const pendingAmt = p.isSettled ? 0 : p.amountDue;

                  return (
                    <tr key={p.id} className="hover:bg-[#F8FAFC]/30 transition-colors">
                      {/* 1. Party */}
                      <td className="py-3 px-3 font-bold text-[#384959]">
                        {p.partyName}
                      </td>

                      {/* 2. City */}
                      <td className="py-3 px-3 text-slate-700 max-w-[140px] truncate" title={city}>
                        {city}
                      </td>

                      {/* 3 & 4. Loading & Delivery Dates */}
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        <div>Load: {p.loadingDate || p.tripDate || '—'}</div>
                        <div className="text-slate-400">Deliv: {p.deliveryDate || '—'}</div>
                      </td>

                      {/* 5 & 6. Vehicle & Driver */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-mono font-bold text-[#384959]">{p.vehicleNumber}</div>
                        <div className="text-[10px] text-slate-500">{p.driverName || 'Assigned Driver'}</div>
                      </td>

                      {/* 7. LR Number */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                        {p.lrNumber}
                      </td>

                      {/* 8 & 9. Goods & Weight */}
                      <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                        <div className="truncate max-w-[120px]" title={p.goodsDescription}>
                          {p.goodsDescription || 'Freight Goods'}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500 font-bold">
                          {(p.weightKg || 12000).toLocaleString('en-IN')} KG
                        </div>
                      </td>

                      {/* 10. Total Transport Amount */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        ₹{totalAmt.toLocaleString('en-IN')}
                      </td>

                      {/* 11. Amount Paid */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                        ₹{(p.amountPaid || 0).toLocaleString('en-IN')}
                      </td>

                      {/* 12. Amount Pending */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-700 whitespace-nowrap">
                        ₹{pendingAmt.toLocaleString('en-IN')}
                      </td>

                      {/* 13. Due Date */}
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {p.dueDate}
                      </td>

                      {/* 14. LR Submitted Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            p.lrSubmittedToParty
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          {p.lrSubmittedToParty ? 'Submitted' : 'Pending'}
                        </span>
                      </td>

                      {/* 15. Payment Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                            p.isSettled || p.status === 'settled'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : p.status === 'partially_paid'
                              ? 'bg-[#BDDDFC]/30 text-[#384959] border-[#DCE8F2]'
                              : p.status === 'overdue'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {p.isSettled ? 'Paid (Settled)' : p.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Action (Hidden in Print) */}
                      <td className="py-3 px-3 text-center print:hidden whitespace-nowrap">
                        {pendingAmt > 0 && (
                          <button
                            onClick={() => handleOpenRecordPayment(p)}
                            className="bg-[#F8FAFC] hover:bg-[#BDDDFC]/30 text-[#384959] border border-[#DCE8F2] px-2 py-1 rounded text-[11px] font-bold cursor-pointer"
                          >
                            Pay Partial
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PARTIAL PAYMENT MODAL (Master Prompt Section 9) */}
      {paymentToRecord && (
        <div className="fixed inset-0 bg-[#384959]/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#DCE8F2] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE8F2]">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#6A89A7]" />
                <h3 className="font-heading font-bold text-base text-[#384959]">
                  Record Partial Payment
                </h3>
              </div>
              <button
                onClick={() => setPaymentToRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#DCE8F2] text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600">Party:</span>
                <strong className="text-[#384959]">{paymentToRecord.partyName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">LR Number:</span>
                <strong className="font-mono">{paymentToRecord.lrNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total Billed:</span>
                <strong className="font-mono">₹{(paymentToRecord.settledAmount ?? paymentToRecord.chargeAmount).toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Previously Paid:</span>
                <strong className="font-mono text-emerald-700">₹{(paymentToRecord.amountPaid || 0).toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#DCE8F2]">
                <span className="text-slate-800 font-bold">Outstanding Balance:</span>
                <strong className="font-mono text-rose-700 text-sm">₹{paymentToRecord.amountDue.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <form onSubmit={handleConfirmRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Payment Installment Amount (₹):
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={paymentToRecord.amountDue}
                  value={payAmountInput}
                  onChange={(e) => setPayAmountInput(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-[#384959]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Mode:</label>
                  <select
                    value={payModeInput}
                    onChange={(e) => setPayModeInput(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="NEFT">NEFT</option>
                    <option value="RTGS">RTGS</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date Paid:</label>
                  <input
                    type="date"
                    required
                    value={payDateInput}
                    onChange={(e) => setPayDateInput(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reference / UTR / Cheque #:</label>
                <input
                  type="text"
                  placeholder="e.g. UTR-9901428"
                  value={payRefInput}
                  onChange={(e) => setPayRefInput(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes / Remarks:</label>
                <input
                  type="text"
                  placeholder="e.g. Received via IndusInd bank"
                  value={payNotesInput}
                  onChange={(e) => setPayNotesInput(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {paymentFeedback && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-medium">
                  {paymentFeedback}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-[#384959] hover:bg-[#2C3A47] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Confirm & Update Balance</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

