/**
 * MedInsight AI — EDA Page
 * BioIntelliX | Team led by Mr. S. K. Shrivastav
 */
import React, { useState, useEffect } from 'react';
import { BarChart3, AlertCircle, RefreshCw } from 'lucide-react';
import { datasetsApi, edaApi } from '../api/client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, CartesianGrid, LineChart, Line,
  ComposedChart, Cell
} from 'recharts';

const COLORS = ['#3b82f6','#06b6d4','#14b8a6','#8b5cf6','#f59e0b','#ef4444','#10b981'];

function ChartCard({ title, children }: any) {
  return (
    <div className="glass-card p-5">
      <h3 className="section-title mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function EDA() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDs, setSelectedDs] = useState<number | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [histogram, setHistogram] = useState<any>(null);
  const [correlation, setCorrelation] = useState<any>(null);
  const [missing, setMissing] = useState<any>(null);
  const [valueCounts, setValueCounts] = useState<any>(null);
  const [selectedNumCol, setSelectedNumCol] = useState('');
  const [selectedCatCol, setSelectedCatCol] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { datasetsApi.list().then(r => setDatasets(r.data)).catch(() => {}); }, []);

  const loadEDA = async (dsId: number) => {
    setLoading(true); setError('');
    try {
      const [sumRes, corrRes, misRes] = await Promise.all([
        edaApi.summary(dsId),
        edaApi.correlation(dsId),
        edaApi.missingHeatmap(dsId),
      ]);
      setSummary(sumRes.data);
      setCorrelation(corrRes.data);
      setMissing(misRes.data);
      const numCols = Object.keys(sumRes.data.numeric_stats || {});
      const catCols = Object.keys(sumRes.data.categorical_stats || {});
      if (numCols[0]) {
        setSelectedNumCol(numCols[0]);
        const hRes = await edaApi.histogram(dsId, numCols[0]);
        setHistogram(hRes.data);
      }
      if (catCols[0]) {
        setSelectedCatCol(catCols[0]);
        const vcRes = await edaApi.valueCounts(dsId, catCols[0]);
        setValueCounts(vcRes.data);
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'EDA failed');
    } finally { setLoading(false); }
  };

  const handleDsChange = (id: number) => {
    setSelectedDs(id); setSummary(null); setHistogram(null); setCorrelation(null); setMissing(null); setValueCounts(null);
    if (id) loadEDA(id);
  };

  const loadHistogram = async (col: string) => {
    if (!selectedDs || !col) return;
    setSelectedNumCol(col);
    try { const r = await edaApi.histogram(selectedDs, col); setHistogram(r.data); } catch {}
  };

  const loadValueCounts = async (col: string) => {
    if (!selectedDs || !col) return;
    setSelectedCatCol(col);
    try { const r = await edaApi.valueCounts(selectedDs, col); setValueCounts(r.data); } catch {}
  };

  const numCols = Object.keys(summary?.numeric_stats || {});
  const catCols = Object.keys(summary?.categorical_stats || {});
  const histData = histogram?.bins?.map((b: any) => ({ x: ((b.x0 + b.x1) / 2).toFixed(2), count: b.count })) || [];
  const corrData = correlation ? correlation.columns.flatMap((r: string, ri: number) =>
    correlation.columns.map((c: string, ci: number) => ({ row: r, col: c, val: correlation.matrix[ri][ci] }))
  ) : [];
  const missingChartData = (missing?.columns || []).map((col: string, i: number) => ({
    col, pct: missing.missing_pct[i],
  })).filter((d: any) => d.pct > 0).sort((a: any, b: any) => b.pct - a.pct).slice(0, 15);
  const vcData = valueCounts?.values?.slice(0, 15) || [];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div><h1 className="page-title">Exploratory Data Analysis</h1><p className="page-subtitle">Interactive charts and statistical summaries</p></div>

      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1">
          <label className="label-text">Dataset</label>
          <select className="select-field" value={selectedDs ?? ''} onChange={e => handleDsChange(Number(e.target.value))}>
            <option value="">— Select dataset —</option>
            {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        {selectedDs && <button onClick={() => loadEDA(selectedDs)} className="btn-secondary gap-2"><RefreshCw size={14}/>Refresh</button>}
      </div>

      {error && <div className="alert-error flex items-center gap-2"><AlertCircle size={14}/>{error}</div>}
      {loading && <div className="text-center py-12 text-slate-400">Computing EDA…</div>}

      {summary && !loading && (
        <div className="space-y-5 animate-slide-up">
          {/* Summary stats */}
          <ChartCard title={`Dataset Summary — ${summary.n_rows.toLocaleString()} rows × ${summary.n_cols} columns`}>
            <div className="overflow-x-auto">
              <table className="data-table text-xs">
                <thead><tr><th>Column</th><th>Type</th><th>Mean</th><th>Std</th><th>Min</th><th>Max</th><th>Median</th><th>Missing</th></tr></thead>
                <tbody>
                  {numCols.map(col => {
                    const s = summary.numeric_stats[col];
                    return (
                      <tr key={col}>
                        <td className="font-medium text-white">{col}</td>
                        <td><span className="badge badge-blue">numeric</span></td>
                        <td className="font-mono">{s.mean?.toFixed(3)}</td>
                        <td className="font-mono">{s.std?.toFixed(3)}</td>
                        <td className="font-mono">{s.min?.toFixed(3)}</td>
                        <td className="font-mono">{s.max?.toFixed(3)}</td>
                        <td className="font-mono">{s.median?.toFixed(3)}</td>
                        <td className={s.missing > 0 ? 'text-yellow-400' : ''}>{s.missing}</td>
                      </tr>
                    );
                  })}
                  {catCols.map(col => {
                    const s = summary.categorical_stats[col];
                    return (
                      <tr key={col}>
                        <td className="font-medium text-white">{col}</td>
                        <td><span className="badge badge-purple">categorical</span></td>
                        <td colSpan={4} className="text-slate-500 text-xs">Top: {s.top} ({s.top_freq}x)</td>
                        <td className="font-mono">{s.unique} unique</td>
                        <td className={s.missing > 0 ? 'text-yellow-400' : ''}>{s.missing}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ChartCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Histogram */}
            {numCols.length > 0 && (
              <ChartCard title="Histogram">
                <div className="mb-3">
                  <select className="select-field text-xs py-1.5" value={selectedNumCol} onChange={e => loadHistogram(e.target.value)}>
                    {numCols.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={histData}>
                    <XAxis dataKey="x" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[2,2,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="text-xs text-slate-600 mt-2 text-center">Distribution of <code>{selectedNumCol}</code> (n={histogram?.sample_size?.toLocaleString()})</div>
              </ChartCard>
            )}

            {/* Value counts */}
            {catCols.length > 0 && (
              <ChartCard title="Category Distribution">
                <div className="mb-3">
                  <select className="select-field text-xs py-1.5" value={selectedCatCol} onChange={e => loadValueCounts(e.target.value)}>
                    {catCols.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={vcData} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="label" width={80} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Bar dataKey="count" radius={[0,3,3,0]}>
                      {vcData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>

          {/* Correlation heatmap (text-based) */}
          {correlation && correlation.columns.length > 1 && (
            <ChartCard title={`Correlation Matrix (${correlation.method})`}>
              <div className="overflow-x-auto">
                <table className="text-xs border-collapse">
                  <thead>
                    <tr>
                      <th className="px-2 py-1 text-slate-500"></th>
                      {correlation.columns.map((c: string) => <th key={c} className="px-2 py-1 text-slate-400 font-medium max-w-16 truncate" title={c}>{c.slice(0,8)}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {correlation.columns.map((row: string, ri: number) => (
                      <tr key={row}>
                        <td className="px-2 py-1 text-slate-400 font-medium">{row.slice(0,8)}</td>
                        {correlation.matrix[ri].map((val: number, ci: number) => {
                          const abs = Math.abs(val);
                          const alpha = abs;
                          const color = val > 0 ? `rgba(59,130,246,${alpha})` : `rgba(239,68,68,${alpha})`;
                          return (
                            <td key={ci} className="px-2 py-1 text-center font-mono" style={{ background: color, borderRadius: 2 }} title={`${row} vs ${correlation.columns[ci]}: ${val}`}>
                              {val.toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-xs text-slate-600 mt-2">Blue = positive, Red = negative correlation. Stronger color = stronger association.</div>
            </ChartCard>
          )}

          {/* Missing values */}
          {missingChartData.length > 0 && (
            <ChartCard title="Missing Values by Column (%)">
              <ResponsiveContainer width="100%" height={Math.min(200, missingChartData.length * 28 + 40)}>
                <BarChart data={missingChartData} layout="vertical">
                  <XAxis type="number" domain={[0,100]} tickFormatter={v=>`${v}%`} tick={{fontSize:10}} />
                  <YAxis type="category" dataKey="col" width={100} tick={{fontSize:10}} />
                  <Tooltip formatter={(v:any)=>[`${v}%`,'Missing']} contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                  <Bar dataKey="pct" radius={[0,4,4,0]}>
                    {missingChartData.map((d:any,i:number) => <Cell key={i} fill={d.pct>50?'#ef4444':d.pct>20?'#f59e0b':'#3b82f6'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}
    </div>
  );
}
