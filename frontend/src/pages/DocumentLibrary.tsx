/**
 * MedInsight AI — Research Document Library Page
 * Upload and manage PDF and TXT research papers
 * BioIntelliX | Team led by Mr. S. K. Shrivastav
 */
import React, { useState, useEffect } from 'react';
import { Library, BookOpen, AlertCircle, Upload, Trash2, Bot } from 'lucide-react';
import { documentsApi } from '../api/client';

export default function DocumentLibrary() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', authors: '', year: '', source: '', doi: '' });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);

  const load = async () => {
    try {
      const r = await documentsApi.list();
      setDocs(r.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Select a file.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', uploadForm.title || file.name);
      fd.append('authors', uploadForm.authors);
      if (uploadForm.year) fd.append('year', uploadForm.year);
      fd.append('source', uploadForm.source);
      fd.append('doi', uploadForm.doi);
      await documentsApi.upload(fd);
      setShowUpload(false);
      setFile(null);
      setUploadForm({ title: '', authors: '', year: '', source: '', doi: '' });
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const loadSummary = async (id: number) => {
    try {
      const r = await documentsApi.summary(id);
      setSummary(r.data);
    } catch (e: any) {
      setSummary({ error: e?.response?.data?.detail || 'Summary failed' });
    }
  };

  const del = async (id: number) => {
    if (!confirm('Delete document?')) return;
    try {
      await documentsApi.delete(id);
      await load();
      setSelected(null);
      setSummary(null);
    } catch {}
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Research Document Library</h1>
          <p className="page-subtitle">Upload and manage PDF and TXT research papers</p>
        </div>
        <button onClick={() => setShowUpload(s => !s)} className="btn-primary">
          <Upload size={15} />
          Upload Document
        </button>
      </div>

      {showUpload && (
        <div className="glass-card p-5">
          <h2 className="section-title mb-4">Upload Research Document</h2>
          {error && (
            <div className="alert-error flex items-center gap-2 mb-4">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
          <form onSubmit={upload} className="space-y-3">
            <input
              type="file"
              accept=".pdf,.txt"
              className="input-field text-xs py-2"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label-text">Title</label>
                <input
                  className="input-field text-xs"
                  value={uploadForm.title}
                  onChange={e => setUploadForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Paper title"
                />
              </div>
              <div>
                <label className="label-text">Authors</label>
                <input
                  className="input-field text-xs"
                  value={uploadForm.authors}
                  onChange={e => setUploadForm(f => ({ ...f, authors: e.target.value }))}
                  placeholder="Author(s)"
                />
              </div>
              <div>
                <label className="label-text">Year</label>
                <input
                  type="number"
                  className="input-field text-xs"
                  value={uploadForm.year}
                  onChange={e => setUploadForm(f => ({ ...f, year: e.target.value }))}
                  placeholder="2025"
                />
              </div>
              <div>
                <label className="label-text">DOI / Source</label>
                <input
                  className="input-field text-xs"
                  value={uploadForm.doi}
                  onChange={e => setUploadForm(f => ({ ...f, doi: e.target.value }))}
                  placeholder="10.xxxx/xxx"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowUpload(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={uploading} className="btn-primary">
                {uploading ? (
                  <>
                    <span className="spinner" />
                    Uploading…
                  </>
                ) : (
                  'Upload & Process'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass-card p-5">
          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading…</div>
          ) : docs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Library size={36} className="mx-auto mb-3 text-slate-700" />
              <p>No documents. Upload research PDFs to begin.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {docs.map(d => (
                <div
                  key={d.id}
                  onClick={() => {
                    setSelected(d);
                    loadSummary(d.id);
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selected?.id === d.id
                      ? 'border-brand-500/60 bg-brand-900/20'
                      : 'border-white/8 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">{d.title}</div>
                      <div className="text-xs text-slate-500">
                        {d.authors || '—'} · {d.year || '—'}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`badge text-[10px] ${
                            d.status === 'READY'
                              ? 'badge-green'
                              : d.status === 'ERROR'
                              ? 'badge-red'
                              : 'badge-yellow'
                          }`}
                        >
                          {d.status}
                        </span>
                        <span className="text-[10px] text-slate-600">
                          {d.word_count?.toLocaleString() || '—'} words
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        del(d.id);
                      }}
                      className="text-slate-600 hover:text-red-400 flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-5">
          {!selected ? (
            <div className="text-center py-10 text-slate-500">
              <BookOpen size={36} className="mx-auto mb-3 text-slate-700" />
              <p>Select a document to view summary</p>
            </div>
          ) : summary?.error ? (
            <div className="alert-error">{summary.error}</div>
          ) : summary ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">{summary.title}</h2>
                <div className="text-xs text-slate-500">
                  {summary.authors} · {summary.year} · {summary.word_count?.toLocaleString()} words ·{' '}
                  {summary.n_chunks} chunks
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1 font-medium">Excerpt</div>
                <p className="text-xs text-slate-300 leading-relaxed">{summary.summary_excerpt}</p>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-2 font-medium">Top Keywords</div>
                <div className="flex flex-wrap gap-1.5">
                  {summary.top_keywords?.slice(0, 15).map((kw: string) => (
                    <span key={kw} className="badge badge-cyan text-[10px]">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              <a href="/research-assistant" className="btn-secondary text-xs gap-2 w-full justify-center">
                <Bot size={13} />
                Ask Questions About This Document
              </a>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">Loading summary…</div>
          )}
        </div>
      </div>

      <div className="alert-info text-xs">
        Only upload documents you are authorised to use. Respect copyright, access restrictions, and
        dataset licenses.
      </div>
    </div>
  );
}
