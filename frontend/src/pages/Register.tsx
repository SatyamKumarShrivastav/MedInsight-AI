/**
 * MedInsight AI — Register Page
 * BioIntelliX | Team led by Mr. S. K. Shrivastav
 * From Biomedical Data to Intelligent Insight.
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HeartPulse, Mail, Lock, User, Building, Eye, EyeOff,
  AlertCircle, CheckCircle2, ExternalLink, Globe, IdCard,
  Briefcase, GraduationCap, MapPin
} from 'lucide-react';
import { authApi } from '../api/client';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    username: '',
    full_name: '',
    role: 'STUDENT',
    department: '',
    degree_branch: '',
    institution: '',
    address: '',
    country: 'India',
    identification_number: '',
    password: '',
    confirmPassword: '',
  });

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const passwordRules = [
    { label: 'At least 8 characters', ok: form.password.length >= 8 },
    { label: 'One uppercase letter', ok: /[A-Z]/.test(form.password) },
    { label: 'One digit', ok: /\d/.test(form.password) },
  ];

  // Validate ID: alphanumeric, 1-25 characters
  const idRegex = /^[a-zA-Z0-9\s\-_]{1,25}$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!passwordRules.every(r => r.ok)) {
      setError('Password does not meet the complexity requirements.');
      return;
    }
    if (form.identification_number && !idRegex.test(form.identification_number)) {
      setError('ID must be 1–25 characters long and contain only letters and numbers (alphanumeric).');
      return;
    }

    setLoading(true);
    try {
      await authApi.register({
        email: form.email,
        username: form.username,
        full_name: form.full_name || undefined,
        role: form.role,
        department: (form.role === 'RESEARCHER' || form.role === 'STAFF') ? form.department : undefined,
        degree_branch: form.role === 'STUDENT' ? form.degree_branch : undefined,
        institution: form.role !== 'CITIZEN' ? form.institution : undefined,
        address: form.role === 'CITIZEN' ? form.address : (form.address || undefined),
        country: form.country || undefined,
        identification_number: form.identification_number || undefined,
        password: form.password,
      });

      setSuccess('Account created successfully! Redirecting to login…');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail) || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-6 py-12">
      <div className="w-full max-w-xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center mx-auto mb-3 shadow-glow">
            <HeartPulse size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Research Account</h1>
          <p className="text-slate-400 text-sm mt-1">Join MedInsight AI — BioIntelliX Platform</p>
        </div>

        <div className="glass-card p-7 sm:p-8">
          {error && (
            <div className="alert-error flex items-start gap-2 mb-5">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="alert-success flex items-center gap-2 mb-5">
              <CheckCircle2 size={16} className="flex-shrink-0" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account Role Selector */}
            <div>
              <label className="label-text">Select Account Role *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                {[
                  { value: 'STUDENT', label: 'Student', desc: 'Degree & Branch' },
                  { value: 'RESEARCHER', label: 'Researcher', desc: 'Lab & Dept' },
                  { value: 'STAFF', label: 'Staff', desc: 'Department' },
                  { value: 'CITIZEN', label: 'Citizen', desc: 'Address' },
                ].map(r => (
                  <button
                    type="button"
                    key={r.value}
                    onClick={() => setForm(f => ({ ...f, role: r.value }))}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      form.role === r.value
                        ? 'bg-brand-900/60 border-cyan-400 text-white shadow-glow'
                        : 'bg-surface-800/80 border-white/5 text-slate-400 hover:text-white hover:bg-surface-800'
                    }`}
                  >
                    <div className="text-xs font-semibold">{r.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Info: Username & Full Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-text">Username *</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="reg-username"
                    type="text"
                    required
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    className="input-field pl-9"
                    placeholder="e.g. satyam_research"
                    autoComplete="username"
                  />
                </div>
              </div>
              <div>
                <label className="label-text">Full Name</label>
                <input
                  id="reg-fullname"
                  type="text"
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. Satyam Shrivastav"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="label-text">Email Address *</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input-field pl-9"
                  placeholder="you@institution.edu"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Country and Identification ID (1-25 alphanumeric) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-text flex items-center gap-1.5">
                  <Globe size={13} className="text-cyan-400" /> Country *
                </label>
                <input
                  id="reg-country"
                  type="text"
                  required
                  value={form.country}
                  onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. India, USA, UK"
                />
              </div>
              <div>
                <label className="label-text flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <IdCard size={13} className="text-cyan-400" />
                    {form.role === 'STUDENT' && 'Student ID *'}
                    {form.role === 'RESEARCHER' && 'Researcher / Faculty ID *'}
                    {form.role === 'STAFF' && 'Staff / Employee ID *'}
                    {form.role === 'CITIZEN' && 'Voter / Aadhaar / National ID *'}
                  </span>
                  <span className="text-[10px] text-slate-500">1–25 alphanumeric</span>
                </label>
                <input
                  id="reg-id-number"
                  type="text"
                  required
                  maxLength={25}
                  value={form.identification_number}
                  onChange={e => setForm(f => ({ ...f, identification_number: e.target.value }))}
                  className="input-field"
                  placeholder={
                    form.role === 'STUDENT' ? 'e.g. 21BCE10425' :
                    form.role === 'STAFF' ? 'e.g. EMP88392' :
                    form.role === 'RESEARCHER' ? 'e.g. RES-2026-X' :
                    'e.g. 583920194821 or VOTER982'
                  }
                />
              </div>
            </div>

            {/* Conditional Role-Specific Fields */}
            {/* If Researcher or Staff -> Department */}
            {(form.role === 'RESEARCHER' || form.role === 'STAFF') && (
              <div>
                <label className="label-text flex items-center gap-1.5">
                  <Briefcase size={13} className="text-purple-400" /> Department *
                </label>
                <input
                  id="reg-department"
                  type="text"
                  required
                  value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. Biomedical Engineering, Cardiology, Clinical AI"
                />
              </div>
            )}

            {/* If Student -> Degree & Branch */}
            {form.role === 'STUDENT' && (
              <div>
                <label className="label-text flex items-center gap-1.5">
                  <GraduationCap size={13} className="text-sky-400" /> Degree & Branch *
                </label>
                <input
                  id="reg-degree-branch"
                  type="text"
                  required
                  value={form.degree_branch}
                  onChange={e => setForm(f => ({ ...f, degree_branch: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. B.Tech Biomedical Engineering, M.Sc Data Science"
                />
              </div>
            )}

            {/* If Citizen -> Replace Institution with Residential Address */}
            {form.role === 'CITIZEN' ? (
              <div>
                <label className="label-text flex items-center gap-1.5">
                  <MapPin size={13} className="text-emerald-400" /> Residential Address *
                </label>
                <textarea
                  id="reg-address"
                  required
                  rows={2}
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className="input-field resize-none"
                  placeholder="Enter your street, city, state, and postal code"
                />
              </div>
            ) : (
              <div>
                <label className="label-text flex items-center gap-1.5">
                  <Building size={13} className="text-slate-400" /> Institution / Organization *
                </label>
                <input
                  id="reg-institution"
                  type="text"
                  required
                  value={form.institution}
                  onChange={e => setForm(f => ({ ...f, institution: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. BioIntelliX Research Institute / AIIMS / MIT"
                />
              </div>
            )}

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-text">Password *</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="reg-password"
                    type={showPass ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="input-field pl-9 pr-9"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="label-text">Confirm Password *</label>
                <input
                  id="reg-confirm-password"
                  type="password"
                  required
                  value={form.confirmPassword}
                  onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  className="input-field"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {form.password && (
              <div className="flex flex-wrap gap-3 text-xs pt-1">
                {passwordRules.map(r => (
                  <div key={r.label} className={`flex items-center gap-1.5 ${r.ok ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle2 size={12} />
                    {r.label}
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              id="reg-submit"
              disabled={loading || !!success}
              className="btn-primary w-full justify-center py-3 mt-3 shadow-glow"
            >
              {loading ? <><span className="spinner" />Creating account…</> : 'Register Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          By registering you agree this platform is for academic and biomedical research only — not for clinical decisions.
        </p>

        <div className="mt-4 text-center">
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5 flex-wrap">
            <span>Developed by BioIntelliX (Team led by</span>
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
          </p>
          <p className="text-[11px] text-slate-500 mt-1">© 2026, all right reserved</p>
        </div>
      </div>
    </div>
  );
}
