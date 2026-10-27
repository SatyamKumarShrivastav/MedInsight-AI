/**
 * MedInsight AI — Anomaly Detection Page
 * Identify unusual patterns using Isolation Forest, LOF, or One-Class SVM
 * BioIntelliX | Team led by Mr. S. K. Shrivastav
 */
import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, Play } from 'lucide-react';
import { anomalyApi, datasetsApi } from '../api/client';

export default function AnomalyDetection() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDs, setSelectedDs] = useState<number | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [selFeatures, setSelFeatures] = useState<string[]>([]);
  const [config, setConfig] = useState({
    algorithm: 'isolation_forest',
    contamination: 0.05,
    n_estimators: 100,
    n_neighbors: 20,
  });
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    datasetsApi.list().then(r => setDatasets(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedDs) return;
    datasetsApi
      .getColumns(selectedDs)
      .then(r => {
        const numCols = r.data.filter((c: any) => /int|float|number/.test(c.dtype)).map((c: any) => c.name);
        setColumns(numCols);
        setSelFeatures(numCols);
      })
      .catch(() => {});
  }, [selectedDs]);

  const run = async () => {
    if (!selectedDs) return;
    setRunning(true);
    setError('');
    setResult(null);
    try {
      const r = await anomalyApi.run(selectedDs, {
        ...config,
        feature_columns: selFeatures.length ? selFeatures : null,
      });
      setResult(r.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Detection failed');
    } finally {
      setRunning(false);
    }
  };

  const toggleFeat = (col: string) =>
    setSelFeatures(f => (f.includes(col) ? f.filter(x => x !== col) : [...f, col]));

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Anomaly Detection</h1>
        <p className="page-subtitle">
          Identify unusual patterns using Isolation Forest, LOF, or One-Class SVM
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="glass-card p-5 space-y-4">
          <h2 className="section-title flex items-center gap-2">
            <Activity size={16} className="text-red-400" />
            Configuration
          </h2>
          <div>
            <label className="label-text">Dataset</label>
            <select
              className="select-field"
              value={selectedDs ?? ''}
              onChange={e => {
                setSelectedDs(Number(e.target.value));
                setResult(null);
              }}
            >
              <option value="">— Select —</option>
              {datasets.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-text">Algorithm</label>
            <select
              className="select-field"
              value={config.algorithm}
              onChange={e => setConfig(c => ({ ...c, algorithm: e.target.value }))}
            >
              <option value="isolation_forest">Isolation Forest</option>
              <option value="lof">Local Outlier Factor</option>
              <option value="ocsvm">One-Class SVM</option>
            </select>
          </div>
          <div>
            <label className="label-text">Contamination (expected anomaly fraction)</label>
            <input
              type="number"
              min="0.01"
              max="0.5"
              step="0.01"
              className="input-field"
              value={config.contamination}
              onChange={e => setConfig(c => ({ ...c, contamination: Number(e.target.value) }))}
            />
          </div>
          {config.algorithm === 'isolation_forest' && (
            <div>
              <label className="label-text">N Estimators</label>
              <input
                type="number"
                min="50"
                max="500"
                step="10"
                className="input-field"
                value={config.n_estimators}
                onChange={e => setConfig(c => ({ ...c, n_estimators: Number(e.target.value) }))}
              />
            </div>
          )}
          {config.algorithm === 'lof' && (
            <div>
              <label className="label-text">N Neighbors</label>
              <input
                type="number"
                min="5"
                max="50"
                className="input-field"
                value={config.n_neighbors}
                onChange={e => setConfig(c => ({ ...c, n_neighbors: Number(e.target.value) }))}
              />
            </div>
          )}
          {columns.length > 0 && (
            <div>
              <label className="label-text">Feature Columns ({selFeatures.length} selected)</label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {columns.map(c => (
                  <label key={c} className="flex items-center gap-2 text-xs cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={selFeatures.includes(c)}
                      onChange={() => toggleFeat(c)}
                      className="rounded"
                    />
                    {c}
                  </label>
                ))}
              </div>
            </div>
          )}
          <button onClick={run} disabled={!selectedDs || running} className="btn-primary w-full justify-center">
            {running ? (
              <>
                <span className="spinner" />
                Detecting…
              </>
            ) : (
              <>
                <Play size={15} />
                Detect Anomalies
              </>
            )}
          </button>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {error && (
            <div className="alert-error flex items-center gap-2">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
          {!result && !running && (
            <div className="glass-card p-10 text-center text-slate-500">
              <Activity size={40} className="mx-auto mb-3 text-slate-700" />
              <p>Configure anomaly detection and click Detect.</p>
            </div>
          )}
          {result && (
            <div className="space-y-4 animate-slide-up">
              <div className="glass-card p-5">
                <h2 className="section-title mb-4">Detection Results — {result.algorithm}</h2>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-surface-800/60 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-white">{result.n_samples?.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">Total Records</div>
                  </div>
                  <div className="bg-surface-800/60 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-red-400">{result.anomaly_count}</div>
                    <div className="text-xs text-slate-500">Anomaly Candidates</div>
                  </div>
                  <div className="bg-surface-800/60 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-yellow-400">{result.anomaly_pct}%</div>
                    <div className="text-xs text-slate-500">of Dataset</div>
                  </div>
                </div>
                <div className="alert-warning text-xs">{result.disclaimer}</div>
              </div>
              {result.top_anomalies?.length > 0 && (
                <div className="glass-card p-5">
                  <h2 className="section-title mb-3">
                    Top Anomaly Candidates (first {Math.min(20, result.top_anomalies.length)})
                  </h2>
                  <div className="table-wrapper overflow-x-auto">
                    <table className="data-table text-xs">
                      <thead>
                        <tr>
                          <th>Row #</th>
                          <th>Anomaly Score</th>
                          {Object.keys(result.top_anomalies[0]?.record_data || {})
                            .slice(0, 6)
                            .map((k: string) => (
                              <th key={k}>{k}</th>
                            ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.top_anomalies.slice(0, 20).map((r: any) => (
                          <tr key={r.record_index}>
                            <td className="font-mono text-red-300">{r.record_index}</td>
                            <td className="font-mono">{r.anomaly_score?.toFixed(4) ?? '—'}</td>
                            {Object.entries(r.record_data || {})
                              .slice(0, 6)
                              .map(([k, v]: any) => (
                                <td key={k} className="font-mono">
                                  {String(v).slice(0, 12)}
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
        </div>
      </div>
    </div>
  );
}
