/**
 * MedInsight AI — Data Quality Page
 * BioIntelliX | Team led by Mr. S. K. Shrivastav
 */
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Play, AlertCircle, CheckCircle2, AlertTriangle, BarChart3, RefreshCw } from 'lucide-react';
import { datasetsApi, qualityApi } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function QualityScore({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400';
  const bg = score >= 80 ? 'bg-emerald-900/30' : score >= 60 ? 'bg-yellow-900/30' : 'bg-red-900/30';
  const barColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div className={`glass-card p-6 text-center ${bg}`}>
      <div className={`text-5xl font-extrabold ${color}`}>{score.toFixed(1)}</div>
      <div className="text-sm text-slate-400 mt-1">Quality Score / 100</div>
      <div className="mt-3 h-2 bg-surface-900 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: barColor }} />
      </div>
      <div className="text-xs text-slate-600 mt-2">Score = 100 − (missing penalty + duplicate penalty + issue penalties)</div>
    </div>
  );
}

export default function DataQuality() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDs, setSelectedDs] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    datasetsApi.list().then(r => setDatasets(r.data)).catch(() => setError('Failed to load datasets'));
  }, []);

  const runAnalysis = async () => {
    if (!selectedDs) return;
    setRunning(true); setError(''); setResult(null);
    try {
      const r = await qualityApi.run(selectedDs);
      setResult(r.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Analysis failed');
    } finally { setRunning(false); }
  };

  const missingData = result?.column_quality
    ?.filter((c: any) => c.null_pct > 0)
    .sort((a: any, b: any) => b.null_pct - a.null_pct)
    .slice(0, 15)
    .map((c: any) => ({ name: c.name, missing: c.null_pct })) || [];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Data Quality Engine</h1>
        <p className="page-subtitle">Detect missing values, duplicates, outliers, and schema issues</p>
      </div>

      {/* Controls */}
      <div className="glass-card p-5 flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="label-text">Select Dataset</label>
          <select className="select-field" value={selectedDs ?? ''} onChange={e => { setSelectedDs(Number(e.target.value)); setResult(null); }}>
            <option value="">— Choose a dataset —</option>
            {datasets.map(d => <option key={d.id} value={d.id}>{d.name} ({d.num_rows} rows)</option>)}
          </select>
        </div>
        <button onClick={runAnalysis} disabled={!selectedDs || running} className="btn-primary">
          {running ? <><span className="spinner"/>Analysing…</> : <><Play size={15}/>Run Quality Analysis</>}
        </button>
      </div>

      {error && <div className="alert-error flex items-center gap-2"><AlertCircle size={14}/>{error}</div>}

      {result && (
        <div className="space-y-6 animate-slide-up">
          {/* Score + overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <QualityScore score={result.quality_score} />
            <div className="glass-card p-5 space-y-3 md:col-span-2">
              <h2 className="section-title">Overview</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Rows', val: result.n_rows?.toLocaleString() },
                  { label: 'Total Columns', val: result.n_cols },
                  { label: 'Missing Cells', val: result.total_missing?.toLocaleString() },
                  { label: 'Duplicate Rows', val: result.duplicate_count },
                ].map(s => (
                  <div key={s.label} className="bg-surface-800/60 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-white">{s.val}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="text-sm text-slate-400">Missing overall: <span className="text-white font-medium">{result.missing_pct}%</span></div>
            </div>
          </div>

          {/* Issues & Warnings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="glass-card p-5">
              <h2 className="section-title flex items-center gap-2 mb-3"><AlertCircle size={16} className="text-red-400"/>Issues ({result.issues?.issues?.length || 0})</h2>
              {result.issues?.issues?.length === 0
                ? <div className="text-emerald-400 text-sm flex items-center gap-2"><CheckCircle2 size={14}/>No critical issues detected.</div>
                : result.issues?.issues?.map((iss: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-red-300 mb-2"><AlertCircle size={13} className="flex-shrink-0 mt-0.5"/>{iss}</div>
                  ))
              }
            </div>
            <div className="glass-card p-5">
              <h2 className="section-title flex items-center gap-2 mb-3"><AlertTriangle size={16} className="text-yellow-400"/>Warnings ({result.issues?.warnings?.length || 0})</h2>
              {result.issues?.warnings?.length === 0
                ? <div className="text-emerald-400 text-sm flex items-center gap-2"><CheckCircle2 size={14}/>No warnings.</div>
                : result.issues?.warnings?.map((w: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-yellow-300 mb-2"><AlertTriangle size={13} className="flex-shrink-0 mt-0.5"/>{w}</div>
                  ))
              }
            </div>
          </div>

          {/* Missing value chart */}
          {missingData.length > 0 && (
            <div className="glass-card p-5">
              <h2 className="section-title mb-4">Missing Values by Column (%)</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={missingData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => [`${v}%`, 'Missing']} contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                  <Bar dataKey="missing" radius={[0, 4, 4, 0]}>
                    {missingData.map((d: any, i: number) => <Cell key={i} fill={d.missing > 50 ? '#ef4444' : d.missing > 20 ? '#f59e0b' : '#3b82f6'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Column quality table */}
          <div className="glass-card p-5">
            <h2 className="section-title mb-4">Column-Level Quality</h2>
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr><th>Column</th><th>Type</th><th>Missing</th><th>Unique</th><th>Min</th><th>Max</th><th>Mean</th><th>Outliers</th><th>Status</th></tr></thead>
                <tbody>
                  {result.column_quality?.map((col: any) => (
                    <tr key={col.name}>
                      <td className="font-medium text-white">{col.name}</td>
                      <td><span className="badge badge-blue text-xs">{col.dtype}</span></td>
                      <td className={col.null_pct > 20 ? 'text-red-400 font-medium' : ''}>{col.null_pct}%</td>
                      <td>{col.unique_count?.toLocaleString() ?? '—'}</td>
                      <td className="font-mono text-xs">{col.min != null ? col.min.toFixed(2) : '—'}</td>
                      <td className="font-mono text-xs">{col.max != null ? col.max.toFixed(2) : '—'}</td>
                      <td className="font-mono text-xs">{col.mean != null ? col.mean.toFixed(2) : '—'}</td>
                      <td className="font-mono text-xs">{col.outlier_candidates ?? '—'}</td>
                      <td>
                        {col.is_constant ? <span className="badge badge-red">Constant</span>
                          : col.null_pct > 50 ? <span className="badge badge-red">High Missing</span>
                          : col.null_pct > 20 ? <span className="badge badge-yellow">Needs Review</span>
                          : <span className="badge badge-green">OK</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recommendations */}
          {result.recommendations?.length > 0 && (
            <div className="glass-card p-5">
              <h2 className="section-title mb-3">Recommendations</h2>
              <ul className="space-y-2">
                {result.recommendations.map((r: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle2 size={14} className="text-brand-400 flex-shrink-0 mt-0.5"/>{r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
