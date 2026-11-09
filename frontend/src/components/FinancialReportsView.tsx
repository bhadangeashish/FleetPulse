import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Building,
  CheckCircle2,
  Clock,
  Bell,
  Check,
  FileCheck2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Filter,
  Printer,
  X,
  Truck,
  Plus,
  Search,
  ShieldCheck,
  FileText,
  Eye,
  Trash2,
  User,
  Phone,
  MapPin,
  ExternalLink,
  Shield,
  Layers,
  FileSpreadsheet,
  Download,
  Building2,
  BadgeCheck,
  TrendingUp,
} from 'lucide-react';
import { useTMS } from '../context/TMSContext';
import { PartyPaymentRecord, Party, PartyDocument } from '../types/tms';
import { ReturnLoadAnalyticsView } from './ReturnLoadAnalyticsView';
import { readFileAsDataURL } from '../utils/fileUploadHelper';
import { EmptyState } from './common/EmptyState';
import { ModalPortal } from './common/ModalPortal';

export const FinancialReportsView: React.FC = () => {
  const {
    partyPayments,
    toggleLRSubmitted,
    settleReturnLoadPayment,
    recordPartialPayment,
    companyName,
    parties,
    addParty,
    addPartyDocument,
    deletePartyDocument,
    updatePartyDocumentStatus,
    role,
    userPermissions,
  } = useTMS();

  // Top Section Sub-Tabs: 'parties' (Party Option) | 'documents' (Document Tab) | 'payments' (Party Payments & Stamped LR) | 'analytics' (Return Load Analytics)
  const [activeSubTab, setActiveSubTab] = useState<'parties' | 'documents' | 'payments' | 'analytics'>('parties');

  // Party Option state
  const [partySearch, setPartySearch] = useState('');
  const [partyTypeFilter, setPartyTypeFilter] = useState<'all' | 'return_load_consignor' | 'fruit_buyer' | 'mandi_trader' | 'gujarat' | 'maharashtra'>('all');
  const [selectedPartyForDetail, setSelectedPartyForDetail] = useState<Party | null>(null);
  const [isAddPartyModalOpen, setIsAddPartyModalOpen] = useState(false);

  // Document Tab state (User Requirement: "add Document tab to add documents")
  const [docSearch, setDocSearch] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState<string>('all');
  const [docPartyFilter, setDocPartyFilter] = useState<string>('all');
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [preselectedPartyIdForDoc, setPreselectedPartyIdForDoc] = useState<string>('');
  const [previewingDoc, setPreviewingDoc] = useState<PartyDocument | null>(null);

  // Payment Tracking State
  const [filterType, setFilterType] = useState<'all' | 'return_load' | 'fruit'>('all');
  const [settlingPayment, setSettlingPayment] = useState<PartyPaymentRecord | null>(null);
  const [settledAmountInput, setSettledAmountInput] = useState<number>(10500);
  const [printModalRecord, setPrintModalRecord] = useState<PartyPaymentRecord | null>(null);

  // Partial Payment Modal State (Master Prompt Section 9)
  const [partialPayModalRecord, setPartialPayModalRecord] = useState<PartyPaymentRecord | null>(null);
  const [partialPayAmount, setPartialPayAmount] = useState<number>(0);
  const [partialPayMode, setPartialPayMode] = useState<'Cash' | 'NEFT' | 'RTGS' | 'UPI' | 'Cheque' | 'Bank Transfer'>('NEFT');
  const [partialPayDate, setPartialPayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [partialPayTime, setPartialPayTime] = useState<string>('12:00');
  const [partialPayRef, setPartialPayRef] = useState<string>('');
  const [partialPayProof, setPartialPayProof] = useState<string>('');
  const [partialPayProofName, setPartialPayProofName] = useState<string>('');
  const [partialPayNotes, setPartialPayNotes] = useState<string>('');

  // Party Report Statement & PDF Modal State (Supports Custom Date Range: 3-4 months, all dates, single/all parties)
  const [isPartyReportModalOpen, setIsPartyReportModalOpen] = useState(false);
  const [reportPartyName, setReportPartyName] = useState<string>('all');
  const [reportFromDate, setReportFromDate] = useState<string>('2026-07-01'); // 4 months default
  const [reportToDate, setReportToDate] = useState<string>('2026-10-31');
  const [reportStatusFilter, setReportStatusFilter] = useState<'all' | 'settled' | 'pending' | 'overdue'>('all');
  const [reportTypeFilter, setReportTypeFilter] = useState<'all' | 'return_load' | 'fruit'>('all');

  // New Party Form State
  const [newPartyForm, setNewPartyForm] = useState({
    name: '',
    businessName: '',
    contactPerson: '',
    mobile: '',
    email: '',
    address: '',
    city: 'Surat',
    state: 'Gujarat',
    partyType: 'return_load_consignor' as Party['partyType'],
    gstin: '',
    panNumber: '',
    aadhaarNumber: '',
  });

  // New Document Form State
  const [newDocForm, setNewDocForm] = useState({
    partyId: '',
    type: 'Aadhaar Card' as PartyDocument['type'],
    documentNumber: '',
    documentName: '',
    issueDate: '',
    expiryDate: '',
    isNonExpiring: true,
    status: 'verified' as PartyDocument['status'],
    softCopyName: '',
    notes: '',
  });

  // Aggregate all documents across all parties for the Document Tab
  const allDocuments: PartyDocument[] = parties.flatMap((p) => p.documents);

  // Filtered Parties
  const filteredParties = parties.filter((party) => {
    const matchesSearch =
      party.name.toLowerCase().includes(partySearch.toLowerCase()) ||
      party.contactPerson.toLowerCase().includes(partySearch.toLowerCase()) ||
      party.city.toLowerCase().includes(partySearch.toLowerCase()) ||
      (party.panNumber && party.panNumber.toLowerCase().includes(partySearch.toLowerCase())) ||
      (party.aadhaarNumber && party.aadhaarNumber.includes(partySearch));

    if (!matchesSearch) return false;

    if (partyTypeFilter === 'return_load_consignor') return party.partyType === 'return_load_consignor' || party.partyType === 'both';
    if (partyTypeFilter === 'fruit_buyer') return party.partyType === 'fruit_buyer' || party.partyType === 'both';
    if (partyTypeFilter === 'mandi_trader') return party.partyType === 'mandi_trader' || party.partyType === 'both';
    if (partyTypeFilter === 'gujarat') return party.state.toLowerCase() === 'gujarat';
    if (partyTypeFilter === 'maharashtra') return party.state.toLowerCase() === 'maharashtra';
    return true;
  });

  // Filtered Documents
  const filteredDocuments = allDocuments.filter((doc) => {
    const matchesSearch =
      doc.documentName.toLowerCase().includes(docSearch.toLowerCase()) ||
      doc.documentNumber.toLowerCase().includes(docSearch.toLowerCase()) ||
      doc.partyName.toLowerCase().includes(docSearch.toLowerCase()) ||
      doc.type.toLowerCase().includes(docSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (docTypeFilter !== 'all' && doc.type !== docTypeFilter) return false;
    if (docPartyFilter !== 'all' && doc.partyId !== docPartyFilter) return false;
    return true;
  });

  // Filtered Payments
  const filteredPayments = partyPayments.filter((p) => {
    if (filterType === 'return_load') return p.type === 'return_load_party';
    if (filterType === 'fruit') return p.type === 'fruit_customer';
    return true;
  });

  // Open Party Statement Modal Helper
  const handleOpenPartyReportModal = (partyName?: string) => {
    if (partyName) {
      setReportPartyName(partyName);
    } else {
      setReportPartyName('all');
    }
    setIsPartyReportModalOpen(true);
  };

  // Quick Preset Helper for Party Report Date Range
  const setReportQuickRange = (months: number) => {
    const end = new Date(2026, 9, 31);
    const start = new Date(2026, 10 - months, 1);
    const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
    const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
    setReportFromDate(startStr);
    setReportToDate(endStr);
  };

  // Filtered Records for the Party Statement Report
  const partyReportRecords = useMemo(() => {
    return partyPayments.filter((p) => {
      if (reportPartyName !== 'all' && p.partyName !== reportPartyName) return false;
      if (reportTypeFilter === 'return_load' && p.type !== 'return_load_party') return false;
      if (reportTypeFilter === 'fruit' && p.type !== 'fruit_customer') return false;

      if (reportStatusFilter === 'settled' && !(p.isSettled || p.status === 'settled')) return false;
      if (reportStatusFilter === 'pending' && (p.isSettled || p.status !== 'pending')) return false;
      if (reportStatusFilter === 'overdue' && (p.isSettled || p.status !== 'overdue')) return false;

      const dateToCheck = p.tripDate || p.dueDate;
      if (reportFromDate && dateToCheck < reportFromDate) return false;
      if (reportToDate && dateToCheck > reportToDate) return false;

      return true;
    }).sort((a, b) => (b.tripDate || b.dueDate).localeCompare(a.tripDate || a.dueDate));
  }, [partyPayments, reportPartyName, reportTypeFilter, reportStatusFilter, reportFromDate, reportToDate]);

  // Statistics for Party Statement Report
  const partyReportStats = useMemo(() => {
    const totalCount = partyReportRecords.length;
    const totalBilled = partyReportRecords.reduce((acc, p) => acc + p.chargeAmount, 0);
    const totalSettled = partyReportRecords.reduce((acc, p) => acc + (p.isSettled ? (p.settledAmount ?? p.amountPaid) : p.amountPaid), 0);
    const totalDue = partyReportRecords.reduce((acc, p) => acc + (p.isSettled ? 0 : p.amountDue), 0);
    const lrSubmittedCount = partyReportRecords.filter((p) => p.lrSubmittedToParty).length;
    const settledCount = partyReportRecords.filter((p) => p.isSettled || p.status === 'settled').length;
    const pendingCount = partyReportRecords.filter((p) => !p.isSettled && p.status === 'pending').length;
    const overdueCount = partyReportRecords.filter((p) => !p.isSettled && p.status === 'overdue').length;
    const clearanceRate = totalBilled > 0 ? Math.round((totalSettled / totalBilled) * 100) : 0;
    const lrSubmissionRate = totalCount > 0 ? Math.round((lrSubmittedCount / totalCount) * 100) : 0;

    return {
      totalCount,
      totalBilled,
      totalSettled,
      totalDue,
      lrSubmittedCount,
      settledCount,
      pendingCount,
      overdueCount,
      clearanceRate,
      lrSubmissionRate,
    };
  }, [partyReportRecords]);

  // Download Party Statement CSV
  const handleDownloadPartyReportCSV = () => {
    const headers = [
      'Trip Date',
      'LR Number',
      'Vehicle Number',
      'Party Name',
      'Route',
      'Type',
      'Freight Billed (INR)',
      'LR Handover Status',
      'Settled Amount (INR)',
      'Balance Due (INR)',
      'Payment Status'
    ];
    const rows = partyReportRecords.map((p) => [
      `"${p.tripDate || ''}"`,
      `"${p.lrNumber}"`,
      `"${p.vehicleNumber}"`,
      `"${p.partyName.replace(/"/g, '""')}"`,
      `"${p.route}"`,
      `"${p.type === 'return_load_party' ? 'Return Load Backhaul' : 'Fruit Customer'}"`,
      p.chargeAmount,
      `"${p.lrSubmittedToParty ? 'Submitted' : 'Pending'}"`,
      p.isSettled ? (p.settledAmount ?? p.amountPaid) : p.amountPaid,
      p.isSettled ? 0 : p.amountDue,
      `"${p.isSettled ? 'SETTLED' : p.status.toUpperCase()}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const cleanPartyName = reportPartyName === 'all' ? 'All_Parties' : reportPartyName.replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute('download', `Party_Statement_${cleanPartyName}_${reportFromDate}_to_${reportToDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle open add doc modal
  const handleOpenAddDocModal = (partyId?: string) => {
    const initialPartyId = partyId || (parties.length > 0 ? parties[0].id : '');
    setPreselectedPartyIdForDoc(initialPartyId);
    setNewDocForm({
      partyId: initialPartyId,
      type: 'Aadhaar Card',
      documentNumber: '',
      documentName: '',
      issueDate: '',
      expiryDate: '',
      isNonExpiring: true,
      status: 'verified',
      softCopyName: 'Aadhaar_Card_KYC.pdf',
      notes: '',
    });
    setIsAddDocModalOpen(true);
  };

  const handleCreateParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartyForm.name.trim()) return;

    addParty({
      ...newPartyForm,
    });

    setIsAddPartyModalOpen(false);
    // Reset form
    setNewPartyForm({
      name: '',
      businessName: '',
      contactPerson: '',
      mobile: '',
      email: '',
      address: '',
      city: 'Surat',
      state: 'Gujarat',
      partyType: 'return_load_consignor',
      gstin: '',
      panNumber: '',
      aadhaarNumber: '',
    });
  };

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocForm.partyId || !newDocForm.documentNumber.trim()) return;

    const result = addPartyDocument(newDocForm.partyId, {
      type: newDocForm.type,
      documentNumber: newDocForm.documentNumber,
      documentName: newDocForm.documentName || `${newDocForm.type} - Document`,
      issueDate: newDocForm.issueDate || undefined,
      expiryDate: newDocForm.isNonExpiring ? undefined : newDocForm.expiryDate || undefined,
      isNonExpiring: newDocForm.isNonExpiring,
      status: newDocForm.status,
      softCopyName: newDocForm.softCopyName || `${newDocForm.type.replace(/[\s/]+/g, '_')}_scan.pdf`,
      notes: newDocForm.notes,
    });

    if (result.success) {
      setIsAddDocModalOpen(false);
      // If a party details modal is currently open, refresh it
      if (selectedPartyForDetail && selectedPartyForDetail.id === newDocForm.partyId) {
        const updated = parties.find((p) => p.id === newDocForm.partyId);
        if (updated) setSelectedPartyForDetail(updated);
      }
    }
  };

  const handleOpenSettle = (payment: PartyPaymentRecord) => {
    setSettlingPayment(payment);
    setSettledAmountInput(payment.chargeAmount);
  };

  const handleConfirmSettle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingPayment) return;
    settleReturnLoadPayment(settlingPayment.id, settledAmountInput);
    setSettlingPayment(null);
  };

  const handleOpenPartialPay = (payment: PartyPaymentRecord) => {
    setPartialPayModalRecord(payment);
    setPartialPayAmount(payment.amountDue);
    setPartialPayMode('NEFT');
    setPartialPayDate(new Date().toISOString().split('T')[0]);
    setPartialPayTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    setPartialPayRef('');
    setPartialPayProof('');
    setPartialPayProofName('');
    setPartialPayNotes('');
  };

  const handleConfirmPartialPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partialPayModalRecord) return;
    recordPartialPayment(partialPayModalRecord.id, {
      amount: Number(partialPayAmount),
      paymentDate: partialPayDate,
      paymentTime: partialPayTime,
      paymentMode: partialPayMode,
      referenceNumber: partialPayRef,
      proofUrl: partialPayProof,
      proofName: partialPayProofName,
      notes: partialPayNotes,
    });
    setPartialPayModalRecord(null);
  };

  const handleTriggerBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with 3 Tab Switchers (Parties / Documents / Payments) */}
      <div className="bg-white p-5 border border-[#DCE8F2] rounded-2xl shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-heading text-lg font-extrabold text-[#384959] flex items-center gap-2">
                <Building className="w-5 h-5 text-[#6A89A7]" />
                <span>Parties, Statutory Documents & Settlements Hub</span>
              </h2>
              <span className="bg-[#BDDDFC]/30 text-[#384959] border border-[#BDDDFC] text-xs font-bold px-2.5 py-0.5 rounded-full">
                Aadhaar • PAN • GST • Mandi KYC • Backhaul LR
              </span>
            </div>
            <p className="text-xs text-[#6A89A7] mt-1 font-medium">
              Manage all client parties with complete KYC compliance (Aadhaar, PAN, GST, Mandi License), centralized document repository, and LR payments.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleOpenPartyReportModal()}
              className="bg-[#384959] hover:bg-[#2C3A47] text-white px-3.5 py-2 rounded-xl text-xs font-heading font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="Print custom date range party statement or download PDF"
            >
              <Printer className="w-4 h-4 text-[#BDDDFC]" />
              <span>Print Party Report / PDF</span>
            </button>
            <button
              onClick={() => handleOpenAddDocModal()}
              className="bg-white hover:bg-[#F3F7FB] text-[#384959] border border-[#DCE8F2] px-3.5 py-2 rounded-xl text-xs font-heading font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4 text-[#6A89A7]" />
              <span>+ Add Document</span>
            </button>
            <button
              onClick={() => setIsAddPartyModalOpen(true)}
              className="bg-[#88BDF2] hover:bg-[#6A89A7] text-[#384959] hover:text-white px-3.5 py-2 rounded-xl text-xs font-heading font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Register New Party</span>
            </button>
          </div>
        </div>

        {/* 3 Prominent Navigation Tabs inside Party Module */}
        <div className="mt-5 pt-3 border-t border-[#DCE8F2] flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSubTab('parties')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'parties'
                ? 'bg-[#384959] text-white shadow-xs'
                : 'bg-white text-[#6A89A7] hover:bg-[#F3F7FB] hover:text-[#384959] border border-[#DCE8F2]'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Party Option & Profiles ({parties.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('documents')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'documents'
                ? 'bg-[#384959] text-white shadow-xs'
                : 'bg-white text-[#6A89A7] hover:bg-[#F3F7FB] hover:text-[#384959] border border-[#DCE8F2]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Document Center ({allDocuments.length} Total KYC Docs)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('payments')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'payments'
                ? 'bg-[#384959] text-white shadow-xs'
                : 'bg-white text-[#6A89A7] hover:bg-[#F3F7FB] hover:text-[#384959] border border-[#DCE8F2]'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Party Payments & Stamped LR ({partyPayments.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'analytics'
                ? 'bg-[#384959] text-white shadow-xs'
                : 'bg-white text-[#6A89A7] hover:bg-[#F3F7FB] hover:text-[#384959] border border-[#DCE8F2]'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Return Load Analytics (Monthly / Half-Year / Yearly)</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          SUB-TAB 1: PARTY DIRECTORY & KYC PROFILES ("Party Option")
          ======================================================== */}
      {activeSubTab === 'parties' && (
        <div className="space-y-5">
          {/* Top Filter and Search Bar */}
          <div className="bg-white p-4 rounded-xl border border-[#DCE8F2] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search party by name, contact, city, Aadhaar, PAN..."
                value={partySearch}
                onChange={(e) => setPartySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#88BDF2]"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs font-bold">
              <button
                onClick={() => setPartyTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  partyTypeFilter === 'all'
                    ? 'bg-[#384959] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-[#F8FAFC] hover:text-[#384959] border border-slate-200'
                }`}
              >
                All Parties ({parties.length})
              </button>
              <button
                onClick={() => setPartyTypeFilter('return_load_consignor')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  partyTypeFilter === 'return_load_consignor'
                    ? 'bg-[#384959] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-[#F8FAFC] hover:text-[#384959] border border-slate-200'
                }`}
              >
                Return Load Parties
              </button>
              <button
                onClick={() => setPartyTypeFilter('fruit_buyer')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  partyTypeFilter === 'fruit_buyer'
                    ? 'bg-[#384959] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-[#F8FAFC] hover:text-[#384959] border border-slate-200'
                }`}
              >
                Fruit Buyers & Mandi
              </button>
              <button
                onClick={() => setPartyTypeFilter('gujarat')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  partyTypeFilter === 'gujarat'
                    ? 'bg-[#384959] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-[#F8FAFC] hover:text-[#384959] border border-slate-200'
                }`}
              >
                Gujarat (GJ)
              </button>
              <button
                onClick={() => setPartyTypeFilter('maharashtra')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  partyTypeFilter === 'maharashtra'
                    ? 'bg-[#384959] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-[#F8FAFC] hover:text-[#384959] border border-slate-200'
                }`}
              >
                Maharashtra (MH)
              </button>

              {/* Dedicated Print Statement & Download PDF Button */}
              <button
                onClick={() => handleOpenPartyReportModal()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#384959] hover:bg-[#2C3A47] text-white shadow-xs transition-all cursor-pointer ml-auto"
                title="Print custom date range party statement or download PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Party Report / PDF</span>
              </button>
            </div>
          </div>

          {/* Parties Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredParties.map((party) => {
              const aadhaarDoc = party.documents.find((d) => d.type === 'Aadhaar Card');
              const panDoc = party.documents.find((d) => d.type === 'PAN Card');
              const otherDocsCount = party.documents.filter(
                (d) => d.type !== 'Aadhaar Card' && d.type !== 'PAN Card'
              ).length;

              return (
                <div
                  key={party.id}
                  className="bg-white rounded-xl border border-[#DCE8F2] hover:border-[#DCE8F2] shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-4 space-y-3.5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#BDDDFC]/30 text-[#6A89A7] flex items-center justify-center shrink-0 border border-[#DCE8F2] font-bold">
                          <Building className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-heading font-extrabold text-sm text-[#384959] truncate leading-snug">
                            {party.name}
                          </h3>
                          <p className="text-[11px] text-slate-500 truncate font-medium">
                            {party.businessName || party.name}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 uppercase border font-mono ${
                          party.partyType === 'return_load_consignor'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : party.partyType === 'fruit_buyer'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-[#BDDDFC]/40 text-[#384959] border-[#BDDDFC]'
                        }`}
                      >
                        {party.partyType === 'return_load_consignor'
                          ? 'Return Load'
                          : party.partyType === 'fruit_buyer'
                          ? 'Fruit Buyer'
                          : 'Mandi Trader'}
                      </span>
                    </div>

                    {/* Contact & Location Info */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-800">{party.contactPerson}</span>
                        </span>
                        <span className="flex items-center gap-1 font-mono text-[#384959] font-bold">
                          <Phone className="w-3 h-3 text-[#6A89A7]" />
                          <span>{party.mobile}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{party.city}, {party.state}</span>
                      </div>
                    </div>

                    {/* Statutory Documents (Aadhaar, PAN, and other KYC docs) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 font-heading">
                        <span>Statutory KYC Documents</span>
                        <span className="text-[#6A89A7] font-mono">{party.documents.length} Uploaded</span>
                      </div>

                      {/* Aadhaar Card Box */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-[#F8FAFC] border border-[#DCE8F2] text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <ShieldCheck className="w-4 h-4 text-[#6A89A7] shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-bold text-[#384959] block leading-tight font-heading">
                              Aadhaar Card
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-800 truncate block">
                              {aadhaarDoc ? aadhaarDoc.documentNumber : party.aadhaarNumber || 'Not Uploaded'}
                            </span>
                          </div>
                        </div>
                        {aadhaarDoc ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-mono">
                            <Check className="w-3 h-3" />
                            Verified
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenAddDocModal(party.id)}
                            className="text-[10px] text-[#6A89A7] hover:text-[#384959] font-bold underline cursor-pointer"
                          >
                            + Add
                          </button>
                        )}
                      </div>

                      {/* PAN Card Box */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/70 border border-amber-100 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-amber-700 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-bold text-amber-900 block leading-tight font-heading">
                              PAN Card
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-800 truncate block">
                              {panDoc ? panDoc.documentNumber : party.panNumber || 'Not Uploaded'}
                            </span>
                          </div>
                        </div>
                        {panDoc ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-mono">
                            <Check className="w-3 h-3" />
                            Verified
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenAddDocModal(party.id)}
                            className="text-[10px] text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                          >
                            + Add
                          </button>
                        )}
                      </div>

                      {/* Additional required docs summary chips */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {party.gstin && (
                          <span className="text-[10px] bg-slate-100 text-slate-700 font-mono font-semibold px-2 py-0.5 rounded border border-slate-200">
                            GST: {party.gstin}
                          </span>
                        )}
                        {otherDocsCount > 0 && (
                          <span className="text-[10px] bg-[#BDDDFC]/30 text-[#384959] font-mono font-semibold px-2 py-0.5 rounded border border-[#DCE8F2]">
                            +{otherDocsCount} More Docs (Mandi/Agreement)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="bg-slate-50 px-4 py-2.5 border-t border-[#DCE8F2] flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedPartyForDetail(party)}
                      className="text-xs font-heading font-extrabold text-[#384959] hover:text-[#384959] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View All Docs ({party.documents.length})</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenPartyReportModal(party.name)}
                        className="text-xs font-heading font-bold text-slate-700 hover:text-[#384959] bg-white hover:bg-[#F8FAFC] border border-slate-200 px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                        title={`Print ${party.name} statement report`}
                      >
                        <Printer className="w-3 h-3 text-slate-500" />
                        <span>Report</span>
                      </button>

                      <button
                        onClick={() => handleOpenAddDocModal(party.id)}
                        className="text-xs font-heading font-bold text-white bg-[#384959] hover:bg-[#384959] px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Doc</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 2: DOCUMENT CENTER ("Document tab to add documents")
          ======================================================== */}
      {activeSubTab === 'documents' && (
        <div className="space-y-5">
          {/* Document Center Controls */}
          <div className="bg-white p-4 rounded-xl border border-[#DCE8F2] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by document number, name, or party..."
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#88BDF2]"
                />
              </div>

              {/* Document Type Dropdown */}
              <select
                value={docTypeFilter}
                onChange={(e) => setDocTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold px-3 py-1.5 text-slate-700 focus:outline-none focus:border-[#88BDF2]"
              >
                <option value="all">All Document Types</option>
                <option value="Aadhaar Card">Aadhaar Card</option>
                <option value="PAN Card">PAN Card</option>
                <option value="GST Certificate">GST Certificate</option>
                <option value="Mandi Trade License">Mandi Trade License</option>
                <option value="Bank Passbook / Cheque">Bank Passbook / Cheque</option>
                <option value="Transport Agreement">Transport Agreement</option>
                <option value="Other Document">Other Document</option>
              </select>

              {/* Party Dropdown */}
              <select
                value={docPartyFilter}
                onChange={(e) => setDocPartyFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold px-3 py-1.5 text-slate-700 focus:outline-none focus:border-[#88BDF2]"
              >
                <option value="all">All Parties ({parties.length})</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Direct Add Document Button */}
            <button
              onClick={() => handleOpenAddDocModal()}
              className="bg-[#384959] hover:bg-[#384959] text-white px-4 py-2 rounded-xl text-xs font-heading font-extrabold flex items-center gap-1.5 shadow-sm shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Document</span>
            </button>
          </div>

          {/* Documents Table / Grid View */}
          <div className="bg-white rounded-xl border border-[#DCE8F2] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] text-[#384959] font-heading font-extrabold uppercase text-[10px] tracking-wider border-b border-[#DCE8F2]">
                    <th className="py-3 px-4">Document Type & Name</th>
                    <th className="py-3 px-4">Registered Party</th>
                    <th className="py-3 px-4">Document Number</th>
                    <th className="py-3 px-4">Validity / Expiry</th>
                    <th className="py-3 px-4">Verification Status</th>
                    <th className="py-3 px-4">Attached Soft Copy</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredDocuments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6">
                        <EmptyState
                          title="No KYC / Party Documents Found"
                          description="No documents found matching your filter criteria. Click '+ Add New Document' to upload Aadhaar, PAN, or GST certificates."
                          actionLabel="+ Add New Document"
                          onAction={() => setIsAddDocModalOpen(true)}
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredDocuments.map((doc) => {
                      const isAadhaar = doc.type === 'Aadhaar Card';
                      const isPan = doc.type === 'PAN Card';
                      const isGst = doc.type === 'GST Certificate';

                      return (
                        <tr key={doc.id} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  isAadhaar
                                    ? 'bg-[#BDDDFC]/30 text-[#6A89A7]'
                                    : isPan
                                    ? 'bg-amber-100 text-amber-800'
                                    : isGst
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-[#BDDDFC]/30 text-[#6A89A7]'
                                }`}
                              >
                                {isAadhaar ? (
                                  <ShieldCheck className="w-4 h-4" />
                                ) : isPan ? (
                                  <FileText className="w-4 h-4" />
                                ) : isGst ? (
                                  <Building2 className="w-4 h-4" />
                                ) : (
                                  <FileSpreadsheet className="w-4 h-4" />
                                )}
                              </div>
                              <div>
                                <span className="font-heading font-extrabold text-[#384959] block">
                                  {doc.type}
                                </span>
                                <span className="text-[11px] text-slate-500 block truncate max-w-xs">
                                  {doc.documentName}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-heading font-bold text-[#384959] block truncate max-w-[200px]">
                              {doc.partyName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {doc.partyId}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-mono font-bold text-[#384959] text-xs">
                            {doc.documentNumber}
                          </td>

                          <td className="py-3 px-4 font-mono text-[11px]">
                            {doc.isNonExpiring ? (
                              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Permanent (Non-Expiring)
                              </span>
                            ) : doc.expiryDate ? (
                              <span className="text-slate-700">{doc.expiryDate}</span>
                            ) : (
                              <span className="text-slate-400">Not specified</span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase border ${
                                doc.status === 'verified'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : doc.status === 'expired'
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : 'bg-amber-100 text-amber-800 border-amber-300'
                              }`}
                            >
                              {doc.status === 'verified' && <Check className="w-3 h-3" />}
                              {doc.status.replace('_', ' ')}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <button
                              onClick={() => setPreviewingDoc(doc)}
                              className="inline-flex items-center gap-1 text-[11px] font-mono text-[#6A89A7] hover:text-[#384959] font-bold bg-[#F8FAFC] hover:bg-[#BDDDFC]/30 px-2.5 py-1 rounded-md border border-[#DCE8F2] transition-colors cursor-pointer"
                              title="Click to view full softcopy preview"
                            >
                              <FileText className="w-3 h-3 text-[#6A89A7]" />
                              <span className="truncate max-w-[140px]">{doc.softCopyName || 'View Document'}</span>
                            </button>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setPreviewingDoc(doc)}
                                className="p-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#BDDDFC]/30 text-[#6A89A7] transition-colors cursor-pointer"
                                title="Preview Document"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  updatePartyDocumentStatus(
                                    doc.partyId,
                                    doc.id,
                                    doc.status === 'verified' ? 'pending_verification' : 'verified'
                                  )
                                }
                                className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                                title="Toggle Status (Verified / Pending)"
                              >
                                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Delete ${doc.type} for ${doc.partyName}?`)) {
                                    deletePartyDocument(doc.partyId, doc.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                                title="Delete Document"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 3: PARTY PAYMENTS & STAMPED LR SETTLEMENTS
          ======================================================== */}
      {activeSubTab === 'payments' && (
        <div className="space-y-6">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-[#BDDDFC]/20 p-1.5 rounded-xl text-xs font-bold border border-[#DCE8F2] flex-wrap">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white text-[#384959] shadow-xs'
                  : 'text-[#384959] hover:text-[#384959] hover:bg-white/50'
              }`}
            >
              All Payment Records ({partyPayments.length})
            </button>
            <button
              onClick={() => setFilterType('return_load')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === 'return_load'
                  ? 'bg-white text-[#384959] shadow-xs'
                  : 'text-[#384959] hover:text-[#384959] hover:bg-white/50'
              }`}
            >
              Return Load Parties
            </button>
            <button
              onClick={() => setFilterType('fruit')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === 'fruit'
                  ? 'bg-white text-[#384959] shadow-xs'
                  : 'text-[#384959] hover:text-[#384959] hover:bg-white/50'
              }`}
            >
              Fruit Delivery Outbound
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPayments.map((payment) => {
              const isSettled = payment.isSettled || payment.status === 'settled';

              return (
                <div
                  key={payment.id}
                  className={`bg-white rounded-xl border p-4 shadow-xs transition-all flex flex-col justify-between ${
                    isSettled
                      ? 'border-emerald-200 bg-gradient-to-br from-white to-emerald-50/20'
                      : 'border-[#DCE8F2] hover:border-[#DCE8F2]'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            payment.type === 'return_load_party'
                              ? 'bg-[#BDDDFC] text-[#384959]'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-heading font-extrabold text-sm text-[#384959]">
                            {payment.partyName}
                          </h3>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {payment.route} • Trip Ref: {payment.tripReferenceId}
                          </span>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-1">
                        {isSettled ? (
                          <span className="bg-emerald-600 text-white font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                            <Check className="w-3 h-3" />
                            (Settled)
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Pending Payment
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Prominent Vehicle Number Banner */}
                    <div className="bg-[#F8FAFC] border border-[#DCE8F2] rounded-lg p-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#6A89A7]" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#384959] font-heading block leading-none">
                            Assigned Vehicle
                          </span>
                          <span className="font-mono text-sm font-extrabold text-[#384959] tracking-wider">
                            {payment.vehicleNumber}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 font-heading block leading-none">
                          LR Ref
                        </span>
                        <span className="font-mono text-xs font-semibold text-slate-600">
                          {payment.lrNumber}
                        </span>
                      </div>
                    </div>

                    {/* Financial Figures */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs font-medium">
                      <div>
                        <span className="text-[11px] text-slate-500 block">Total Load Charge</span>
                        <span className="font-mono font-bold text-[#384959] text-sm">
                          ₹{payment.chargeAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-500 block">
                          {isSettled ? 'Settled & Received' : 'Outstanding Balance'}
                        </span>
                        <span
                          className={`font-mono font-bold text-sm ${
                            isSettled ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          ₹
                          {isSettled
                            ? (payment.settledAmount ?? payment.chargeAmount).toLocaleString('en-IN')
                            : payment.amountDue.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Stamped LR Status */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#F8FAFC] border border-[#DCE8F2] text-xs">
                      <div className="flex items-center gap-1.5">
                        <FileCheck2
                          className={`w-4 h-4 ${
                            payment.lrSubmittedToParty ? 'text-emerald-600' : 'text-amber-500'
                          }`}
                        />
                        <span className="text-slate-700 font-medium">
                          LR Submitted to Party:
                        </span>
                        <span
                          className={`font-bold font-mono text-[11px] ${
                            payment.lrSubmittedToParty ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {payment.lrSubmittedToParty ? 'YES (Submitted)' : 'NO (Pending Submission)'}
                        </span>
                      </div>

                      <button
                        onClick={() => toggleLRSubmitted(payment.id)}
                        className="text-[11px] font-bold text-[#6A89A7] hover:text-[#384959] underline cursor-pointer"
                      >
                        {payment.lrSubmittedToParty ? 'Mark Unsubmitted' : 'Mark as Submitted'}
                      </button>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setPrintModalRecord(payment)}
                      className="bg-[#F8FAFC] hover:bg-[#BDDDFC]/30 text-[#384959] border border-[#DCE8F2] px-3 py-1.5 rounded-lg text-xs font-heading font-extrabold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#6A89A7]" />
                      <span>Print Slip</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {!isSettled && (
                        <button
                          onClick={() => handleOpenPartialPay(payment)}
                          className="bg-[#F8FAFC] hover:bg-[#BDDDFC]/30 text-[#384959] border border-[#DCE8F2] px-3 py-1.5 rounded-lg text-xs font-heading font-extrabold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-[#6A89A7]" />
                          <span>Pay Partial</span>
                        </button>
                      )}

                      {isSettled ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-bold font-heading bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Settled & Closed
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenSettle(payment)}
                          className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-heading font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        >
                          <span>Settle Full</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 4: RETURN LOAD PAYMENT ANALYTICS (Monthly / Half-Year / Yearly)
          ======================================================== */}
      {activeSubTab === 'analytics' && <ReturnLoadAnalyticsView />}

      {/* ========================================================
          MODAL 1: ADD DOCUMENT MODAL ("add Document tab to add documents")
          ======================================================== */}
      <ModalPortal isOpen={isAddDocModalOpen} onClose={() => setIsAddDocModalOpen(false)}>
        {isAddDocModalOpen && (
          <div className="bg-white rounded-2xl border border-[#DCE8F2] shadow-2xl w-full max-w-lg p-5 space-y-4 text-xs text-slate-800 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#DCE8F2] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#BDDDFC]/30 text-[#6A89A7] flex items-center justify-center">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-sm text-[#384959]">
                    Add Party Statutory Document
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Upload Aadhaar, PAN, GST, Mandi License, or Trade Agreements
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddDocModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-3.5">
              {/* Party Selection */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#384959] mb-1 font-heading">
                  Select Transporter / Mandi Party *
                </label>
                <select
                  required
                  value={newDocForm.partyId}
                  onChange={(e) => setNewDocForm({ ...newDocForm, partyId: e.target.value })}
                  className="w-full bg-white border border-[#DCE8F2] rounded-lg px-3 py-2 text-xs font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                >
                  <option value="" disabled>
                    -- Select Party --
                  </option>
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.city}, {p.state})
                    </option>
                  ))}
                </select>
              </div>

              {/* Document Type & Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#384959] mb-1 font-heading">
                    Document Type *
                  </label>
                  <select
                    required
                    value={newDocForm.type}
                    onChange={(e) => {
                      const selectedType = e.target.value as PartyDocument['type'];
                      const isPerm = selectedType === 'Aadhaar Card' || selectedType === 'PAN Card';
                      setNewDocForm({
                        ...newDocForm,
                        type: selectedType,
                        isNonExpiring: isPerm,
                        softCopyName: `${selectedType.replace(/[\s/]+/g, '_')}_Scan.pdf`,
                      });
                    }}
                    className="w-full bg-white border border-[#DCE8F2] rounded-lg px-3 py-2 text-xs font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                  >
                    <option value="Aadhaar Card">Aadhaar Card (UIDAI)</option>
                    <option value="PAN Card">PAN Card (Income Tax)</option>
                    <option value="GST Certificate">GST Certificate (REG-06)</option>
                    <option value="Mandi Trade License">Mandi APMC Trader License</option>
                    <option value="Bank Passbook / Cheque">Bank Passbook / Cancelled Cheque</option>
                    <option value="Transport Agreement">Transport & Freight Agreement</option>
                    <option value="Other Document">Other Statutory Document</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#384959] mb-1 font-heading">
                    Document / Registration Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      newDocForm.type === 'Aadhaar Card'
                        ? 'e.g. 7489 1234 5678'
                        : newDocForm.type === 'PAN Card'
                        ? 'e.g. AAACS1234D'
                        : newDocForm.type === 'GST Certificate'
                        ? 'e.g. 24AAACS1234D1Z5'
                        : 'e.g. APMC-SURAT-2026'
                    }
                    value={newDocForm.documentNumber}
                    onChange={(e) => setNewDocForm({ ...newDocForm, documentNumber: e.target.value })}
                    className="w-full bg-white border border-[#DCE8F2] rounded-lg px-3 py-2 font-mono text-xs font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                  />
                </div>
              </div>

              {/* Document Title / Description */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#384959] mb-1 font-heading">
                  Document Title / Holder Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aadhaar Card - Proprietor Rajeshbhai Patel"
                  value={newDocForm.documentName}
                  onChange={(e) => setNewDocForm({ ...newDocForm, documentName: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#88BDF2]"
                />
              </div>

              {/* Expiry & Non-Expiring Checkbox */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-xs text-slate-700">
                    Validity & Expiry
                  </span>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newDocForm.isNonExpiring}
                      onChange={(e) => setNewDocForm({ ...newDocForm, isNonExpiring: e.target.checked })}
                      className="rounded text-[#6A89A7] focus:ring-sky-500"
                    />
                    <span className="font-semibold text-[#384959]">Permanent / Non-Expiring</span>
                  </label>
                </div>

                {!newDocForm.isNonExpiring && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 font-heading">
                        Issue Date
                      </label>
                      <input
                        type="date"
                        value={newDocForm.issueDate}
                        onChange={(e) => setNewDocForm({ ...newDocForm, issueDate: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 font-heading">
                        Expiry Date *
                      </label>
                      <input
                        type="date"
                        required={!newDocForm.isNonExpiring}
                        value={newDocForm.expiryDate}
                        onChange={(e) => setNewDocForm({ ...newDocForm, expiryDate: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Status & Soft Copy Attachment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#384959] mb-1 font-heading">
                    Verification Status
                  </label>
                  <select
                    value={newDocForm.status}
                    onChange={(e) => setNewDocForm({ ...newDocForm, status: e.target.value as PartyDocument['status'] })}
                    className="w-full bg-white border border-[#DCE8F2] rounded-lg px-3 py-2 text-xs font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                  >
                    <option value="verified">Verified (Active KYC)</option>
                    <option value="pending_verification">Pending Verification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#384959] mb-1 font-heading">
                    Softcopy File Name / Attachment
                  </label>
                  <input
                    type="text"
                    value={newDocForm.softCopyName}
                    onChange={(e) => setNewDocForm({ ...newDocForm, softCopyName: e.target.value })}
                    placeholder="e.g. Aadhaar_Scan_Signed.pdf"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#88BDF2]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 font-heading">
                  Remarks / Verification Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. UIDAI verified with OTP/QR scan, signed by proprietor"
                  value={newDocForm.notes}
                  onChange={(e) => setNewDocForm({ ...newDocForm, notes: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-2 pt-3 border-t border-[#DCE8F2]">
                <button
                  type="button"
                  onClick={() => setIsAddDocModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-gradient-to-r from-[#384959] to-[#2C3A47] hover:from-[#2C3A47] hover:to-[#384959] rounded-lg shadow-sm shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Document</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </ModalPortal>

      {/* ========================================================
          MODAL 2: REGISTER NEW PARTY MODAL
          ======================================================== */}
      <ModalPortal isOpen={isAddPartyModalOpen} onClose={() => setIsAddPartyModalOpen(false)}>
        {isAddPartyModalOpen && (
          <div className="bg-white rounded-2xl border border-[#DCE8F2] shadow-2xl w-full max-w-xl p-5 space-y-4 text-xs text-slate-800 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#DCE8F2] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#BDDDFC]/30 text-[#6A89A7] flex items-center justify-center">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-sm text-[#384959]">
                    Register New Transporter Party
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Add party details with Aadhaar, PAN & KYC documents
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddPartyModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateParty} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#384959] mb-1 font-heading">
                    Party / Trading Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Surat Shreenathji Textiles"
                    value={newPartyForm.name}
                    onChange={(e) => setNewPartyForm({ ...newPartyForm, name: e.target.value })}
                    className="w-full bg-white border border-[#DCE8F2] rounded-lg px-3 py-2 text-xs font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#384959] mb-1 font-heading">
                    Party Type *
                  </label>
                  <select
                    value={newPartyForm.partyType}
                    onChange={(e) => setNewPartyForm({ ...newPartyForm, partyType: e.target.value as Party['partyType'] })}
                    className="w-full bg-white border border-[#DCE8F2] rounded-lg px-3 py-2 text-xs font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                  >
                    <option value="return_load_consignor">Return Load Consignor (Backhaul Goods)</option>
                    <option value="fruit_buyer">Fruit Buyer (Wholesale Mandi)</option>
                    <option value="mandi_trader">APMC Mandi Commission Agent</option>
                    <option value="both">Both (Fruit Buyer & Backhaul Consignor)</option>
                  </select>
                </div>
              </div>

              {/* Contact Person & Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#384959] mb-1 font-heading">
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajeshbhai Patel"
                    value={newPartyForm.contactPerson}
                    onChange={(e) => setNewPartyForm({ ...newPartyForm, contactPerson: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#384959] mb-1 font-heading">
                    Mobile / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 98250 12345"
                    value={newPartyForm.mobile}
                    onChange={(e) => setNewPartyForm({ ...newPartyForm, mobile: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              {/* City & State (No hardcoded Gujarat - configurable) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#384959] mb-1 font-heading">
                    City / Mandi Hub *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Surat, Vapi, Ahmedabad, Pune"
                    value={newPartyForm.city}
                    onChange={(e) => setNewPartyForm({ ...newPartyForm, city: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#384959] mb-1 font-heading">
                    State *
                  </label>
                  <select
                    value={newPartyForm.state}
                    onChange={(e) => setNewPartyForm({ ...newPartyForm, state: e.target.value })}
                    className="w-full bg-white border border-[#DCE8F2] rounded-lg px-3 py-2 text-xs font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                  >
                    <option value="Gujarat">Gujarat</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Other Interstate">Other Interstate</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 font-heading">
                  Address / Gala / Shed No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gala #44, APMC Fruit Market, Ring Road"
                  value={newPartyForm.address}
                  onChange={(e) => setNewPartyForm({ ...newPartyForm, address: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs"
                />
              </div>

              {/* Statutory Documents (Aadhaar & PAN direct inputs) */}
              <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#DCE8F2] space-y-2.5">
                <span className="font-heading font-extrabold text-xs text-[#384959] block">
                  Statutory KYC Documents (Auto-registers Documents)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#384959] mb-0.5 font-heading">
                      Aadhaar Number
                    </label>
                    <input
                      type="text"
                      placeholder="XXXX XXXX XXXX"
                      value={newPartyForm.aadhaarNumber}
                      onChange={(e) => setNewPartyForm({ ...newPartyForm, aadhaarNumber: e.target.value })}
                      className="w-full bg-white border border-[#DCE8F2] rounded-lg px-2.5 py-1.5 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#384959] mb-0.5 font-heading">
                      PAN Card Number
                    </label>
                    <input
                      type="text"
                      placeholder="ABCDE1234F"
                      value={newPartyForm.panNumber}
                      onChange={(e) => setNewPartyForm({ ...newPartyForm, panNumber: e.target.value.toUpperCase() })}
                      className="w-full bg-white border border-[#DCE8F2] rounded-lg px-2.5 py-1.5 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#384959] mb-0.5 font-heading">
                      GSTIN Number
                    </label>
                    <input
                      type="text"
                      placeholder="24ABCDE1234F1Z5"
                      value={newPartyForm.gstin}
                      onChange={(e) => setNewPartyForm({ ...newPartyForm, gstin: e.target.value.toUpperCase() })}
                      className="w-full bg-white border border-[#DCE8F2] rounded-lg px-2.5 py-1.5 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-[#DCE8F2]">
                <button
                  type="button"
                  onClick={() => setIsAddPartyModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-gradient-to-r from-[#384959] to-[#2C3A47] hover:from-[#2C3A47] hover:to-[#384959] rounded-lg shadow-sm shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Party</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </ModalPortal>

      {/* ========================================================
          MODAL 3: PARTY DETAILS & ALL DOCUMENTS MODAL
          ======================================================== */}
      <ModalPortal isOpen={Boolean(selectedPartyForDetail)} onClose={() => setSelectedPartyForDetail(null)}>
        {selectedPartyForDetail && (
          <div className="bg-white rounded-2xl border border-[#DCE8F2] shadow-2xl w-full max-w-2xl p-6 space-y-5 text-xs text-slate-800 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#DCE8F2] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#BDDDFC]/30 text-[#6A89A7] flex items-center justify-center font-bold">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base text-[#384959]">
                    {selectedPartyForDetail.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedPartyForDetail.businessName} • {selectedPartyForDetail.city}, {selectedPartyForDetail.state}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPartyForDetail(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Party Overview Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-heading">Contact Person</span>
                <span className="font-bold text-slate-800">{selectedPartyForDetail.contactPerson}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-heading">Phone / Mobile</span>
                <span className="font-bold font-mono text-[#384959]">{selectedPartyForDetail.mobile}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-heading">Total Trips</span>
                <span className="font-bold text-slate-800">{selectedPartyForDetail.totalTripsCount} Trips</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-heading">Outstanding</span>
                <span className="font-bold font-mono text-rose-600">
                  ₹{selectedPartyForDetail.outstandingBalance.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Attached Statutory Documents List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-extrabold text-sm text-[#384959] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#6A89A7]" />
                  <span>Statutory KYC Documents ({selectedPartyForDetail.documents.length})</span>
                </h4>
                <button
                  onClick={() => {
                    handleOpenAddDocModal(selectedPartyForDetail.id);
                  }}
                  className="bg-[#384959] hover:bg-[#384959] text-white px-3 py-1.5 rounded-lg text-xs font-heading font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Document to Party</span>
                </button>
              </div>

              <div className="divide-y divide-sky-100 border border-[#DCE8F2] rounded-xl overflow-hidden">
                {selectedPartyForDetail.documents.map((doc) => (
                  <div key={doc.id} className="p-3 bg-white hover:bg-[#F8FAFC] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#BDDDFC]/30 text-[#6A89A7] flex items-center justify-center shrink-0">
                        {doc.type === 'Aadhaar Card' ? (
                          <ShieldCheck className="w-4 h-4" />
                        ) : doc.type === 'PAN Card' ? (
                          <FileText className="w-4 h-4" />
                        ) : (
                          <Building2 className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-bold text-xs text-[#384959] truncate">
                            {doc.type}
                          </span>
                          <span className="font-mono text-xs font-extrabold text-[#384959] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#DCE8F2]">
                            {doc.documentNumber}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {doc.documentName} • {doc.softCopyName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-mono">
                        <Check className="w-3 h-3" />
                        Verified
                      </span>
                      <button
                        onClick={() => setPreviewingDoc(doc)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        title="View Soft Copy Preview"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-[#DCE8F2] flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  handleOpenPartyReportModal(selectedPartyForDetail.name);
                }}
                className="px-4 py-2 font-bold text-white bg-[#384959] hover:bg-[#2C3A47] rounded-lg cursor-pointer flex items-center gap-1.5 shadow-xs text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Party Statement / PDF</span>
              </button>
              <button
                onClick={() => setSelectedPartyForDetail(null)}
                className="px-4 py-2 font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer text-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* ========================================================
          MODAL 4: DOCUMENT SOFTCOPY PREVIEW MODAL
          ======================================================== */}
      <ModalPortal isOpen={Boolean(previewingDoc)} onClose={() => setPreviewingDoc(null)} zIndex="z-[110]">
        {previewingDoc && (
          <div className="bg-white rounded-2xl border border-[#DCE8F2] shadow-2xl w-full max-w-lg p-6 space-y-4 text-xs text-slate-800 my-auto">
            <div className="flex items-center justify-between border-b border-[#DCE8F2] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#6A89A7]" />
                <div>
                  <h3 className="font-heading font-extrabold text-sm text-[#384959]">
                    Statutory Document Soft Copy Preview
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {previewingDoc.softCopyName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewingDoc(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated Government Document Paper Preview */}
            <div className="p-6 bg-gradient-to-b from-[#F8FAFC] to-white border-2 border-dashed border-[#DCE8F2] rounded-xl space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#DCE8F2] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#384959] text-white flex items-center justify-center font-bold">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-heading font-extrabold text-xs text-[#384959] block">
                      {companyName}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Verified Transporter KYC Repository
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  VERIFIED KYC
                </span>
              </div>

              <div className="space-y-2 py-2">
                <div className="text-center space-y-1">
                  <span className="text-[11px] uppercase font-bold text-[#384959] font-heading">
                    {previewingDoc.type}
                  </span>
                  <div className="text-base font-extrabold font-mono text-[#384959] tracking-wider">
                    {previewingDoc.documentNumber}
                  </div>
                  <div className="text-xs text-slate-600 font-medium">
                    {previewingDoc.documentName}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 text-[11px] border-t border-[#DCE8F2]">
                  <div>
                    <span className="text-slate-400 block font-heading uppercase text-[9px] font-bold">Party Entity</span>
                    <span className="font-bold text-slate-800">{previewingDoc.partyName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-heading uppercase text-[9px] font-bold">Uploaded Date</span>
                    <span className="font-mono text-slate-700">{previewingDoc.uploadedAt}</span>
                  </div>
                </div>

                {previewingDoc.notes && (
                  <div className="bg-[#F8FAFC] p-2 rounded text-[11px] text-[#384959] border border-[#DCE8F2]">
                    <strong>Note:</strong> {previewingDoc.notes}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#DCE8F2]">
              <button
                onClick={() => setPreviewingDoc(null)}
                className="px-4 py-2 font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* ========================================================
          MODAL 5: SETTLEMENT MODAL (Existing)
          ======================================================== */}
      <ModalPortal isOpen={Boolean(settlingPayment)} onClose={() => setSettlingPayment(null)}>
        {settlingPayment && (
          <div className="bg-white rounded-xl border border-[#DCE8F2] shadow-2xl w-full max-w-md p-5 space-y-4 text-xs text-slate-800 my-auto">
            <div className="flex items-center justify-between border-b border-[#DCE8F2] pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="font-heading font-extrabold text-sm text-[#384959]">
                  Settle Return Load Payment
                </h3>
              </div>
              <button
                onClick={() => setSettlingPayment(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSettle} className="space-y-3">
              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#DCE8F2] space-y-1">
                <span className="font-heading font-bold text-[#384959] block">
                  {settlingPayment.partyName}
                </span>
                <p className="text-[11px] text-[#384959]">
                  Vehicle: <strong>{settlingPayment.vehicleNumber}</strong> • Original Charge:{' '}
                  <strong>₹{settlingPayment.chargeAmount.toLocaleString('en-IN')}</strong>
                </p>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#384959] mb-1 font-heading">
                  Final Settled Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={settledAmountInput}
                  onChange={(e) => setSettledAmountInput(Number(e.target.value))}
                  className="w-full bg-white border border-[#DCE8F2] rounded-lg px-3 py-2 font-mono font-bold text-[#384959] text-sm focus:outline-none focus:border-[#88BDF2]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#DCE8F2]">
                <button
                  type="button"
                  onClick={() => setSettlingPayment(null)}
                  className="px-4 py-2 font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 rounded-lg shadow-sm shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Tag as (Settled)</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </ModalPortal>

      {/* ========================================================
          MODAL 6: 6-FIELD PRINT MEMO SLIP MODAL (Existing)
          ======================================================== */}
      <ModalPortal isOpen={Boolean(printModalRecord)} onClose={() => setPrintModalRecord(null)}>
        {printModalRecord && (
          <div className="bg-white rounded-2xl border border-[#DCE8F2] shadow-2xl w-full max-w-lg p-6 space-y-4 text-xs text-slate-800 my-auto">
            <div className="flex items-center justify-between border-b border-[#DCE8F2] pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#6A89A7]" />
                <h3 className="font-heading font-extrabold text-base text-[#384959]">
                  LR & Payment Delivery Memo
                </h3>
              </div>
              <button
                onClick={() => setPrintModalRecord(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Memo Sheet with 6 Required Fields */}
            <div
              id="printable-party-slip"
              className="p-5 bg-white border-2 border-[#384959] rounded-xl space-y-4 text-slate-800 shadow-inner"
            >
              <div className="text-center border-b-2 border-[#384959] pb-3">
                <h1 className="font-heading font-black text-lg text-[#384959] uppercase tracking-tight">
                  {companyName}
                </h1>
                <p className="text-[11px] text-slate-600 font-medium">
                  Maharashtra ⇄ Gujarat Fruit & Backhaul Commercial Transport
                </p>
                <span className="inline-block mt-1 font-mono text-[10px] font-bold bg-[#BDDDFC]/30 text-[#384959] px-3 py-0.5 rounded-full border border-[#DCE8F2]">
                  CONSIGNMENT & PAYMENT ACKNOWLEDGEMENT SLIP
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-[#F8FAFC] rounded-lg border border-[#DCE8F2]">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-[#384959] font-heading block">
                    1. Vehical No.
                  </span>
                  <span className="font-mono text-sm font-black text-[#384959] tracking-wider">
                    {printModalRecord.vehicleNumber}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-[#384959] font-heading block">
                    2. Dates
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-800">
                    Loading: {printModalRecord.tripDate || '2026-10-21'} • Due: {printModalRecord.dueDate}
                  </span>
                </div>

                <div className="space-y-0.5 col-span-2 border-t border-[#DCE8F2] pt-2">
                  <span className="text-[10px] uppercase font-bold text-[#384959] font-heading block">
                    3. Party Name
                  </span>
                  <span className="font-heading font-extrabold text-xs text-[#384959]">
                    {printModalRecord.partyName}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Route: {printModalRecord.route} • LR: {printModalRecord.lrNumber}
                  </span>
                </div>

                <div className="space-y-0.5 border-t border-[#DCE8F2] pt-2">
                  <span className="text-[10px] uppercase font-bold text-[#384959] font-heading block">
                    4. LR Submit Status
                  </span>
                  <span
                    className={`inline-block font-mono text-xs font-bold px-2 py-0.5 rounded ${
                      printModalRecord.lrSubmittedToParty
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {printModalRecord.lrSubmittedToParty ? 'SUBMITTED' : 'NOT SUBMITTED'}
                  </span>
                </div>

                <div className="space-y-0.5 border-t border-[#DCE8F2] pt-2">
                  <span className="text-[10px] uppercase font-bold text-[#384959] font-heading block">
                    5. Charge
                  </span>
                  <span className="font-mono text-sm font-black text-[#384959]">
                    ₹{printModalRecord.chargeAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="space-y-0.5 col-span-2 border-t border-[#DCE8F2] pt-2">
                  <span className="text-[10px] uppercase font-bold text-[#384959] font-heading block">
                    6. Payment Status
                  </span>
                  <span
                    className={`inline-block font-mono text-xs font-black px-2.5 py-0.5 rounded ${
                      printModalRecord.isSettled || printModalRecord.status === 'settled'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {printModalRecord.isSettled || printModalRecord.status === 'settled'
                      ? 'SETTLED (Payment Cleared)'
                      : `PENDING (Due: ₹${printModalRecord.amountDue.toLocaleString('en-IN')})`}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-200">
                <span>Authorized Signatory: __________________</span>
                <span>Party Stamp & Signature: __________________</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#DCE8F2]">
              <button
                type="button"
                onClick={() => setPrintModalRecord(null)}
                className="px-4 py-2 font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleTriggerBrowserPrint}
                className="px-4 py-2 font-bold text-white bg-[#384959] hover:bg-[#2C3A47] rounded-lg shadow-sm shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* ========================================================
          MODAL 7: CONSOLIDATED PARTY STATEMENT & PAYMENT REPORT (CUSTOM DATE RANGE & PDF / PRINT)
          ======================================================== */}
      <ModalPortal isOpen={isPartyReportModalOpen} onClose={() => setIsPartyReportModalOpen(false)}>
        <div className="bg-white rounded-2xl border border-[#DCE8F2] shadow-2xl w-full max-w-4xl p-5 sm:p-6 space-y-4 text-xs text-slate-800 max-h-[92vh] flex flex-col my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#DCE8F2] pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#BDDDFC]/30 text-[#6A89A7] flex items-center justify-center">
                  <Printer className="w-5 h-5 text-[#6A89A7]" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base text-[#384959]">
                    Party Account Statement & Settlement Report
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Filter by custom date range (3-4 months+), consignor party, and generate printable statement or save as PDF
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPartyReportModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Interactive Filters Bar (Custom Date Range & Party Selection) */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3 shrink-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* Party Selection Dropdown */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1 font-heading">
                    Select Party / Consignor
                  </label>
                  <select
                    value={reportPartyName}
                    onChange={(e) => setReportPartyName(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-[#384959] font-bold text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#88BDF2] shadow-2xs cursor-pointer"
                  >
                    <option value="all">All Registered Parties ({parties.length})</option>
                    {parties.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({p.city})
                      </option>
                    ))}
                  </select>
                </div>

                {/* From Date */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1 font-heading">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={reportFromDate}
                    onChange={(e) => setReportFromDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-[#384959] font-mono font-bold text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#88BDF2] shadow-2xs"
                  />
                </div>

                {/* To Date */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1 font-heading">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={reportToDate}
                    onChange={(e) => setReportToDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-[#384959] font-mono font-bold text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#88BDF2] shadow-2xs"
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1 font-heading">
                    Payment Status
                  </label>
                  <select
                    value={reportStatusFilter}
                    onChange={(e) => setReportStatusFilter(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 text-[#384959] font-bold text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#88BDF2] shadow-2xs cursor-pointer"
                  >
                    <option value="all">All Payment Statuses</option>
                    <option value="settled">Settled / Cleared Only</option>
                    <option value="pending">Pending Clearance Only</option>
                    <option value="overdue">Overdue Alerts Only</option>
                  </select>
                </div>
              </div>

              {/* Quick Span Presets & Load Type */}
              <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-200">
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="text-[11px] font-bold text-slate-500">Quick Ranges:</span>
                  <button
                    type="button"
                    onClick={() => setReportQuickRange(1)}
                    className="px-2 py-0.5 rounded-md bg-white hover:bg-[#F8FAFC] text-slate-700 font-bold border border-slate-200 text-[11px] cursor-pointer"
                  >
                    Last 30 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportQuickRange(3)}
                    className="px-2 py-0.5 rounded-md bg-[#BDDDFC]/30 hover:bg-[#BDDDFC]/40 text-[#384959] font-bold border border-[#DCE8F2] text-[11px] cursor-pointer"
                  >
                    Last 3 Months
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportQuickRange(4)}
                    className="px-2 py-0.5 rounded-md bg-[#384959] text-white font-bold text-[11px] shadow-2xs cursor-pointer hover:bg-[#2C3A47]"
                  >
                    Last 4 Months
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportQuickRange(6)}
                    className="px-2 py-0.5 rounded-md bg-white hover:bg-[#F8FAFC] text-slate-700 font-bold border border-slate-200 text-[11px] cursor-pointer"
                  >
                    Last 6 Months
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReportFromDate('2026-04-01');
                      setReportToDate('2026-10-31');
                    }}
                    className="px-2 py-0.5 rounded-md bg-white hover:bg-[#F8FAFC] text-slate-700 font-bold border border-slate-200 text-[11px] cursor-pointer"
                  >
                    FY 26-27 YTD
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReportFromDate('');
                      setReportToDate('');
                    }}
                    className="px-2 py-0.5 rounded-md bg-white hover:bg-slate-100 text-slate-600 font-medium border border-slate-200 text-[11px] cursor-pointer"
                  >
                    All Dates
                  </button>
                </div>

                {/* Filter by Load Type */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[11px] font-bold text-slate-500">Load:</span>
                  <select
                    value={reportTypeFilter}
                    onChange={(e) => setReportTypeFilter(e.target.value as any)}
                    className="bg-white border border-slate-300 text-[#384959] font-semibold text-xs px-2 py-0.5 rounded-md focus:outline-none focus:border-[#88BDF2] shadow-2xs cursor-pointer"
                  >
                    <option value="all">All Loads (Return + Fruit)</option>
                    <option value="return_load">Return Backhauls Only</option>
                    <option value="fruit">Fruit Customers Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Scrollable Printable Statement Sheet */}
            <div className="overflow-y-auto flex-1 p-1">
              <div
                id="printable-party-report"
                className="p-5 sm:p-6 bg-white border-2 border-[#384959] rounded-xl space-y-4 text-slate-800 shadow-inner"
              >
                {/* Official Letterhead */}
                <div className="text-center border-b-2 border-[#384959] pb-3 space-y-1">
                  <h1 className="font-heading font-black text-xl text-[#384959] uppercase tracking-tight">
                    {companyName}
                  </h1>
                  <p className="text-xs text-slate-700 font-bold">
                    Maharashtra ⇄ Gujarat Fruit & Commercial Backhaul Freight Logistics
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Corridors: Pune • Nashik • Mumbai ⇄ Surat • Ahmedabad • Vadodara • Rajkot
                  </p>
                  <div className="inline-block mt-1 font-mono text-[11px] font-extrabold bg-[#BDDDFC]/30 text-[#384959] px-3 py-0.5 rounded-full border border-[#DCE8F2] uppercase tracking-wide">
                    Consolidated Party Statement & Payment Clearance Report
                  </div>
                </div>

                {/* Scope & Party Profile Header */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#F8FAFC] rounded-xl border border-[#DCE8F2]">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#384959] font-heading block">
                      Party / Consignor
                    </span>
                    <span className="font-heading font-extrabold text-sm text-[#384959] block">
                      {reportPartyName === 'all' ? 'All Registered Transporter Parties (Consolidated)' : reportPartyName}
                    </span>
                    {reportPartyName !== 'all' && (() => {
                      const partyObj = parties.find((p) => p.name === reportPartyName);
                      if (!partyObj) return null;
                      return (
                        <div className="mt-1 text-[11px] text-slate-600 space-y-0.5">
                          <div>Contact: <span className="font-semibold text-slate-800">{partyObj.contactPerson} ({partyObj.mobile})</span></div>
                          <div>Address: <span className="font-medium text-slate-800">{partyObj.city}, {partyObj.state}</span></div>
                          <div className="font-mono text-[10px] text-slate-500">
                            {partyObj.panNumber && `PAN: ${partyObj.panNumber} `}
                            {partyObj.gstin && `• GSTIN: ${partyObj.gstin} `}
                            {partyObj.aadhaarNumber && `• Aadhaar: ${partyObj.aadhaarNumber}`}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="sm:text-right space-y-1">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#384959] font-heading block">
                        Statement Period
                      </span>
                      <span className="font-mono font-extrabold text-xs text-[#384959]">
                        {reportFromDate && reportToDate
                          ? `${reportFromDate} to ${reportToDate}`
                          : reportFromDate
                          ? `From ${reportFromDate}`
                          : reportToDate
                          ? `Up to ${reportToDate}`
                          : 'All Historical Dates'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#384959] font-heading block">
                        Date Generated
                      </span>
                      <span className="font-mono text-xs text-slate-700">
                        {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Summary KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Gross Invoiced</span>
                    <span className="text-base font-black text-[#384959] font-mono">
                      ₹{partyReportStats.totalBilled.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-500 block">{partyReportStats.totalCount} Consignments</span>
                  </div>

                  <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200">
                    <span className="text-[10px] text-emerald-800 uppercase font-bold block">Amount Settled</span>
                    <span className="text-base font-black text-emerald-700 font-mono">
                      ₹{partyReportStats.totalSettled.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold block">{partyReportStats.clearanceRate}% Cleared</span>
                  </div>

                  <div className="bg-rose-50/70 p-2.5 rounded-lg border border-rose-200">
                    <span className="text-[10px] text-rose-800 uppercase font-bold block">Balance Due</span>
                    <span className="text-base font-black text-rose-700 font-mono">
                      ₹{partyReportStats.totalDue.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-rose-700 font-semibold block">{partyReportStats.pendingCount + partyReportStats.overdueCount} Pending LRs</span>
                  </div>

                  <div className="bg-[#F8FAFC] p-2.5 rounded-lg border border-[#DCE8F2]">
                    <span className="text-[10px] text-[#384959] uppercase font-bold block">Stamped LR Handover</span>
                    <span className="text-base font-black text-[#384959] font-mono">
                      {partyReportStats.lrSubmissionRate}%
                    </span>
                    <span className="text-[10px] text-[#6A89A7] font-semibold block">{partyReportStats.lrSubmittedCount} Submitted</span>
                  </div>
                </div>

                {/* Itemized Ledger Table */}
                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[11px]">
                        <th className="py-2 px-2.5">Date</th>
                        <th className="py-2 px-2">LR No.</th>
                        <th className="py-2 px-2">Vehicle</th>
                        <th className="py-2 px-2.5">Party & Route</th>
                        <th className="py-2 px-2 text-center">Stamped LR</th>
                        <th className="py-2 px-2 text-right">Invoiced (₹)</th>
                        <th className="py-2 px-2 text-right">Settled (₹)</th>
                        <th className="py-2 px-2 text-right">Due (₹)</th>
                        <th className="py-2 px-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-[11px]">
                      {partyReportRecords.length > 0 ? (
                        partyReportRecords.map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80">
                            <td className="py-1.5 px-2.5 font-mono text-slate-700 whitespace-nowrap">
                              {p.tripDate || p.dueDate}
                            </td>
                            <td className="py-1.5 px-2 font-mono font-bold text-[#384959] whitespace-nowrap">
                              {p.lrNumber}
                            </td>
                            <td className="py-1.5 px-2 font-mono font-semibold text-slate-800 whitespace-nowrap">
                              {p.vehicleNumber}
                            </td>
                            <td className="py-1.5 px-2.5">
                              <span className="font-bold text-[#384959] block truncate max-w-[180px]">{p.partyName}</span>
                              <span className="text-[10px] text-slate-500 block truncate max-w-[180px]">{p.route}</span>
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <span
                                className={`inline-block font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  p.lrSubmittedToParty
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {p.lrSubmittedToParty ? 'Handed Over' : 'Pending LR'}
                              </span>
                            </td>
                            <td className="py-1.5 px-2 text-right font-mono font-bold text-[#384959]">
                              ₹{p.chargeAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="py-1.5 px-2 text-right font-mono text-emerald-700">
                              ₹{(p.isSettled ? (p.settledAmount ?? p.amountPaid) : p.amountPaid).toLocaleString('en-IN')}
                            </td>
                            <td className="py-1.5 px-2 text-right font-mono text-rose-700 font-bold">
                              ₹{(p.isSettled ? 0 : p.amountDue).toLocaleString('en-IN')}
                            </td>
                            <td className="py-1.5 px-2.5 text-center">
                              <span
                                className={`inline-block font-mono text-[10px] font-black px-2 py-0.5 rounded ${
                                  p.isSettled || p.status === 'settled'
                                    ? 'bg-emerald-600 text-white'
                                    : p.status === 'overdue'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {p.isSettled || p.status === 'settled' ? 'SETTLED' : p.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="py-6 text-center text-slate-400 font-medium">
                            No transactions found for the selected party and date range filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {partyReportRecords.length > 0 && (
                      <tfoot>
                        <tr className="bg-[#BDDDFC]/20 border-t-2 border-[#DCE8F2] font-bold text-[#384959] text-xs">
                          <td colSpan={5} className="py-2 px-2.5 text-right font-heading uppercase">
                            Grand Totals ({partyReportRecords.length} Consignments):
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-black">
                            ₹{partyReportStats.totalBilled.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-black text-emerald-800">
                            ₹{partyReportStats.totalSettled.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-black text-rose-800">
                            ₹{partyReportStats.totalDue.toLocaleString('en-IN')}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Verification & Signatures Block */}
                <div className="pt-4 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-300">
                  <div>
                    <span>Official Statement • {companyName}</span>
                    <span className="block text-[10px] text-slate-400">Generated for Audit & Reconciliation</span>
                  </div>
                  <div className="text-right">
                    <span>Authorized Accounts Signatory: __________________</span>
                    <span className="block text-[10px] text-slate-400 mt-1">Party Stamp & Acknowledgment: __________________</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#DCE8F2] shrink-0 flex-wrap">
              <button
                type="button"
                onClick={handleDownloadPartyReportCSV}
                className="px-3.5 py-2 font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer flex items-center gap-1.5 text-xs transition-colors"
                title="Download statement as Excel CSV file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV Statement</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPartyReportModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer text-xs"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleTriggerBrowserPrint}
                  className="px-4 py-2 font-bold text-white bg-[#384959] hover:bg-[#2C3A47] rounded-lg shadow-sm shadow-xs cursor-pointer flex items-center gap-1.5 text-xs"
                  title="Print or Save as PDF in print preview"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Report / Download PDF</span>
                </button>
              </div>
            </div>
          </div>
      </ModalPortal>

      {/* Partial Payment Recording Modal (Master Prompt Section 9) */}
      <ModalPortal isOpen={Boolean(partialPayModalRecord)} onClose={() => setPartialPayModalRecord(null)}>
        {partialPayModalRecord && (
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#DCE8F2] space-y-4 text-xs my-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE8F2]">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#6A89A7]" />
                <h3 className="font-heading font-bold text-base text-[#384959]">
                  Record Freight Installment Payment
                </h3>
              </div>
              <button
                onClick={() => setPartialPayModalRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#DCE8F2] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600">Party:</span>
                <strong className="text-[#384959]">{partialPayModalRecord.partyName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">LR Reference:</span>
                <strong className="font-mono">{partialPayModalRecord.lrNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total Billed:</span>
                <strong className="font-mono">₹{(partialPayModalRecord.settledAmount ?? partialPayModalRecord.chargeAmount).toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Previously Paid:</span>
                <strong className="font-mono text-emerald-700">₹{(partialPayModalRecord.amountPaid || 0).toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#DCE8F2]">
                <span className="text-slate-800 font-bold">Outstanding Balance:</span>
                <strong className="font-mono text-rose-700 text-sm">₹{partialPayModalRecord.amountDue.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <form onSubmit={handleConfirmPartialPay} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Payment Installment Amount (₹):
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={partialPayModalRecord.amountDue}
                  value={partialPayAmount}
                  onChange={(e) => setPartialPayAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-[#384959]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Mode:</label>
                  <select
                    value={partialPayMode}
                    onChange={(e) => setPartialPayMode(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
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
                    value={partialPayDate}
                    onChange={(e) => setPartialPayDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reference / UTR / Cheque #:</label>
                <input
                  type="text"
                  placeholder="e.g. UTR-9901428"
                  value={partialPayRef}
                  onChange={(e) => setPartialPayRef(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              {/* Payment Proof Upload (Master Prompt Section 9) */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Upload Payment Proof / Bank Slip:</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const res = await readFileAsDataURL(file);
                        setPartialPayProof(res.dataUrl);
                        setPartialPayProofName(file.name);
                      } catch (err: any) {
                        alert(err.message);
                      }
                    }
                  }}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600"
                />
                {partialPayProofName && (
                  <span className="text-[11px] text-emerald-700 font-bold block mt-1">
                    ✓ Attached: {partialPayProofName}
                  </span>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes / Remarks:</label>
                <input
                  type="text"
                  placeholder="e.g. Cleared through HDFC corporate account"
                  value={partialPayNotes}
                  onChange={(e) => setPartialPayNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPartialPayModalRecord(null)}
                  className="px-3.5 py-2 font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#384959] hover:bg-[#384959] text-white font-bold rounded-lg shadow-xs transition-all cursor-pointer"
                >
                  Save Payment & Update Due
                </button>
              </div>
            </form>
          </div>
        )}
      </ModalPortal>
    </div>
  );
};
