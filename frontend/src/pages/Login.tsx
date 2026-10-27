/**
 * MedInsight AI — Login Page
 * BioIntelliX | Team led by Mr. S. K. Shrivastav
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartPulse, Mail, Lock, Eye, EyeOff, AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-900 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-hero-gradient relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-glow-blue pointer-events-none" />
        <div className="relative text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center mx-auto mb-6 shadow-glow">
            <HeartPulse size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3">MedInsight AI</h1>
          <p className="text-brand-200 text-lg mb-2">BioIntelliX Platform</p>
          <p className="text-slate-400 text-sm italic">"From Biomedical Data to Intelligent Insight."</p>
          <div className="mt-10 space-y-3 text-left max-w-xs mx-auto">
            {['Explainable AI with SHAP', 'Biomedical Signal Analysis', 'Research Document Q&A', 'Secure Role-Based Access'].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center">
              <HeartPulse size={22} className="text-white" />
            </div>
            <span className="text-lg font-bold text-white">MedInsight AI</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
          <p className="text-slate-400 text-sm mb-6">Sign in to your research account</p>

          {error && (
            <div className="alert-error flex items-center gap-2 mb-6">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-text">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input-field pl-10"
                  placeholder="you@research.edu"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="label-text flex items-center justify-between">
                Password
                <Link to="/forgot-password" className="text-brand-400 hover:text-brand-300 text-xs">Forgot password?</Link>
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" id="login-submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? <><span className="spinner" />Signing in…</> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            No account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">Create one</Link>
          </p>

          <div className="mt-8 pt-6 border-t border-white/8 text-center">
            <p className="text-xs text-slate-300 flex items-center justify-center gap-1.5 flex-wrap">
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
            <p className="text-[11px] text-slate-500 mt-1.5">© 2026, all right reserved</p>
          </div>
        </div>
      </div>
    </div>
  );
}
