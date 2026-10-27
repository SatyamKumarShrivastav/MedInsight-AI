/**
 * MedInsight AI — Help & Platform Disclaimer
 * BioIntelliX | Team led by Mr. S. K. Shrivastav
 */
import React, { useState } from 'react';
import {
  HelpCircle, Shield, BookOpen, Zap, Upload, Brain, BarChart3,
  Activity, MessageSquare, FileText, Search, ChevronDown, ChevronRight,
  FlaskConical, HeartPulse, AlertTriangle, ExternalLink
} from 'lucide-react';

const FAQ = [
  {
    q: 'What data formats are supported for upload?',
    a: 'MedInsight AI supports CSV (.csv) and Excel (.xlsx, .xls) files up to 50 MB. For signal analysis, CSV files with time-series columns (ECG, EEG, PPG) are accepted.',
  },
  {
    q: 'Is MedInsight AI a certified medical device?',
    a: 'No. MedInsight AI is a strictly academic and research platform. It is NOT a medical device, clinical diagnostic tool, or healthcare system. All outputs are research estimates only. Always consult qualified healthcare professionals for any clinical decisions.',
  },
  {
    q: 'How does model training work?',
    a: 'Navigate to ML Workbench, select a preprocessed dataset, choose your target column, select algorithms (e.g., Random Forest, XGBoost, Logistic Regression), and click Train. Results appear in the Experiment Registry and Model Evaluation pages.',
  },
  {
    q: 'What is XAI (Explainable AI)?',
    a: 'XAI Workspace uses SHAP (SHapley Additive exPlanations) to break down individual predictions into per-feature contributions. This helps researchers understand why a model made a particular prediction.',
  },
  {
    q: 'How does the Research Assistant work?',
    a: 'Upload a PDF to the Document Library. Then go to Research Assistant, select the document, and ask questions in natural language. The system uses a hierarchical RAG (Retrieval-Augmented Generation) approach to answer from the document.',
  },
  {
    q: 'What signal types does Signal Analysis support?',
    a: 'Signal Analysis supports ECG (Electrocardiogram), EEG (Electroencephalogram), PPG (Photoplethysmography), and generic biomedical time-series. Upload a CSV with a time column and signal column.',
  },
  {
    q: 'How are reports generated?',
    a: 'Navigate to Reports, enter a title, optionally link an experiment, and choose your format (PDF, CSV, or XLSX). PDF reports are generated using ReportLab and include methodology, metrics, and references.',
  },
  {
    q: 'Is my data private?',
    a: 'All data is stored locally on your server instance. MedInsight AI does not transmit your biomedical data to any external service. For production deployments, ensure your server is properly secured.',
  },
];

const WORKFLOW = [
  { icon: Upload,      title: 'Upload Dataset',      desc: 'Dataset Management → Upload CSV/XLSX (max 50 MB)', color: 'text-cyan-400' },
  { icon: BarChart3,   title: 'Quality Analysis',    desc: 'Data Quality Engine → Run Quality Check',          color: 'text-emerald-400' },
  { icon: Zap,         title: 'Preprocessing',       desc: 'Preprocessing → Apply transforms (impute, scale)', color: 'text-yellow-400' },
  { icon: Search,      title: 'Explore Data (EDA)',  desc: 'EDA → Visualize distributions, correlations',      color: 'text-violet-400' },
  { icon: Brain,       title: 'Train Models',        desc: 'ML Workbench → Select algorithm → Train',          color: 'text-brand-400' },
  { icon: BarChart3,   title: 'Evaluate',            desc: 'Model Evaluation → Compare metrics, ROC, CM',      color: 'text-teal-400' },
  { icon: FlaskConical,title: 'Explain (XAI)',       desc: 'XAI Workspace → SHAP feature contributions',       color: 'text-orange-400' },
  { icon: Activity,    title: 'Anomaly Detection',   desc: 'Anomaly Detection → Isolation Forest / DBSCAN',    color: 'text-red-400' },
  { icon: HeartPulse,  title: 'Signal Analysis',     desc: 'Signal Analysis → ECG/EEG processing & features', color: 'text-pink-400' },
  { icon: MessageSquare,title:'Research Q&A',        desc: 'Document Library → Upload PDF → Ask questions',    color: 'text-purple-400' },
  { icon: FileText,    title: 'Generate Reports',    desc: 'Reports → PDF / CSV / XLSX export',                color: 'text-slate-400' },
];

const REFERENCES = [
  'Petridis et al. (2026). Holistic AI in Medicine. npj Digital Medicine.',
  'Kim, Gadgil & Lee (2025/26). Transparency of Medical AI Systems. Nature Reviews Bioengineering.',
  'Patlatzoglou et al. (2025). Cost of Explainability in AI-ECG. npj Digital Medicine.',
  'Gliner et al. (2025). Clinically Meaningful Interpretability. npj Digital Medicine.',
  'van der Valk et al. (2026). Explainable ECG VAE Analysis. IEEE TBME.',
  'Taleban et al. (2026). XAI in ECG: Systematic Review. Biomedical Signal Processing and Control.',
  'Pe et al. (2026). Contrastive XAI in Healthcare. BMC Medical Informatics.',
  'Jeon et al. (2026). Hierarchical RAG for Pharmacogenomics. Computers in Biology and Medicine.',
  'Han et al. (2026). CLEAR Foundation Model for Radiology. Nature Biomedical Engineering.',
];

export default function Help() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="p-6 max-w-4xl space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title flex items-center gap-2">
          <HelpCircle size={24} className="text-brand-400" /> Help &amp; Platform Guide
        </h1>
        <p className="page-subtitle">User guide, FAQ, research references, and important disclaimers</p>
      </div>

      {/* CRITICAL DISCLAIMER */}
      <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-red-300 text-sm mb-2 uppercase tracking-wider">
              ⚠ Critical Research Disclaimer
            </div>
            <p className="text-sm text-red-200 leading-relaxed">
              <strong>MedInsight AI is an academic and research-oriented software platform.</strong> It provides
              data-driven analytical and model-generated insights using biomedical datasets. It is{' '}
              <strong className="text-red-300">NOT</strong> a medical device, diagnostic system, clinical
              decision-support tool, or healthcare product. It must{' '}
              <strong className="text-red-300">NOT</strong> be used to make medical decisions about patients or
              individuals. All outputs are research estimates and statistical associations — not clinical findings.
              Always consult qualified healthcare professionals for medical concerns.
            </p>
          </div>
        </div>
      </div>

      {/* Platform Overview */}
      <div className="glass-card p-5">
        <h2 className="section-title mb-3 flex items-center gap-2">
          <BookOpen size={16} className="text-brand-400" /> Platform Overview
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed mb-3">
          <strong className="text-white">MedInsight AI</strong> is developed by{' '}
          <strong className="text-brand-400">BioIntelliX</strong> (Team led by{' '}
          <a
            href="https://www.linkedin.com/in/s-k-shrivastav/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-200 font-semibold underline underline-offset-2 inline-flex items-center gap-1 transition-colors"
          >
            Mr. S. K. Shrivastav
            <ExternalLink size={12} />
          </a>
          ) as an academic platform for research in explainable AI, biomedical data analytics, and predictive modelling.
        </p>
        <p className="text-sm text-slate-300 leading-relaxed">
          The platform integrates modern 2025–2026 research directions including SHAP-based XAI, hierarchical
          Retrieval-Augmented Generation (RAG), biomedical signal processing (ECG/EEG/PPG), and multi-algorithm
          AutoML — all without requiring any physical hardware.
        </p>
        <p className="mt-3 text-sm italic text-cyan-400 font-medium">
          "BioIntelliX | MedInsight AI — From Biomedical Data to Intelligent Insight."
        </p>
      </div>

      {/* Workflow */}
      <div className="glass-card p-5">
        <h2 className="section-title mb-4 flex items-center gap-2">
          <Zap size={16} className="text-brand-400" /> Recommended Workflow
        </h2>
        <div className="space-y-2">
          {WORKFLOW.map((step, i) => (
            <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/3 transition">
              <div className={`flex-shrink-0 w-7 h-7 rounded-full bg-surface-800 border border-white/10 flex items-center justify-center`}>
                <step.icon size={13} className={step.color} />
              </div>
              <div>
                <div className="text-sm font-medium text-white">{i + 1}. {step.title}</div>
                <div className="text-xs text-slate-500">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="glass-card p-5">
        <h2 className="section-title mb-4 flex items-center gap-2">
          <HelpCircle size={16} className="text-brand-400" /> Frequently Asked Questions
        </h2>
        <div className="space-y-2">
          {FAQ.map((faq, i) => (
            <div key={i} className="border border-white/8 rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-white/4 transition"
              >
                <span className="text-sm font-medium text-white">{faq.q}</span>
                {openFaq === i
                  ? <ChevronDown size={14} className="text-brand-400 flex-shrink-0 ml-2" />
                  : <ChevronRight size={14} className="text-slate-500 flex-shrink-0 ml-2" />}
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Research References */}
      <div className="glass-card p-5">
        <h2 className="section-title mb-4 flex items-center gap-2">
          <FileText size={16} className="text-brand-400" /> Research References (2025–2026)
        </h2>
        <ol className="space-y-2">
          {REFERENCES.map((ref, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
              <span className="flex-shrink-0 text-brand-500 font-mono">{i + 1}.</span>
              <span>{ref}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Footer credit */}
      <div className="text-center text-xs text-slate-500 py-3 border-t border-white/5 space-y-1">
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          <span>MedInsight AI v1.0.0 &nbsp;|&nbsp; Developed by <strong className="text-slate-300">BioIntelliX</strong> (Team led by</span>
          <a
            href="https://www.linkedin.com/in/s-k-shrivastav/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-200 font-semibold underline underline-offset-2 inline-flex items-center gap-1 transition-colors"
          >
            Mr. S. K. Shrivastav
            <ExternalLink size={11} />
          </a>
          <span>) &nbsp;|&nbsp; From Biomedical Data to Intelligent Insight.</span>
        </div>
        <div className="text-[11px] text-slate-600">© 2026, all right reserved</div>
      </div>
    </div>
  );
}
