/**
 * MedInsight AI — Experiment Registry
 * BioIntelliX | Team led by Mr. S. K. Shrivastav
 */
import React, { useState, useEffect } from 'react';
import {
  FlaskConical, RefreshCw, ChevronRight, Brain,
  CheckCircle2, XCircle, Clock, BarChart3, Target, Calendar,
} from 'lucide-react';
import { mlApi } from '../api/client';

const STATUS_BADGE: Record<string, string> = {
  COMPLETED: 'badge-green',
  RUNNING:   'badge-yellow',
  FAILED:    'badge-red',
  PENDING:   'badge-blue',
};

export default function Experiments() {
  const [experiments, setExperiments] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState<any>(null);
  const [detail, setDetail]           = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await mlApi.listExperiments(0, 50);
      setExperiments(r.data);
    } catch {
      setExperiments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const loadDetail = async (exp: any) => {
    setSelected(exp);
    setDetail(null);
    setDetailLoading(true);
    try {
      const r = await mlApi.getExperiment(exp.id);
      setDetail(r.data);
    } catch {
      setDetail(exp);
    } finally {
      setDetailLoading(false);
    }
  };

  const bestModel = (models: any[]) => {
    if (!models?.length) return null;
    return models.reduce((best, m) => {
      const score = m.metrics?.accuracy ?? m.metrics?.r2 ?? 0;
      const bestScore = best.metrics?.accuracy ?? best.metrics?.r2 ?? 0;
      return score > bestScore ? m : best;
    }, models[0]);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FlaskConical size={24} className="text-brand-400" /> Experiment Registry
          </h1>
          <p className="page-subtitle">
            {experiments.length} training experiment{experiments.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <button onClick={load} className="btn-secondary gap-2 text-xs">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: list */}
        <div className="lg:col-span-2 glass-card p-4 space-y-2">
          <h2 className="section-title mb-3">All Experiments</h2>
          {loading ? (
            <div className="flex items-center justify-center py-10 gap-2">
              <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-slate-400 text-sm">Loading…</span>
            </div>
          ) : experiments.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <FlaskConical size={36} className="mx-auto mb-2 text-slate-700" />
              <p className="text-sm">No experiments yet.</p>
              <p className="text-xs mt-1 text-slate-600">Start training in the ML Workbench.</p>
            </div>
          ) : (
            experiments.map(exp => (
              <button
                key={exp.id}
                onClick={() => loadDetail(exp)}
                className={`w-full text-left p-3 rounded-xl border transition-all group ${
                  selected?.id === exp.id
                    ? 'border-brand-500/60 bg-brand-900/20'
                    : 'border-white/8 hover:border-white/20 hover:bg-white/4'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-white truncate">{exp.name}</div>
                  <ChevronRight size={14} className="text-slate-600 group-hover:text-brand-400 flex-shrink-0 ml-1" />
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`badge text-[10px] ${STATUS_BADGE[exp.status] || 'badge-blue'}`}>
                    {exp.status}
                  </span>
                  <span className="text-xs text-slate-500">{exp.task_type}</span>
                  <span className="text-xs text-slate-600 ml-auto">
                    {new Date(exp.created_at).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Right: detail */}
        <div className="lg:col-span-3 glass-card p-5">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-slate-600">
              <FlaskConical size={48} className="mb-4 text-slate-700" />
              <p className="text-sm">Select an experiment to inspect its details</p>
            </div>
          ) : detailLoading ? (
            <div className="flex items-center justify-center py-16 gap-2">
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-slate-400 text-sm">Loading experiment…</span>
            </div>
          ) : detail ? (
            <div className="space-y-5">
              {/* Title */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-bold text-white">{detail.name}</h2>
                  <span className={`badge flex-shrink-0 ${STATUS_BADGE[detail.status] || 'badge-blue'}`}>
                    {detail.status}
                  </span>
                </div>
                {detail.description && (
                  <p className="text-xs text-slate-500 mt-1">{detail.description}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="badge badge-blue flex items-center gap-1"><Brain size={10}/>{detail.task_type}</span>
                  <span className="badge badge-cyan flex items-center gap-1"><Target size={10}/>Target: {detail.target_column}</span>
                  <span className="badge badge-purple flex items-center gap-1">
                    <Calendar size={10}/>{new Date(detail.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Best model highlight */}
              {detail.models?.length > 0 && (() => {
                const best = bestModel(detail.models);
                const score = best?.metrics?.accuracy ?? best?.metrics?.r2;
                return best ? (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-900/30 to-teal-900/20 border border-emerald-500/20">
                    <div className="text-xs text-emerald-400 font-semibold mb-1 uppercase tracking-wider">Best Model</div>
                    <div className="text-base font-bold text-white">{best.algorithm?.replace(/_/g, ' ')}</div>
                    {score != null && (
                      <div className="text-sm text-slate-300 mt-0.5">
                        Score: <span className="text-emerald-300 font-mono font-bold">{Number(score).toFixed(4)}</span>
                      </div>
                    )}
                  </div>
                ) : null;
              })()}

              {/* Models list */}
              <div>
                <h3 className="section-title text-sm mb-3">
                  All Models ({detail.models?.length || 0})
                </h3>
                <div className="space-y-2">
                  {detail.models?.map((m: any) => {
                    const score = m.metrics?.accuracy ?? m.metrics?.r2;
                    const mse = m.metrics?.mse;
                    return (
                      <div key={m.id} className="p-3 rounded-lg bg-surface-800/60 border border-white/5 hover:border-white/10 transition">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-white">{m.algorithm?.replace(/_/g, ' ')}</div>
                          <div className="flex items-center gap-2">
                            {m.status === 'COMPLETED' ? (
                              <CheckCircle2 size={13} className="text-emerald-400" />
                            ) : m.status === 'FAILED' ? (
                              <XCircle size={13} className="text-red-400" />
                            ) : (
                              <Clock size={13} className="text-yellow-400" />
                            )}
                            <span className={`badge text-[10px] ${STATUS_BADGE[m.status] || 'badge-blue'}`}>
                              {m.status}
                            </span>
                          </div>
                        </div>
                        {m.status === 'COMPLETED' && (
                          <div className="flex flex-wrap gap-3 mt-1.5">
                            {score != null && (
                              <div className="text-xs text-slate-400">
                                Score: <span className="text-emerald-300 font-mono">{Number(score).toFixed(4)}</span>
                              </div>
                            )}
                            {mse != null && (
                              <div className="text-xs text-slate-400">
                                MSE: <span className="text-yellow-300 font-mono">{Number(mse).toFixed(4)}</span>
                              </div>
                            )}
                            {m.training_time_seconds != null && (
                              <div className="text-xs text-slate-400">
                                Time: <span className="text-slate-300 font-mono">{Number(m.training_time_seconds).toFixed(1)}s</span>
                              </div>
                            )}
                          </div>
                        )}
                        {m.error_message && (
                          <div className="text-xs text-red-400 mt-1">{m.error_message}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
