/**
 * MedInsight AI — Explainable AI Workspace
 * SHAP-powered local and global feature explanations
 * BioIntelliX | Team led by Mr. S. K. Shrivastav
 */
import React, { useState, useEffect } from 'react';
import { Zap, AlertCircle } from 'lucide-react';
import { mlApi, xaiApi } from '../api/client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

export default function XAIWorkspace() {
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  const [inputData, setInputData] = useState<Record<string, string>>({});
  const [features, setFeatures] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [globalResult, setGlobalResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    mlApi.listModels().then(r => setModels(r.data)).catch(() => {});
  }, []);

  const handleModelSelect = async (id: number) => {
    setSelectedModel(id);
    setResult(null);
    setGlobalResult(null);
    const m = models.find(x => x.id === id);
    if (m?.feature_names) setFeatures(m.feature_names);
    try {
      const gr = await xaiApi.globalImportance(id);
      setGlobalResult(gr.data);
    } catch {}
  };

  const explain = async () => {
    if (!selectedModel) return;
    setLoading(true);
    setError('');
    try {
      const parsed: Record<string, any> = {};
      features.forEach(f => {
        const v = inputData[f];
        parsed[f] = v && !isNaN(Number(v)) ? Number(v) : v || 0;
      });
      const r = await xaiApi.explain({ model_id: selectedModel, input_data: parsed });
      setResult(r.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Explanation failed');
    } finally {
      setLoading(false);
    }
  };

  const contribs = result?.feature_contributions || [];
  const globalImp = globalResult?.feature_importance?.slice(0, 15) || [];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Explainable AI Workspace</h1>
        <p className="page-subtitle">SHAP-powered local and global feature explanations</p>
      </div>

      <div className="glass-card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-text">Model</label>
            <select
              className="select-field"
              value={selectedModel ?? ''}
              onChange={e => handleModelSelect(Number(e.target.value))}
            >
              <option value="">— Select trained model —</option>
              {models.map(m => (
                <option key={m.id} value={m.id}>
                  #{m.id} — {m.algorithm} · {m.experiment_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert-error flex items-center gap-2">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Local explanation */}
        <div className="space-y-4">
          {features.length > 0 && (
            <div className="glass-card p-5">
              <h2 className="section-title mb-3">Local Explanation — Enter Input</h2>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1 mb-4">
                {features.map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <label className="text-xs text-slate-400 w-32 truncate">{f}</label>
                    <input
                      type="text"
                      className="input-field text-xs py-1.5 flex-1"
                      value={inputData[f] ?? ''}
                      onChange={e => setInputData(d => ({ ...d, [f]: e.target.value }))}
                      placeholder="Value"
                    />
                  </div>
                ))}
              </div>
              <button onClick={explain} disabled={loading} className="btn-primary w-full justify-center">
                {loading ? (
                  <>
                    <span className="spinner" />
                    Explaining…
                  </>
                ) : (
                  <>
                    <Zap size={15} />
                    Explain Prediction
                  </>
                )}
              </button>
            </div>
          )}
          {result && (
            <div className="glass-card p-5 animate-slide-up">
              <h2 className="section-title mb-2">Feature Contributions (SHAP)</h2>
              <div className="text-xs text-slate-500 mb-3">Method: {result.explanation_method}</div>
              <ResponsiveContainer width="100%" height={Math.min(300, contribs.length * 26 + 40)}>
                <BarChart data={contribs.slice(0, 12)} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={v => v.toFixed(3)} />
                  <YAxis type="category" dataKey="feature" width={110} tick={{ fontSize: 9 }} />
                  <Tooltip
                    contentStyle={{
                      background: '#0f172a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="shap_value" radius={[0, 3, 3, 0]}>
                    {contribs.slice(0, 12).map((c: any, i: number) => (
                      <Cell key={i} fill={c.shap_value >= 0 ? '#3b82f6' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="alert-info text-xs mt-3">{result.disclaimer}</div>
            </div>
          )}
        </div>

        {/* Global importance */}
        <div className="space-y-4">
          {globalImp.length > 0 ? (
            <div className="glass-card p-5">
              <h2 className="section-title mb-4">Global Feature Importance</h2>
              <ResponsiveContainer width="100%" height={Math.min(340, globalImp.length * 26 + 40)}>
                <BarChart data={globalImp} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={v => v.toFixed(3)} />
                  <YAxis type="category" dataKey="feature" width={120} tick={{ fontSize: 9 }} />
                  <Tooltip
                    contentStyle={{
                      background: '#0f172a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="importance" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-slate-600 mt-2">
                Global importance: how the model uses each feature overall. Blue bars (local) = positive
                contribution, Red = negative.
              </p>
            </div>
          ) : selectedModel ? (
            <div className="glass-card p-8 text-center text-slate-500">
              <Zap size={36} className="mx-auto mb-3 text-slate-700" />
              <p>Global importance will appear when a model is selected.</p>
            </div>
          ) : (
            <div className="glass-card p-8 text-center text-slate-500">
              <Zap size={36} className="mx-auto mb-3 text-slate-700" />
              <p>Select a model to view explainability analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
