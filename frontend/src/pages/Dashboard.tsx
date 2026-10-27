/**
 * MedInsight AI — Dashboard Page
 * BioIntelliX | Team led by Mr. S. K. Shrivastav
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Database, Brain, Crosshair, FileText, Activity, Dna,
  TrendingUp, BookOpen, RefreshCw, AlertCircle, ChevronRight, ExternalLink
} from 'lucide-react';
import { dashboardApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#06b6d4', '#14b8a6', '#8b5cf6', '#f59e0b'];

function StatCard({ icon, label, value, to, color = 'brand' }: any) {
  const colorMap: any = {
    brand: 'text-brand-400 bg-brand-900/30',
    cyan: 'text-cyan-400 bg-cyan-900/30',
    teal: 'text-teal-400 bg-teal-900/30',
    purple: 'text-purple-400 bg-purple-900/30',
    yellow: 'text-yellow-400 bg-yellow-900/30',
    red: 'text-red-400 bg-red-900/30',
    emerald: 'text-emerald-400 bg-emerald-900/30',
  };
  const cls = colorMap[color] || colorMap.brand;
  return (
    <Link to={to} className="stat-card glass-card-hover group cursor-pointer">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cls}`}>
        {icon}
      </div>
      <div className="metric-value">{value ?? '—'}</div>
      <div className="metric-label">{label}</div>
      <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 self-end mt-auto transition-colors" />
    </Link>
  );
}

function ActivityItem({ log }: { log: any }) {
  const actionColors: any = {
    USER_LOGIN: 'badge-blue', DATASET_UPLOAD: 'badge-cyan', MODEL_TRAINED: 'badge-purple',
    PREDICTION_MADE: 'badge-teal', QUALITY_ANALYSIS: 'badge-green', REPORT_GENERATED: 'badge-yellow',
    ANOMALY_DETECTION: 'badge-red', SIGNAL_ANALYSIS: 'badge-cyan', DOCUMENT_UPLOAD: 'badge-purple',
  };
  const cls = actionColors[log.action] || 'badge-blue';
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
      <span className={`${cls} flex-shrink-0`}>{log.action.replace(/_/g, ' ')}</span>
      <span className="text-xs text-slate-500 ml-auto flex-shrink-0">{new Date(log.created_at).toLocaleTimeString()}</span>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await dashboardApi.summary();
      setData(res.data);
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading dashboard…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-8"><div className="alert-error flex items-center gap-2"><AlertCircle size={16}/>{error}</div></div>
  );

  const stats = data?.stats || {};
  const recentActivity = data?.recent_activity || [];
  const formatDist = data?.dataset_format_distribution || [];
  const recentExps = data?.recent_experiments || [];

  const expStatusData = recentExps.reduce((acc: any, e: any) => {
    const s = String(e.status);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(expStatusData).map(([k, v]) => ({ name: k, value: v as number }));

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, <span className="text-white">{user?.full_name || user?.username}</span></p>
        </div>
        <button onClick={load} className="btn-secondary gap-2 text-xs">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Disclaimer banner */}
      <div className="alert-warning text-xs">
        ⚠ <strong>Research Platform:</strong> All outputs are model-generated research estimates. Not for clinical use. — MedInsight AI, BioIntelliX
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard icon={<Database size={20}/>} label="Datasets" value={stats.datasets} to="/datasets" color="brand" />
        <StatCard icon={<Brain size={20}/>} label="Trained Models" value={stats.trained_models} to="/ml-workbench" color="purple" />
        <StatCard icon={<Crosshair size={20}/>} label="Predictions" value={stats.predictions} to="/predictions" color="cyan" />
        <StatCard icon={<FileText size={20}/>} label="Reports" value={stats.reports} to="/reports" color="yellow" />
        <StatCard icon={<TrendingUp size={20}/>} label="Experiments" value={stats.experiments} to="/experiments" color="teal" />
        <StatCard icon={<Activity size={20}/>} label="Anomaly Jobs" value={stats.anomaly_jobs} to="/anomaly" color="red" />
        <StatCard icon={<Dna size={20}/>} label="Signal Jobs" value={stats.signal_jobs} to="/signals" color="emerald" />
        <StatCard icon={<BookOpen size={20}/>} label="Research Docs" value={stats.research_documents} to="/documents" color="brand" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Dataset format distribution */}
        <div className="glass-card p-5 lg:col-span-1">
          <h2 className="section-title mb-4">Dataset Formats</h2>
          {formatDist.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">No datasets uploaded yet.<br/><Link to="/datasets" className="text-brand-400 hover:underline text-xs mt-1 inline-block">Upload one →</Link></div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={formatDist} dataKey="count" nameKey="format" cx="50%" cy="50%" outerRadius={65} label={({ format, count }) => `${format}: ${count}`} labelLine={false}>
                  {formatDist.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent experiments */}
        <div className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Recent Experiments</h2>
            <Link to="/experiments" className="text-xs text-brand-400 hover:text-brand-300">View all →</Link>
          </div>
          {recentExps.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">No experiments yet.<br/><Link to="/ml-workbench" className="text-brand-400 hover:underline text-xs">Start training →</Link></div>
          ) : (
            <div className="space-y-2">
              {recentExps.map((e: any) => (
                <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-800/60 border border-white/5">
                  <Brain size={15} className="text-purple-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white truncate">{e.name}</div>
                    <div className="text-xs text-slate-500">{e.task_type} · {new Date(e.created_at).toLocaleDateString()}</div>
                  </div>
                  <span className={`badge ${e.status === 'COMPLETED' ? 'badge-green' : e.status === 'FAILED' ? 'badge-red' : 'badge-yellow'} flex-shrink-0`}>
                    {e.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Recent Activity</h2>
          <Link to="/activity" className="text-xs text-brand-400 hover:text-brand-300">View audit log →</Link>
        </div>
        {recentActivity.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-sm">No activity recorded yet.</div>
        ) : (
          <div>{recentActivity.map((log: any, i: number) => <ActivityItem key={i} log={log} />)}</div>
        )}
      </div>

      {/* Footer credit */}
      <div className="text-center text-xs text-slate-500 pt-4 pb-2 border-t border-white/5 space-y-1">
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
          <span>) | MedInsight AI v1.0.0</span>
        </div>
        <div className="text-[11px] text-slate-600">© 2026, all right reserved</div>
      </div>
    </div>
  );
}
