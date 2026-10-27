/**
 * MedInsight AI — Model Evaluation & Comparison Page
 * BioIntelliX | Team led by Mr. S. K. Shrivastav
 */
import React, { useState, useEffect } from 'react';
import { LineChart, RefreshCw, AlertCircle, BarChart3 } from 'lucide-react';
import { mlApi } from '../api/client';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Cell } from 'recharts';

const COLORS = ['#3b82f6','#06b6d4','#10b981','#8b5cf6','#f59e0b','#ef4444'];

export default function ModelEvaluation() {
  const [models, setModels] = useState<any[]>([]);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedExpId, setSelectedExpId] = useState<number|null>(null);
  const [expDetail, setExpDetail] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [mRes, eRes] = await Promise.all([mlApi.listModels(), mlApi.listExperiments()]);
        setModels(mRes.data); setExperiments(eRes.data);
      } catch { setError('Failed to load'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedExpId) { setExpDetail(null); return; }
    mlApi.getExperiment(selectedExpId).then(r=>setExpDetail(r.data)).catch(()=>{});
  }, [selectedExpId]);

  const classMetrics = ['accuracy','f1_score','precision','recall','roc_auc'];
  const regMetrics = ['r2','mae','rmse'];

  const comparisonData = expDetail?.models?.filter((m:any)=>m.status==='COMPLETED').map((m:any)=>{
    const row: any = { algorithm: m.algorithm.replace(/_/g,' ') };
    [...classMetrics,...regMetrics].forEach(k=>{ if(m.metrics[k]!=null) row[k]=Number(m.metrics[k]).toFixed(4); });
    return row;
  }) || [];

  const radarData = expDetail?.models?.filter((m:any)=>m.status==='COMPLETED').map((m:any)=>({
    algorithm: m.algorithm,
    ...classMetrics.reduce((acc:any,k)=>({ ...acc, [k]: m.metrics[k] ? Number(m.metrics[k]) : 0 }),{}),
  })) || [];

  const radarMetrics = expDetail?.task_type==='CLASSIFICATION' ? classMetrics : regMetrics;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Model Evaluation & Comparison</h1><p className="page-subtitle">Compare trained models within experiments</p></div>
        <button onClick={() => { setLoading(true); mlApi.listModels().then(r=>setModels(r.data)).finally(()=>setLoading(false)); }} className="btn-secondary gap-2 text-xs"><RefreshCw size={13}/>Refresh</button>
      </div>

      {error && <div className="alert-error flex items-center gap-2"><AlertCircle size={14}/>{error}</div>}

      {/* Experiment selector */}
      <div className="glass-card p-4">
        <label className="label-text">Select Experiment to Compare Models</label>
        <select className="select-field" value={selectedExpId??''} onChange={e=>setSelectedExpId(e.target.value?Number(e.target.value):null)}>
          <option value="">— Choose experiment —</option>
          {experiments.map(e=><option key={e.id} value={e.id}>{e.name} ({e.model_count} model{e.model_count!==1?'s':''}) · {e.task_type}</option>)}
        </select>
      </div>

      {/* All models table */}
      <div className="glass-card p-5">
        <h2 className="section-title mb-4">All Trained Models</h2>
        {loading ? <div className="text-center py-8 text-slate-400">Loading…</div>
        : models.length === 0 ? (
          <div className="text-center py-8 text-slate-500">No trained models yet. Go to ML Workbench to train models.</div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>ID</th><th>Algorithm</th><th>Experiment</th><th>Task</th><th>Target</th><th>Accuracy/R²</th><th>F1/MAE</th><th>Duration</th><th>Date</th></tr></thead>
              <tbody>
                {models.map(m=>(
                  <tr key={m.id}>
                    <td className="font-mono text-xs">#{m.id}</td>
                    <td className="font-medium text-white">{m.algorithm.replace(/_/g,' ')}</td>
                    <td className="text-xs">{m.experiment_name}</td>
                    <td><span className="badge badge-blue text-xs">{m.task_type}</span></td>
                    <td className="text-xs">{m.target_column}</td>
                    <td className="font-mono text-cyan-300">{m.metrics?.accuracy?.toFixed(4) ?? m.metrics?.r2?.toFixed(4) ?? '—'}</td>
                    <td className="font-mono text-brand-300">{m.metrics?.f1_score?.toFixed(4) ?? m.metrics?.mae?.toFixed(4) ?? '—'}</td>
                    <td className="text-xs text-slate-500">{m.training_duration_sec}s</td>
                    <td className="text-xs text-slate-500">{new Date(m.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Comparison charts */}
      {expDetail && comparisonData.length > 0 && (
        <div className="space-y-5 animate-slide-up">
          <div className="glass-card p-5">
            <h2 className="section-title mb-4">Side-by-Side Metric Comparison — {expDetail.name}</h2>
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr><th>Algorithm</th>{radarMetrics.map(m=><th key={m}>{m.replace(/_/g,' ')}</th>)}<th>Train Duration</th></tr></thead>
                <tbody>
                  {expDetail.models.filter((m:any)=>m.status==='COMPLETED').map((m:any,i:number)=>(
                    <tr key={m.id}>
                      <td className="font-medium" style={{color:COLORS[i%COLORS.length]}}>{m.algorithm.replace(/_/g,' ')}</td>
                      {radarMetrics.map(k=>(
                        <td key={k} className="font-mono">
                          {m.metrics[k]!=null ? <span className={m.metrics[k]>0.8?'text-emerald-400':m.metrics[k]>0.6?'text-yellow-400':'text-red-400'}>{Number(m.metrics[k]).toFixed(4)}</span> : '—'}
                        </td>
                      ))}
                      <td className="text-xs text-slate-500">{m.training_duration_sec}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {radarData.length >= 2 && expDetail.task_type === 'CLASSIFICATION' && (
            <div className="glass-card p-5">
              <h2 className="section-title mb-4">Performance Radar Comparison</h2>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={[
                  ...classMetrics.map(metric=>({
                    metric: metric.replace(/_/g,' '),
                    ...radarData.reduce((acc:any,m:any)=>({...acc,[m.algorithm]:m[metric]||0}),{}),
                  }))
                ]}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)"/>
                  <PolarAngleAxis dataKey="metric" tick={{fontSize:11,fill:'#94a3b8'}}/>
                  {radarData.map((m:any,i:number)=>(
                    <Radar key={m.algorithm} name={m.algorithm} dataKey={m.algorithm} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15}/>
                  ))}
                  <Legend iconSize={10}/>
                  <Tooltip contentStyle={{background:'#0f172a',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8}}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="alert-info text-xs">
            ℹ️ Metrics reflect performance on the held-out test set only. Do not select a model solely based on a single metric, especially with imbalanced datasets. Consider cross-validation results and ROC-AUC for classification tasks.
          </div>
        </div>
      )}
    </div>
  );
}
