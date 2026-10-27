/**
 * MedInsight AI — Profile & Account Settings
 * BioIntelliX | Team led by Mr. S. K. Shrivastav
 * From Biomedical Data to Intelligent Insight.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Save, Lock, Eye, EyeOff, CheckCircle2, AlertCircle,
  Building, Mail, Shield, LogOut, Camera, Globe, IdCard,
  Briefcase, GraduationCap, MapPin, Trash2, Clock, AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { authApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

const ROLE_STYLE: Record<string, string> = {
  CEO:        'text-amber-200 bg-amber-500/20 border border-amber-500/50 shadow-sm shadow-amber-500/10 font-bold',
  ADMIN:      'text-rose-300 bg-rose-500/15 border border-rose-500/30',
  RESEARCHER: 'text-violet-300 bg-violet-500/15 border border-violet-500/30',
  STUDENT:    'text-sky-300 bg-sky-500/15 border border-sky-500/30',
  STAFF:      'text-amber-300 bg-amber-500/15 border border-amber-500/30',
  CITIZEN:    'text-emerald-300 bg-emerald-500/15 border border-emerald-500/30',
};

export default function Profile() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: '',
    institution: '',
    department: '',
    degree_branch: '',
    address: '',
    country: '',
    identification_number: '',
    bio: '',
  });

  const [passForm, setPassForm] = useState({
    current_password: '',
    new_password: '',
    confirm: '',
  });

  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'profile' | 'security' | 'danger'>('profile');

  const toast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    if (type === 'ok') {
      setSuccess(msg);
      setError('');
    } else {
      setError(msg);
      setSuccess('');
    }
    setTimeout(() => { setSuccess(''); setError(''); }, 5000);
  };

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        institution: user.institution || '',
        department: (user as any).department || '',
        degree_branch: (user as any).degree_branch || '',
        address: (user as any).address || '',
        country: (user as any).country || '',
        identification_number: (user as any).identification_number || '',
        bio: (user as any).bio || '',
      });
    }
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await authApi.updateProfile({
        full_name: form.full_name || undefined,
        institution: form.institution || undefined,
        department: form.department || undefined,
        degree_branch: form.degree_branch || undefined,
        address: form.address || undefined,
        country: form.country || undefined,
        identification_number: form.identification_number || undefined,
        bio: form.bio || undefined,
      });
      await refreshUser();
      toast('Profile updated successfully.');
    } catch (e: any) {
      toast(e?.response?.data?.detail || 'Failed to update profile.', 'err');
    } finally {
      setSaving(false);
    }
  };

  const changePass = async () => {
    if (!passForm.current_password) {
      toast('Enter your current password.', 'err');
      return;
    }
    if (passForm.new_password.length < 8) {
      toast('New password must be at least 8 characters.', 'err');
      return;
    }
    if (passForm.new_password !== passForm.confirm) {
      toast('Passwords do not match.', 'err');
      return;
    }

    setChangingPass(true);
    setError('');
    setSuccess('');
    try {
      const res = await authApi.changePassword({
        current_password: passForm.current_password,
        new_password: passForm.new_password,
      });
      await refreshUser();
      toast(res.data.message || 'Password update processed successfully.');
      setPassForm({ current_password: '', new_password: '', confirm: '' });
    } catch (e: any) {
      toast(e?.response?.data?.detail || 'Failed to request password change.', 'err');
    } finally {
      setChangingPass(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await authApi.deleteMyAccount();
      logout();
      navigate('/login');
    } catch (e: any) {
      toast(e?.response?.data?.detail || 'Failed to delete account.', 'err');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const initials = user?.username?.[0]?.toUpperCase() || '?';
  const role = user?.role || 'STUDENT';
  const hasPendingPassword = (user as any)?.has_pending_password;
  const pendingDate = (user as any)?.pending_password_requested_at;

  return (
    <div className="p-6 max-w-3xl space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title flex items-center gap-2">
          <User size={24} className="text-brand-400" /> Profile & Account Settings
        </h1>
        <p className="page-subtitle">Manage your personal profile, credentials, and account lifecycle</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert-error flex items-center gap-2 text-sm shadow-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="alert-success flex items-center gap-2 text-sm shadow-sm">
          <CheckCircle2 size={16} className="flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Pending Password Notice Banner */}
      {hasPendingPassword && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <Clock size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200">
            <div className="font-semibold text-amber-300">Password Change Pending Administrator Approval</div>
            <p className="mt-0.5 text-amber-200/90 leading-relaxed">
              You submitted a request to change your password
              {pendingDate ? ` on ${new Date(pendingDate).toLocaleString()}` : ''}.
              Your new password will become active as soon as the platform Administrator reviews and approves the request.
              Your current password remains valid in the meantime.
            </p>
          </div>
        </div>
      )}

      {/* User Card */}
      <div className="glass-card p-5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white shadow-glow">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">{user?.full_name || user?.username}</h2>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${ROLE_STYLE[role] || 'bg-surface-700 text-slate-300'}`}>
                {role}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5 font-mono">@{user?.username} · {user?.email}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
              {form.country && <span className="flex items-center gap-1"><Globe size={11} /> {form.country}</span>}
              {form.identification_number && <span className="flex items-center gap-1"><IdCard size={11} /> ID: {form.identification_number}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="flex border-b border-white/10 gap-2">
        {[
          { id: 'profile', label: 'Profile Information', icon: <User size={13} /> },
          { id: 'security', label: 'Security & Password', icon: <Lock size={13} /> },
          { id: 'danger', label: 'Account Deletion', icon: <Trash2 size={13} /> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 ${
              tab === t.id
                ? 'border-brand-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="glass-card p-6 space-y-4">
          <h2 className="section-title text-sm">Personal & Academic Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-text">Full Name</label>
              <input
                className="input-field"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Dr. Satyam Shrivastav"
              />
            </div>
            <div>
              <label className="label-text flex items-center gap-1.5">
                <Globe size={13} className="text-cyan-400" /> Country
              </label>
              <input
                className="input-field"
                value={form.country}
                onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                placeholder="India, United States, etc."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-text flex items-center gap-1.5">
                <IdCard size={13} className="text-cyan-400" />
                Identification Number (1–25 characters)
              </label>
              <input
                className="input-field"
                maxLength={25}
                value={form.identification_number}
                onChange={e => setForm(f => ({ ...f, identification_number: e.target.value }))}
                placeholder="Student ID, Staff ID, Voter ID, Aadhaar"
              />
            </div>

            {/* Department (for Researcher or Staff) */}
            {(role === 'RESEARCHER' || role === 'STAFF') && (
              <div>
                <label className="label-text flex items-center gap-1.5">
                  <Briefcase size={13} className="text-purple-400" /> Department
                </label>
                <input
                  className="input-field"
                  value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  placeholder="Department of Biomedical Engineering"
                />
              </div>
            )}

            {/* Degree & Branch (for Student) */}
            {role === 'STUDENT' && (
              <div>
                <label className="label-text flex items-center gap-1.5">
                  <GraduationCap size={13} className="text-sky-400" /> Degree & Branch
                </label>
                <input
                  className="input-field"
                  value={form.degree_branch}
                  onChange={e => setForm(f => ({ ...f, degree_branch: e.target.value }))}
                  placeholder="B.Tech Biomedical Engineering"
                />
              </div>
            )}
          </div>

          {/* Address (for Citizen) or Institution (for others) */}
          {role === 'CITIZEN' ? (
            <div>
              <label className="label-text flex items-center gap-1.5">
                <MapPin size={13} className="text-emerald-400" /> Residential Address
              </label>
              <textarea
                className="input-field resize-none h-20"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Street address, City, State, Postal Code"
              />
            </div>
          ) : (
            <div>
              <label className="label-text flex items-center gap-1.5">
                <Building size={13} className="text-slate-400" /> Institution / Organization
              </label>
              <input
                className="input-field"
                value={form.institution}
                onChange={e => setForm(f => ({ ...f, institution: e.target.value }))}
                placeholder="University / Research Lab / Hospital"
              />
            </div>
          )}

          <div>
            <label className="label-text">Professional Bio / Research Focus</label>
            <textarea
              className="input-field resize-none h-24"
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Brief professional bio or biomedical research areas of interest…"
            />
          </div>

          <button onClick={saveProfile} disabled={saving} className="btn-primary">
            <Save size={14} /> {saving ? 'Saving changes…' : 'Save Profile Changes'}
          </button>
        </div>
      )}

      {/* Security Tab */}
      {tab === 'security' && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title text-sm flex items-center gap-2">
              <Lock size={15} className="text-yellow-400" /> Change Account Password
            </h2>
            <span className="badge badge-cyan text-[10px]">Governance Regulated</span>
          </div>

          <div className="p-3 rounded-lg bg-surface-800/80 border border-white/5 text-xs text-slate-300">
            {role === 'CEO' ? (
              <p className="text-amber-300">
                <strong>Super Admin CEO Authority:</strong> As Chief Executive Officer (Satyam Kumar Shrivastav), your password updates
                immediately upon submission without requiring any intermediate approval.
              </p>
            ) : role === 'ADMIN' ? (
              <p className="text-amber-200">
                <strong>Platform Governance Notice:</strong> In accordance with MedInsight AI security governance, updating an
                <strong className="text-amber-300"> Administrator password requires approval from the CEO (Satyam Kumar Shrivastav)</strong>.
              </p>
            ) : (
              <p>
                <strong>Security Protocol Notice:</strong> Users can change their password after
                <strong className="text-cyan-300"> Administrator approval</strong>. Once submitted, your request is reviewed
                by the platform Admin to safeguard sensitive biomedical datasets and prevent unauthorized account takeover.
              </p>
            )}
          </div>

          <div>
            <label className="label-text">Current Password *</label>
            <input
              type="password"
              className="input-field"
              value={passForm.current_password}
              onChange={e => setPassForm(f => ({ ...f, current_password: e.target.value }))}
              autoComplete="current-password"
              placeholder="Enter current password"
            />
          </div>

          <div>
            <label className="label-text">New Password *</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                className="input-field pr-10"
                value={passForm.new_password}
                onChange={e => setPassForm(f => ({ ...f, new_password: e.target.value }))}
                autoComplete="new-password"
                placeholder="At least 8 characters with uppercase and digit"
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {passForm.new_password && (
              <div className="flex gap-1 mt-1.5">
                {[
                  passForm.new_password.length >= 8,
                  /[A-Z]/.test(passForm.new_password),
                  /[0-9]/.test(passForm.new_password),
                ].map((ok, i) => (
                  <div key={i} className={`flex-1 h-1 rounded-full ${ok ? 'bg-emerald-500' : 'bg-surface-700'}`} />
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="label-text">Confirm New Password *</label>
            <input
              type="password"
              className="input-field"
              value={passForm.confirm}
              onChange={e => setPassForm(f => ({ ...f, confirm: e.target.value }))}
              autoComplete="new-password"
              placeholder="Confirm new password"
            />
            {passForm.confirm && passForm.new_password !== passForm.confirm && (
              <p className="text-xs text-red-400 mt-1">Passwords do not match.</p>
            )}
          </div>

          <button onClick={changePass} disabled={changingPass} className="btn-secondary">
            <Lock size={14} /> {changingPass ? 'Submitting request…' : 'Submit Password Change Request'}
          </button>
        </div>
      )}

      {/* Danger Zone: Account Deletion */}
      {tab === 'danger' && (
        <div className="glass-card p-6 border border-red-500/30 space-y-4">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle size={18} />
            <h2 className="text-base font-bold">Delete Account</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Users have the complete right to delete their personal account and associated credentials at any time.
            Permanently deleting your account will erase your login access and personal sessions from MedInsight AI.
          </p>
          {role === 'CEO' ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-2">
              <div className="font-semibold text-amber-300">Protected Super Admin Account</div>
              <p>
                The Super Admin CEO account (<strong>Satyam Kumar Shrivastav</strong>) is the root authority and foundation of the
                MedInsight AI platform. In accordance with system governance, this account cannot be deleted or deactivated.
              </p>
            </div>
          ) : (
            <>
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/20 text-xs text-red-300">
                Warning: This action is irreversible. If you are an administrator, ensure other administrators exist before deleting.
              </div>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-xs flex items-center gap-2 transition"
              >
                <Trash2 size={14} /> Delete My Account
              </button>
            </>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 border border-red-500/40 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold text-white">Confirm Account Deletion</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you absolutely sure you want to delete your account (<strong className="text-white">@{user?.username}</strong>)?
              You will be signed out immediately and all profile records will be permanently removed.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                onClick={deleteAccount}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs flex items-center gap-2 transition"
              >
                {deleting ? 'Deleting…' : 'Yes, Delete My Account'}
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
