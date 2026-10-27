/**
 * MedInsight AI — Biomedical Analytics Page
 * BioIntelliX | Team led by Mr. S. K. Shrivastav
 */
import React, { useState, useEffect } from 'react';
import { HeartPulse, AlertCircle, Info, Play } from 'lucide-react';
import { datasetsApi, edaApi } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

const COLORS = ['#3b82f6','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6'];

function AnalyticsCard({ title, children }: any) {
  return <div className="glass-card p-5"><h3 className="section-title mb-4">{title}</h3>{children}</div>;
}

export default function BiomedAnalytics() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDs, setSelectedDs] = useState<number|null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { datasetsApi.list().then(r => setDatasets(r.data)).catch(()=>{}); }, []);

  const run = async () => {
    if (!selectedDs) return;
    setLoading(true); setError(''); setAnalytics(null);
    try {
      const r = await edaApi.biomedicalAnalytics(selectedDs);
      setAnalytics(r.data);
    } catch(e:any) { setError(e?.response?.data?.detail||'Analysis failed'); }
    finally { setLoading(false); }
  };

  const a = analytics?.analytics || {};

  const ageBins = a.age_distribution ? a.age_distribution.bins.map((v:number,i:number)=>({
    range:`${Math.round(a.age_distribution.edges[i])}-${Math.round(a.age_distribution.edges[i+1])}`, count:v
  })) : [];

  const bmiData = a.bmi_distribution ? [
    { label:'Underweight (<18.5)', pct:a.bmi_distribution.underweight_pct },
    { label:'Normal (18.5-25)', pct:a.bmi_distribution.normal_pct },
    { label:'Overweight (25-30)', pct:a.bmi_distribution.overweight_pct },
    { label:'Obese (≥30)', pct:a.bmi_distribution.obese_pct },
  ] : [];

  const bpData = a.blood_pressure ? [
    { label:'Normal (<120)', pct:a.blood_pressure.normal_pct },
    { label:'Elevated (120-130)', pct:a.blood_pressure.elevated_pct },
    { label:'High (≥130)', pct:a.blood_pressure.high_pct },
  ] : [];

  const targetData = a.target_distribution?.values || [];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div><h1 className="page-title">Biomedical Analytics</h1><p className="page-subtitle">Auto-detected biomedical descriptive statistics</p></div>

      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1">
          <label className="label-text">Dataset</label>
          <select className="select-field" value={selectedDs??''} onChange={e=>{setSelectedDs(Number(e.target.value));setAnalytics(null);}}>
            <option value="">— Select dataset —</option>
            {datasets.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <button onClick={run} disabled={!selectedDs||loading} className="btn-primary">
          {loading?<><span className="spinner"/>Analysing…</>:<><Play size={15}/>Run Analytics</>}
        </button>
      </div>

      {error && <div className="alert-error flex items-center gap-2"><AlertCircle size={14}/>{error}</div>}

      {analytics && !loading && (
        <>
          {Object.keys(a).length === 0 ? (
            <div className="glass-card p-8 text-center text-slate-500">
              <HeartPulse size={36} className="mx-auto mb-3 text-slate-700"/>
              <p>No standard biomedical columns detected (age, bmi, trestbps, chol, glucose, target…).</p>
              <p className="text-xs mt-2">Try uploading the synthetic_heart_disease.csv or synthetic_diabetes.csv dataset.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-slide-up">
              {ageBins.length > 0 && (
                <AnalyticsCard title={`Age Distribution (Column: ${a.age_distribution.column})`}>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[{l:'Mean Age',v:a.age_distribution.mean.toFixed(1)},{l:'Std Dev',v:a.age_distribution.std.toFixed(1)},{l:'Range',v:`${a.age_distribution.min}–${a.age_distribution.max}`}].map(s=>(
                      <div key={s.l} className="bg-surface-800/60 rounded-lg p-2 text-center">
                        <div className="text-base font-bold text-white">{s.v}</div>
                        <div className="text-[10px] text-slate-500">{s.l}</div>
                      </div>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={ageBins}><XAxis dataKey="range" tick={{fontSize:9}}/><YAxis tick={{fontSize:9}}/><Tooltip contentStyle={{background:'#0f172a',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8}}/><Bar dataKey="count" fill="#3b82f6" radius={[2,2,0,0]}/></BarChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-slate-600 mt-2">Descriptive statistics only. Not a clinical finding.</p>
                </AnalyticsCard>
              )}

              {bmiData.length > 0 && (
                <AnalyticsCard title={`BMI Distribution (Column: ${a.bmi_distribution.column})`}>
                  <div className="text-center mb-3"><span className="text-2xl font-bold text-white">{a.bmi_distribution.mean.toFixed(1)}</span><span className="text-sm text-slate-400 ml-2">Mean BMI</span></div>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart><Pie data={bmiData} dataKey="pct" nameKey="label" cx="50%" cy="50%" outerRadius={60} label={({label,pct})=>`${pct.toFixed(1)}%`} labelLine={false}>
                      {bmiData.map((_:any,i:number)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                    </Pie><Tooltip formatter={(v:any)=>[`${Number(v).toFixed(1)}%`,'Proportion']} contentStyle={{background:'#0f172a',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8}}/><Legend iconSize={10} wrapperStyle={{fontSize:10}}/></PieChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-slate-600 mt-2">WHO BMI categories used as reference only.</p>
                </AnalyticsCard>
              )}

              {bpData.length > 0 && (
                <AnalyticsCard title={`Blood Pressure Summary (Column: ${a.blood_pressure.column})`}>
                  <div className="text-center mb-3"><span className="text-2xl font-bold text-white">{a.blood_pressure.mean.toFixed(1)}</span><span className="text-sm text-slate-400 ml-2">Mean Systolic (mmHg)</span></div>
                  <div className="space-y-2">
                    {bpData.map((b:any)=>(
                      <div key={b.label}>
                        <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">{b.label}</span><span className="text-white">{b.pct.toFixed(1)}%</span></div>
                        <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden"><div className="h-full bg-brand-500 rounded-full" style={{width:`${b.pct}%`}}/></div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 mt-3">Statistical groupings for research analysis only.</p>
                </AnalyticsCard>
              )}

              {a.glucose && (
                <AnalyticsCard title={`Glucose / Blood Sugar (Column: ${a.glucose.column})`}>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surface-800/60 rounded-lg p-3 text-center"><div className="text-xl font-bold text-white">{a.glucose.mean.toFixed(1)}</div><div className="text-xs text-slate-500">Mean mg/dL</div></div>
                    <div className="bg-surface-800/60 rounded-lg p-3 text-center"><div className="text-xl font-bold text-cyan-400">{a.glucose.std.toFixed(1)}</div><div className="text-xs text-slate-500">Std Dev</div></div>
                  </div>
                </AnalyticsCard>
              )}

              {a.cholesterol && (
                <AnalyticsCard title={`Cholesterol (Column: ${a.cholesterol.column})`}>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surface-800/60 rounded-lg p-3 text-center"><div className="text-xl font-bold text-white">{a.cholesterol.mean.toFixed(1)}</div><div className="text-xs text-slate-500">Mean mg/dL</div></div>
                    <div className="bg-surface-800/60 rounded-lg p-3 text-center"><div className="text-xl font-bold text-yellow-400">{a.cholesterol.std.toFixed(1)}</div><div className="text-xs text-slate-500">Std Dev</div></div>
                  </div>
                </AnalyticsCard>
              )}

              {targetData.length > 0 && (
                <AnalyticsCard title={`Target / Outcome Distribution (Column: ${a.target_distribution.column})`}>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={targetData}><XAxis dataKey="label" tick={{fontSize:11}}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{background:'#0f172a',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8}}/><Bar dataKey="count" radius={[3,3,0,0]}>{targetData.map((_:any,i:number)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar></BarChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-slate-600 mt-2">Class distribution for research reference. Check for imbalance before modelling.</p>
                </AnalyticsCard>
              )}
            </div>
          )}
        </>
      )}

      <div className="alert-warning text-xs flex items-start gap-2">
        <Info size={14} className="flex-shrink-0 mt-0.5"/>
        These are descriptive statistics derived from dataset variables. They represent statistical associations, not clinical findings or diagnoses. — MedInsight AI, BioIntelliX
      </div>
    </div>
  );
}
