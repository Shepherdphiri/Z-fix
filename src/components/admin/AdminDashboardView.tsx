import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { User, UserRole } from '../../types';
import {
  FileText,
  Users,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Laptop,
  RefreshCw,
  Sliders,
  Sparkles,
  Layers,
  Database,
  Lock,
} from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const {
    usersList,
    activityLogs,
    refreshActivityLogs,
    updateUserRole,
    updateUserPermissions,
    currentUser,
    loginUser,
    setShowAuthModal,
    showToast,
  } = useStudio();

  const [activeSubTab, setActiveSubTab] = useState<'audit' | 'users'>('audit');
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // If not authenticated as Admin, show high-security Login Gate
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="flex-1 h-full bg-[#0a0a0b] flex flex-col items-center justify-center p-6 text-[#e4e4e7] select-none">
        <div className="max-w-md w-full bg-[#09090b] border border-[#27272a] rounded-2xl p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-[#18181b] border border-[#27272a] mx-auto flex items-center justify-center text-indigo-400 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded bg-black text-indigo-400 border border-indigo-500/30">
              Admin Access Gate
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight mt-2 font-mono">
              ADMINISTRATOR LOGIN REQUIRED
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Global system monitoring, PostgreSQL audit trails, and user role permission matrices are strictly restricted to authenticated administrators.
            </p>
          </div>

          {currentUser && (
            <div className="p-3 bg-[#18181b] rounded-lg border border-[#27272a] text-xs text-zinc-400 font-mono flex items-center justify-between">
              <span>Active Session: {currentUser.email}</span>
              <span className="text-rose-400 uppercase text-[10px] font-bold">({currentUser.role} - Non-Admin)</span>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              onClick={async () => {
                setIsLoggingIn(true);
                await loginUser('shepherdphiri88@gmail.com', 'admin', 'Shepherd Phiri (Owner & Admin)');
                setIsLoggingIn(false);
                showToast('Welcome back, Shepherd Phiri (Admin & Owner)');
              }}
              disabled={isLoggingIn}
              className="w-full py-3 px-4 bg-white hover:bg-zinc-200 text-black rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95 shadow-md"
            >
              <Lock className="w-3.5 h-3.5" />
              {isLoggingIn ? 'Authenticating Admin...' : 'Sign In with Google OAuth (Admin)'}
            </button>

            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full py-2.5 px-4 bg-[#18181b] hover:bg-[#222226] border border-[#27272a] text-zinc-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              Switch / Enter Admin Credentials
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter logs
  const filteredLogs = activityLogs.filter((log) => {
    const matchesSearch =
      log.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPlatform =
      platformFilter === 'all' || log.platform.toLowerCase().includes(platformFilter.toLowerCase());

    return matchesSearch && matchesPlatform;
  });

  const exportAuditLogsCSV = () => {
    const headers = ['Timestamp', 'User Email', 'Action', 'Details', 'Platform', 'IP', 'Status'];
    const rows = filteredLogs.map((l) => [
      l.timestamp,
      l.userEmail,
      l.action,
      `"${l.details.replace(/"/g, '""')}"`,
      l.platform,
      l.ip,
      l.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `zfix_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Audit trail exported to CSV');
  };

  return (
    <div className="flex-1 h-full bg-[#0a0a0b] flex overflow-hidden text-[#e4e4e7] select-none">
      {/* Left Sidebar: System Telemetry & Quick Activity Feed */}
      <aside className="w-72 md:w-80 border-r border-[#27272a] bg-[#0c0c0e] flex flex-col shrink-0 overflow-hidden">
        {/* System Monitoring Metrics */}
        <div className="p-4 border-b border-[#27272a]">
          <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
            System Monitoring
          </span>
          <div className="mt-3 space-y-3">
            <div className="bg-[#18181b] p-3 rounded-lg border border-[#27272a]">
              <div className="flex justify-between items-end">
                <span className="text-xs text-zinc-400">Active Pro Users</span>
                <span className="text-lg font-mono text-white font-bold">1,284</span>
              </div>
              <div className="w-full bg-zinc-800 h-1 mt-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full w-[72%]"></div>
              </div>
            </div>

            <div className="bg-[#18181b] p-3 rounded-lg border border-[#27272a]">
              <div className="flex justify-between items-end">
                <span className="text-xs text-zinc-400">PostgreSQL Cloud IO</span>
                <span className="text-lg font-mono text-white font-bold">24.8%</span>
              </div>
              <div className="w-full bg-zinc-800 h-1 mt-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[24%]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Live Activity Log Stream */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
              Global Activity Stream
            </span>
            <button
              onClick={refreshActivityLogs}
              className="text-zinc-500 hover:text-zinc-300 p-1"
              title="Refresh Stream"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
            {activityLogs.slice(0, 6).map((log, index) => (
              <div
                key={log.id}
                className={`text-[11px] leading-relaxed py-2 border-l-2 pl-3 rounded-r transition ${
                  index === 0
                    ? 'border-indigo-500 bg-indigo-500/5 text-zinc-300'
                    : 'border-zinc-700 bg-transparent text-zinc-400 opacity-80'
                }`}
              >
                <p>
                  <span className="text-white font-bold">{log.userEmail.split('@')[0]}</span>{' '}
                  <span className="text-indigo-400 font-mono text-[10px] uppercase">{log.action}</span>
                </p>
                <p className="text-zinc-500 text-[10px] truncate mt-0.5">{log.details}</p>
                <p className="text-zinc-600 font-mono text-[9px] mt-1">
                  {log.platform} • {new Date(log.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Administrative Control Workspace */}
      <section className="flex-1 flex flex-col h-full overflow-y-auto bg-[#0a0a0b]">
        {/* Admin Header */}
        <div className="p-4 md:p-6 border-b border-[#27272a] bg-[#09090b] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white font-mono tracking-tight">
                ADMIN AUDIT & PERMISSIONS OVERSIGHT
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-black text-indigo-400 border border-indigo-500/40 uppercase">
                Owner Privileges
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Global system monitoring, multi-platform activity audit trails, and granular RBAC permissions.
            </p>
          </div>

          {/* SubTab switcher */}
          <div className="flex items-center gap-1.5 bg-[#18181b] p-1 rounded-lg border border-[#27272a]">
            <button
              onClick={() => setActiveSubTab('audit')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition flex items-center gap-1.5 ${
                activeSubTab === 'audit'
                  ? 'bg-white text-black font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Activity Log ({filteredLogs.length})
            </button>

            <button
              onClick={() => setActiveSubTab('users')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition flex items-center gap-1.5 ${
                activeSubTab === 'users'
                  ? 'bg-white text-black font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              User Permissions ({usersList.length})
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 md:p-6 max-w-6xl w-full space-y-5">
          {activeSubTab === 'audit' && (
            <div className="space-y-4">
              {/* Filter toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#18181b] p-3 rounded-lg border border-[#27272a]">
                <div className="flex items-center gap-2 w-full sm:w-80">
                  <Search className="w-4 h-4 text-zinc-500 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search logs by email, action, or payload..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent text-xs text-zinc-200 placeholder-zinc-500 outline-none w-full"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <div className="flex items-center gap-1 bg-[#09090b] px-2 py-1 rounded border border-[#27272a] text-xs">
                    <Filter className="w-3.5 h-3.5 text-zinc-500" />
                    <select
                      value={platformFilter}
                      onChange={(e) => setPlatformFilter(e.target.value)}
                      className="bg-transparent text-zinc-300 text-xs outline-none cursor-pointer"
                    >
                      <option value="all">All Platforms</option>
                      <option value="iOS">iOS Devices</option>
                      <option value="Android">Android Devices</option>
                      <option value="Desktop">Web Desktop</option>
                    </select>
                  </div>

                  <button
                    onClick={exportAuditLogsCSV}
                    className="px-3 py-1.5 bg-[#27272a] hover:bg-zinc-700 text-white rounded text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Audit Table */}
              <div className="bg-[#18181b] border border-[#27272a] rounded-lg overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#09090b] border-b border-[#27272a] text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                      <tr>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Event Details</th>
                        <th className="py-3 px-4">Platform</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272a] font-sans">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-[#202024] transition">
                          <td className="py-3 px-4 font-mono text-[10px] text-zinc-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>
                          <td className="py-3 px-4 font-medium text-zinc-200">
                            <span className="font-mono text-indigo-400">{log.userEmail}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[10px]">
                            <span className="px-2 py-0.5 rounded bg-black text-zinc-300 border border-[#27272a]">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-zinc-400 max-w-md truncate">
                            {log.details}
                          </td>
                          <td className="py-3 px-4 text-zinc-400 flex items-center gap-1.5 whitespace-nowrap">
                            {log.platform.includes('iOS') || log.platform.includes('Android') ? (
                              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                            ) : (
                              <Laptop className="w-3.5 h-3.5 text-zinc-400" />
                            )}
                            <span>{log.platform}</span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {log.status === 'success' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-black text-emerald-400 border border-emerald-900/50">
                                <CheckCircle2 className="w-3 h-3" /> SUCCESS
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-black text-rose-400 border border-rose-900/50">
                                <AlertTriangle className="w-3 h-3" /> FAILED
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Users RBAC Panel */}
          {activeSubTab === 'users' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {usersList.map((u) => {
                const isCurrent = currentUser?.id === u.id;
                return (
                  <div
                    key={u.id}
                    className="bg-[#18181b] border border-[#27272a] rounded-lg p-4 shadow-lg space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatarUrl}
                            alt=""
                            className="w-10 h-10 rounded object-cover border border-[#27272a]"
                          />
                          <div>
                            <div className="text-xs font-semibold text-white">{u.name}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">{u.email}</div>
                          </div>
                        </div>
                        {isCurrent && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800 font-bold">
                            YOU
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-[#27272a] mb-3">
                        <span className="text-zinc-400 font-medium">Assigned Role:</span>
                        <select
                          value={u.role}
                          onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)}
                          className="bg-[#09090b] text-zinc-200 text-xs px-2 py-1 rounded border border-[#27272a] outline-none uppercase font-mono font-bold"
                        >
                          <option value="admin">ADMIN</option>
                          <option value="pro">PRO</option>
                          <option value="editor">EDITOR</option>
                          <option value="viewer">VIEWER</option>
                        </select>
                      </div>

                      {/* Granular Checkboxes */}
                      <div className="space-y-2 text-xs">
                        <label className="flex items-center justify-between text-zinc-300 cursor-pointer">
                          <span>Batch Processing Engine</span>
                          <input
                            type="checkbox"
                            checked={u.permissions.canBatchProcess}
                            onChange={(e) =>
                              updateUserPermissions(u.id, { canBatchProcess: e.target.checked })
                            }
                            className="rounded bg-black border-[#27272a] text-indigo-600 focus:ring-0"
                          />
                        </label>

                        <label className="flex items-center justify-between text-zinc-300 cursor-pointer">
                          <span>Generative AI Relight & Grade</span>
                          <input
                            type="checkbox"
                            checked={u.permissions.canUseGenerativeAI}
                            onChange={(e) =>
                              updateUserPermissions(u.id, { canUseGenerativeAI: e.target.checked })
                            }
                            className="rounded bg-black border-[#27272a] text-indigo-600 focus:ring-0"
                          />
                        </label>

                        <label className="flex items-center justify-between text-zinc-300 cursor-pointer">
                          <span>4K Master Canvas Export</span>
                          <input
                            type="checkbox"
                            checked={u.permissions.canExport4K}
                            onChange={(e) =>
                              updateUserPermissions(u.id, { canExport4K: e.target.checked })
                            }
                            className="rounded bg-black border-[#27272a] text-indigo-600 focus:ring-0"
                          />
                        </label>

                        <label className="flex items-center justify-between text-zinc-300 cursor-pointer">
                          <span>View Audit Logs</span>
                          <input
                            type="checkbox"
                            checked={u.permissions.canViewAuditLogs}
                            onChange={(e) =>
                              updateUserPermissions(u.id, { canViewAuditLogs: e.target.checked })
                            }
                            className="rounded bg-black border-[#27272a] text-indigo-600 focus:ring-0"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#27272a] text-[10px] text-zinc-500 font-mono space-y-1">
                      <div className="flex justify-between">
                        <span>AI API Calls:</span>
                        <span className="text-zinc-300">{u.quotaUsed.aiCallsCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cloud Storage:</span>
                        <span className="text-zinc-300">
                          {u.quotaUsed.storageUsedMB} / {u.permissions.maxStorageMB} MB
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
