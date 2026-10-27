/**
 * MedInsight AI — Dataset Management Page
 * BioIntelliX | Team led by Mr. S. K. Shrivastav
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Upload, Database, Eye, Trash2, RefreshCw, AlertCircle,
  CheckCircle2, FileText, BarChart3, Search, X, Info
} from 'lucide-react';
import { datasetsApi } from '../api/client';

function UploadModal({ onClose, onSuccess }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ name: '', description: '', source: '', license_info: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError('Please select a file.'); return; }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('name', form.name || file.name);
      fd.append('description', form.description);
      fd.append('source', form.source);
      fd.append('license_info', form.license_info);
      await datasetsApi.upload(fd);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Upload failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Upload Dataset</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X size={18}/></button>
        </div>
        {error && <div className="alert-error flex items-center gap-2 mb-4"><AlertCircle size={14}/>{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
              ${file ? 'border-brand-500/60 bg-brand-900/20' : 'border-white/15 hover:border-brand-500/40'}`}
          >
            <Upload size={28} className={`mx-auto mb-2 ${file ? 'text-brand-400' : 'text-slate-600'}`}/>
            {file ? (
              <div>
                <div className="text-sm font-medium text-white">{file.name}</div>
                <div className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</div>
              </div>
            ) : (
              <div>
                <div className="text-sm text-slate-400">Click to select CSV or XLSX file</div>
                <div className="text-xs text-slate-600 mt-1">Max 50 MB</div>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".csv,.xlsx" className="hidden"
            onChange={e => setFile(e.target.files?.[0] || null)} />
          <div><label className="label-text">Dataset Name</label>
            <input className="input-field" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="My Heart Disease Dataset" /></div>
          <div><label className="label-text">Description</label>
            <textarea className="input-field resize-none h-16" value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} placeholder="Brief description of this dataset..." /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label-text">Source</label>
              <input className="input-field text-xs" value={form.source} onChange={e => setForm(f=>({...f,source:e.target.value}))} placeholder="e.g. Synthetic / UCI" /></div>
            <div><label className="label-text">License / Access</label>
              <input className="input-field text-xs" value={form.license_info} onChange={e => setForm(f=>({...f,license_info:e.target.value}))} placeholder="e.g. CC0, Synthetic" /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? <><span className="spinner"/>Uploading…</> : <><Upload size={15}/>Upload</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PreviewModal({ dataset, onClose }: any) {
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    datasetsApi.preview(dataset.id, 50).then(r => setPreview(r.data)).catch(() => setError('Preview failed')).finally(() => setLoading(false));
  }, [dataset.id]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-5xl flex flex-col" style={{maxHeight:'90vh'}}>
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <div>
            <h2 className="text-lg font-semibold text-white">{dataset.name}</h2>
            <p className="text-xs text-slate-500">{dataset.num_rows?.toLocaleString()} rows × {dataset.num_columns} columns · {dataset.file_format.toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X size={18}/></button>
        </div>
        <div className="overflow-auto flex-1 p-5">
          {loading ? <div className="text-center py-10 text-slate-400">Loading preview…</div>
          : error ? <div className="alert-error">{error}</div>
          : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr>{preview.columns.map((c: string) => <th key={c}>{c}</th>)}</tr></thead>
                <tbody>{preview.rows.map((row: any[], i: number) => (
                  <tr key={i}>{row.map((cell: any, j: number) => <td key={j} className="font-mono text-xs">{String(cell)}</td>)}</tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Datasets() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [previewDs, setPreviewDs] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<number|null>(null);

  const load = async () => {
    setLoading(true); setError('');
    try { const r = await datasetsApi.list(); setDatasets(r.data); }
    catch { setError('Failed to load datasets.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this dataset and all associated results?')) return;
    setDeleting(id);
    try { await datasetsApi.delete(id); await load(); }
    catch (e: any) { alert(e?.response?.data?.detail || 'Delete failed'); }
    finally { setDeleting(null); }
  };

  const filtered = datasets.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={() => { setShowUpload(false); load(); }} />}
      {previewDs && <PreviewModal dataset={previewDs} onClose={() => setPreviewDs(null)} />}

      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Dataset Management</h1><p className="page-subtitle">Upload, preview, and manage biomedical datasets</p></div>
        <button onClick={() => setShowUpload(true)} className="btn-primary"><Upload size={16}/>Upload Dataset</button>
      </div>

      {error && <div className="alert-error flex items-center gap-2"><AlertCircle size={14}/>{error}</div>}

      <div className="glass-card p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
            <input className="input-field pl-9 py-2" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search datasets…" />
          </div>
          <button onClick={load} className="btn-secondary py-2"><RefreshCw size={14}/></button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading datasets…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Database size={40} className="mx-auto text-slate-700 mb-3"/>
          <p className="text-slate-400">{datasets.length === 0 ? 'No datasets yet. Upload your first dataset.' : 'No datasets match your search.'}</p>
          {datasets.length === 0 && <button onClick={() => setShowUpload(true)} className="btn-primary mt-4 mx-auto"><Upload size={14}/>Upload Dataset</button>}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th><th>Format</th><th>Rows</th><th>Columns</th>
                <th>Size</th><th>Status</th><th>Uploaded</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ds => (
                <tr key={ds.id}>
                  <td>
                    <div className="font-medium text-white">{ds.name}</div>
                    {ds.description && <div className="text-xs text-slate-600 truncate max-w-40">{ds.description}</div>}
                  </td>
                  <td><span className="badge badge-blue uppercase">{ds.file_format}</span></td>
                  <td className="font-mono">{ds.num_rows?.toLocaleString() ?? '—'}</td>
                  <td className="font-mono">{ds.num_columns ?? '—'}</td>
                  <td className="font-mono text-xs">{ds.file_size_bytes ? `${(ds.file_size_bytes/1024).toFixed(1)} KB` : '—'}</td>
                  <td>
                    <span className={`badge ${ds.status === 'READY' ? 'badge-green' : ds.status === 'ERROR' ? 'badge-red' : 'badge-yellow'}`}>
                      {ds.status}
                    </span>
                  </td>
                  <td className="text-xs text-slate-500">{new Date(ds.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setPreviewDs(ds)} className="btn-secondary py-1 px-2 text-xs gap-1"><Eye size={12}/>Preview</button>
                      <button onClick={() => handleDelete(ds.id)} disabled={deleting === ds.id} className="btn-danger py-1 px-2 text-xs gap-1">
                        {deleting === ds.id ? <span className="spinner w-3 h-3"/> : <Trash2 size={12}/>}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="alert-info text-xs flex items-start gap-2">
        <Info size={14} className="flex-shrink-0 mt-0.5"/>
        <span>Only upload deidentified or synthetic datasets. Do not upload real patient data without appropriate authorization and safeguards.</span>
      </div>
    </div>
  );
}
