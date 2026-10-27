/**
 * MedInsight AI — Reset Password Page
 * BioIntelliX | Team led by Mr. S. K. Shrivastav
 */
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { HeartPulse, Lock, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { authApi } from '../api/client';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ token: params.get('token') || '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const res = await authApi.resetPassword(form.token, form.password);
      setSuccess(res.data.message);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-glow">
            <HeartPulse size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-slate-400 text-sm mt-1">Enter your new password</p>
        </div>
        <div className="glass-card p-8">
          {error && <div className="alert-error flex items-center gap-2 mb-5"><AlertCircle size={16}/>{error}</div>}
          {success && <div className="alert-success flex items-center gap-2 mb-5"><CheckCircle2 size={16}/>{success}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!params.get('token') && (
              <div>
                <label className="label-text">Reset Token</label>
                <input type="text" required value={form.token}
                  onChange={e => setForm(f => ({...f, token: e.target.value}))}
                  className="input-field font-mono text-xs" placeholder="Paste your reset token" />
              </div>
            )}
            <div>
              <label className="label-text">New Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="password" required value={form.password}
                  onChange={e => setForm(f => ({...f, password: e.target.value}))}
                  className="input-field pl-9" placeholder="Min 8 chars, 1 uppercase, 1 digit" />
              </div>
            </div>
            <div>
              <label className="label-text">Confirm Password</label>
              <input type="password" required value={form.confirm}
                onChange={e => setForm(f => ({...f, confirm: e.target.value}))}
                className="input-field" placeholder="Repeat new password" />
            </div>
            <button type="submit" disabled={loading || !!success} className="btn-primary w-full justify-center py-3">
              {loading ? <><span className="spinner"/>Resetting…</> : 'Reset Password'}
            </button>
          </form>
          <Link to="/login" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 mt-5 justify-center">
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
