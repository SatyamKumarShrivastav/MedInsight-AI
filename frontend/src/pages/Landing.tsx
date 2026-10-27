/**
 * MedInsight AI — Landing Page
 * BioIntelliX | Team led by Mr. S. K. Shrivastav
 */
import React from 'react';
import { Link } from 'react-router-dom';
import {
  HeartPulse, Brain, Zap, BarChart3, Shield, Activity,
  BookOpen, FileText, ChevronRight, Dna, Bot, FlaskConical,
  CheckCircle2, ArrowRight, ExternalLink
} from 'lucide-react';

const features = [
  { icon: <Database />, title: 'Dataset Management', desc: 'Upload CSV/XLSX biomedical datasets with preview, schema inspection, and version tracking.' },
  { icon: <ShieldCheck />, title: 'Data Quality Engine', desc: 'Automated detection of missing values, duplicates, outliers, and schema inconsistencies.' },
  { icon: <Brain size={22} className="text-purple-400" />, title: 'ML Workbench', desc: 'Train classification and regression models with 7+ algorithms including XGBoost and LightGBM.' },
  { icon: <Zap size={22} className="text-yellow-400" />, title: 'Explainable AI', desc: 'SHAP-powered local and global feature importance explanations for every prediction.' },
  { icon: <Activity size={22} className="text-red-400" />, title: 'Anomaly Detection', desc: 'Isolation Forest, LOF, and One-Class SVM to surface unusual patterns in your data.' },
  { icon: <Dna size={22} className="text-teal-400" />, title: 'Signal Analysis', desc: 'ECG, EEG, and EMG CSV file processing with filtering, FFT, and feature extraction.' },
  { icon: <Bot size={22} className="text-cyan-400" />, title: 'Research Assistant', desc: 'Upload PDF/TXT papers and ask questions using TF-IDF retrieval. LLM-optional.' },
  { icon: <FileText size={22} className="text-emerald-400" />, title: 'Report Generation', desc: 'Download PDF, CSV, and XLSX research reports with metrics and references.' },
];

const refs = [
  'Petridis et al. (2026) — Holistic AI in Medicine (npj Digital Medicine)',
  'Kim et al. (2025/26) — Transparency of Medical AI Systems (Nature Reviews Bioengineering)',
  'Patlatzoglou et al. (2025) — Cost of Explainability in AI-ECG (npj Digital Medicine)',
  'Gliner et al. (2025) — Clinically Meaningful Interpretability (npj Digital Medicine)',
  'Taleban et al. (2026) — XAI in ECG: Systematic Review (Biomed Signal Processing)',
  'Jeon et al. (2026) — Hierarchical RAG for Biomedical AI (Computers in Biology)',
];

function Database() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-400">
      <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}
function ShieldCheck() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface-900 overflow-x-hidden">
      {/* Nav */}
      <header className="border-b border-white/8 px-6 py-4 flex items-center justify-between sticky top-0 z-30 bg-surface-900/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center">
            <HeartPulse size={18} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-white">MedInsight AI</span>
            <span className="text-xs text-slate-500 ml-2 hidden sm:inline">BioIntelliX</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-secondary text-xs py-2 px-3">Sign In</Link>
          <Link to="/register" className="btn-primary text-xs py-2 px-3">Get Started</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-6 py-24 text-center overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-brand-700/20 rounded-full blur-3xl" />
          <div className="absolute top-32 right-1/4 w-80 h-80 bg-cyan-700/15 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-900/60 border border-brand-700/40 text-brand-300 text-xs font-medium mb-6">
            <HeartPulse size={12} />
            BioIntelliX — Academic & Research Platform
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-white leading-tight mb-4">
            MedInsight <span className="text-gradient">AI</span>
          </h1>
          <p className="text-xl text-slate-400 mb-3 font-medium">
            An Explainable AI-Powered Biomedical Data Analytics
          </p>
          <p className="text-lg text-slate-500 mb-8">
            and Predictive Decision-Support Platform
          </p>
          <p className="text-sm italic text-cyan-400 mb-10">
            "From Biomedical Data to Intelligent Insight."
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary text-base px-8 py-3.5 shadow-glow">
              Start Research <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-secondary text-base px-8 py-3.5">
              Sign In to Platform
            </Link>
          </div>
        </div>
      </section>

      {/* Architecture flow */}
      <section className="px-6 py-12 border-y border-white/6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs text-slate-600 uppercase tracking-widest mb-6">Platform Pipeline</p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-medium">
            {['Biomedical Data Upload', 'Quality Validation', 'Preprocessing', 'EDA & Analytics', 'AI/ML Training', 'XAI & Anomaly', 'Signal Analysis', 'Reports & RAG'].map((step, i, arr) => (
              <React.Fragment key={step}>
                <div className="px-3 py-2 rounded-lg bg-surface-800 border border-white/10 text-slate-300">{step}</div>
                {i < arr.length - 1 && <ChevronRight size={14} className="text-slate-600 flex-shrink-0" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Platform Capabilities</h2>
            <p className="text-slate-400">A complete, modular biomedical AI research platform</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <div key={i} className="glass-card-hover p-5 group">
                <div className="mb-3">{f.icon}</div>
                <h3 className="font-semibold text-white text-sm mb-2">{f.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="px-6 py-16 border-y border-white/6 bg-surface-950/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Technology Stack</h2>
          <p className="text-slate-400 text-sm mb-8">Built with modern, production-ready technologies</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { name: 'React + Vite', cat: 'Frontend' },
              { name: 'TypeScript', cat: 'Frontend' },
              { name: 'Tailwind CSS', cat: 'Frontend' },
              { name: 'FastAPI', cat: 'Backend' },
              { name: 'SQLAlchemy', cat: 'Backend' },
              { name: 'MySQL', cat: 'Database' },
              { name: 'scikit-learn', cat: 'ML' },
              { name: 'XGBoost/LGBM', cat: 'ML' },
              { name: 'SHAP', cat: 'XAI' },
              { name: 'SciPy', cat: 'Signal' },
            ].map(t => (
              <div key={t.name} className="glass-card px-3 py-3 text-center">
                <div className="text-xs font-semibold text-white">{t.name}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">{t.cat}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* References */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">Research Foundation</h2>
          <p className="text-slate-400 text-sm text-center mb-8">Grounded in 2025–2026 peer-reviewed biomedical AI literature</p>
          <div className="space-y-2">
            {refs.map((ref, i) => (
              <div key={i} className="flex items-start gap-3 glass-card p-3.5">
                <CheckCircle2 size={14} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-slate-400">{ref}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="alert-warning text-center">
            <strong>⚠ Academic Research Platform Disclaimer:</strong> MedInsight AI is an academic and research-oriented platform.
            It provides data-driven analytical and model-generated insights using biomedical datasets.
            It is <strong>not</strong> a medical diagnostic system and should <strong>not</strong> be used to make medical decisions.
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 px-6 py-8 text-center bg-surface-950/40">
        <div className="flex items-center justify-center gap-2 mb-2">
          <HeartPulse size={18} className="text-brand-400" />
          <span className="text-base font-semibold text-white">BioIntelliX | MedInsight AI</span>
        </div>
        <p className="text-xs text-cyan-300 font-medium mb-1.5">From Biomedical Data to Intelligent Insight.</p>
        <p className="text-xs text-slate-300 flex items-center justify-center gap-1.5 flex-wrap">
          <span>Developed by BioIntelliX (Team led by</span>
          <a
            href="https://www.linkedin.com/in/s-k-shrivastav/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-200 font-semibold underline underline-offset-2 inline-flex items-center gap-1 transition-colors"
          >
            Mr. S. K. Shrivastav
            <ExternalLink size={12} />
          </a>
          <span>)</span>
        </p>
        <p className="text-xs text-slate-500 mt-2">© 2026, all right reserved</p>
      </footer>
    </div>
  );
}
