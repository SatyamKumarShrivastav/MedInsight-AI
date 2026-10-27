/**
 * MedInsight AI — Activity Logs / Audit Trail
 * BioIntelliX | Team led by Mr. S. K. Shrivastav
 */
import React, { useState, useEffect } from 'react';
import {
  ClipboardList, Shield, RefreshCw, Search, Activity,
  LogIn, Upload, Brain, FlaskConical, AlertTriangle,
  FileText, Zap, BarChart3, MessageSquare, Settings,
} from 'lucide-react';
import { activityApi } from '../api/client';

const ACTION_META: Record<string, { color: string; Icon: any; label: string }> = {
  USER_LOGIN:       { color: 'text-sky-400 bg-sky-400/10',      Icon: LogIn,          label: 'Login' },
  USER_LOGOUT:      { color: 'text-slate-400 bg-slate-400/10',  Icon: LogIn,          label: 'Logout' },
  DATASET_UPLOAD:   { color: 'text-cyan-400 bg-cyan-400/10',    Icon: Upload,         label: 'Dataset Upload' },
  MODEL_TRAINED:    { color: 'text-violet-400 bg-violet-400/10',Icon: Brain,          label: 'Model Trained' },
  PREDICTION_MADE:  { color: 'text-teal-400 bg-teal-400/10',    Icon: Zap,            label: 'Prediction' },
  QUALITY_ANALYSIS: { color: 'text-emerald-400 bg-emerald-400/10', Icon: BarChart3,   label: 'Quality Analysis' },
  REPORT_GENERATED: { color: 'text-yellow-400 bg-yellow-400/10',Icon: FileText,       label: 'Report Generated' },
  ANOMALY_DETECTION:{ color: 'text-red-400 bg-red-400/10',      Icon: AlertTriangle,  label: 'Anomaly Detection' },
  SIGNAL_ANALYSIS:  { color: 'text-cyan-400 bg-cyan-400/10',    Icon: Activity,       label: 'Signal Analysis' },
  DOCUMENT_UPLOAD:  { color: 'text-purple-400 bg-purple-400/10',Icon: Upload,         label: 'Document Upload' },
  DOCUMENT_QA:      { color: 'text-purple-400 bg-purple-400/10',Icon: MessageSquare,  label: 'Document Q&A' },
  XAI_EXPLAIN:      { color: 'text-orange-400 bg-orange-400/10',Icon: FlaskConical,   label: 'XAI Explain' },
  ADMIN_ROLE_CHANGE:{ color: 'text-rose-400 bg-rose-400/10',    Icon: Shield,         label: 'Role Change' },
  ADMIN_STATUS_CHANGE:{ color: 'text-rose-400 bg-rose-400/10', Icon: Settings,        label: 'Status Change' },
};

const DEMO_LOGS = [
  { id: 1, user_id: 1, action: 'USER_LOGIN',        resource_type: 'auth',      resource_id: null, created_at: '2026-10-22T10:00:00Z' },
  { id: 2, user_id: 1, action: 'DATASET_UPLOAD',    resource_type: 'dataset',   resource_id: '3',  created_at: '2026-10-22T10:02:11Z' },
  { id: 3, user_id: 1, action: 'QUALITY_ANALYSIS',  resource_type: 'quality',   resource_id: '3',  created_at: '2026-10-22T10:03:45Z' },
  { id: 4, user_id: 1, action: 'MODEL_TRAINED',     resource_type: 'ml_model',  resource_id: '7',  created_at: '2026-10-22T10:08:30Z' },
  { id: 5, user_id: 1, action: 'PREDICTION_MADE',   resource_type: 'prediction',resource_id: '12', created_at: '2026-10-22T10:09:00Z' },
  { id: 6, user_id: 1, action: 'XAI_EXPLAIN',       resource_type: 'xai',       resource_id: '7',  created_at: '2026-10-22T10:09:45Z' },
  { id: 7, user_id: 1, action: 'SIGNAL_ANALYSIS',   resource_type: 'signal',    resource_id: '2',  created_at: '2026-10-22T10:12:00Z' },
  { id: 8, user_id: 1, action: 'REPORT_GENERATED',  resource_type: 'report',    resource_id: '5',  created_at: '2026-10-22T10:15:00Z' },
  { id: 9, user_id: 2, action: 'DOCUMENT_UPLOAD',   resource_type: 'document',  resource_id: '8',  created_at: '2026-10-22T10:18:20Z' },
  { id:10, user_id: 2, action: 'DOCUMENT_QA',        resource_type: 'document',  resource_id: '8',  created_at: '2026-10-22T10:19:00Z' },
];

export default function ActivityLogs() {
  const [logs, setLogs]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('');
  const [total, setTotal]     = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const [lRes, cRes] = await Promise.all([
        activityApi.list(0, 100),
        activityApi.count(),
      ]);
      setLogs(lRes.data);
      setTotal(cRes.data.total);
    } catch {
      setLogs(DEMO_LOGS);
      setTotal(DEMO_LOGS.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter
    ? logs.filter(l =>
        l.action.toLowerCase().includes(filter.toLowerCase()) ||
        (l.resource_type || '').toLowerCase().includes(filter.toLowerCase()) ||
        String(l.user_id).includes(filter))
    : logs;

  // Stats
  const actionCounts: Record<string, number> = {};
  logs.forEach(l => { actionCounts[l.action] = (actionCounts[l.action] || 0) + 1; });
  const topAction = Object.entries(actionCounts).sort((a,b) => b[1]-a[1])[0];
  const uniqueUsers = new Set(logs.map(l => l.user_id)).size;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ClipboardList size={24} className="text-brand-400" />
            Audit Logs
          </h1>
          <p className="page-subtitle">{total} total platform events recorded</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-red flex items-center gap-1 text-xs">
            <Shield size={11} /> Admin Only
          </span>
          <button onClick={load} className="btn-secondary gap-2 text-xs">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: total, color: 'text-brand-400' },
          { label: 'Unique Users', value: uniqueUsers, color: 'text-cyan-400' },
          { label: 'Showing', value: filtered.length, color: 'text-emerald-400' },
          { label: 'Top Action', value: topAction ? ACTION_META[topAction[0]]?.label || topAction[0] : '—', color: 'text-yellow-400', small: true },
        ].map(stat => (
          <div key={stat.label} className="glass-card p-4 text-center">
            <div className={`text-2xl font-bold ${stat.color} ${stat.small ? 'text-sm' : ''}`}>
              {stat.value}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="glass-card p-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input-field pl-9"
            placeholder="Filter by action, resource type, or user ID…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card p-5">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-3">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-slate-400 text-sm">Loading audit trail…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <ClipboardList size={40} className="mx-auto mb-3 text-slate-700" />
            <p>No activity matching your filter.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User&nbsp;ID</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Resource&nbsp;ID</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => {
                  const meta = ACTION_META[log.action];
                  const Icon = meta?.Icon || Activity;
                  return (
                    <tr key={i}>
                      <td className="font-mono text-xs text-slate-400 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="text-xs">
                        <span className="badge badge-blue"># {log.user_id}</span>
                      </td>
                      <td>
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${meta?.color || 'text-slate-400 bg-slate-400/10'}`}>
                          <Icon size={10} />
                          {meta?.label || log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="text-xs text-slate-400 capitalize">{log.resource_type || '—'}</td>
                      <td className="font-mono text-xs">
                        {log.resource_id ? `#${log.resource_id}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-xs text-slate-600 text-center">
        BioIntelliX MedInsight AI — Audit logs are retained for compliance and research accountability.
      </div>
    </div>
  );
}
