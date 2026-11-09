import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  UserCheck,
  Check,
  X,
  AlertCircle,
  Truck,
  Users,
  CreditCard,
  Eye,
  Plus,
  Shield,
} from 'lucide-react';
import { useTMS } from '../context/TMSContext';
import { UserAccountsModal } from './UserAccountsModal';

export const TenantRBACView: React.FC = () => {
  const {
    userPermissions,
    setUserPermissions,
    driverCanViewDocs,
    setDriverCanViewDocs,
    userAccounts,
    role,
  } = useTMS();

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const handleToggle = (key: keyof typeof userPermissions) => {
    setUserPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 border border-[#DCE8F2] rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-heading text-lg font-extrabold text-[#384959]">
              Admin User Rights & Permission Management
            </h2>
            <span className="bg-[#BDDDFC]/30 text-[#384959] border border-[#BDDDFC] text-xs font-bold px-2.5 py-0.5 rounded-full">
              Admin Authority (PRD Specification)
            </span>
          </div>
          <p className="text-xs text-[#6A89A7] mt-1 font-medium">
            The Admin can handle all work, register users, verify soft copies, assign operational rights, and toggle document visibility for Drivers.
          </p>
        </div>

        {role === 'admin' && (
          <button
            onClick={() => setIsUserModalOpen(true)}
            className="px-4 py-2.5 bg-[#384959] hover:bg-[#2C3A47] text-white font-bold text-xs rounded-lg shadow-sm shadow-xs flex items-center gap-2 cursor-pointer transition-all self-start md:self-auto font-heading shrink-0"
          >
            <Users className="w-4 h-4" />
            <span>Manage Users & KYC Verification ({userAccounts.length})</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: User Rights Assignment */}
        <div className="bg-white border border-[#DCE8F2] rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#DCE8F2]">
            <UserCheck className="w-5 h-5 text-[#6A89A7]" />
            <h3 className="font-heading font-bold text-sm text-[#384959]">
              User / Manager Operational Permissions
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-[#F8FAFC] rounded-xl border border-[#DCE8F2]">
              <div>
                <span className="font-heading font-bold text-[#384959] block">
                  1. Can Approve / Reject Driver Trips
                </span>
                <span className="text-slate-500 text-[11px]">
                  User can review daily fruit delivery trips saved by drivers and approve them for dispatch.
                </span>
              </div>
              <button
                onClick={() => handleToggle('canApproveTrips')}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  userPermissions.canApproveTrips ? 'bg-[#384959]' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    userPermissions.canApproveTrips ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-[#F8FAFC] rounded-xl border border-[#DCE8F2]">
              <div>
                <span className="font-heading font-bold text-[#384959] block">
                  2. Can Settle Return Load Payments
                </span>
                <span className="text-slate-500 text-[11px]">
                  User can negotiate, record settled amounts, and apply the (Settled) tag.
                </span>
              </div>
              <button
                onClick={() => handleToggle('canSettlePayments')}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  userPermissions.canSettlePayments ? 'bg-[#384959]' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    userPermissions.canSettlePayments ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-[#F8FAFC] rounded-xl border border-[#DCE8F2]">
              <div>
                <span className="font-heading font-bold text-[#384959] block">
                  3. Can Manage Drivers & WhatsApp Links
                </span>
                <span className="text-slate-500 text-[11px]">
                  User can enrol new drivers and trigger WhatsApp application links.
                </span>
              </div>
              <button
                onClick={() => handleToggle('canManageDrivers')}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  userPermissions.canManageDrivers ? 'bg-[#384959]' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    userPermissions.canManageDrivers ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-[#F8FAFC] rounded-xl border border-[#DCE8F2]">
              <div>
                <span className="font-heading font-bold text-[#384959] block">
                  4. Can View Financial Balances
                </span>
                <span className="text-slate-500 text-[11px]">
                  User can view total party dues and freight amounts.
                </span>
              </div>
              <button
                onClick={() => handleToggle('canViewFinancials')}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  userPermissions.canViewFinancials ? 'bg-[#384959]' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    userPermissions.canViewFinancials ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Driver Permissions (Admin Controlled) */}
        <div className="bg-white border border-[#DCE8F2] rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#DCE8F2]">
            <Truck className="w-5 h-5 text-[#6A89A7]" />
            <h3 className="font-heading font-bold text-sm text-[#384959]">
              Driver Portal Permissions (Controlled by Admin)
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            {/* Permission: Driver Can see all Vehicle Documentation (PRD Requirement) */}
            <div className="flex items-center justify-between p-4 bg-[#F8FAFC]/60 rounded-xl border border-[#DCE8F2]">
              <div>
                <span className="font-heading font-extrabold text-[#384959] text-sm block">
                  Allow Drivers to View Vehicle Documentation
                </span>
                <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                  PRD: "Driver Can see all Vehical Documentation by Permision of Admin."
                  <br />
                  When enabled, drivers can open RC, Permit, Insurance, PUC, and Fitness soft copies on their phone at RTO checkposts on the Maharashtra ⇄ Gujarat highway.
                </p>
              </div>

              <button
                onClick={() => setDriverCanViewDocs(!driverCanViewDocs)}
                className={`w-14 h-7 rounded-full transition-colors relative shrink-0 ml-4 cursor-pointer ${
                  driverCanViewDocs ? 'bg-[#384959]' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-1 ${
                    driverCanViewDocs ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div className="p-3.5 bg-[#F8FAFC]/30 border border-[#DCE8F2] rounded-xl text-slate-600 space-y-1">
              <span className="font-heading font-bold text-[#384959] block text-xs">Driver Fixed Privileges:</span>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600">
                <li>Can save Daily Work (Trip) with destinations & fruit items</li>
                <li>Can upload Stamped LR photos from delivered locations</li>
                <li>Can log final trip odometer reading</li>
                <li>Financial amounts & ledger management are permanently locked for drivers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Registered Staff & Document Verification Roster (Master Prompt Section 4) */}
      <div className="bg-white border border-[#DCE8F2] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE8F2]">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#6A89A7]" />
            <div>
              <h3 className="font-heading font-extrabold text-sm text-[#384959]">
                Staff User Roster & Verification Status
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Admin-controlled identity verification and document review
              </p>
            </div>
          </div>

          {role === 'admin' && (
            <button
              onClick={() => setIsUserModalOpen(true)}
              className="px-3.5 py-1.5 bg-[#F8FAFC] hover:bg-[#BDDDFC]/30 border border-[#DCE8F2] text-[#384959] rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 font-heading self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register User / Review Soft Copies</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {userAccounts.map((u) => (
            <div
              key={u.id}
              className="p-3 bg-[#F8FAFC] rounded-xl border border-[#DCE8F2] text-xs space-y-2 hover:border-[#DCE8F2] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="font-heading font-bold text-[#384959] truncate">{u.fullName}</span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.2 rounded-full uppercase border font-mono ${
                      u.verificationStatus === 'verified'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : u.verificationStatus === 'rejected'
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                  >
                    {u.verificationStatus.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">{u.mobile} • {u.role}</div>
              </div>

              <div className="pt-2 border-t border-[#DCE8F2] flex items-center justify-between text-[11px]">
                <span className="text-slate-500">{u.documents.length} KYC Doc(s)</span>
                {role === 'admin' && (
                  <button
                    onClick={() => setIsUserModalOpen(true)}
                    className="text-[#6A89A7] hover:text-[#384959] font-bold hover:underline cursor-pointer"
                  >
                    Inspect
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Accounts & Document Verification Modal */}
      <UserAccountsModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
      />
    </div>
  );
};
