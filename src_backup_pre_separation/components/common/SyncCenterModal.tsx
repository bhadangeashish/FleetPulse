import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Truck,
  Check,
  X,
  Database,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Layers,
  FileText,
  Fuel,
  Wrench,
  AlertOctagon,
} from 'lucide-react';
import {
  subscribeToSyncState,
  processOfflineSyncQueue,
  retryFailedSyncItems,
  resetOfflineQueueToInitial,
  setHighwayDeadZoneSimulated,
  getHighwayDeadZoneSimulated,
  setSyncFailureSimulated,
  getSyncFailureSimulated,
  SyncSummary,
} from '../../utils/syncEngine';
import { OfflineQueueItem, OfflineSyncStatus } from '../../types/tms';
import { ModalPortal } from './ModalPortal';

interface SyncCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'screen' | 'queue';
}

export const SyncCenterModal: React.FC<SyncCenterModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'screen',
}) => {
  const [syncSummary, setSyncSummary] = useState<SyncSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'screen' | 'queue'>(initialTab);
  const [isDeadZone, setIsDeadZone] = useState<boolean>(getHighwayDeadZoneSimulated());
  const [isSimulateFailure, setIsSimulateFailure] = useState<boolean>(getSyncFailureSimulated());
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Manual view step override for inspection ('saved_offline' | 'waiting_to_sync' | 'syncing' | 'sync_failed' | 'synced_successfully')
  const [manualViewStep, setManualViewStep] = useState<OfflineSyncStatus | null>(null);

  useEffect(() => {
    return subscribeToSyncState((summary) => {
      setSyncSummary(summary);
      setIsDeadZone(getHighwayDeadZoneSimulated());
      setIsSimulateFailure(getSyncFailureSimulated());
    });
  }, []);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const handleSyncNow = async () => {
    setIsManualSyncing(true);
    setManualViewStep('syncing');
    try {
      const res = await processOfflineSyncQueue();
      if (res.failed > 0) {
        setManualViewStep('sync_failed');
        showToast('Sync failed due to simulated network error. Queued data preserved in IndexedDB.');
      } else {
        setManualViewStep('synced_successfully');
        showToast(`Successfully synchronized ${res.processed} records to FleetPulse!`);
      }
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleRetryFailed = async () => {
    setIsManualSyncing(true);
    setManualViewStep('syncing');
    try {
      await retryFailedSyncItems();
      setManualViewStep('synced_successfully');
      showToast('All failed records retried & synchronized successfully!');
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleResetQueue = async () => {
    await resetOfflineQueueToInitial();
    setManualViewStep('saved_offline');
    showToast('Reset offline queue with 3 showcase sample records (Trip, Fuel, Service).');
  };

  // Determine current active presentation state
  const effectiveStatus = manualViewStep || syncSummary?.status || 'saved_offline';

  const savedCount = syncSummary?.savedOfflineCount || 3;
  const waitingCount = syncSummary?.waitingToSyncCount || 3;
  const lastSyncDate = '06 Nov 2026, 04:32 PM';

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-[#DCE8F2] overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="bg-[#384959] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#88BDF2] text-[#384959] flex items-center justify-center font-black">
              <Database className="w-4 h-4 text-[#384959]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-sm text-white leading-tight">
                  FleetPulse Sync & Offline Center
                </h3>
                <span className="text-[10px] bg-[#6A89A7] text-[#BDDDFC] px-2 py-0.2 rounded-full font-bold">
                  IndexedDB Persistent
                </span>
              </div>
              <p className="text-[11px] text-[#BDDDFC]">
                Anti-Duplication Queue • Idempotent Execution • PWA Service Worker
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Strip */}
        <div className="bg-[#F8FAFC] border-b border-[#DCE8F2] px-5 py-2 flex flex-wrap items-center justify-between gap-2">
          {/* 5-State Showcase Switcher */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#DCE8F2] text-xs font-bold shadow-2xs">
            <button
              type="button"
              onClick={() => setManualViewStep('saved_offline')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                effectiveStatus === 'saved_offline'
                  ? 'bg-[#384959] text-white shadow-2xs'
                  : 'text-[#6A89A7] hover:text-[#384959]'
              }`}
            >
              1. Saved Offline
            </button>
            <button
              type="button"
              onClick={() => setManualViewStep('waiting_to_sync')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                effectiveStatus === 'waiting_to_sync'
                  ? 'bg-[#384959] text-white shadow-2xs'
                  : 'text-[#6A89A7] hover:text-[#384959]'
              }`}
            >
              2. Waiting
            </button>
            <button
              type="button"
              onClick={() => setManualViewStep('syncing')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                effectiveStatus === 'syncing'
                  ? 'bg-[#384959] text-white shadow-2xs'
                  : 'text-[#6A89A7] hover:text-[#384959]'
              }`}
            >
              3. Syncing
            </button>
            <button
              type="button"
              onClick={() => setManualViewStep('sync_failed')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                effectiveStatus === 'sync_failed'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-[#6A89A7] hover:text-[#384959]'
              }`}
            >
              4. Failed
            </button>
            <button
              type="button"
              onClick={() => setManualViewStep('synced_successfully')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                effectiveStatus === 'synced_successfully'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-[#6A89A7] hover:text-[#384959]'
              }`}
            >
              5. Synced
            </button>
          </div>

          {/* Tab Switcher: Presentation Screen vs Detailed Queue */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#DCE8F2] text-xs font-bold shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('screen')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeTab === 'screen' ? 'bg-[#BDDDFC] text-[#384959]' : 'text-[#6A89A7]'
              }`}
            >
              Showcase Screen
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('queue')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeTab === 'queue' ? 'bg-[#BDDDFC] text-[#384959]' : 'text-[#6A89A7]'
              }`}
            >
              Queue ({syncSummary?.totalItems || 3})
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'screen' && (
            <div className="flex flex-col items-center">
              {/* STATE 1: SAVED OFFLINE (Screen 10) */}
              {effectiveStatus === 'saved_offline' && (
                <div className="w-full max-w-sm flex flex-col items-center text-center space-y-3 py-2 animate-in zoom-in-95 duration-150">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-500 to-rose-400 text-white flex items-center justify-center shadow-lg shadow-rose-200 animate-pulse">
                    <WifiOff className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-xl text-[#384959]">Offline Mode</h3>
                    <p className="text-xs text-[#6A89A7] mt-1">
                      You are offline<br />Your work is being saved on this device.
                    </p>
                  </div>

                  <div className="w-full bg-[#F8FAFC] border border-[#DCE8F2] rounded-2xl p-4 space-y-3 text-xs text-left shadow-2xs mt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[#384959]">
                        <Truck className="w-4 h-4 text-[#6A89A7]" />
                        <span className="font-semibold">Saved Offline</span>
                      </div>
                      <span className="font-mono font-black text-sm text-[#384959]">{savedCount}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[#384959]">
                        <Clock className="w-4 h-4 text-[#6A89A7]" />
                        <span className="font-semibold">Waiting to Sync</span>
                      </div>
                      <span className="font-mono font-black text-sm text-[#384959]">{waitingCount}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#DCE8F2]">
                      <div className="flex items-center gap-1.5 text-[#6A89A7]">
                        <RefreshCw className="w-3.5 h-3.5 text-[#6A89A7]" />
                        <span className="text-[11px]">Last Sync</span>
                      </div>
                      <span className="font-mono font-bold text-[#6A89A7] text-[11px]">05 Nov 2026, 06:20 PM</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSyncNow}
                    disabled={isManualSyncing}
                    className="w-full py-3.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl font-heading font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] cursor-pointer mt-3"
                  >
                    <RefreshCw className={`w-4 h-4 text-white ${isManualSyncing ? 'animate-spin' : ''}`} />
                    <span>Sync Now</span>
                  </button>
                </div>
              )}

              {/* STATE 2: WAITING TO SYNC */}
              {effectiveStatus === 'waiting_to_sync' && (
                <div className="w-full max-w-sm flex flex-col items-center text-center space-y-3 py-2 animate-in zoom-in-95 duration-150">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center shadow-lg shadow-amber-200">
                    <Clock className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-xl text-[#384959]">Waiting to Sync</h3>
                    <p className="text-xs text-[#6A89A7] mt-1">
                      Network restored.<br />{waitingCount} records queued in IndexedDB ready to upload.
                    </p>
                  </div>

                  <div className="w-full bg-[#F8FAFC] border border-[#DCE8F2] rounded-2xl p-4 space-y-3 text-xs text-left shadow-2xs mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#384959] font-semibold">Queued Mutations</span>
                      <span className="font-mono font-black text-sm text-amber-700">{waitingCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#384959] font-semibold">Idempotency Guarantee</span>
                      <span className="text-emerald-700 font-bold">100% Anti-Duplicate</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#DCE8F2]">
                      <span className="text-[11px] text-[#6A89A7]">Last Sync</span>
                      <span className="font-mono text-[11px] text-[#6A89A7]">05 Nov 2026, 06:20 PM</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSyncNow}
                    disabled={isManualSyncing}
                    className="w-full py-3.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl font-heading font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] cursor-pointer mt-3"
                  >
                    <RefreshCw className="w-4 h-4 text-white" />
                    <span>Upload Now</span>
                  </button>
                </div>
              )}

              {/* STATE 3: SYNCHRONIZING (Screen 11) */}
              {effectiveStatus === 'syncing' && (
                <div className="w-full max-w-sm flex flex-col items-center text-center space-y-3 py-2 animate-in zoom-in-95 duration-150">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#0284c7] to-[#88BDF2] text-white flex items-center justify-center shadow-lg shadow-sky-200">
                    <RefreshCw className="w-10 h-10 text-white animate-spin" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-xl text-[#384959]">Synchronizing...</h3>
                    <p className="text-xs text-[#6A89A7] mt-1">
                      Uploading your records to FleetPulse.
                    </p>
                  </div>

                  {/* 75% Progress Bar matching Screen 11 */}
                  <div className="w-full space-y-1 mt-2">
                    <div className="w-full bg-[#DCE8F2] h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#0284c7] h-full rounded-full transition-all duration-500"
                        style={{ width: '75%' }}
                      />
                    </div>
                    <div className="text-right text-[11px] font-mono font-bold text-[#0284c7]">75%</div>
                  </div>

                  {/* 4-Item Status Checklist matching Screen 11 */}
                  <div className="w-full bg-[#F8FAFC] border border-[#DCE8F2] rounded-2xl p-4 space-y-2.5 text-xs text-left shadow-2xs mt-2">
                    <div className="flex items-center gap-2.5 text-emerald-800 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Trip Record (1/1)</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-emerald-800 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Fuel Entry (1/1)</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-emerald-800 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Service Record (1/1)</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[#6A89A7]">
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                      <span>Other Records (0/1)</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#6A89A7] font-semibold pt-1">
                    Atomic transaction in progress • Never lose queued data
                  </p>
                </div>
              )}

              {/* STATE 4: SYNC FAILED */}
              {effectiveStatus === 'sync_failed' && (
                <div className="w-full max-w-sm flex flex-col items-center text-center space-y-3 py-2 animate-in zoom-in-95 duration-150">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-600 to-rose-400 text-white flex items-center justify-center shadow-lg shadow-rose-200">
                    <AlertTriangle className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-xl text-[#384959]">Sync Failed</h3>
                    <p className="text-xs text-rose-700 font-semibold mt-1">
                      Highway network connection interrupted.
                    </p>
                    <p className="text-xs text-[#6A89A7] mt-0.5">
                      Your 3 records remain safely stored in IndexedDB. No data was lost.
                    </p>
                  </div>

                  <div className="w-full bg-rose-50/70 border border-rose-200 rounded-2xl p-4 space-y-2.5 text-xs text-left shadow-2xs mt-2">
                    <div className="flex items-center justify-between text-rose-900 font-bold">
                      <span>Records Preserved Locally</span>
                      <span>3 Records Safe</span>
                    </div>
                    <div className="flex items-center justify-between text-rose-800">
                      <span>Failure Reason</span>
                      <span className="font-semibold">Network Timeout (NH-48)</span>
                    </div>
                    <div className="flex items-center justify-between text-rose-800">
                      <span>Anti-Duplicate Check</span>
                      <span className="text-emerald-700 font-bold">Passed (Zero Duplicates)</span>
                    </div>
                  </div>

                  <div className="w-full flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={handleRetryFailed}
                      className="flex-1 py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl font-heading font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retry Sync</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualViewStep('saved_offline')}
                      className="px-4 py-3 bg-white border border-[#DCE8F2] text-[#384959] rounded-xl font-heading font-bold text-xs hover:bg-[#F3F7FB] cursor-pointer"
                    >
                      Keep Offline
                    </button>
                  </div>
                </div>
              )}

              {/* STATE 5: SUCCESSFULLY SYNCED (Screen 12) */}
              {effectiveStatus === 'synced_successfully' && (
                <div className="w-full max-w-sm flex flex-col items-center text-center space-y-3 py-2 animate-in zoom-in-95 duration-150">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
                    <Check className="w-10 h-10 text-white stroke-[3]" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-xl text-[#384959]">All Records Synced!</h3>
                    <p className="text-xs text-[#6A89A7] mt-1">
                      Your offline data has been<br />successfully uploaded.
                    </p>
                  </div>

                  <div className="w-full bg-[#F8FAFC] border border-[#DCE8F2] rounded-2xl p-4 space-y-2.5 text-xs text-left shadow-2xs mt-2">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>3 Records Synced</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#6A89A7] font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-[#6A89A7] shrink-0" />
                      <span>0 Failed</span>
                    </div>
                    <div className="pt-2 border-t border-[#DCE8F2] text-[11px] text-[#6A89A7] font-mono">
                      Last Sync: {lastSyncDate}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-3.5 bg-[#384959] hover:bg-[#2C3B49] text-white rounded-xl font-heading font-extrabold text-xs shadow-md transition-all active:scale-[0.99] cursor-pointer mt-3"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DETAILED PERSISTENT QUEUE TABLE */}
          {activeTab === 'queue' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#DCE8F2]">
                <div>
                  <h4 className="font-heading font-extrabold text-xs text-[#384959]">
                    IndexedDB Persistent Mutation Queue
                  </h4>
                  <p className="text-[11px] text-[#6A89A7]">
                    Object Store: <code className="bg-[#F3F7FB] px-1 py-0.5 rounded font-mono text-[10px]">offline_queue</code>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetQueue}
                  className="px-2.5 py-1 bg-[#F3F7FB] hover:bg-[#BDDDFC]/40 text-[#384959] rounded-lg text-[10px] font-bold border border-[#DCE8F2] flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 text-[#6A89A7]" />
                  <span>Reset Demo Queue</span>
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {(syncSummary?.items || []).map((item: OfflineQueueItem, idx: number) => {
                  const isSynced = item.status === 'synced_successfully';
                  const isFailed = item.status === 'sync_failed';
                  const isSyncing = item.status === 'syncing';

                  return (
                    <div
                      key={item.id || idx}
                      className="p-3 bg-[#F8FAFC] rounded-2xl border border-[#DCE8F2] space-y-1.5 shadow-2xs hover:bg-white transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-extrabold text-xs text-[#384959]">
                            {item.summary.split(':')[0]}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.2 rounded-full border ${
                              isSynced
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : isFailed
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : isSyncing
                                ? 'bg-sky-100 text-sky-800 border-sky-300 animate-pulse'
                                : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}
                          >
                            {item.status.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#6A89A7] font-mono">
                          {new Date(item.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-[#384959] leading-snug">{item.summary}</p>

                      <div className="pt-1.5 border-t border-[#DCE8F2]/60 flex items-center justify-between text-[10px] text-[#6A89A7] font-mono">
                        <span>Key: {item.idempotencyKey.slice(0, 24)}...</span>
                        <span>Vehicle: {item.vehicleNumber || 'MH-12-RN-4892'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Testing Controls Bar */}
          <div className="bg-[#F3F7FB] rounded-2xl p-3 border border-[#DCE8F2] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold text-[#384959] text-[11px]">
                Offline Resilience: Zero data loss, Monotonic ODO verification active
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Dead zone simulator */}
              <button
                type="button"
                onClick={() => {
                  const next = !isDeadZone;
                  setHighwayDeadZoneSimulated(next);
                  setIsDeadZone(next);
                  showToast(
                    next
                      ? 'Simulated Highway Dead Zone: IndexedDB offline caching active!'
                      : 'Restored Highway Connectivity: Automatic background sync initiated.'
                  );
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                  isDeadZone
                    ? 'bg-rose-500 text-white border-rose-600'
                    : 'bg-white text-[#384959] border-[#DCE8F2] hover:bg-[#F3F7FB]'
                }`}
              >
                {isDeadZone ? 'Dead Zone (Active)' : 'Simulate Dead Zone'}
              </button>

              {/* Failure simulator */}
              <button
                type="button"
                onClick={() => {
                  const next = !isSimulateFailure;
                  setSyncFailureSimulated(next);
                  setIsSimulateFailure(next);
                  showToast(
                    next
                      ? 'Simulated Sync Failure Active: Next sync attempt will trigger error screen.'
                      : 'Simulated Sync Failure Disabled: Next sync will succeed.'
                  );
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                  isSimulateFailure
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'bg-white text-[#384959] border-[#DCE8F2] hover:bg-[#F3F7FB]'
                }`}
              >
                {isSimulateFailure ? 'Simulate Error (ON)' : 'Simulate Error'}
              </button>
            </div>
          </div>
        </div>

        {/* Toast Popup Notification */}
        {feedbackToast && (
          <div className="bg-[#384959] text-white px-4 py-2 text-xs font-semibold flex items-center justify-between border-t border-[#88BDF2]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#88BDF2]" />
              <span>{feedbackToast}</span>
            </div>
            <button type="button" onClick={() => setFeedbackToast(null)} className="text-[#BDDDFC]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </ModalPortal>
  );
};

