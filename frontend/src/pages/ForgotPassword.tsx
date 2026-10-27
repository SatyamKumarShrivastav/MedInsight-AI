/**
 * MedInsight AI — Forgot/Reset Password Pages
 * BioIntelliX | Team led by Mr. S. K. Shrivastav
 */
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { HeartPulse, Mail, Lock, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { authApi } from '../api/client';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{msg: string; token?: string} | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setResult(null); setLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      setResult({ msg: res.data.message, token: res.data.dev_reset_token });
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Request failed.');
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
          <h1 className="text-2xl font-bold text-white">Forgot Password</h1>
          <p className="text-slate-400 text-sm mt-1">We'll send a reset link to your email</p>
        </div>

        <div className="glass-card p-8">
          {error && <div className="alert-error flex items-center gap-2 mb-5"><AlertCircle size={16}/>{error}</div>}
          {result ? (
            <div className="space-y-4">
              <div className="alert-success flex items-start gap-2">
                <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
                <span>{result.msg}</span>
              </div>
              {result.token && (
                <div className="alert-info text-xs">
                  <strong>Development mode — Reset token:</strong>
                  <code className="block mt-1 font-mono bg-surface-900 px-2 py-1 rounded text-cyan-300 break-all">{result.token}</code>
                  <Link to={`/reset-password?token=${result.token}`} className="mt-2 btn-primary text-xs inline-flex">
                    Reset Password Now
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label-text">Registered Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input id="forgot-email" type="email" required value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input-field pl-9" placeholder="you@research.edu" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                {loading ? <><span className="spinner"/>Sending…</> : 'Send Reset Link'}
              </button>
            </form>
          )}
          <Link to="/login" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 mt-5 justify-center">
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return <ForgotPassword />;
}
