/**
 * MedInsight AI — ML Workbench Page
 * BioIntelliX | Team led by Mr. S. K. Shrivastav
 */
import React, { useState, useEffect } from 'react';
import { Brain, Play, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { datasetsApi, mlApi } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const ALGO_COLORS: Record<string,string> = { accuracy:'#3b82f6',f1_score:'#06b6d4',roc_auc:'#8b5cf6',precision:'#10b981',recall:'#f59e0b',r2:'#3b82f6',mae:'#f59e0b',rmse:'#ef4444' };

export default function MLWorkbench() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDs, setSelectedDs] = useState<number|null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [algorithms, setAlgorithms] = useState<any>({classification:[],regression:[]});
  const [form, setForm] = useState({
    experiment_name:'', description:'', target_column:'', algorithm:'random_forest',
    task_type:'CLASSIFICATION', test_size:0.2, random_state:42, cross_validate:false,
  });
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [training, setTraining] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    datasetsApi.list().then(r=>setDatasets(r.data)).catch(()=>{});
    mlApi.availableAlgorithms().then(r=>setAlgorithms(r.data)).catch(()=>{});
  }, []);

  useEffect(() => {
    if (!selectedDs) return;
    datasetsApi.getColumns(selectedDs).then(r=>{
      const cols = r.data.map((c:any)=>c.name);
      setColumns(cols);
      setSelectedFeatures(cols);
    }).catch(()=>{});
  }, [selectedDs]);

  const availableAlgos = form.task_type==='CLASSIFICATION' ? algorithms.classification : algorithms.regression;

  const train = async () => {
    if (!selectedDs || !form.target_column || !form.experiment_name) {
      setError('Please fill: Experiment Name, Dataset, Target Column.'); return;
    }
    setTraining(true); setError(''); setResult(null);
    try {
      const r = await mlApi.train({
        experiment_name: form.experiment_name,
        description: form.description,
        dataset_id: selectedDs,
        target_column: form.target_column,
        feature_columns: selectedFeatures.filter(f=>f!==form.target_column),
        algorithm: form.algorithm,
        task_type: form.task_type,
        test_size: form.test_size,
        random_state: form.random_state,
        cross_validate: form.cross_validate,
        hyperparams: {},
      });
      setResult(r.data);
    } catch(e:any){ setError(e?.response?.data?.detail||'Training failed'); }
    finally { setTraining(false); }
  };

  const toggleFeature = (col:string) => {
    setSelectedFeatures(f=>f.includes(col)?f.filter(x=>x!==col):[...f,col]);
  };

  const metricsChart = result ? Object.entries(result.metrics)
    .filter(([k,v])=>typeof v==='number'&&!['confusion_matrix','class_labels'].includes(k))
    .map(([k,v])=>({metric:k,value:Number(v)})) : [];

  const fiChart = result ? Object.entries(result.feature_importance||{}).map(([f,v])=>({feature:f,importance:Number(v)})).slice(0,15) : [];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div><h1 className="page-title">ML Workbench</h1><p className="page-subtitle">Configure and train machine learning models on your biomedical dataset</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Config */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-5 space-y-4">
            <h2 className="section-title flex items-center gap-2"><Brain size={17} className="text-purple-400"/>Training Configuration</h2>

            <div><label className="label-text">Experiment Name *</label>
              <input className="input-field" value={form.experiment_name} onChange={e=>setForm(f=>({...f,experiment_name:e.target.value}))} placeholder="Heart Disease Study v1"/></div>

            <div><label className="label-text">Description</label>
              <textarea className="input-field resize-none h-14 text-xs" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Brief description…"/></div>

            <div><label className="label-text">Dataset *</label>
              <select className="select-field" value={selectedDs??''} onChange={e=>{setSelectedDs(Number(e.target.value));setResult(null);}}>
                <option value="">— Select —</option>
                {datasets.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div><label className="label-text">Task Type</label>
              <select className="select-field" value={form.task_type} onChange={e=>setForm(f=>({...f,task_type:e.target.value,algorithm:e.target.value==='CLASSIFICATION'?'random_forest':'linear_regression'}))}>
                <option value="CLASSIFICATION">Classification</option>
                <option value="REGRESSION">Regression</option>
              </select>
            </div>

            {columns.length > 0 && <>
              <div><label className="label-text">Target Column *</label>
                <select className="select-field" value={form.target_column} onChange={e=>setForm(f=>({...f,target_column:e.target.value}))}>
                  <option value="">— Select target —</option>
                  {columns.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label-text">Feature Columns ({selectedFeatures.filter(f=>f!==form.target_column).length} selected)</label>
                <div className="max-h-36 overflow-y-auto space-y-1 mt-1 pr-1">
                  {columns.filter(c=>c!==form.target_column).map(col=>(
                    <label key={col} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white">
                      <input type="checkbox" checked={selectedFeatures.includes(col)} onChange={()=>toggleFeature(col)} className="rounded"/>
                      {col}
                    </label>
                  ))}
                </div>
              </div>
            </>}

            <div><label className="label-text">Algorithm</label>
              <select className="select-field" value={form.algorithm} onChange={e=>setForm(f=>({...f,algorithm:e.target.value}))}>
                {availableAlgos.map((a:string)=><option key={a} value={a}>{a.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><label className="label-text">Test Split</label>
                <input type="number" min="0.1" max="0.4" step="0.05" className="input-field" value={form.test_size} onChange={e=>setForm(f=>({...f,test_size:Number(e.target.value)}))} /></div>
              <div><label className="label-text">Random State</label>
                <input type="number" className="input-field" value={form.random_state} onChange={e=>setForm(f=>({...f,random_state:Number(e.target.value)}))} /></div>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input type="checkbox" checked={form.cross_validate} onChange={e=>setForm(f=>({...f,cross_validate:e.target.checked}))} className="rounded"/>
              Enable 5-Fold Cross-Validation
            </label>

            <button onClick={train} disabled={training||!selectedDs||!form.target_column||!form.experiment_name} className="btn-primary w-full justify-center">
              {training?<><span className="spinner"/>Training…</>:<><Play size={15}/>Train Model</>}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {error && <div className="alert-error flex items-center gap-2"><AlertCircle size={14}/>{error}</div>}

          {!result && !training && (
            <div className="glass-card p-10 text-center text-slate-500">
              <Brain size={44} className="mx-auto mb-3 text-slate-700"/>
              <p className="font-medium">Configure training settings and click Train Model</p>
              <p className="text-xs mt-2">Supported: Logistic Regression, Decision Tree, Random Forest, SVM, KNN, XGBoost, LightGBM (classification); Linear Regression, RF Regressor, Gradient Boosting (regression)</p>
            </div>
          )}

          {training && (
            <div className="glass-card p-10 text-center">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
              <p className="text-slate-300 font-medium">Training {form.algorithm.replace(/_/g,' ')}…</p>
              <p className="text-xs text-slate-500 mt-2">This may take a moment. Results will appear here automatically.</p>
            </div>
          )}

          {result && (
            <div className="space-y-4 animate-slide-up">
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-4"><CheckCircle2 size={18} className="text-emerald-400"/><h2 className="section-title">Training Complete</h2></div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[{l:'Model ID',v:`#${result.model_id}`},{l:'Algorithm',v:result.algorithm.replace(/_/g,' ')},{l:'Train Samples',v:result.n_train},{l:'Test Samples',v:result.n_test}].map(s=>(
                    <div key={s.l} className="bg-surface-800/60 rounded-lg p-2.5 text-center">
                      <div className="text-sm font-bold text-white">{s.v}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{s.l}</div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-slate-500">Training duration: <span className="text-white">{result.training_duration_sec}s</span> · Experiment #{result.experiment_id}</div>
              </div>

              {/* Metrics chart */}
              {metricsChart.length > 0 && (
                <div className="glass-card p-5">
                  <h2 className="section-title mb-4">Evaluation Metrics</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    {metricsChart.map(m=>(
                      <div key={m.metric} className="bg-surface-800/60 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold" style={{color:ALGO_COLORS[m.metric]||'#94a3b8'}}>{m.value.toFixed(4)}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{m.metric.replace(/_/g,' ')}</div>
                      </div>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={metricsChart.filter(m=>m.value<=1||['mae','mse','rmse'].includes(m.metric))}>
                      <XAxis dataKey="metric" tick={{fontSize:10}} tickFormatter={v=>v.replace(/_/g,' ')}/>
                      <YAxis tick={{fontSize:10}} domain={[0,'auto']}/>
                      <Tooltip contentStyle={{background:'#0f172a',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8}}/>
                      <Bar dataKey="value" radius={[3,3,0,0]}>{metricsChart.map((_:any,i:number)=><Cell key={i} fill={Object.values(ALGO_COLORS)[i%7]}/>)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Confusion matrix */}
              {result.metrics?.confusion_matrix && (
                <div className="glass-card p-5">
                  <h2 className="section-title mb-3">Confusion Matrix</h2>
                  <div className="overflow-x-auto">
                    <table className="text-xs border-collapse mx-auto">
                      {result.metrics.confusion_matrix.map((row:number[],i:number)=>(
                        <tr key={i}>{row.map((cell:number,j:number)=>(
                          <td key={j} className={`w-16 h-12 text-center font-bold border border-surface-700 ${i===j?'bg-brand-800/50 text-brand-300':'bg-surface-800/40 text-slate-300'}`}>
                            {cell}
                          </td>
                        ))}</tr>
                      ))}
                    </table>
                    <div className="text-xs text-slate-600 mt-2 text-center">Rows = actual, Cols = predicted. Diagonal = correct predictions.</div>
                  </div>
                </div>
              )}

              {/* Feature importance */}
              {fiChart.length > 0 && (
                <div className="glass-card p-5">
                  <h2 className="section-title mb-4">Feature Importance (Top {fiChart.length})</h2>
                  <ResponsiveContainer width="100%" height={Math.min(300, fiChart.length*26+40)}>
                    <BarChart data={fiChart} layout="vertical">
                      <XAxis type="number" tick={{fontSize:10}} tickFormatter={v=>v.toFixed(3)}/>
                      <YAxis type="category" dataKey="feature" width={110} tick={{fontSize:10}}/>
                      <Tooltip contentStyle={{background:'#0f172a',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8}}/>
                      <Bar dataKey="importance" fill="#8b5cf6" radius={[0,4,4,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-slate-600 mt-2">Feature importance reflects how the model uses variables. It does not imply biological causation.</p>
                </div>
              )}

              <div className="alert-warning text-xs">
                ⚠ These are model-generated research estimates from a single train/test split. Not clinical findings. Use cross-validation and multiple models for robust conclusions.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
