import React, { useState } from 'react';
import {
  Users,
  Plus,
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Upload,
  Eye,
  Trash2,
  Lock,
  Phone,
  Mail,
  MapPin,
  Check,
  X,
} from 'lucide-react';
import { useTMS } from '../context/TMSContext';
import { UserAccount, UserDocument, VerificationStatus } from '../types/tms';
import { handleFormKeyDown } from '../utils/keyboardNavigation';

interface UserAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserAccountsModal: React.FC<UserAccountsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    userAccounts,
    addUserAccount,
    updateUserVerification,
    role,
  } = useTMS();

  const [activeTab, setActiveTab] = useState<'roster' | 'register'>('roster');

  // New User Registration Form State
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [userRole, setUserRole] = useState<'operator' | 'admin'>('operator');
  const [docType, setDocType] = useState<UserDocument['type']>('Aadhaar');
  const [docNumber, setDocNumber] = useState('');
  const [docFileName, setDocFileName] = useState('');
  const [docFileUrl, setDocFileUrl] = useState('');

  // Permissions to assign
  const [canApproveTrips, setCanApproveTrips] = useState(false);
  const [canSettlePayments, setCanSettlePayments] = useState(false);
  const [canManageDrivers, setCanManageDrivers] = useState(true);
  const [canViewFinancials, setCanViewFinancials] = useState(false);

  // Review modal state
  const [selectedUserForReview, setSelectedUserForReview] = useState<UserAccount | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDocumentFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File exceeds 5 MB limit. Please upload a smaller document.');
      return;
    }

    setDocFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDocFileUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRegisterUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !mobile.trim()) {
      alert('Please enter required Full Name and Mobile number.');
      return;
    }

    const docList: UserDocument[] = [];
    if (docFileName) {
      docList.push({
        id: `udoc-${Date.now()}`,
        name: `${docType} Soft Copy`,
        type: docType,
        documentNumber: docNumber,
        fileName: docFileName,
        fileUrl: docFileUrl,
        uploadedAt: new Date().toISOString().split('T')[0],
        status: 'pending',
      });
    }

    const res = addUserAccount({
      fullName: fullName.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      password: password.trim() || 'operator123',
      address: address.trim(),
      role: userRole,
      documents: docList,
      permissions: {
        canApproveTrips,
        canSettlePayments,
        canEditReminders: false,
        canManageDrivers,
        canViewFinancials,
      },
    });

    if (res.success) {
      setFeedback(res.message);
      // Reset form
      setFullName('');
      setMobile('');
      setEmail('');
      setPassword('');
      setAddress('');
      setDocFileName('');
      setDocFileUrl('');
      setDocNumber('');
      setActiveTab('roster');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleStatusChange = (userId: string, status: VerificationStatus) => {
    if (status === 'rejected' && !rejectionReason.trim()) {
      alert('Please specify a rejection reason for the user documents.');
      return;
    }

    updateUserVerification(userId, status, rejectionReason.trim() || undefined);
    setSelectedUserForReview(null);
    setRejectionReason('');
    setFeedback(`User verification status set to "${status.replace('_', ' ')}".`);
    setTimeout(() => setFeedback(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-sky-950/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-sky-200 shadow-2xl w-full max-w-4xl overflow-hidden text-xs text-slate-800 animate-in fade-in duration-150 my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shrink-0">
              <Users className="w-5 h-5 text-sky-100" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-sm tracking-tight">
                User Registration & Document Verification Hub
              </h3>
              <p className="text-[11px] text-sky-100/90 font-medium mt-0.5">
                Onboard operators and verify identity soft copies (Master Prompt Section 4)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-sky-100 hover:text-white p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-sky-50 border-b border-sky-200 text-xs shrink-0">
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'roster'
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'text-sky-800 hover:bg-sky-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Registered Users ({userAccounts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'register'
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'text-sky-800 hover:bg-sky-100'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register New User & Upload KYC</span>
          </button>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div className="mx-5 mt-3 p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl flex items-center gap-2 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'roster' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {userAccounts.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 bg-white rounded-xl border border-sky-200 shadow-2xs space-y-3 hover:border-sky-300 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-heading font-extrabold text-sm text-sky-950">
                              {user.fullName}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border font-mono ${
                                user.role === 'admin'
                                  ? 'bg-purple-100 text-purple-800 border-purple-200'
                                  : 'bg-sky-100 text-sky-800 border-sky-200'
                              }`}
                            >
                              {user.role}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-sky-500" />
                              {user.mobile}
                            </span>
                            {user.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-sky-500" />
                                {user.email}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Verification Status Badge */}
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border font-mono shrink-0 ${
                            user.verificationStatus === 'verified'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : user.verificationStatus === 'rejected'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : user.verificationStatus === 'additional_docs_required'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          {user.verificationStatus.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Document Details */}
                      <div className="p-2.5 bg-sky-50/50 rounded-lg border border-sky-100 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-sky-900 block font-heading">
                          Submitted Identity Documents:
                        </span>
                        {user.documents.length === 0 ? (
                          <span className="text-[10px] text-slate-400 italic">No KYC documents attached yet.</span>
                        ) : (
                          user.documents.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between bg-white p-2 rounded border border-sky-100 text-[11px]"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-sky-600" />
                                <div>
                                  <span className="font-bold text-slate-800">{doc.name}</span>
                                  {doc.documentNumber && (
                                    <span className="text-slate-500 font-mono text-[10px] ml-1.5">
                                      ({doc.documentNumber})
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded border font-mono ${
                                  doc.status === 'verified'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : doc.status === 'rejected'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {doc.status}
                              </span>
                            </div>
                          ))
                        )}
                      </div>

                      {user.rejectionReason && (
                        <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-700 text-[10px]">
                          <strong>Rejection Reason:</strong> {user.rejectionReason}
                        </div>
                      )}
                    </div>

                    {/* Admin Action Button */}
                    {role === 'admin' && (
                      <div className="pt-2 border-t border-sky-100 flex items-center justify-end">
                        <button
                          onClick={() => {
                            setSelectedUserForReview(user);
                            setRejectionReason(user.rejectionReason || '');
                          }}
                          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-2xs font-heading"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review & Verify Documents</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* User Registration Form with Enter-Key navigation */
            <form
              onSubmit={handleRegisterUser}
              onKeyDown={(e) => handleFormKeyDown(e)}
              className="space-y-4 max-w-2xl mx-auto bg-slate-50/70 p-5 rounded-2xl border border-sky-200 shadow-2xs"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-sky-200">
                <Users className="w-4 h-4 text-sky-600" />
                <h4 className="font-heading font-extrabold text-xs text-sky-950 uppercase tracking-wider">
                  New User Information & Identity Soft Copy
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-sky-900 mb-1 font-heading">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Anand Shinde"
                    className="w-full bg-white border border-sky-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-sky-900 mb-1 font-heading">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 98220 99122"
                    className="w-full bg-white border border-sky-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-sky-900 mb-1 font-heading">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="anand@fleetpulse.com"
                    className="w-full bg-white border border-sky-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-sky-900 mb-1 font-heading">
                    Account Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Set temporary password"
                    className="w-full bg-white border border-sky-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-sky-900 mb-1 font-heading">
                  Residential / Office Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Pune Market Yard Staff Quarters, Maharashtra"
                  className="w-full bg-white border border-sky-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-sky-500"
                />
              </div>

              {/* Document Soft Copy Upload Section */}
              <div className="p-3.5 bg-white rounded-xl border border-sky-200 space-y-3">
                <span className="font-heading font-bold text-xs text-sky-950 block">
                  Identity Document Soft Copy Upload
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sky-800 mb-1 font-heading">
                      Document Type
                    </label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value as any)}
                      className="w-full bg-sky-50 border border-sky-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-sky-500"
                    >
                      <option value="Aadhaar">Aadhaar Card</option>
                      <option value="PAN">PAN Card</option>
                      <option value="Voter ID">Voter ID</option>
                      <option value="Passport">Passport</option>
                      <option value="Employee ID">Company Staff Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sky-800 mb-1 font-heading">
                      Document Number
                    </label>
                    <input
                      type="text"
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      placeholder="e.g. XXXX-XXXX-9912 or PAN"
                      className="w-full bg-white border border-sky-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:outline-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-sky-800 mb-1 font-heading">
                    Soft Copy Document (PDF, PNG, JPEG)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-2xs font-heading">
                      <Upload className="w-3.5 h-3.5 text-sky-600" />
                      <span>Choose Soft Copy File</span>
                      <input
                        type="file"
                        accept="application/pdf,image/png,image/jpeg"
                        onChange={handleDocumentFileUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[11px] text-slate-600 font-mono">
                      {docFileName ? `Attached: ${docFileName}` : 'No document chosen'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Operational Permissions */}
              <div className="p-3.5 bg-white rounded-xl border border-sky-200 space-y-2">
                <span className="font-heading font-bold text-xs text-sky-950 block">
                  Admin-Assigned Permissions
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canApproveTrips}
                      onChange={(e) => setCanApproveTrips(e.target.checked)}
                      className="rounded text-sky-600"
                    />
                    <span>Can Approve / Reject Daily Trips</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canSettlePayments}
                      onChange={(e) => setCanSettlePayments(e.target.checked)}
                      className="rounded text-sky-600"
                    />
                    <span>Can Settle Return Load Payments</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canManageDrivers}
                      onChange={(e) => setCanManageDrivers(e.target.checked)}
                      className="rounded text-sky-600"
                    />
                    <span>Can Manage Drivers & WhatsApp</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canViewFinancials}
                      onChange={(e) => setCanViewFinancials(e.target.checked)}
                      className="rounded text-sky-600"
                    />
                    <span>Can View Financial Balances</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-sky-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('roster')}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 rounded-lg shadow-sm shadow-sky-600/25 flex items-center gap-1.5 cursor-pointer font-heading"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Register User Account</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Review Modal for Admin */}
        {selectedUserForReview && (
          <div className="fixed inset-0 z-60 bg-sky-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-sky-200 shadow-2xl w-full max-w-lg p-5 space-y-4 text-xs animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-sky-600" />
                  <h4 className="font-heading font-extrabold text-sm text-sky-950">
                    Review User KYC: {selectedUserForReview.fullName}
                  </h4>
                </div>
                <button onClick={() => setSelectedUserForReview(null)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-sky-900 block font-heading">
                    Submitted Soft Copies
                  </span>
                  {selectedUserForReview.documents.map((d) => (
                    <div key={d.id} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-sky-100">
                      <span>{d.name} ({d.type})</span>
                      <button
                        type="button"
                        onClick={() => alert(`Opening soft copy: ${d.fileName || d.fileUrl || 'Document File'}`)}
                        className="text-sky-600 hover:underline font-bold text-[11px]"
                      >
                        Preview Soft Copy
                      </button>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-sky-900 mb-1 font-heading">
                    Rejection / Additional Document Note (If Rejecting)
                  </label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Document image is blurred. Please upload clear front/back scan."
                    className="w-full bg-white border border-sky-200 rounded-lg px-3 py-2 text-xs focus:outline-sky-500"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-sky-100">
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedUserForReview.id, 'rejected')}
                  className="px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject KYC</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedUserForReview.id, 'additional_docs_required')}
                  className="px-3.5 py-2 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Require More Docs</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedUserForReview.id, 'verified')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-2xs font-heading"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verify & Approve User</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

