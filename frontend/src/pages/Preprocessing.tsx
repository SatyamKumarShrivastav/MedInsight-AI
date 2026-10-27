/**
 * MedInsight AI — Preprocessing Page
 * BioIntelliX | Team led by Mr. S. K. Shrivastav
 */
import React, { useState, useEffect } from 'react';
import { Sliders, Play, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { datasetsApi, preprocessingApi } from '../api/client';

export default function Preprocessing() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDs, setSelectedDs] = useState<number | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [config, setConfig] = useState({
    missing_strategy: 'mean', remove_duplicates: true,
    encoding: 'label', scaling: 'standard',
    outlier_strategy: 'none', test_size: 0.2,
    random_state: 42, target_column: '',
    drop_columns: [] as string[],
  });
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    datasetsApi.list().then(r => setDatasets(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedDs) return;
    datasetsApi.getColumns(selectedDs).then(r => setColumns(r.data.map((c: any) => c.name))).catch(() => {});
  }, [selectedDs]);

  const runPreprocessing = async () => {
    if (!selectedDs) return;
    setRunning(true); setError(''); setResult(null);
    try {
      const r = await preprocessingApi.run(selectedDs, {
        ...config,
        drop_columns: config.drop_columns,
        target_column: config.target_column || null,
      });
      setResult(r.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Preprocessing failed');
    } finally { setRunning(false); }
  };

  const toggleDropCol = (col: string) => {
    setConfig(c => ({
      ...c,
      drop_columns: c.drop_columns.includes(col)
        ? c.drop_columns.filter(x => x !== col)
        : [...c.drop_columns, col],
    }));
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Data Preprocessing</h1>
        <p className="page-subtitle">Configure and apply transformations to prepare data for ML</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Config panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-5 space-y-4">
            <h2 className="section-title">Configuration</h2>
            <div>
              <label className="label-text">Dataset</label>
              <select className="select-field" value={selectedDs ?? ''} onChange={e => { setSelectedDs(Number(e.target.value)); setResult(null); setColumns([]); }}>
                <option value="">— Select dataset —</option>
                {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            {columns.length > 0 && <>
              <div>
                <label className="label-text">Target Column (optional)</label>
                <select className="select-field" value={config.target_column} onChange={e => setConfig(c => ({...c, target_column: e.target.value}))}>
                  <option value="">— None —</option>
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label-text">Columns to Drop</label>
                <div className="max-h-32 overflow-y-auto space-y-1 mt-1">
                  {columns.map(col => (
                    <label key={col} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white">
                      <input type="checkbox" checked={config.drop_columns.includes(col)} onChange={() => toggleDropCol(col)} className="rounded" />
                      {col}
                    </label>
                  ))}
                </div>
              </div>
            </>}

            <div>
              <label className="label-text">Missing Value Strategy</label>
              <select className="select-field" value={config.missing_strategy} onChange={e => setConfig(c => ({...c, missing_strategy: e.target.value}))}>
                <option value="mean">Mean (numeric)</option>
                <option value="median">Median (numeric)</option>
                <option value="mode">Mode (categorical)</option>
                <option value="constant">Constant (0)</option>
                <option value="drop_row">Drop Rows</option>
                <option value="drop_col">Drop Empty Columns</option>
              </select>
            </div>

            <div>
              <label className="label-text">Categorical Encoding</label>
              <select className="select-field" value={config.encoding} onChange={e => setConfig(c => ({...c, encoding: e.target.value}))}>
                <option value="label">Label Encoding</option>
                <option value="onehot">One-Hot Encoding</option>
                <option value="none">None</option>
              </select>
            </div>

            <div>
              <label className="label-text">Feature Scaling</label>
              <select className="select-field" value={config.scaling} onChange={e => setConfig(c => ({...c, scaling: e.target.value}))}>
                <option value="standard">Standard Scaler (Z-score)</option>
                <option value="minmax">Min-Max Normalization</option>
                <option value="none">None</option>
              </select>
            </div>

            <div>
              <label className="label-text">Outlier Strategy</label>
              <select className="select-field" value={config.outlier_strategy} onChange={e => setConfig(c => ({...c, outlier_strategy: e.target.value}))}>
                <option value="none">None</option>
                <option value="clip">Clip to IQR Bounds</option>
                <option value="remove_iqr">Remove Outlier Rows</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <label className="label-text mb-0">Remove Duplicates</label>
              <input type="checkbox" checked={config.remove_duplicates} onChange={e => setConfig(c => ({...c, remove_duplicates: e.target.checked}))} className="ml-auto" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-text">Test Split (%)</label>
                <input type="number" min="0.05" max="0.5" step="0.05" className="input-field"
                  value={config.test_size} onChange={e => setConfig(c => ({...c, test_size: Number(e.target.value)}))} />
              </div>
              <div>
                <label className="label-text">Random State</label>
                <input type="number" className="input-field" value={config.random_state}
                  onChange={e => setConfig(c => ({...c, random_state: Number(e.target.value)}))} />
              </div>
            </div>

            <button onClick={runPreprocessing} disabled={!selectedDs || running} className="btn-primary w-full justify-center">
              {running ? <><span className="spinner"/>Processing…</> : <><Play size={15}/>Run Preprocessing</>}
            </button>
          </div>
        </div>

        {/* Results panel */}
        <div className="lg:col-span-2 space-y-4">
          {error && <div className="alert-error flex items-center gap-2"><AlertCircle size={14}/>{error}</div>}

          {!result && !running && (
            <div className="glass-card p-8 text-center text-slate-500">
              <Sliders size={40} className="mx-auto mb-3 text-slate-700"/>
              <p>Configure preprocessing options and click Run to transform your dataset.</p>
              <p className="text-xs mt-2">Transformations are fit on training data only to prevent leakage.</p>
            </div>
          )}

          {result && (
            <div className="space-y-4 animate-slide-up">
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 size={18} className="text-emerald-400"/>
                  <h2 className="section-title">Preprocessing Complete</h2>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-surface-800/60 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-white">{result.original_shape?.[0]?.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">Original Rows</div>
                  </div>
                  <div className="bg-surface-800/60 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-emerald-400">{result.processed_shape?.[0]?.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">Processed Rows</div>
                  </div>
                  <div className="bg-surface-800/60 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-cyan-400">{result.processed_shape?.[1]}</div>
                    <div className="text-xs text-slate-500">Final Columns</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-300">Processing Steps</h3>
                  {result.log_steps?.map((step: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                      <CheckCircle2 size={12} className="text-brand-400 flex-shrink-0 mt-0.5"/>{step}
                    </div>
                  ))}
                </div>
              </div>

              {result.sample_preview?.length > 0 && (
                <div className="glass-card p-5">
                  <h2 className="section-title mb-3">Processed Data Preview (5 rows)</h2>
                  <div className="table-wrapper overflow-x-auto">
                    <table className="data-table">
                      <thead><tr>{result.columns?.map((c: string) => <th key={c} className="text-xs">{c}</th>)}</tr></thead>
                      <tbody>
                        {result.sample_preview.map((row: any, i: number) => (
                          <tr key={i}>
                            {result.columns?.map((c: string) => (
                              <td key={c} className="font-mono text-xs">
                                {typeof row[c] === 'number' ? Number(row[c]).toFixed(3) : String(row[c] ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="alert-info text-xs flex items-start gap-2">
            <Info size={14} className="flex-shrink-0 mt-0.5"/>
            Preprocessing pipeline is saved and will be applied consistently to training/test splits and future inference data.
          </div>
        </div>
      </div>
    </div>
  );
}
