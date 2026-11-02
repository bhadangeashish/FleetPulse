import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck2,
  Printer,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Truck,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  RefreshCw,
  Download,
  X,
  ShieldAlert,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { useTMS } from '../context/TMSContext';
import { PartyPaymentRecord } from '../types/tms';

type TimeHorizon = 'monthly' | 'custom' | 'half_year' | 'yearly';
type HalfYearType = 'H1' | 'H2';

export const ReturnLoadAnalyticsView: React.FC = () => {
  const {
    partyPayments,
    companyName,
    toggleLRSubmitted,
    settleReturnLoadPayment,
  } = useTMS();

  // Primary Time Horizon
  const [horizon, setHorizon] = useState<TimeHorizon>('monthly');

  // Specific Period Selectors
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(10); // 1-12 (10 = October)
  const [selectedHalfYear, setSelectedHalfYear] = useState<HalfYearType>('H2'); // H1 (Apr-Sep) or H2 (Oct-Mar)
  const [halfYearStandard, setHalfYearStandard] = useState<'financial' | 'calendar'>('financial'); // FY vs CY

  // Custom Date Range State (Supports 3-4 months, 6 months, or any arbitrary custom span)
  const [customStartDate, setCustomStartDate] = useState<string>('2026-07-01'); // 4 months (July - Oct)
  const [customEndDate, setCustomEndDate] = useState<string>('2026-10-31');

  // Quick Preset Helper for Custom Multi-Month Spans
  const applyCustomSpanPreset = (monthsBack: number) => {
    const end = new Date(2026, 9, 31); // 31 Oct 2026
    const start = new Date(2026, 10 - monthsBack, 1);
    const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
    const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
    setCustomStartDate(startStr);
    setCustomEndDate(endStr);
  };

  // Calculate approximate months span
  const customSpanMonths = useMemo(() => {
    if (!customStartDate || !customEndDate) return 0;
    const s = new Date(customStartDate);
    const e = new Date(customEndDate);
    const diff = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1;
    return Math.max(1, diff);
  }, [customStartDate, customEndDate]);

  // Ledger Filter & Search
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState<'all' | 'settled' | 'pending' | 'overdue' | 'lr_pending'>('all');

  // Quick Settle Modal State
  const [settlingRecord, setSettlingRecord] = useState<PartyPaymentRecord | null>(null);
  const [settleAmountInput, setSettleAmountInput] = useState<number>(0);
  const [settleNotesInput, setSettleNotesInput] = useState('');

  // Print Statement Modal State
  const [printModalRecord, setPrintModalRecord] = useState<PartyPaymentRecord | null>(null);
  const [isPrintSummaryOpen, setIsPrintSummaryOpen] = useState(false);
  const [isPrintLedgerOpen, setIsPrintLedgerOpen] = useState(false);

  // All Return Load Payments only (excluding pure fruit buyers)
  const allReturnLoadPayments = useMemo(() => {
    return partyPayments.filter((p) => p.type === 'return_load_party');
  }, [partyPayments]);

  // Available Years
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    allReturnLoadPayments.forEach((p) => {
      if (p.tripDate) {
        years.add(new Date(p.tripDate).getFullYear());
      }
    });
    // Ensure 2026 and 2025 are available
    years.add(2026);
    years.add(2025);
    return Array.from(years).sort((a, b) => b - a);
  }, [allReturnLoadPayments]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper: Filter records based on active horizon
  const periodFilteredPayments = useMemo(() => {
    return allReturnLoadPayments.filter((p) => {
      if (!p.tripDate) return false;
      const d = new Date(p.tripDate);
      const yr = d.getFullYear();
      const mo = d.getMonth() + 1; // 1-12

      if (horizon === 'yearly') {
        return yr === selectedYear;
      }

      if (horizon === 'monthly') {
        return yr === selectedYear && mo === selectedMonth;
      }

      if (horizon === 'custom') {
        const start = customStartDate || '1970-01-01';
        const end = customEndDate || '2099-12-31';
        return p.tripDate >= start && p.tripDate <= end;
      }

      if (horizon === 'half_year') {
        if (halfYearStandard === 'financial') {
          // Indian Financial Year:
          // H1: April - September of selectedYear
          // H2: October (selectedYear) - March (selectedYear + 1)
          if (selectedHalfYear === 'H1') {
            return yr === selectedYear && mo >= 4 && mo <= 9;
          } else {
            // H2
            if (yr === selectedYear && mo >= 10 && mo <= 12) return true;
            if (yr === selectedYear + 1 && mo >= 1 && mo <= 3) return true;
            return false;
          }
        } else {
          // Calendar Year:
          // H1: January - June
          // H2: July - December
          if (selectedHalfYear === 'H1') {
            return yr === selectedYear && mo >= 1 && mo <= 6;
          } else {
            return yr === selectedYear && mo >= 7 && mo <= 12;
          }
        }
      }

      return true;
    });
  }, [allReturnLoadPayments, horizon, selectedYear, selectedMonth, selectedHalfYear, halfYearStandard, customStartDate, customEndDate]);

  // Executive KPI Aggregations for Active Period
  const stats = useMemo(() => {
    const totalCount = periodFilteredPayments.length;
    const totalBilled = periodFilteredPayments.reduce((acc, p) => acc + p.chargeAmount, 0);
    const totalSettled = periodFilteredPayments.reduce((acc, p) => acc + (p.isSettled ? (p.settledAmount ?? p.amountPaid) : p.amountPaid), 0);
    const totalDue = periodFilteredPayments.reduce((acc, p) => acc + (p.isSettled ? 0 : p.amountDue), 0);

    const settledRecords = periodFilteredPayments.filter((p) => p.isSettled || p.status === 'settled');
    const pendingRecords = periodFilteredPayments.filter((p) => !p.isSettled && p.status === 'pending');
    const overdueRecords = periodFilteredPayments.filter((p) => !p.isSettled && p.status === 'overdue');

    const lrSubmittedCount = periodFilteredPayments.filter((p) => p.lrSubmittedToParty).length;
    const lrPendingCount = totalCount - lrSubmittedCount;

    const clearanceRate = totalBilled > 0 ? Math.round((totalSettled / totalBilled) * 100) : 0;
    const lrSubmissionRate = totalCount > 0 ? Math.round((lrSubmittedCount / totalCount) * 100) : 0;

    // Approximate average turnaround days for settled payments
    const settledWithDates = settledRecords.filter((p) => p.tripDate && p.lrSubmittedDate);
    const avgTurnaroundDays = settledWithDates.length > 0
      ? (settledWithDates.reduce((acc, p) => {
          const trip = new Date(p.tripDate!).getTime();
          const lr = new Date(p.lrSubmittedDate!).getTime();
          const diffDays = Math.max(1, Math.round((lr - trip) / (1000 * 60 * 60 * 24)));
          return acc + diffDays;
        }, 0) / settledWithDates.length).toFixed(1)
      : '3.2';

    return {
      totalCount,
      totalBilled,
      totalSettled,
      totalDue,
      settledCount: settledRecords.length,
      pendingCount: pendingRecords.length,
      overdueCount: overdueRecords.length,
      overdueAmount: overdueRecords.reduce((acc, p) => acc + p.amountDue, 0),
      pendingAmount: pendingRecords.reduce((acc, p) => acc + p.amountDue, 0),
      lrSubmittedCount,
      lrPendingCount,
      clearanceRate,
      lrSubmissionRate,
      avgTurnaroundDays,
    };
  }, [periodFilteredPayments]);

  // Breakdown for Bar / Trend Charts based on the active horizon
  const chartBreakdown = useMemo(() => {
    if (horizon === 'monthly') {
      // Show all 12 months of selectedYear to give high-context monthly trends, with current month highlighted!
      return Array.from({ length: 12 }, (_, i) => {
        const moNum = i + 1;
        const moRecords = allReturnLoadPayments.filter((p) => {
          if (!p.tripDate) return false;
          const d = new Date(p.tripDate);
          return d.getFullYear() === selectedYear && d.getMonth() + 1 === moNum;
        });

        const billed = moRecords.reduce((acc, p) => acc + p.chargeAmount, 0);
        const settled = moRecords.reduce((acc, p) => acc + (p.isSettled ? (p.settledAmount ?? p.amountPaid) : p.amountPaid), 0);
        const due = moRecords.reduce((acc, p) => acc + (p.isSettled ? 0 : p.amountDue), 0);
        const count = moRecords.length;

        return {
          label: monthNames[i].substring(0, 3),
          fullLabel: `${monthNames[i]} ${selectedYear}`,
          monthNum: moNum,
          billed,
          settled,
          due,
          count,
          isSelected: moNum === selectedMonth,
          clearanceRate: billed > 0 ? Math.round((settled / billed) * 100) : 0,
        };
      });
    }

    if (horizon === 'half_year') {
      // 6 months of the selected Half-Year
      let monthIndices: { num: number; yr: number }[] = [];
      if (halfYearStandard === 'financial') {
        if (selectedHalfYear === 'H1') {
          monthIndices = [
            { num: 4, yr: selectedYear },
            { num: 5, yr: selectedYear },
            { num: 6, yr: selectedYear },
            { num: 7, yr: selectedYear },
            { num: 8, yr: selectedYear },
            { num: 9, yr: selectedYear },
          ];
        } else {
          monthIndices = [
            { num: 10, yr: selectedYear },
            { num: 11, yr: selectedYear },
            { num: 12, yr: selectedYear },
            { num: 1, yr: selectedYear + 1 },
            { num: 2, yr: selectedYear + 1 },
            { num: 3, yr: selectedYear + 1 },
          ];
        }
      } else {
        if (selectedHalfYear === 'H1') {
          monthIndices = [1, 2, 3, 4, 5, 6].map((m) => ({ num: m, yr: selectedYear }));
        } else {
          monthIndices = [7, 8, 9, 10, 11, 12].map((m) => ({ num: m, yr: selectedYear }));
        }
      }

      return monthIndices.map(({ num, yr }) => {
        const moRecords = allReturnLoadPayments.filter((p) => {
          if (!p.tripDate) return false;
          const d = new Date(p.tripDate);
          return d.getFullYear() === yr && d.getMonth() + 1 === num;
        });

        const billed = moRecords.reduce((acc, p) => acc + p.chargeAmount, 0);
        const settled = moRecords.reduce((acc, p) => acc + (p.isSettled ? (p.settledAmount ?? p.amountPaid) : p.amountPaid), 0);
        const due = moRecords.reduce((acc, p) => acc + (p.isSettled ? 0 : p.amountDue), 0);

        return {
          label: `${monthNames[num - 1].substring(0, 3)} '${String(yr).slice(-2)}`,
          fullLabel: `${monthNames[num - 1]} ${yr}`,
          monthNum: num,
          billed,
          settled,
          due,
          count: moRecords.length,
          isSelected: false,
          clearanceRate: billed > 0 ? Math.round((settled / billed) * 100) : 0,
        };
      });
    }

    if (horizon === 'custom') {
      // Dynamic monthly buckets spanning from customStartDate to customEndDate
      const s = new Date(customStartDate || '2026-07-01');
      const e = new Date(customEndDate || '2026-10-31');
      const monthIndices: { num: number; yr: number }[] = [];

      const curr = new Date(s.getFullYear(), s.getMonth(), 1);
      const last = new Date(e.getFullYear(), e.getMonth(), 1);

      let safety = 0;
      while (curr <= last && safety < 48) {
        monthIndices.push({ num: curr.getMonth() + 1, yr: curr.getFullYear() });
        curr.setMonth(curr.getMonth() + 1);
        safety++;
      }

      if (monthIndices.length === 0) {
        monthIndices.push({ num: s.getMonth() + 1, yr: s.getFullYear() });
      }

      return monthIndices.map(({ num, yr }) => {
        const moRecords = allReturnLoadPayments.filter((p) => {
          if (!p.tripDate) return false;
          const d = new Date(p.tripDate);
          return d.getFullYear() === yr && d.getMonth() + 1 === num;
        });

        const billed = moRecords.reduce((acc, p) => acc + p.chargeAmount, 0);
        const settled = moRecords.reduce((acc, p) => acc + (p.isSettled ? (p.settledAmount ?? p.amountPaid) : p.amountPaid), 0);
        const due = moRecords.reduce((acc, p) => acc + (p.isSettled ? 0 : p.amountDue), 0);

        return {
          label: `${monthNames[num - 1].substring(0, 3)} '${String(yr).slice(-2)}`,
          fullLabel: `${monthNames[num - 1]} ${yr}`,
          monthNum: num,
          billed,
          settled,
          due,
          count: moRecords.length,
          isSelected: false,
          clearanceRate: billed > 0 ? Math.round((settled / billed) * 100) : 0,
        };
      });
    }

    // Yearly: 4 Quarters + Multi-Year YoY
    const quarters = [
      { name: 'Q1 (Jan-Mar)', months: [1, 2, 3] },
      { name: 'Q2 (Apr-Jun)', months: [4, 5, 6] },
      { name: 'Q3 (Jul-Sep)', months: [7, 8, 9] },
      { name: 'Q4 (Oct-Dec)', months: [10, 11, 12] },
    ];

    return quarters.map((q) => {
      const qRecords = allReturnLoadPayments.filter((p) => {
        if (!p.tripDate) return false;
        const d = new Date(p.tripDate);
        return d.getFullYear() === selectedYear && q.months.includes(d.getMonth() + 1);
      });

      const billed = qRecords.reduce((acc, p) => acc + p.chargeAmount, 0);
      const settled = qRecords.reduce((acc, p) => acc + (p.isSettled ? (p.settledAmount ?? p.amountPaid) : p.amountPaid), 0);
      const due = qRecords.reduce((acc, p) => acc + (p.isSettled ? 0 : p.amountDue), 0);

      return {
        label: q.name.split(' ')[0],
        fullLabel: `${q.name} ${selectedYear}`,
        monthNum: q.months[0],
        billed,
        settled,
        due,
        count: qRecords.length,
        isSelected: false,
        clearanceRate: billed > 0 ? Math.round((settled / billed) * 100) : 0,
      };
    });
  }, [allReturnLoadPayments, horizon, selectedYear, selectedMonth, selectedHalfYear, halfYearStandard, customStartDate, customEndDate]);

  // Max value in chart for scale
  const maxChartBilled = useMemo(() => {
    const maxVal = Math.max(...chartBreakdown.map((item) => Math.max(item.billed, item.settled)), 10000);
    return Math.ceil(maxVal / 5000) * 5000;
  }, [chartBreakdown]);

  // Party / Consignor Performance Matrix
  const partyPerformance = useMemo(() => {
    const partyMap = new Map<string, {
      partyName: string;
      tripsCount: number;
      billed: number;
      settled: number;
      due: number;
      routes: Set<string>;
      settledCount: number;
      pendingCount: number;
      overdueCount: number;
      lrPendingCount: number;
    }>();

    periodFilteredPayments.forEach((p) => {
      const key = p.partyName;
      const current = partyMap.get(key) || {
        partyName: key,
        tripsCount: 0,
        billed: 0,
        settled: 0,
        due: 0,
        routes: new Set<string>(),
        settledCount: 0,
        pendingCount: 0,
        overdueCount: 0,
        lrPendingCount: 0,
      };

      current.tripsCount += 1;
      current.billed += p.chargeAmount;
      current.settled += (p.isSettled ? (p.settledAmount ?? p.amountPaid) : p.amountPaid);
      current.due += (p.isSettled ? 0 : p.amountDue);
      if (p.route) current.routes.add(p.route);

      if (p.isSettled || p.status === 'settled') {
        current.settledCount += 1;
      } else if (p.status === 'overdue') {
        current.overdueCount += 1;
      } else {
        current.pendingCount += 1;
      }

      if (!p.lrSubmittedToParty) {
        current.lrPendingCount += 1;
      }

      partyMap.set(key, current);
    });

    return Array.from(partyMap.values()).map((p) => {
      const clearanceRate = p.billed > 0 ? Math.round((p.settled / p.billed) * 100) : 0;
      let tier: 'Prompt' | 'Steady' | 'Follow-up Needed' = 'Prompt';
      if (p.overdueCount > 0 || clearanceRate < 60) {
        tier = 'Follow-up Needed';
      } else if (clearanceRate < 90) {
        tier = 'Steady';
      }

      return {
        ...p,
        routesList: Array.from(p.routes).join(', '),
        clearanceRate,
        tier,
      };
    }).sort((a, b) => b.billed - a.billed);
  }, [periodFilteredPayments]);

  // Filtered Ledger for the period
  const filteredLedger = useMemo(() => {
    return periodFilteredPayments.filter((p) => {
      const matchesSearch =
        p.partyName.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
        p.vehicleNumber.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
        p.lrNumber.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
        p.route.toLowerCase().includes(ledgerSearch.toLowerCase());

      if (!matchesSearch) return false;

      if (ledgerStatusFilter === 'settled') return p.isSettled || p.status === 'settled';
      if (ledgerStatusFilter === 'pending') return !p.isSettled && p.status === 'pending';
      if (ledgerStatusFilter === 'overdue') return !p.isSettled && p.status === 'overdue';
      if (ledgerStatusFilter === 'lr_pending') return !p.lrSubmittedToParty;

      return true;
    });
  }, [periodFilteredPayments, ledgerSearch, ledgerStatusFilter]);

  // Aggregated KPIs specifically for the currently filtered ledger view
  const ledgerStats = useMemo(() => {
    const totalBilled = filteredLedger.reduce((acc, p) => acc + p.chargeAmount, 0);
    const totalSettled = filteredLedger.reduce((acc, p) => acc + (p.isSettled ? (p.settledAmount ?? p.amountPaid) : p.amountPaid), 0);
    const totalDue = filteredLedger.reduce((acc, p) => acc + (p.isSettled ? 0 : p.amountDue), 0);
    const lrSubmittedCount = filteredLedger.filter((p) => p.lrSubmittedToParty).length;
    const clearanceRate = totalBilled > 0 ? Math.round((totalSettled / totalBilled) * 100) : 0;
    return {
      totalBilled,
      totalSettled,
      totalDue,
      lrSubmittedCount,
      clearanceRate,
    };
  }, [filteredLedger]);

  // Export Filtered Ledger Table to CSV
  const handleExportLedgerCSV = () => {
    const headers = [
      'Trip Date',
      'Vehicle Number',
      'Route',
      'Party Name',
      'Trip Ref ID',
      'LR Number',
      'LR Submitted',
      'LR Submitted Date',
      'Due Date',
      'Freight Charge (INR)',
      'Settled Amount (INR)',
      'Due Balance (INR)',
      'Status',
    ];

    const rows = filteredLedger.map((p) => [
      `"${p.tripDate || ''}"`,
      `"${p.vehicleNumber}"`,
      `"${p.route}"`,
      `"${p.partyName.replace(/"/g, '""')}"`,
      `"${p.tripReferenceId}"`,
      `"${p.lrNumber}"`,
      p.lrSubmittedToParty ? 'YES' : 'NO',
      `"${p.lrSubmittedDate || ''}"`,
      `"${p.dueDate || ''}"`,
      p.chargeAmount,
      p.isSettled ? (p.settledAmount ?? p.amountPaid) : p.amountPaid,
      p.isSettled ? 0 : p.amountDue,
      `"${p.isSettled ? 'SETTLED' : p.status.toUpperCase()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filenameSuffix = horizon === 'custom' ? `${customStartDate}_to_${customEndDate}` : activePeriodLabel.replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute('download', `Return_Load_Ledger_${filenameSuffix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Quick Settle Handler
  const handleOpenSettle = (record: PartyPaymentRecord) => {
    setSettlingRecord(record);
    setSettleAmountInput(record.amountDue > 0 ? record.amountDue : record.chargeAmount);
    setSettleNotesInput(`Return load payment cleared for ${record.partyName}`);
  };

  const handleConfirmSettle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingRecord) return;
    settleReturnLoadPayment(settlingRecord.id, settleAmountInput, settleNotesInput);
    setSettlingRecord(null);
  };

  // Human Readable Active Period Label
  const activePeriodLabel = useMemo(() => {
    if (horizon === 'monthly') {
      return `${monthNames[selectedMonth - 1]} ${selectedYear}`;
    }
    if (horizon === 'custom') {
      const sDate = new Date(customStartDate);
      const eDate = new Date(customEndDate);
      const sFormatted = isNaN(sDate.getTime()) ? customStartDate : sDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const eFormatted = isNaN(eDate.getTime()) ? customEndDate : eDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      return `Custom Range: ${sFormatted} to ${eFormatted} (${customSpanMonths} Months Span)`;
    }
    if (horizon === 'half_year') {
      if (halfYearStandard === 'financial') {
        return selectedHalfYear === 'H1'
          ? `FY ${selectedYear}-${String(selectedYear + 1).slice(-2)} H1 (Apr - Sep ${selectedYear})`
          : `FY ${selectedYear}-${String(selectedYear + 1).slice(-2)} H2 (Oct ${selectedYear} - Mar ${selectedYear + 1})`;
      } else {
        return selectedHalfYear === 'H1'
          ? `Calendar Year ${selectedYear} H1 (Jan - Jun ${selectedYear})`
          : `Calendar Year ${selectedYear} H2 (Jul - Dec ${selectedYear})`;
      }
    }
    return `Full Year ${selectedYear}`;
  }, [horizon, selectedMonth, selectedYear, selectedHalfYear, halfYearStandard, customStartDate, customEndDate, customSpanMonths]);

  return (
    <div className="space-y-6">
      {/* ========================================================
          TOP HEADER & TIMEFRAME SELECTOR BAR
          ======================================================== */}
      <div className="bg-white rounded-2xl border border-sky-100 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                <Truck className="w-3 h-3 text-sky-600" />
                Gujarat ⇄ Maharashtra Commercial Backhauls
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {companyName}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mt-1">
              Return Load Payments Status Analytics
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive freight billing, stamped LR physical submission tracking, and cash collection recovery.
            </p>
          </div>

          {/* Quick Print & Export Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsPrintLedgerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-sky-700 text-white hover:bg-sky-800 shadow-xs transition-colors cursor-pointer"
              title={horizon === 'monthly' ? `Print Full Month Ledger (${activePeriodLabel})` : `Print Full Custom Range Ledger (${activePeriodLabel})`}
            >
              <Printer className="w-3.5 h-3.5 text-sky-200" />
              <span>{horizon === 'monthly' ? 'Print Month Ledger' : 'Print Range Ledger'}</span>
            </button>
            <button
              onClick={() => setIsPrintSummaryOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
              title="Print return load analytics summary report"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-slate-600" />
              <span>Executive Summary</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            PRIMARY TIME HORIZON SWITCHER: MONTHLY / CUSTOM RANGE / HALF-YEAR / YEARLY
            ======================================================== */}
        <div className="mt-5 pt-4 border-t border-sky-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Segmented Horizon Control */}
          <div className="inline-flex p-1 bg-slate-100/90 rounded-xl border border-slate-200 text-xs font-bold flex-wrap gap-1">
            <button
              onClick={() => setHorizon('monthly')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                horizon === 'monthly'
                  ? 'bg-sky-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Monthly</span>
            </button>

            <button
              onClick={() => setHorizon('custom')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                horizon === 'custom'
                  ? 'bg-sky-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Custom Range</span>
            </button>

            <button
              onClick={() => setHorizon('half_year')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                horizon === 'half_year'
                  ? 'bg-sky-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Half-Year (H1 / H2)</span>
            </button>

            <button
              onClick={() => setHorizon('yearly')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                horizon === 'yearly'
                  ? 'bg-sky-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Yearly</span>
            </button>
          </div>

          {/* Sub-period controls - Completely disappear when Custom Range is selected */}
          {horizon !== 'custom' && (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Year selector (for Monthly, Half-Year, Yearly) */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium">Year:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  aria-label="Filter analytics by year"
                  className="bg-white border border-slate-200 text-slate-800 text-xs font-bold px-2.5 py-1.5 rounded-lg focus:outline-sky-500 cursor-pointer shadow-2xs"
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              {/* In Monthly Mode: Month selector & quick prev/next */}
              {horizon === 'monthly' && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedMonth((m) => (m === 1 ? 12 : m - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    aria-label="Filter analytics by month"
                    className="bg-white border border-slate-200 text-slate-800 text-xs font-bold px-2.5 py-1.5 rounded-lg focus:outline-sky-500 cursor-pointer shadow-2xs"
                  >
                    {monthNames.map((name, idx) => (
                      <option key={name} value={idx + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setSelectedMonth((m) => (m === 12 ? 1 : m + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer"
                    title="Next Month"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* In Half-Year Mode: H1 vs H2 toggle */}
              {horizon === 'half_year' && (
                <div className="flex items-center gap-1.5">
                  <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-bold">
                    <button
                      onClick={() => setSelectedHalfYear('H1')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        selectedHalfYear === 'H1'
                          ? 'bg-sky-700 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      H1 {halfYearStandard === 'financial' ? '(Apr-Sep)' : '(Jan-Jun)'}
                    </button>
                    <button
                      onClick={() => setSelectedHalfYear('H2')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        selectedHalfYear === 'H2'
                          ? 'bg-sky-700 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      H2 {halfYearStandard === 'financial' ? '(Oct-Mar)' : '(Jul-Dec)'}
                    </button>
                  </div>

                  <button
                    onClick={() => setHalfYearStandard((s) => (s === 'financial' ? 'calendar' : 'financial'))}
                    className="text-[11px] font-semibold text-sky-700 hover:text-sky-800 bg-sky-50 px-2 py-1 rounded-md border border-sky-200 cursor-pointer"
                    title="Toggle between Fiscal Year and Calendar Year definitions"
                  >
                    {halfYearStandard === 'financial' ? 'Fiscal (FY)' : 'Calendar (CY)'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* In Custom Range Mode: Dedicated From/To Date Picker & Multi-Month Presets (other controls disappear!) */}
        {horizon === 'custom' && (
          <div className="mt-4 pt-3 border-t border-sky-100 bg-sky-50/80 p-3.5 rounded-xl border border-sky-200">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Date Inputs */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-bold text-slate-700">From Date:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-white border border-slate-300 text-slate-900 font-mono font-bold text-xs px-2.5 py-1.5 rounded-lg focus:outline-sky-500 shadow-2xs"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-bold text-slate-700">To Date:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-white border border-slate-300 text-slate-900 font-mono font-bold text-xs px-2.5 py-1.5 rounded-lg focus:outline-sky-500 shadow-2xs"
                  />
                </div>

                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-900 border border-sky-200 font-mono">
                  {customSpanMonths} Months Span • {stats.totalCount} Loads
                </span>
              </div>

              {/* Quick Span Presets: 3 Months, 4 Months, 6 Months, FYTD */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="text-[11px] text-slate-500 font-medium">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => applyCustomSpanPreset(3)}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-900 font-bold border border-slate-200 shadow-2xs cursor-pointer text-[11px] transition-colors"
                  title="Last 3 Months (Aug - Oct 2026)"
                >
                  3 Months
                </button>
                <button
                  type="button"
                  onClick={() => applyCustomSpanPreset(4)}
                  className="px-2.5 py-1 rounded-lg bg-sky-700 text-white font-bold shadow-2xs cursor-pointer text-[11px] hover:bg-sky-800 transition-colors"
                  title="Last 4 Months (Jul - Oct 2026)"
                >
                  4 Months
                </button>
                <button
                  type="button"
                  onClick={() => applyCustomSpanPreset(6)}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-900 font-bold border border-slate-200 shadow-2xs cursor-pointer text-[11px] transition-colors"
                  title="Last 6 Months (May - Oct 2026)"
                >
                  6 Months
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomStartDate('2026-04-01');
                    setCustomEndDate('2026-10-31');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-900 font-bold border border-slate-200 shadow-2xs cursor-pointer text-[11px] transition-colors"
                  title="Fiscal Year 2026-27 to Date (Apr - Oct 2026)"
                >
                  FY 26-27 YTD
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomStartDate('2026-01-01');
                    setCustomEndDate('2026-12-31');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-900 font-bold border border-slate-200 shadow-2xs cursor-pointer text-[11px] transition-colors"
                  title="Entire Year 2026"
                >
                  Full Year 2026
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Current Active Period Banner */}
        <div className="mt-3.5 bg-sky-50/70 border border-sky-100 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sky-900">Current Scope:</span>
            <span className="font-bold text-sky-700">{activePeriodLabel}</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600 font-medium">
              {stats.totalCount} Commercial Backhaul Trips Recorded
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {stats.clearanceRate}% Settled
            </span>
            <span className="text-sky-700 font-bold bg-sky-100/60 px-2 py-0.5 rounded-md border border-sky-200">
              {stats.lrSubmissionRate}% LR Handed Over
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
          KPI CARDS GRID
          ======================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Billed */}
        <div className="bg-white p-3.5 rounded-xl border border-sky-100 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Total Billed</span>
            <CreditCard className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-lg md:text-xl font-black text-slate-900 mt-1 font-mono">
            ₹{stats.totalBilled.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
            {stats.totalCount} Return Loads
          </div>
        </div>

        {/* Cleared / Settled */}
        <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200/70 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs">
            <span className="font-bold">Settled (Cleared)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg md:text-xl font-black text-emerald-700 mt-1 font-mono">
            ₹{stats.totalSettled.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5 font-semibold">
            {stats.settledCount} cleared ({stats.clearanceRate}%)
          </div>
        </div>

        {/* Pending Clearance */}
        <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200/70 shadow-2xs">
          <div className="flex items-center justify-between text-amber-800 text-xs">
            <span className="font-bold">Pending Clearance</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg md:text-xl font-black text-amber-700 mt-1 font-mono">
            ₹{stats.pendingAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-amber-600 mt-0.5 font-medium">
            {stats.pendingCount} in grace period
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-rose-50/50 p-3.5 rounded-xl border border-rose-200/70 shadow-2xs">
          <div className="flex items-center justify-between text-rose-800 text-xs">
            <span className="font-bold">Overdue Payments</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-lg md:text-xl font-black text-rose-700 mt-1 font-mono">
            ₹{stats.overdueAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-rose-600 mt-0.5 font-medium">
            {stats.overdueCount} loads past due date
          </div>
        </div>

        {/* Stamped LR Submission */}
        <div className="bg-sky-50/60 p-3.5 rounded-xl border border-sky-200/70 shadow-2xs">
          <div className="flex items-center justify-between text-sky-800 text-xs">
            <span className="font-bold">LR Handover Status</span>
            <FileCheck2 className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-lg md:text-xl font-black text-sky-900 mt-1 font-mono">
            {stats.lrSubmittedCount} / {stats.totalCount}
          </div>
          <div className="text-[11px] text-sky-700 mt-0.5 font-medium">
            {stats.lrPendingCount > 0 ? `${stats.lrPendingCount} LR pending delivery` : 'All LRs Submitted'}
          </div>
        </div>

        {/* Turnaround Days */}
        <div className="bg-white p-3.5 rounded-xl border border-sky-100 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Avg Settlement Speed</span>
            <TrendingUp className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-lg md:text-xl font-black text-slate-900 mt-1 font-mono">
            {stats.avgTurnaroundDays} <span className="text-xs font-sans font-bold text-slate-500">Days</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
            From loading to settlement
          </div>
        </div>
      </div>

      {/* ========================================================
          VISUAL CHARTS SECTION (Pure SVG & Tailwind)
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Bar Chart: Billed vs Settled Breakdown */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-sky-100 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">
                {horizon === 'monthly' && `Monthly Progression (${selectedYear})`}
                {horizon === 'half_year' && `Half-Year Breakdown (${selectedHalfYear} ${selectedYear})`}
                {horizon === 'yearly' && `Quarterly Performance (${selectedYear})`}
              </h2>
              <p className="text-xs text-slate-500">
                Freight Billed vs Amount Cleared across the timeline
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-sky-600 inline-block" />
                <span className="text-slate-600">Billed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" />
                <span className="text-slate-600">Settled</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-amber-400 inline-block" />
                <span className="text-slate-600">Pending</span>
              </div>
            </div>
          </div>

          {/* SVG Grouped Bar Chart */}
          <div className="mt-5">
            <div className="h-64 flex items-end gap-2 sm:gap-4 px-2 pt-6 pb-2 border-b border-slate-200">
              {chartBreakdown.map((bar, idx) => {
                const billedHeight = maxChartBilled > 0 ? (bar.billed / maxChartBilled) * 100 : 0;
                const settledHeight = maxChartBilled > 0 ? (bar.settled / maxChartBilled) * 100 : 0;
                const dueHeight = maxChartBilled > 0 ? (bar.due / maxChartBilled) * 100 : 0;

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                    onClick={() => {
                      if (horizon === 'monthly') {
                        setSelectedMonth(bar.monthNum);
                      }
                    }}
                  >
                    {/* Tooltip on Hover */}
                    <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-14 bg-slate-900 text-white text-[11px] py-1.5 px-2.5 rounded-lg shadow-lg z-20 whitespace-nowrap transition-opacity">
                      <div className="font-bold">{bar.fullLabel}</div>
                      <div>Billed: ₹{bar.billed.toLocaleString('en-IN')}</div>
                      <div>Settled: ₹{bar.settled.toLocaleString('en-IN')} ({bar.clearanceRate}%)</div>
                    </div>

                    {/* Bars Container */}
                    <div className="w-full flex items-end justify-center gap-1 max-w-[48px] h-full">
                      {/* Billed Bar */}
                      <div
                        style={{ height: `${Math.max(billedHeight, 4)}%` }}
                        className={`w-1/2 rounded-t-xs transition-all ${
                          bar.isSelected
                            ? 'bg-sky-700 ring-2 ring-sky-300'
                            : 'bg-sky-500/80 group-hover:bg-sky-600'
                        }`}
                        title={`Billed: ₹${bar.billed.toLocaleString('en-IN')}`}
                      />
                      {/* Settled Bar */}
                      <div
                        style={{ height: `${Math.max(settledHeight, bar.settled > 0 ? 4 : 0)}%` }}
                        className="w-1/2 rounded-t-xs bg-emerald-500/90 group-hover:bg-emerald-600 transition-all"
                        title={`Settled: ₹${bar.settled.toLocaleString('en-IN')}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-Axis Labels */}
            <div className="flex items-center justify-between gap-2 sm:gap-4 px-2 pt-2 text-[11px] font-bold text-slate-500">
              {chartBreakdown.map((bar, idx) => (
                <div
                  key={idx}
                  className={`flex-1 text-center transition-colors ${
                    bar.isSelected ? 'text-sky-900 font-extrabold underline decoration-sky-500 underline-offset-4' : ''
                  }`}
                >
                  <span>{bar.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Bar Summary Footer */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Peak Month Capacity: ₹{maxChartBilled.toLocaleString('en-IN')}</span>
            <span className="font-medium text-sky-800">
              {horizon === 'monthly' ? 'Click on any month to inspect details' : 'Active period comparative chart'}
            </span>
          </div>
        </div>

        {/* Right Panel: Payment Status Distribution & Pipeline */}
        <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">
              Payment Status Distribution
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of total {stats.totalCount} backhaul loads in {activePeriodLabel}
            </p>

            {/* Visual Distribution Stacked Bar */}
            <div className="mt-4 h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              {stats.totalBilled > 0 ? (
                <>
                  <div
                    style={{ width: `${(stats.totalSettled / stats.totalBilled) * 100}%` }}
                    className="bg-emerald-500 transition-all"
                    title={`Settled: ${stats.clearanceRate}%`}
                  />
                  <div
                    style={{ width: `${(stats.pendingAmount / stats.totalBilled) * 100}%` }}
                    className="bg-amber-400 transition-all"
                    title={`Pending: ₹${stats.pendingAmount}`}
                  />
                  <div
                    style={{ width: `${(stats.overdueAmount / stats.totalBilled) * 100}%` }}
                    className="bg-rose-500 transition-all"
                    title={`Overdue: ₹${stats.overdueAmount}`}
                  />
                </>
              ) : (
                <div className="w-full bg-slate-200" />
              )}
            </div>

            {/* Legend with Amounts & Count */}
            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-bold text-emerald-950">Settled / Cleared</span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-emerald-800 font-mono">
                    ₹{stats.totalSettled.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-emerald-600 block">
                    {stats.settledCount} loads ({stats.clearanceRate}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60 border border-amber-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="font-bold text-amber-950">Pending Due</span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-amber-800 font-mono">
                    ₹{stats.pendingAmount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-amber-600 block">
                    {stats.pendingCount} loads
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/60 border border-rose-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="font-bold text-rose-950">Overdue Alert</span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-rose-800 font-mono">
                    ₹{stats.overdueAmount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-rose-600 block">
                    {stats.overdueCount} loads past due
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stamped LR Milestone Pipeline */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-extrabold text-slate-800 flex items-center justify-between">
              <span>LR Clearance Pipeline</span>
              <span className="text-[11px] text-sky-700 font-bold">{stats.lrSubmissionRate}% Converted</span>
            </h3>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Stamped LR Handed to Party</span>
                </span>
                <span className="font-bold text-slate-800 font-mono">{stats.lrSubmittedCount}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Awaiting LR Handover</span>
                </span>
                <span className="font-bold text-amber-700 font-mono">{stats.lrPendingCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          CONSIGNOR / PARTY SETTLEMENT MATRIX
          ======================================================== */}
      <div className="bg-white rounded-2xl border border-sky-100 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-sky-700" />
              <span>Consignor & Party Settlement Performance</span>
            </h2>
            <p className="text-xs text-slate-500">
              Payment reliability, billing volume, and clearance turnaround per return party
            </p>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            {partyPerformance.length} Active Parties in {activePeriodLabel}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-sky-50/70 border-b border-sky-200 text-sky-950 font-bold">
                <th className="py-2.5 px-3">Party Name & Corridor</th>
                <th className="py-2.5 px-3 text-center">Loads</th>
                <th className="py-2.5 px-3 text-right">Total Billed</th>
                <th className="py-2.5 px-3 text-right">Settled (Paid)</th>
                <th className="py-2.5 px-3 text-right">Outstanding</th>
                <th className="py-2.5 px-3 text-center">Settlement %</th>
                <th className="py-2.5 px-3 text-center">Reliability Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {partyPerformance.map((pty, idx) => (
                <tr key={idx} className="hover:bg-sky-50/30 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{pty.partyName}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {pty.routesList || 'Gujarat → Maharashtra'}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-700 font-mono">
                    {pty.tripsCount}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900 font-mono">
                    ₹{pty.billed.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-700 font-mono">
                    ₹{pty.settled.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-rose-700 font-mono">
                    {pty.due > 0 ? `₹${pty.due.toLocaleString('en-IN')}` : '₹0'}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          style={{ width: `${pty.clearanceRate}%` }}
                          className={`h-full ${
                            pty.clearanceRate === 100
                              ? 'bg-emerald-500'
                              : pty.clearanceRate >= 70
                              ? 'bg-sky-500'
                              : 'bg-amber-500'
                          }`}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-bold text-slate-700">
                        {pty.clearanceRate}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        pty.tier === 'Prompt'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : pty.tier === 'Steady'
                          ? 'bg-sky-100 text-sky-800 border border-sky-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {pty.tier}
                    </span>
                  </td>
                </tr>
              ))}
              {partyPerformance.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No return load transactions recorded for {activePeriodLabel}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          DETAILED TRANSACTIONS LEDGER FOR THE ACTIVE PERIOD
          ======================================================== */}
      <div className="bg-white rounded-2xl border border-sky-100 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-700" />
                <span>Return Load Payments Ledger</span>
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-900 border border-sky-200 font-mono">
                {activePeriodLabel}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Detailed list of individual freight shipments with vehicle numbers, LR status, and settlement actions
            </p>
          </div>

          {/* Action buttons, Search & Status Filters */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Primary Print Range Ledger & Export Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsPrintLedgerOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-700 hover:bg-sky-800 text-white shadow-sm shadow-sky-700/20 transition-all cursor-pointer"
                title={horizon === 'monthly' ? `Print Full Month Ledger (${activePeriodLabel})` : `Print Custom Range Ledger (${activePeriodLabel})`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{horizon === 'monthly' ? 'Print Month Ledger (PDF)' : 'Print Range Ledger (PDF)'}</span>
              </button>
              <button
                onClick={handleExportLedgerCSV}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                title="Export this ledger table to CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">CSV</span>
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search party, vehicle, LR..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-sky-500 w-44"
              />
            </div>

            <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setLedgerStatusFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  ledgerStatusFilter === 'all'
                    ? 'bg-sky-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({periodFilteredPayments.length})
              </button>
              <button
                onClick={() => setLedgerStatusFilter('settled')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  ledgerStatusFilter === 'settled'
                    ? 'bg-sky-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Settled ({stats.settledCount})
              </button>
              <button
                onClick={() => setLedgerStatusFilter('pending')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  ledgerStatusFilter === 'pending'
                    ? 'bg-sky-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending ({stats.pendingCount})
              </button>
              <button
                onClick={() => setLedgerStatusFilter('overdue')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  ledgerStatusFilter === 'overdue'
                    ? 'bg-sky-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Overdue ({stats.overdueCount})
              </button>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-sky-50/70 border-b border-sky-200 text-sky-950 font-bold">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Vehicle & Route</th>
                <th className="py-2.5 px-3">Party Name</th>
                <th className="py-2.5 px-3 text-center">LR Number & Submission</th>
                <th className="py-2.5 px-3 text-right">Rent Charge</th>
                <th className="py-2.5 px-3 text-center">Payment Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLedger.map((record) => (
                <tr key={record.id} className="hover:bg-sky-50/30 transition-colors">
                  <td className="py-3 px-3 font-mono font-medium text-slate-700 whitespace-nowrap">
                    {record.tripDate || '—'}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-sky-900 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 inline-block">
                      {record.vehicleNumber}
                    </span>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                      {record.route}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{record.partyName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Ref: {record.tripReferenceId}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="font-mono font-bold text-slate-800">{record.lrNumber}</div>
                    <div className="mt-1">
                      <button
                        onClick={() => toggleLRSubmitted(record.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                          record.lrSubmittedToParty
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
                        }`}
                        title="Click to toggle Stamped LR Handover to Party"
                      >
                        {record.lrSubmittedToParty ? (
                          <>
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>LR Submitted</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-2.5 h-2.5" />
                            <span>Submit LR</span>
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    <div className="font-black text-slate-900">
                      ₹{record.chargeAmount.toLocaleString('en-IN')}
                    </div>
                    {record.isSettled ? (
                      <div className="text-[10px] text-emerald-600 font-bold">
                        Cleared ₹{(record.settledAmount ?? record.amountPaid).toLocaleString('en-IN')}
                      </div>
                    ) : (
                      <div className="text-[10px] text-rose-600 font-bold">
                        Due ₹{record.amountDue.toLocaleString('en-IN')}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        record.isSettled || record.status === 'settled'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : record.status === 'overdue'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {record.isSettled || record.status === 'settled' ? 'Settled' : record.status === 'overdue' ? 'Overdue' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {!record.isSettled && (
                        <button
                          onClick={() => handleOpenSettle(record)}
                          className="px-2 py-1 rounded-md text-[11px] font-bold bg-sky-700 text-white hover:bg-sky-800 transition-colors cursor-pointer"
                        >
                          Settle
                        </button>
                      )}
                      <button
                        onClick={() => setPrintModalRecord(record)}
                        className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Print Return Load Statement"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLedger.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No matching return load records found in {activePeriodLabel}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          MODAL: QUICK SETTLE RETURN LOAD
          ======================================================== */}
      {settlingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-sky-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                Settle Return Load Payment
              </h3>
              <button
                onClick={() => setSettlingRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSettle} className="mt-4 space-y-4">
              <div className="bg-sky-50 p-3 rounded-xl border border-sky-100 text-xs">
                <div className="font-bold text-sky-950">{settlingRecord.partyName}</div>
                <div className="text-slate-600 font-mono mt-0.5">
                  Route: {settlingRecord.route} • Vehicle: {settlingRecord.vehicleNumber}
                </div>
                <div className="text-slate-600 font-mono mt-0.5">
                  LR Number: {settlingRecord.lrNumber}
                </div>
                <div className="mt-2 text-slate-900 font-black font-mono">
                  Original Freight Charge: ₹{settlingRecord.chargeAmount.toLocaleString('en-IN')}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Settled Amount Received (₹)
                </label>
                <input
                  type="number"
                  required
                  value={settleAmountInput}
                  onChange={(e) => setSettleAmountInput(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold font-mono focus:outline-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Settlement Notes / Bank UTR Reference
                </label>
                <input
                  type="text"
                  value={settleNotesInput}
                  onChange={(e) => setSettleNotesInput(e.target.value)}
                  placeholder="e.g. Cleared via IMPS / Cheque on Stamped LR receipt"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSettlingRecord(null)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs cursor-pointer"
                >
                  Confirm & Mark (Settled)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: PRINT RETURN LOAD STATEMENT (SINGLE RECORD)
          ======================================================== */}
      {printModalRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-sky-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Printer className="w-4 h-4 text-sky-700" />
                <span>Return Load Official Print Voucher</span>
              </h3>
              <button
                onClick={() => setPrintModalRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Switcher: 1-Day Slip vs Full Range Ledger */}
            <div className="mt-3 p-2.5 rounded-xl bg-sky-50 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="text-sky-950">
                <span className="font-extrabold block">1-Day Consignment Voucher</span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {printModalRecord.vehicleNumber} • {printModalRecord.tripDate || '—'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPrintModalRecord(null);
                  setIsPrintLedgerOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-bold transition-colors cursor-pointer text-[11px] flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-2xs"
                title={`Print full ledger for ${activePeriodLabel}`}
              >
                <Printer className="w-3 h-3 text-sky-200" />
                <span>Print Full Period Ledger ({filteredLedger.length} Loads)</span>
              </button>
            </div>

            {/* Printable Content Box */}
            <div id="printable-return-load-slip" className="mt-4 p-5 border border-slate-300 rounded-xl bg-slate-50 font-sans space-y-4 text-xs">
              <div className="text-center border-b border-slate-200 pb-3">
                <h4 className="text-base font-black text-sky-950 uppercase tracking-tight">
                  {companyName}
                </h4>
                <p className="text-[11px] text-slate-500">
                  Fleet & Return Load Backhaul Clearance Statement
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  Maharashtra (Pune/Nashik) ⇄ Gujarat (Surat/Ahmedabad)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block text-[10px]">Vehicle Number</span>
                  <span className="font-mono font-extrabold text-sm text-slate-900">
                    {printModalRecord.vehicleNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Trip Date</span>
                  <span className="font-mono font-bold text-slate-900">
                    {printModalRecord.tripDate || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Party / Consignor</span>
                  <span className="font-bold text-slate-900">
                    {printModalRecord.partyName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Route</span>
                  <span className="font-medium text-slate-800">
                    {printModalRecord.route}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block text-[10px]">LR Number</span>
                  <span className="font-mono font-bold text-slate-900">
                    {printModalRecord.lrNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">LR Submit Status</span>
                  <span className="font-bold text-emerald-700">
                    {printModalRecord.lrSubmittedToParty ? 'Submitted to Party' : 'Pending Physical Submission'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Agreed Freight Rent Charge</span>
                  <span className="font-mono font-extrabold text-sm text-slate-900">
                    ₹{printModalRecord.chargeAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Payment Settlement Status</span>
                  <span className="font-bold uppercase text-emerald-800">
                    {printModalRecord.isSettled ? `Settled (₹${(printModalRecord.settledAmount ?? printModalRecord.amountPaid).toLocaleString('en-IN')})` : 'Pending'}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[10px] text-slate-400">
                <span>Generated by {companyName} Logistics Engine</span>
                <span>Authorized Signatory</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPrintModalRecord(null)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 text-xs font-bold bg-sky-700 hover:bg-sky-800 text-white rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: PRINT PERIOD ANALYTICS SUMMARY REPORT
          ======================================================== */}
      {isPrintSummaryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-sky-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Printer className="w-4 h-4 text-sky-700" />
                <span>Return Load Analytics Executive Summary</span>
              </h3>
              <button
                onClick={() => setIsPrintSummaryOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div id="printable-return-load-summary" className="mt-4 p-5 border border-slate-300 rounded-xl bg-slate-50 font-sans space-y-4 text-xs">
              <div className="text-center border-b border-slate-200 pb-3">
                <h4 className="text-lg font-black text-sky-950 uppercase">
                  {companyName}
                </h4>
                <p className="text-xs text-slate-600 font-bold">
                  Return Load Payment Status & Stamped LR Reconciliation Report
                </p>
                <p className="text-xs text-sky-800 font-extrabold mt-0.5">
                  Period: {activePeriodLabel}
                </p>
              </div>

              {/* Summary Metrics */}
              <div className="grid grid-cols-3 gap-3 text-center border-b border-slate-200 pb-4">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Gross Return Freight</span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    ₹{stats.totalBilled.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-emerald-600 uppercase font-bold block">Amount Realized</span>
                  <span className="text-base font-black text-emerald-700 font-mono">
                    ₹{stats.totalSettled.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-rose-600 uppercase font-bold block">Outstanding Balance</span>
                  <span className="text-base font-black text-rose-700 font-mono">
                    ₹{stats.totalDue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Key Indicators */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Total Backhauls:</span>
                  <span className="font-extrabold text-slate-800">{stats.totalCount} Loads</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Clearance Rate:</span>
                  <span className="font-extrabold text-emerald-700">{stats.clearanceRate}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">LR Handover Rate:</span>
                  <span className="font-extrabold text-sky-800">{stats.lrSubmissionRate}%</span>
                </div>
              </div>

              {/* In Custom Horizon: Month-by-Month Trajectory Table */}
              {horizon === 'custom' && (
                <div className="border-t border-slate-200 pt-3">
                  <h5 className="font-extrabold text-slate-800 text-xs mb-2">
                    Month-by-Month Trajectory ({customSpanMonths} Months Span)
                  </h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="border-b border-slate-300 font-bold text-slate-700 bg-slate-100/60">
                          <th className="py-1.5 px-2">Month</th>
                          <th className="py-1.5 px-2 text-center">Loads</th>
                          <th className="py-1.5 px-2 text-right">Billed</th>
                          <th className="py-1.5 px-2 text-right">Settled</th>
                          <th className="py-1.5 px-2 text-right">Due</th>
                          <th className="py-1.5 px-2 text-right">Clearance %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {chartBreakdown.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-1 px-2 font-semibold">{item.fullLabel}</td>
                            <td className="py-1 px-2 text-center font-mono">{item.count}</td>
                            <td className="py-1 px-2 text-right font-mono font-bold">₹{item.billed.toLocaleString('en-IN')}</td>
                            <td className="py-1 px-2 text-right font-mono text-emerald-700">₹{item.settled.toLocaleString('en-IN')}</td>
                            <td className="py-1 px-2 text-right font-mono text-rose-700">{item.due > 0 ? `₹${item.due.toLocaleString('en-IN')}` : '₹0'}</td>
                            <td className="py-1 px-2 text-right font-mono font-bold text-sky-800">{item.clearanceRate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Top Consignors Table */}
              <div className="border-t border-slate-200 pt-3">
                <h5 className="font-extrabold text-slate-800 text-xs mb-2">
                  Consignor Wise Breakdown ({activePeriodLabel})
                </h5>
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-300 font-bold text-slate-700">
                      <th className="py-1">Party Name</th>
                      <th className="py-1 text-center">Loads</th>
                      <th className="py-1 text-right">Billed</th>
                      <th className="py-1 text-right">Settled</th>
                      <th className="py-1 text-right">Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {partyPerformance.map((p, i) => (
                      <tr key={i}>
                        <td className="py-1 font-medium">{p.partyName}</td>
                        <td className="py-1 text-center font-mono">{p.tripsCount}</td>
                        <td className="py-1 text-right font-mono font-bold">₹{p.billed.toLocaleString('en-IN')}</td>
                        <td className="py-1 text-right font-mono text-emerald-700">₹{p.settled.toLocaleString('en-IN')}</td>
                        <td className="py-1 text-right font-mono text-rose-700">{p.due > 0 ? `₹${p.due.toLocaleString('en-IN')}` : '₹0'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-[10px] text-slate-400">
                <span>Official Accounts Report • {companyName}</span>
                <span>Finance & Fleet Operations</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  const headers = ['Party Name', 'Loads Count', 'Total Billed (INR)', 'Total Settled (INR)', 'Balance Due (INR)', 'Clearance Rate (%)', 'Tier'];
                  const rows = partyPerformance.map((p) => [
                    `"${p.partyName.replace(/"/g, '""')}"`,
                    p.tripsCount,
                    p.billed,
                    p.settled,
                    p.due,
                    `"${p.clearanceRate}%"`,
                    `"${p.tier}"`,
                  ]);
                  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement('a');
                  link.setAttribute('href', encodedUri);
                  link.setAttribute('download', `Return_Load_Analytics_${horizon === 'custom' ? `${customStartDate}_to_${customEndDate}` : selectedYear}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV Data</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrintSummaryOpen(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 text-xs font-bold bg-sky-700 hover:bg-sky-800 text-white rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Official Summary</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: PRINT FULL PERIOD / CUSTOM RANGE RETURN LOAD LEDGER
          ======================================================== */}
      {isPrintLedgerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-sky-200 my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-sky-700" />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {horizon === 'monthly' ? 'Print Full Month Payments Ledger' : 'Print Custom Range Payments Ledger'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activePeriodLabel} • {filteredLedger.length} itemized consignments
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPrintLedgerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer transition-colors"
                title="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Printable Statement Sheet */}
            <div className="mt-4 flex-1 overflow-y-auto pr-1">
              <div
                id="printable-return-load-ledger"
                className="p-5 border border-slate-300 rounded-xl bg-white font-sans space-y-4 text-xs shadow-2xs"
              >
                {/* Formal Letterhead */}
                <div className="text-center border-b-2 border-slate-800 pb-3">
                  <div className="flex items-center justify-center gap-2">
                    <Truck className="w-5 h-5 text-sky-800" />
                    <h4 className="text-xl font-black text-sky-950 uppercase tracking-tight font-heading">
                      {companyName}
                    </h4>
                  </div>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">
                    RETURN LOAD FREIGHT & PAYMENTS LEDGER STATEMENT
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Commercial Backhaul Operations • Gujarat (Surat/Ahmedabad) ⇄ Maharashtra (Pune/Nashik/Navi Mumbai)
                  </p>
                </div>

                {/* Scope & Metadata Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-sky-50/80 rounded-xl border border-sky-200 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-sky-800 block">
                      Statement Period / Scope
                    </span>
                    <span className="font-extrabold text-sm text-sky-950 font-heading block mt-0.5">
                      {activePeriodLabel}
                    </span>
                    <span className="text-[11px] text-slate-600 font-mono">
                      Filter Scope: {ledgerStatusFilter === 'all' ? 'All Transactions' : `${ledgerStatusFilter.toUpperCase()} only`}
                      {ledgerSearch ? ` • Search: "${ledgerSearch}"` : ''}
                    </span>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-sky-800 block">
                      Statement Date & Time
                    </span>
                    <span className="font-mono font-bold text-xs text-slate-800 block mt-0.5">
                      {new Date().toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Total Consignments: <strong className="font-mono text-slate-900">{filteredLedger.length}</strong>
                    </span>
                  </div>
                </div>

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Gross Invoiced</span>
                    <span className="text-base font-black text-slate-900 font-mono">
                      ₹{ledgerStats.totalBilled.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-500 block">{filteredLedger.length} Loads</span>
                  </div>

                  <div className="bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200">
                    <span className="text-[10px] text-emerald-700 uppercase font-bold block">Settled (Received)</span>
                    <span className="text-base font-black text-emerald-800 font-mono">
                      ₹{ledgerStats.totalSettled.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-emerald-600 block">{ledgerStats.clearanceRate}% Cleared</span>
                  </div>

                  <div className="bg-rose-50/80 p-2.5 rounded-lg border border-rose-200">
                    <span className="text-[10px] text-rose-700 uppercase font-bold block">Balance Due</span>
                    <span className="text-base font-black text-rose-800 font-mono">
                      ₹{ledgerStats.totalDue.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-rose-600 block">Outstanding</span>
                  </div>

                  <div className="bg-sky-50/80 p-2.5 rounded-lg border border-sky-200">
                    <span className="text-[10px] text-sky-800 uppercase font-bold block">LR Handed Over</span>
                    <span className="text-base font-black text-sky-950 font-mono">
                      {ledgerStats.lrSubmittedCount} / {filteredLedger.length}
                    </span>
                    <span className="text-[10px] text-sky-700 block">
                      {filteredLedger.length > 0 ? Math.round((ledgerStats.lrSubmittedCount / filteredLedger.length) * 100) : 0}% Stamped
                    </span>
                  </div>
                </div>

                {/* Itemized Table of All Loads in the Period */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/90 border-b border-slate-300 text-slate-900 font-bold">
                        <th className="py-2 px-2 text-center w-8">#</th>
                        <th className="py-2 px-2.5">Date</th>
                        <th className="py-2 px-2">Vehicle</th>
                        <th className="py-2 px-2.5">Party & Corridor</th>
                        <th className="py-2 px-2">LR No. & Status</th>
                        <th className="py-2 px-2 text-right">Billed (₹)</th>
                        <th className="py-2 px-2 text-right">Settled (₹)</th>
                        <th className="py-2 px-2 text-right">Due (₹)</th>
                        <th className="py-2 px-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-[11px]">
                      {filteredLedger.length > 0 ? (
                        filteredLedger.map((record, idx) => (
                          <tr key={record.id} className="hover:bg-slate-50/80">
                            <td className="py-2 px-2 text-center text-slate-400 font-mono">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-2.5 font-mono text-slate-700 whitespace-nowrap">
                              {record.tripDate || '—'}
                            </td>
                            <td className="py-2 px-2 font-mono font-bold text-sky-950 whitespace-nowrap">
                              {record.vehicleNumber}
                            </td>
                            <td className="py-2 px-2.5">
                              <span className="font-bold text-slate-900 block truncate max-w-[200px]">
                                {record.partyName}
                              </span>
                              <span className="text-[10px] text-slate-500 block truncate max-w-[200px]">
                                {record.route}
                              </span>
                            </td>
                            <td className="py-2 px-2">
                              <span className="font-mono font-bold text-slate-800 block">
                                {record.lrNumber}
                              </span>
                              <span
                                className={`inline-block font-mono text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                  record.lrSubmittedToParty
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {record.lrSubmittedToParty ? 'LR Handed Over' : 'LR Pending'}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                              ₹{record.chargeAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-emerald-700">
                              ₹{(record.isSettled ? (record.settledAmount ?? record.amountPaid) : record.amountPaid).toLocaleString('en-IN')}
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-rose-700 font-bold">
                              ₹{(record.isSettled ? 0 : record.amountDue).toLocaleString('en-IN')}
                            </td>
                            <td className="py-2 px-2.5 text-center">
                              <span
                                className={`inline-block font-mono text-[10px] font-black px-2 py-0.5 rounded ${
                                  record.isSettled || record.status === 'settled'
                                    ? 'bg-emerald-600 text-white'
                                    : record.status === 'overdue'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {record.isSettled || record.status === 'settled' ? 'SETTLED' : record.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="py-6 text-center text-slate-400 font-medium">
                            No return load transactions found for {activePeriodLabel}.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {filteredLedger.length > 0 && (
                      <tfoot>
                        <tr className="bg-sky-100/70 border-t-2 border-sky-300 font-bold text-slate-900 text-xs">
                          <td colSpan={5} className="py-2.5 px-2.5 text-right font-heading uppercase">
                            Grand Totals ({filteredLedger.length} Consignments):
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-black">
                            ₹{ledgerStats.totalBilled.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-black text-emerald-800">
                            ₹{ledgerStats.totalSettled.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-black text-rose-800">
                            ₹{ledgerStats.totalDue.toLocaleString('en-IN')}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Formal Signatures Section */}
                <div className="pt-4 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-300">
                  <div>
                    <span className="font-bold text-slate-700 block">Fleet & Accounts Operations</span>
                    <span>{companyName} • Transport Management System</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-700 block">Authorized Signatory</span>
                    <span className="text-[10px] text-slate-400">Signature & Seal: _______________________</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 shrink-0 flex-wrap mt-3">
              <button
                type="button"
                onClick={handleExportLedgerCSV}
                className="px-3.5 py-2 font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer flex items-center gap-1.5 text-xs transition-colors"
                title="Download statement as CSV file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV Ledger</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrintLedgerOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer text-xs"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm shadow-sky-700/20 cursor-pointer flex items-center gap-1.5 text-xs"
                  title="Print or Save as PDF in browser preview"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Ledger / Save as PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
