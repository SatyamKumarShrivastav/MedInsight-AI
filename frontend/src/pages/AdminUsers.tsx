/**
 * MedInsight AI — Admin User Management & Super Admin (CEO) Governance
 * BioIntelliX | Team led by Mr. S. K. Shrivastav
 * From Biomedical Data to Intelligent Insight.
 */
import React, { useState, useEffect } from 'react';
import {
  Users, Shield, RefreshCw, Trash2, ToggleLeft, ToggleRight,
  Search, UserCog, AlertTriangle, CheckCircle2, Edit2, Lock,
  Check, X, KeyRound, ExternalLink, Globe, IdCard, Briefcase,
  GraduationCap, MapPin, Building, Crown, Sliders, Sparkles,
  Info, ShieldAlert, CheckCircle
} from 'lucide-react';
import { adminApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

const ASSIGNABLE_ROLES = ['RESEARCHER', 'STUDENT', 'STAFF', 'CITIZEN', 'ADMIN'];

const ROLE_BADGE: Record<string, string> = {
  CEO:        'text-amber-200 bg-amber-500/25 border border-amber-400/60 shadow-sm font-bold',
  ADMIN:      'text-rose-300 bg-rose-500/15 border border-rose-500/30 font-semibold',
  RESEARCHER: 'text-violet-300 bg-violet-500/15 border border-violet-500/30',
  STUDENT:    'text-sky-300 bg-sky-500/15 border border-sky-500/30',
  STAFF:      'text-amber-300 bg-amber-500/15 border border-amber-500/30',
  CITIZEN:    'text-emerald-300 bg-emerald-500/15 border border-emerald-500/30',
};

export default function AdminUsers() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [governance, setGovernance] = useState<any>(null);
  const [maxAdminsInput, setMaxAdminsInput] = useState<number>(5);
  const [updatingQuota, setUpdatingQuota] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Editing modal state
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Deleting user modal
  const [deletingUser, setDeletingUser] = useState<any | null>(null);

  const isCurrentCallerCEO = currentAdmin?.role === 'CEO';

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersRes, govRes] = await Promise.all([
        adminApi.listUsers(0, 100),
        adminApi.getGovernance().catch(() => ({ data: null })),
      ]);
      setUsers(usersRes.data);
      if (govRes && govRes.data) {
        setGovernance(govRes.data);
        setMaxAdminsInput(govRes.data.max_admins || 5);
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Admin access required or API unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Update Max Admins Quota (Only CEO)
  const handleUpdateMaxAdmins = async () => {
    if (!isCurrentCallerCEO) {
      setError('Only the CEO (Satyam Kumar Shrivastav) can configure the maximum number of administrators.');
      return;
    }
    if (maxAdminsInput < 1 || maxAdminsInput > 100) {
      setError('Administrator quota must be between 1 and 100.');
      return;
    }
    setUpdatingQuota(true);
    try {
      const res = await adminApi.updateMaxAdmins(maxAdminsInput);
      showToast(res.data.message || 'Administrator limit updated by CEO.');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to update admin quota.');
    } finally {
      setUpdatingQuota(false);
    }
  };

  // Password Approval Actions
  const approvePassword = async (u: any) => {
    if (u.role === 'ADMIN' && !isCurrentCallerCEO) {
      setError("Updating an Administrator's password requires approval from the CEO (Satyam Kumar Shrivastav).");
      return;
    }
    try {
      const res = await adminApi.approvePassword(u.id);
      showToast(res.data.message || `Password approved for ${u.username}.`);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to approve password.');
    }
  };

  const rejectPassword = async (u: any) => {
    if (u.role === 'ADMIN' && !isCurrentCallerCEO) {
      setError("Managing an Administrator's password change requires approval from the CEO (Satyam Kumar Shrivastav).");
      return;
    }
    try {
      const res = await adminApi.rejectPassword(u.id);
      showToast(res.data.message || `Password change rejected for ${u.username}.`);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to reject password.');
    }
  };

  const toggleStatus = async (targetUser: any) => {
    if (targetUser.role === 'CEO') {
      setError('The Super Admin CEO account cannot be deactivated.');
      return;
    }
    if (targetUser.role === 'ADMIN' && !isCurrentCallerCEO) {
      setError('Only the CEO can deactivate an Administrator.');
      return;
    }
    try {
      await adminApi.updateStatus(targetUser.id, !targetUser.is_active);
      showToast(`User ${targetUser.is_active ? 'deactivated' : 'activated'}.`);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to update status.');
    }
  };

  const openEditModal = (u: any) => {
    // Check permission to edit:
    if (u.role === 'CEO' && !isCurrentCallerCEO) {
      setError('Access Denied: The Super Admin CEO profile (Satyam Kumar Shrivastav) can only be updated by the CEO himself.');
      return;
    }
    setEditingUser(u);
    setEditForm({
      full_name: u.full_name || '',
      role: u.role || 'STUDENT',
      institution: u.institution || '',
      department: u.department || '',
      degree_branch: u.degree_branch || '',
      address: u.address || '',
      country: u.country || '',
      identification_number: u.identification_number || '',
      bio: u.bio || '',
      is_active: u.is_active,
    });
    setAdminNewPassword('');
  };

  const saveUserEdits = async () => {
    if (!editingUser) return;
    setSavingEdit(true);
    setError('');
    try {
      // Validate role change to ADMIN requires CEO
      if (editForm.role === 'ADMIN' && editingUser.role !== 'ADMIN' && !isCurrentCallerCEO) {
        throw new Error('Adding or appointing a new Administrator requires CEO (Satyam Kumar Shrivastav) approval.');
      }
      await adminApi.updateUser(editingUser.id, editForm);

      // If admin specified a direct password reset
      if (adminNewPassword.trim()) {
        await adminApi.resetPassword(editingUser.id, adminNewPassword.trim());
      }

      showToast(`User @${editingUser.username} updated successfully.`);
      setEditingUser(null);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || e.message || 'Failed to update user.');
    } finally {
      setSavingEdit(false);
    }
  };

  const initiateDelete = (u: any) => {
    if (u.role === 'CEO') {
      setError('The Super Admin CEO (Satyam Kumar Shrivastav) account cannot be deleted.');
      return;
    }
    if (u.role === 'ADMIN' && !isCurrentCallerCEO) {
      setError('Only the CEO (Satyam Kumar Shrivastav) has authorization to delete an Administrator account.');
      return;
    }
    if (u.id === currentAdmin?.id) {
      setError('Cannot delete your own account from the administrator panel.');
      return;
    }
    setDeletingUser(u);
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    try {
      await adminApi.deleteUser(deletingUser.id);
      showToast(`User @${deletingUser.username} deleted permanently.`);
      setDeletingUser(null);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Delete failed.');
    }
  };

  const pendingPasswordUsers = users.filter(u => u.has_pending_password);

  const filtered = filter
    ? users.filter(u =>
        u.username.toLowerCase().includes(filter.toLowerCase()) ||
        u.email.toLowerCase().includes(filter.toLowerCase()) ||
        (u.full_name || '').toLowerCase().includes(filter.toLowerCase()) ||
        (u.identification_number || '').toLowerCase().includes(filter.toLowerCase()) ||
        (u.country || '').toLowerCase().includes(filter.toLowerCase()) ||
        (u.role || '').toLowerCase().includes(filter.toLowerCase()))
    : users;

  const stats = {
    total:    users.length,
    admins:   users.filter(u => u.role === 'ADMIN').length,
    active:   users.filter(u => u.is_active).length,
    pending:  pendingPasswordUsers.length,
    ceo:      users.find(u => u.role === 'CEO'),
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 alert-success flex items-center gap-2 text-sm shadow-xl animate-fade-in">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <UserCog size={24} className="text-brand-400" /> User Administration & Governance
          </h1>
          <p className="page-subtitle">Full administrative oversight & Super Admin CEO platform governance</p>
        </div>
        <div className="flex items-center gap-2">
          {isCurrentCallerCEO ? (
            <span className="badge bg-amber-500/20 text-amber-300 border border-amber-400/50 flex items-center gap-1.5 text-xs font-bold px-3 py-1">
              <Crown size={13} className="text-amber-400" /> Logged in as CEO (Satyam Kumar Shrivastav)
            </span>
          ) : (
            <span className="badge badge-red flex items-center gap-1 text-xs">
              <Shield size={11} /> Platform Administrator
            </span>
          )}
          <button onClick={load} className="btn-secondary gap-2 text-xs">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Super Admin CEO Governance Panel */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-surface-900 to-surface-900 border border-amber-500/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm tracking-wide uppercase">
              <Crown size={18} className="text-amber-400 animate-pulse" />
              <span>Super Administrator & CEO Governance</span>
              <span className="text-[10px] bg-amber-500/20 border border-amber-500/40 text-amber-200 px-2 py-0.5 rounded-full font-mono">
                Exclusive Single-Seat Authority
              </span>
            </div>
            <div className="text-xl font-extrabold text-white flex items-center gap-2">
              <span>Satyam Kumar Shrivastav</span>
              <span className="text-xs font-normal text-slate-400 font-mono">(@ceo · ceo@medinsight.ai)</span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Holds all platform rights, decides maximum administrator quotas, approves new administrators,
              governs admin password authorizations, and manages all platform user and administrator accounts.
              The CEO can update his own data at any time.
            </p>
          </div>

          {/* Quota & Admin Allocation */}
          <div className="bg-surface-950/80 p-4 rounded-xl border border-amber-500/30 flex flex-col sm:flex-row items-center gap-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-black text-amber-300">{governance?.max_admins ?? 5}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Max Admins Quota</div>
              </div>
              <div className="border-x border-white/10 px-3">
                <div className="text-xl font-black text-cyan-300">{governance?.current_active_admins ?? stats.admins}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Active Admins</div>
              </div>
              <div>
                <div className="text-xl font-black text-emerald-400">{governance?.available_admin_slots ?? 0}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Open Slots</div>
              </div>
            </div>

            {/* CEO Quota Configuration Controller */}
            {isCurrentCallerCEO ? (
              <div className="border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-4 flex flex-col gap-1.5 min-w-[190px]">
                <label className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                  <Sliders size={12} /> Set Admin Quota:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={maxAdminsInput}
                    onChange={e => setMaxAdminsInput(parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 bg-surface-800 border border-amber-500/40 rounded text-center text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={handleUpdateMaxAdmins}
                    disabled={updatingQuota}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded text-xs transition shadow-sm disabled:opacity-50"
                  >
                    {updatingQuota ? 'Saving…' : 'Apply'}
                  </button>
                </div>
                <span className="text-[9.5px] text-slate-400">Decided exclusively by CEO</span>
              </div>
            ) : (
              <div className="border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-4 text-[11px] text-slate-400">
                <span className="text-amber-300 font-semibold block">CEO Regulated Quota</span>
                Configurable only by Satyam Kumar Shrivastav
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Accounts', value: stats.total, color: 'text-brand-400' },
          { label: 'Active Users', value: stats.active, color: 'text-emerald-400' },
          { label: 'Platform Admins', value: stats.admins, color: 'text-rose-400' },
          { label: 'Pending Passwords', value: stats.pending, color: stats.pending > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pending Password Approval Notice / Action Board */}
      {pendingPasswordUsers.length > 0 && (
        <div className="glass-card p-5 border border-amber-500/30 bg-amber-950/20 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
              <KeyRound size={16} className="text-amber-400" />
              <span>Pending Password Change Requests ({pendingPasswordUsers.length})</span>
            </div>
            <span className="text-[11px] text-amber-400/90 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Users change password after Admin/CEO Approval
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Review submitted user password change requests. For updating an Administrator's password,
            <strong className="text-amber-300"> CEO (Satyam Kumar Shrivastav) approval is required</strong>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {pendingPasswordUsers.map(u => {
              const isAdminTarget = u.role === 'ADMIN';
              const canApproveThis = !isAdminTarget || isCurrentCallerCEO;

              return (
                <div key={u.id} className="p-3.5 rounded-xl bg-surface-900/90 border border-amber-500/20 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">{u.full_name || u.username}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${ROLE_BADGE[u.role]}`}>{u.role}</span>
                      {isAdminTarget && (
                        <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          CEO Approval Required
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">{u.email}</div>
                    <div className="text-[10px] text-amber-400 mt-0.5">
                      Requested: {u.pending_password_requested_at ? new Date(u.pending_password_requested_at).toLocaleString() : 'Recently'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {canApproveThis ? (
                      <>
                        <button
                          onClick={() => approvePassword(u)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition shadow-sm"
                          title="Approve Password Change"
                        >
                          <Check size={12} /> Approve
                        </button>
                        <button
                          onClick={() => rejectPassword(u)}
                          className="px-2.5 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-800 text-red-200 text-xs font-semibold flex items-center gap-1 transition border border-red-500/30"
                          title="Reject Password Request"
                        >
                          <X size={12} /> Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-[10.5px] text-amber-300 italic px-2 py-1 bg-amber-500/10 rounded border border-amber-500/30">
                        CEO Only
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="alert-error flex items-center gap-2">
          <AlertTriangle size={14} className="flex-shrink-0" /> {error}
        </div>
      )}

      {/* Search & Filter */}
      <div className="glass-card p-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input-field pl-9"
            placeholder="Search by username, email, full name, ID number, country, or role…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
      </div>

      {/* User Data Table */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title text-sm">All Platform Accounts ({filtered.length})</h2>
          <span className="text-xs text-slate-500">
            {isCurrentCallerCEO ? 'CEO Full Access: Edit or delete any account' : 'Admin Access: Edit users; CEO controls administrators'}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-slate-400 text-sm">Loading users…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Users size={40} className="mx-auto mb-3 text-slate-700" />
            <p>No user accounts matched the search criteria.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User & ID Number</th>
                  <th>Role</th>
                  <th>Department / Degree / Address</th>
                  <th>Country</th>
                  <th>Status</th>
                  <th>Security Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const isCEO = u.role === 'CEO';
                  const isAdmin = u.role === 'ADMIN';
                  const canEdit = isCurrentCallerCEO || (!isCEO && u.id !== currentAdmin?.id) || u.id === currentAdmin?.id;
                  const canDelete = isCurrentCallerCEO ? (!isCEO && u.id !== currentAdmin?.id) : (!isCEO && !isAdmin && u.id !== currentAdmin?.id);

                  return (
                    <tr
                      key={u.id}
                      className={`transition ${isCEO ? 'bg-amber-950/20 hover:bg-amber-950/30' : 'hover:bg-white/3'}`}
                    >
                      <td className="font-mono text-xs text-slate-500">
                        {isCEO ? <Crown size={14} className="text-amber-400 inline mr-1" /> : `#${u.id}`}
                      </td>
                      <td>
                        <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                          <span>{u.full_name || u.username}</span>
                          {isCEO && (
                            <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                              Founder & CEO
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                        {u.identification_number && (
                          <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                            ID: {u.identification_number}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${ROLE_BADGE[u.role] || 'bg-surface-700 text-slate-300'}`}>
                          {u.role === 'CEO' ? '👑 CEO' : u.role}
                        </span>
                      </td>
                      <td className="text-xs text-slate-300 max-w-[200px] truncate">
                        {u.role === 'STUDENT' && (u.degree_branch || u.institution || '—')}
                        {(u.role === 'RESEARCHER' || u.role === 'STAFF') && (
                          u.department ? `${u.department} (${u.institution || '—'})` : (u.institution || '—')
                        )}
                        {u.role === 'CITIZEN' && (u.address || '—')}
                        {u.role === 'ADMIN' && (u.institution || 'System Administrator')}
                        {u.role === 'CEO' && (u.department || 'Executive Leadership & Strategy')}
                      </td>
                      <td className="text-xs text-slate-400">{u.country || '—'}</td>
                      <td>
                        {isCEO ? (
                          <span className="badge bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px]">
                            Always Active
                          </span>
                        ) : (
                          <button
                            onClick={() => toggleStatus(u)}
                            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-all ${
                              u.is_active
                                ? 'text-emerald-300 bg-emerald-500/15 hover:bg-red-500/15 hover:text-red-300'
                                : 'text-red-300 bg-red-500/15 hover:bg-emerald-500/15 hover:text-emerald-300'
                            }`}
                          >
                            {u.is_active ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                            {u.is_active ? 'Active' : 'Inactive'}
                          </button>
                        )}
                      </td>
                      <td>
                        {u.has_pending_password ? (
                          <span className="badge badge-amber text-[10px] flex items-center gap-1 animate-pulse">
                            <KeyRound size={10} /> Password Pending
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">Normal</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(u)}
                            disabled={isCEO && !isCurrentCallerCEO}
                            className="px-2 py-1 rounded bg-surface-700 hover:bg-brand-600 text-slate-200 hover:text-white text-xs flex items-center gap-1 transition disabled:opacity-30 disabled:cursor-not-allowed"
                            title={isCEO && !isCurrentCallerCEO ? 'CEO profile can only be edited by CEO' : 'Edit account data'}
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                          <button
                            onClick={() => initiateDelete(u)}
                            disabled={!canDelete}
                            className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition disabled:opacity-20 disabled:cursor-not-allowed"
                            title={
                              isCEO
                                ? 'The Super Admin CEO account cannot be deleted'
                                : isAdmin && !isCurrentCallerCEO
                                ? 'Only CEO has authorization to delete Administrator accounts'
                                : u.id === currentAdmin?.id
                                ? 'Cannot delete your own account from here'
                                : 'Delete user permanently'
                            }
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card max-w-xl w-full p-6 border border-brand-500/30 space-y-4 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 size={18} className="text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  {editingUser.role === 'CEO' ? 'Edit CEO Profile (Satyam Kumar Shrivastav)' : `Edit User @${editingUser.username}`}
                </h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label-text">Full Name</label>
                  <input
                    className="input-field"
                    value={editForm.full_name}
                    onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label-text">Platform Role</label>
                  {editingUser.role === 'CEO' ? (
                    <div className="input-field bg-amber-500/10 border-amber-500/30 text-amber-300 font-bold flex items-center gap-1.5 cursor-not-allowed">
                      <Crown size={14} /> Super Admin (CEO) · Fixed Authority
                    </div>
                  ) : (
                    <select
                      className="input-field"
                      value={editForm.role}
                      onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                    >
                      {ASSIGNABLE_ROLES.map(r => {
                        const isPromotingToAdmin = r === 'ADMIN' && editingUser.role !== 'ADMIN';
                        const disabled = isPromotingToAdmin && !isCurrentCallerCEO;
                        return (
                          <option
                            key={r}
                            value={r}
                            disabled={disabled}
                            className="bg-surface-900 text-white"
                          >
                            {r} {disabled ? '(Requires CEO Approval)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  )}
                  {editForm.role === 'ADMIN' && editingUser.role !== 'ADMIN' && (
                    <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                      <Info size={11} /> Appointing an Administrator consumes 1 quota slot authorized by CEO.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label-text">Country</label>
                  <input
                    className="input-field"
                    value={editForm.country}
                    onChange={e => setEditForm({ ...editForm, country: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label-text">Identification ID (1–25 alphanumeric)</label>
                  <input
                    className="input-field"
                    maxLength={25}
                    value={editForm.identification_number}
                    onChange={e => setEditForm({ ...editForm, identification_number: e.target.value })}
                  />
                </div>
              </div>

              {/* Department */}
              {(editForm.role === 'RESEARCHER' || editForm.role === 'STAFF' || editForm.role === 'CEO') && (
                <div>
                  <label className="label-text">Department</label>
                  <input
                    className="input-field"
                    value={editForm.department}
                    onChange={e => setEditForm({ ...editForm, department: e.target.value })}
                  />
                </div>
              )}

              {/* Degree & Branch */}
              {editForm.role === 'STUDENT' && (
                <div>
                  <label className="label-text">Degree & Branch</label>
                  <input
                    className="input-field"
                    value={editForm.degree_branch}
                    onChange={e => setEditForm({ ...editForm, degree_branch: e.target.value })}
                  />
                </div>
              )}

              {/* Address or Institution */}
              {editForm.role === 'CITIZEN' ? (
                <div>
                  <label className="label-text">Residential Address</label>
                  <textarea
                    rows={2}
                    className="input-field resize-none"
                    value={editForm.address}
                    onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                  />
                </div>
              ) : (
                <div>
                  <label className="label-text">Institution / Organization</label>
                  <input
                    className="input-field"
                    value={editForm.institution}
                    onChange={e => setEditForm({ ...editForm, institution: e.target.value })}
                  />
                </div>
              )}

              <div>
                <label className="label-text">Bio / Administrative Notes</label>
                <textarea
                  rows={2}
                  className="input-field resize-none"
                  value={editForm.bio}
                  onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                />
              </div>

              {/* Direct Admin Password Reset */}
              <div className="p-3 rounded-lg bg-surface-800/80 border border-white/10 space-y-2">
                <label className="label-text text-amber-300 flex items-center gap-1.5 font-semibold">
                  <KeyRound size={13} /> Direct Password Reset (Optional)
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Leave empty to keep existing password, or enter new password"
                  value={adminNewPassword}
                  onChange={e => setAdminNewPassword(e.target.value)}
                />
                <p className="text-[10px] text-slate-500">
                  {editingUser.role === 'ADMIN' && !isCurrentCallerCEO
                    ? "Resetting an Administrator's password directly requires CEO approval."
                    : "Directly reset and activate this account's password immediately."}
                </p>
              </div>

              {/* Active Toggle */}
              {editingUser.role !== 'CEO' && (
                <div className="flex items-center gap-3 pt-1">
                  <label className="label-text mb-0">Account Active:</label>
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${
                      editForm.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    {editForm.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button
                onClick={() => setEditingUser(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                onClick={saveUserEdits}
                disabled={savingEdit}
                className="btn-primary text-xs"
              >
                {savingEdit ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 border border-red-500/40 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold text-white">Delete User Account</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to permanently delete user <strong className="text-white">@{deletingUser.username}</strong> ({deletingUser.email})?
              All associated experiment history, activity logs, and personal settings will be permanently removed.
            </p>
            {deletingUser.role === 'ADMIN' && (
              <div className="p-3 bg-red-950/40 border border-red-500/30 rounded text-xs text-red-300">
                Notice: Deleting an Administrator account is executed under Super Admin CEO authority.
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingUser(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs flex items-center gap-2 transition"
              >
                Yes, Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer credit */}
      <div className="text-center text-xs text-slate-500 pt-4 border-t border-white/5 space-y-1">
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          <span>Developed by <strong className="text-slate-300">BioIntelliX</strong> (Team led by</span>
          <a
            href="https://www.linkedin.com/in/s-k-shrivastav/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-200 font-semibold underline underline-offset-2 inline-flex items-center gap-1 transition-colors"
          >
            Mr. S. K. Shrivastav
            <ExternalLink size={11} />
          </a>
          <span>)</span>
        </div>
        <div className="text-[11px] text-slate-600">© 2026, all right reserved</div>
      </div>
    </div>
  );
}
