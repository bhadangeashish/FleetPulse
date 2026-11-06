import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Truck,
  CreditCard,
  FileText,
  FileCheck2,
  RefreshCw,
  Download,
} from 'lucide-react';
import { useTMS } from '../context/TMSContext';
import { AuditLogEntry } from '../types/tms';

export const AuditLogView: React.FC = () => {
  const { auditLogs } = useTMS();
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.entityId && log.entityId.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (moduleFilter !== 'all' && log.module !== moduleFilter) return false;
    if (roleFilter !== 'all' && log.userRole !== roleFilter) return false;
    return true;
  });

  const getModuleBadge = (module: AuditLogEntry['module']) => {
    switch (module) {
      case 'payments':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Payments</span>;
      case 'trips':
        return <span className="bg-[#BDDDFC]/30 text-[#384959] border border-[#DCE8F2] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Trips</span>;
      case 'vehicles':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Vehicles</span>;
      case 'drivers':
        return <span className="bg-purple-100 text-purple-800 border border-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Drivers</span>;
      case 'documents':
        return <span className="bg-[#BDDDFC]/30 text-[#384959] border border-[#DCE8F2] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Documents</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{module}</span>;
    }
  };

  const handleDownloadCSV = () => {
    const headers = ['Timestamp', 'User Role', 'User Name', 'Module', 'Action', 'Details', 'Entity ID'];
    const rows = filteredLogs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.userRole}"`,
      `"${l.userName}"`,
      `"${l.module}"`,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.entityId || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FleetPulse_Audit_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 border border-[#DCE8F2] rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-heading text-lg font-extrabold text-[#384959]">
              System Audit Logs & Activity Trail
            </h2>
            <span className="bg-[#BDDDFC]/30 text-[#384959] border border-[#BDDDFC] text-xs font-bold px-2.5 py-0.5 rounded-full">
              Compliance & Security
            </span>
          </div>
          <p className="text-xs text-[#6A89A7] mt-1 font-medium">
            Immutable tracking of financial payments, trip approvals/rejections, LR updates, vehicle ODO revisions, and permission changes.
          </p>
        </div>

        <button
          onClick={handleDownloadCSV}
          className="px-3.5 py-2 text-xs font-bold text-[#384959] bg-white hover:bg-[#F8FAFC] border border-[#DCE8F2] rounded-lg shadow-xs flex items-center gap-2 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#6A89A7]" />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#DCE8F2] shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search action, details, user, or entity ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#88BDF2]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="all">All Modules</option>
            <option value="payments">Payments</option>
            <option value="trips">Trips</option>
            <option value="vehicles">Vehicles</option>
            <option value="drivers">Drivers</option>
            <option value="parties">Parties</option>
            <option value="documents">Documents</option>
            <option value="permissions">Permissions</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="operator">User / Operator</option>
            <option value="driver">Driver</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-[#DCE8F2] rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC]/70 border-b border-[#DCE8F2] text-[#384959] font-heading font-bold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-3">Actor / Role</th>
                <th className="py-3 px-3">Module</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-4">Event Details</th>
                <th className="py-3 px-3">Entity ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F8FAFC]/30 transition-colors">
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-bold text-[#384959] block">{log.userName}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">{log.userRole}</span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getModuleBadge(log.module)}
                    </td>
                    <td className="py-3 px-3 font-bold text-[#384959] whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-md">
                      {log.details}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {log.entityId || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

