/**
 * MedInsight AI — Biomedical Signal Analysis Page
 * Upload ECG, EEG, or EMG CSV files for research-oriented signal characterisation
 * BioIntelliX | Team led by Mr. S. K. Shrivastav
 */
import React, { useState } from 'react';
import { Dna, AlertCircle, Play } from 'lucide-react';
import { signalsApi } from '../api/client';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function SignalAnalysis() {
  const [file, setFile] = useState<File | null>(null);
  const [config, setConfig] = useState({
    signal_type: 'ECG',
    sampling_rate: 250,
    channel_column: '',
    apply_filter: true,
    lowcut: 0.5,
    highcut: 40,
    normalize: true,
  });
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const run = async () => {
    if (!file) {
      setError('Please select a signal file.');
      return;
    }
    setRunning(true);
    setError('');
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('signal_type', config.signal_type);
      fd.append('sampling_rate', String(config.sampling_rate));
      fd.append('channel_column', config.channel_column);
      fd.append('apply_filter', String(config.apply_filter));
      fd.append('lowcut', String(config.lowcut));
      fd.append('highcut', String(config.highcut));
      fd.append('normalize', String(config.normalize));
      const r = await signalsApi.analyze(fd);
      setResult(r.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Analysis failed');
    } finally {
      setRunning(false);
    }
  };

  const signalData =
    result?.processed_preview?.map((v: number, i: number) => ({
      t: Number(result.time_axis[i]).toFixed(2),
      v: Number(v).toFixed(4),
    })) || [];

  const fftData =
    result?.fft
      ?.slice(0, 100)
      .map((f: any) => ({ freq: f.freq.toFixed(1), mag: Number(f.magnitude).toFixed(2) })) || [];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Biomedical Signal Analysis</h1>
        <p className="page-subtitle">
          Upload ECG, EEG, or EMG CSV files for research-oriented signal characterisation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="glass-card p-5 space-y-4">
          <h2 className="section-title flex items-center gap-2">
            <Dna size={16} className="text-teal-400" />
            Configuration
          </h2>
          <div>
            <label className="label-text">Signal File (CSV/TXT)</label>
            <input
              type="file"
              accept=".csv,.txt"
              className="input-field text-xs py-2"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
            {file && (
              <div className="text-xs text-slate-500 mt-1">
                {file.name} · {(file.size / 1024).toFixed(1)} KB
              </div>
            )}
          </div>
          <div>
            <label className="label-text">Signal Type</label>
            <select
              className="select-field"
              value={config.signal_type}
              onChange={e => setConfig(c => ({ ...c, signal_type: e.target.value }))}
            >
              <option value="ECG">ECG (Electrocardiogram)</option>
              <option value="EEG">EEG (Electroencephalogram)</option>
              <option value="EMG">EMG (Electromyogram)</option>
            </select>
          </div>
          <div>
            <label className="label-text">Sampling Rate (Hz)</label>
            <input
              type="number"
              className="input-field"
              value={config.sampling_rate}
              onChange={e => setConfig(c => ({ ...c, sampling_rate: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className="label-text">Channel Column (optional)</label>
            <input
              type="text"
              className="input-field text-xs"
              value={config.channel_column}
              onChange={e => setConfig(c => ({ ...c, channel_column: e.target.value }))}
              placeholder="e.g. ecg_mv (auto-detected)"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label-text">Low Cut (Hz)</label>
              <input
                type="number"
                className="input-field text-xs"
                value={config.lowcut}
                onChange={e => setConfig(c => ({ ...c, lowcut: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="label-text">High Cut (Hz)</label>
              <input
                type="number"
                className="input-field text-xs"
                value={config.highcut}
                onChange={e => setConfig(c => ({ ...c, highcut: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={config.apply_filter}
                onChange={e => setConfig(c => ({ ...c, apply_filter: e.target.checked }))}
                className="rounded"
              />
              Bandpass Filter
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={config.normalize}
                onChange={e => setConfig(c => ({ ...c, normalize: e.target.checked }))}
                className="rounded"
              />
              Normalize
            </label>
          </div>
          <button onClick={run} disabled={!file || running} className="btn-primary w-full justify-center">
            {running ? (
              <>
                <span className="spinner" />
                Analysing…
              </>
            ) : (
              <>
                <Play size={15} />
                Analyse Signal
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
              <Dna size={40} className="mx-auto mb-3 text-slate-700" />
              <p>Upload a CSV signal file and configure parameters.</p>
              <p className="text-xs mt-2">
                Use the synthetic_ecg_signal.csv from the datasets folder to test.
              </p>
            </div>
          )}
          {result && (
            <div className="space-y-4 animate-slide-up">
              <div className="glass-card p-5">
                <h2 className="section-title mb-3">
                  {result.signal_type} Signal — Channel: {result.channel}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { l: 'Samples', v: result.n_samples?.toLocaleString() },
                    { l: 'Duration', v: `${result.duration_sec}s` },
                    { l: 'Sampling Rate', v: `${result.sampling_rate_hz} Hz` },
                    { l: 'Missing', v: result.missing_samples },
                  ].map(s => (
                    <div key={s.l} className="bg-surface-800/60 rounded-lg p-2 text-center">
                      <div className="text-sm font-bold text-white">{s.v}</div>
                      <div className="text-[10px] text-slate-500">{s.l}</div>
                    </div>
                  ))}
                </div>
                <h3 className="text-sm font-medium text-slate-300 mb-2">
                  Processed Signal (first {signalData.length} samples)
                </h3>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={signalData}>
                    <XAxis
                      dataKey="t"
                      tick={{ fontSize: 9 }}
                      label={{ value: 'Time (s)', position: 'insideBottom', offset: -5, fontSize: 10 }}
                    />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip
                      contentStyle={{
                        background: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                      }}
                    />
                    <Line type="monotone" dataKey="v" stroke="#06b6d4" dot={false} strokeWidth={1} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card p-5">
                <h3 className="section-title mb-3">FFT — Power Spectrum (first 100 frequencies)</h3>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={fftData}>
                    <XAxis
                      dataKey="freq"
                      tick={{ fontSize: 9 }}
                      label={{ value: 'Freq (Hz)', position: 'insideBottom', offset: -5, fontSize: 10 }}
                    />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip
                      contentStyle={{
                        background: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="mag" fill="#8b5cf6" barSize={4} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card p-5">
                <h3 className="section-title mb-3">Extracted Features</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(result.features || {}).map(([k, v]: any) => (
                    <div key={k} className="bg-surface-800/60 rounded-lg px-3 py-2">
                      <div className="text-[10px] text-slate-500">{k.replace(/_/g, ' ')}</div>
                      <div className="text-sm font-mono text-white">
                        {typeof v === 'number' ? Number(v).toFixed(4) : String(v)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="alert-warning text-xs">{result.disclaimer}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
