/**
 * MedInsight AI — Research Reports
 * BioIntelliX | Team led by Mr. S. K. Shrivastav
 */
import React, { useState, useEffect } from 'react';
import {
  FileText, Download, Play, AlertCircle, CheckCircle2,
  RefreshCw, Filter,
} from 'lucide-react';
import { reportsApi, mlApi } from '../api/client';

export default function Reports() {
  const [reports, setReports]       = useState<any[]>([]);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [form, setForm]             = useState({ title: '', experiment_id: '', report_type: 'PDF' });
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');

  const load = async () => {
    try {
      const [rRes, eRes] = await Promise.all([
        reportsApi.list(),
        mlApi.listExperiments(0, 50),
      ]);
      setReports(rRes.data);
      setExperiments(eRes.data);
    } catch {
      // API not connected — keep empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const generate = async () => {
    if (!form.title.trim()) { setError('Report title is required.'); return; }
    setGenerating(true); setError(''); setSuccess('');
    try {
      await reportsApi.generate({
        title: form.title,
        experiment_id: form.experiment_id ? Number(form.experiment_id) : null,
        report_type: form.report_type,
      });
      setSuccess(`${form.report_type} report generated successfully!`);
      setForm(f => ({ ...f, title: '' }));
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Report generation failed. Ensure backend is running.');
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = async (id: number, type: string) => {
    try {
      const r = await reportsApi.download(id);
      const ext = type === 'PDF' ? 'pdf' : type === 'CSV' ? 'csv' : 'xlsx';
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `medinsight_report_${id}.${ext}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Download failed. The report file may not be available yet.');
    }
  };

  // Stats
  const completed = reports.filter(r => r.status === 'COMPLETED').length;
  const pdfCount  = reports.filter(r => r.report_type === 'PDF').length;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FileText size={24} className="text-brand-400" /> Research Reports
          </h1>
          <p className="page-subtitle">
            Generate and download PDF, CSV, and XLSX research summaries
          </p>
        </div>
        <button onClick={load} className="btn-secondary gap-2 text-xs">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Reports', value: reports.length, color: 'text-brand-400' },
          { label: 'Completed',     value: completed,       color: 'text-emerald-400' },
          { label: 'PDF Reports',   value: pdfCount,        color: 'text-cyan-400' },
          { label: 'Experiments',   value: experiments.length, color: 'text-violet-400' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Generator */}
      <div className="glass-card p-5">
        <h2 className="section-title mb-4 flex items-center gap-2">
          <Play size={15} className="text-brand-400" /> Generate New Report
        </h2>

        {error && (
          <div className="alert-error flex items-center gap-2 mb-4 text-sm">
            <AlertCircle size={14} /> {error}
          </div>
        )}
        {success && (
          <div className="alert-success flex items-center gap-2 mb-4 text-sm">
            <CheckCircle2 size={14} /> {success}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="sm:col-span-2">
            <label className="label-text">Report Title *</label>
            <input
              className="input-field"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g., Diabetes Classification Experiment Report"
            />
          </div>
          <div>
            <label className="label-text">Output Format</label>
            <select
              className="select-field"
              value={form.report_type}
              onChange={e => setForm(f => ({ ...f, report_type: e.target.value }))}
            >
              <option value="PDF">📄 PDF (ReportLab)</option>
              <option value="CSV">📊 CSV</option>
              <option value="XLSX">📗 Excel (XLSX)</option>
            </select>
          </div>
        </div>

        <div className="mb-5">
          <label className="label-text flex items-center gap-1.5">
            <Filter size={12} className="text-slate-500" /> Link Experiment (optional)
          </label>
          <select
            className="select-field"
            value={form.experiment_id}
            onChange={e => setForm(f => ({ ...f, experiment_id: e.target.value }))}
          >
            <option value="">— No linked experiment —</option>
            {experiments.map(e => (
              <option key={e.id} value={e.id}>
                [{e.task_type}] {e.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-600 mt-1">
            Linking an experiment includes model metrics and training details in the report.
          </p>
        </div>

        <button onClick={generate} disabled={generating} className="btn-primary">
          <Play size={14} />
          {generating ? 'Generating Report…' : `Generate ${form.report_type} Report`}
        </button>
      </div>

      {/* Reports table */}
      <div className="glass-card p-5">
        <h2 className="section-title mb-4">Generated Reports</h2>

        {loading ? (
          <div className="flex items-center justify-center py-10 gap-2">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-slate-400 text-sm">Loading reports…</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <FileText size={42} className="mx-auto mb-3 text-slate-700" />
            <p className="text-sm">No reports generated yet.</p>
            <p className="text-xs mt-1 text-slate-600">Use the form above to generate your first report.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Format</th>
                  <th>Status</th>
                  <th>Experiment</th>
                  <th>Generated</th>
                  <th>Download</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs text-slate-500">#{r.id}</td>
                    <td className="font-medium text-white max-w-[180px] truncate" title={r.title}>
                      {r.title}
                    </td>
                    <td>
                      <span className="badge badge-blue">{String(r.report_type)}</span>
                    </td>
                    <td>
                      <span className={`badge ${
                        r.status === 'COMPLETED' ? 'badge-green' :
                        r.status === 'FAILED'    ? 'badge-red'   : 'badge-yellow'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="text-xs text-slate-400">
                      {r.experiment_id ? `#${r.experiment_id}` : '—'}
                    </td>
                    <td className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      {r.status === 'COMPLETED' ? (
                        <button
                          onClick={() => downloadReport(r.id, String(r.report_type))}
                          className="btn-secondary py-1 px-2 text-xs gap-1"
                        >
                          <Download size={11} /> Download
                        </button>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/20 px-4 py-3 text-xs text-cyan-400/80">
        <strong>Note:</strong> Reports are research summaries generated by MedInsight AI. They include methodology,
        model metrics, and 2025–2026 research references. They are <strong>not</strong> clinical documents and must
        not be used for medical decision-making. — BioIntelliX
      </div>
    </div>
  );
}
