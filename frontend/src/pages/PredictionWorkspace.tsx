/**
 * MedInsight AI — Prediction Workspace
 * Input feature values and get model-generated estimates with uncertainty & probabilities
 * BioIntelliX | Team led by Mr. S. K. Shrivastav
 */
import React, { useState, useEffect } from 'react';
import { Crosshair, AlertCircle, CheckCircle2 } from 'lucide-react';
import { mlApi, predictionsApi } from '../api/client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#14b8a6'];

export default function PredictionWorkspace() {
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [inputData, setInputData] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    mlApi.listModels().then(r => setModels(r.data)).catch(() => {});
    predictionsApi.history().then(r => setHistory(r.data)).catch(() => {});
  }, []);

  const handleModelSelect = (id: number) => {
    const m = models.find(x => x.id === id);
    setSelectedModel(m);
    setResult(null);
    setInputData({});
  };

  const predict = async () => {
    if (!selectedModel) return;
    setLoading(true);
    setError('');
    try {
      const parsed: Record<string, any> = {};
      Object.entries(inputData).forEach(([k, v]) => {
        parsed[k] = isNaN(Number(v)) ? v : Number(v);
      });
      const r = await predictionsApi.predict(selectedModel.id, parsed);
      setResult(r.data);
      const h = await predictionsApi.history();
      setHistory(h.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const features = selectedModel?.feature_names || [];
  const probEntries = result?.output?.probabilities ? Object.entries(result.output.probabilities) : [];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Prediction Workspace</h1>
        <p className="page-subtitle">Input feature values and get model-generated estimates</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div className="glass-card p-5 space-y-4">
            <h2 className="section-title flex items-center gap-2">
              <Crosshair size={16} className="text-cyan-400" />
              Select Model & Input
            </h2>
            <div>
              <label className="label-text">Trained Model</label>
              <select
                className="select-field"
                value={selectedModel?.id ?? ''}
                onChange={e => handleModelSelect(Number(e.target.value))}
              >
                <option value="">— Select a trained model —</option>
                {models.map(m => (
                  <option key={m.id} value={m.id}>
                    #{m.id} — {m.algorithm} ({m.task_type}) · {m.experiment_name}
                  </option>
                ))}
              </select>
            </div>
            {features.length > 0 && (
              <div>
                <label className="label-text">Feature Values</label>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {features.map((f: string) => (
                    <div key={f} className="flex items-center gap-2">
                      <label className="text-xs text-slate-400 w-32 flex-shrink-0 truncate" title={f}>
                        {f}
                      </label>
                      <input
                        type="text"
                        className="input-field text-xs py-1.5"
                        value={inputData[f] ?? ''}
                        onChange={e => setInputData(d => ({ ...d, [f]: e.target.value }))}
                        placeholder="Value…"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={predict}
              disabled={!selectedModel || loading}
              className="btn-primary w-full justify-center"
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Predicting…
                </>
              ) : (
                <>
                  <Crosshair size={15} />
                  Run Prediction
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="alert-error flex items-center gap-2">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
          {!result && !loading && (
            <div className="glass-card p-10 text-center text-slate-500">
              <Crosshair size={36} className="mx-auto mb-3 text-slate-700" />
              <p>Select a model, enter feature values, and run prediction.</p>
            </div>
          )}
          {result && (
            <div className="glass-card p-5 space-y-4 animate-slide-up">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={18} className="text-emerald-400" />
                <h2 className="section-title">Prediction Result</h2>
              </div>
              <div className="bg-surface-800/60 rounded-xl p-4 text-center">
                {result.output.predicted_class !== undefined ? (
                  <>
                    <div className="text-xs text-slate-500 mb-1">Predicted Class</div>
                    <div className="text-3xl font-extrabold text-white">{result.output.predicted_class}</div>
                  </>
                ) : (
                  <>
                    <div className="text-xs text-slate-500 mb-1">Predicted Value</div>
                    <div className="text-3xl font-extrabold text-cyan-300">
                      {Number(result.output.predicted_value).toFixed(4)}
                    </div>
                  </>
                )}
              </div>
              {probEntries.length > 0 && (
                <div>
                  <div className="text-xs text-slate-400 mb-2">Class Probabilities</div>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={probEntries.map(([k, v]) => ({ label: k, prob: Number(v) }))}>
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 1]} tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(v: any) => [`${(Number(v) * 100).toFixed(1)}%`, 'Probability']}
                        contentStyle={{
                          background: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 8,
                        }}
                      />
                      <Bar dataKey="prob" radius={[3, 3, 0, 0]}>
                        {probEntries.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="alert-warning text-xs">{result.output.model_note}</div>
              <div className="text-xs text-slate-600">
                Prediction #{result.prediction_id} · Model #{result.model_id} ·{' '}
                {new Date(result.timestamp).toLocaleString()}
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="glass-card p-5">
              <h2 className="section-title mb-3">Recent Predictions</h2>
              <div className="space-y-1">
                {history.slice(0, 5).map((p: any) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 text-xs py-1.5 border-b border-white/5 last:border-0"
                  >
                    <span className="text-slate-500">#{p.id}</span>
                    <span className="text-slate-300 flex-1 truncate">
                      {JSON.stringify(p.output).slice(0, 60)}…
                    </span>
                    <span className="text-slate-600 flex-shrink-0">
                      {new Date(p.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
