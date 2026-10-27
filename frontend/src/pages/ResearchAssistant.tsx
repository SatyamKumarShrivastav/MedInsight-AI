/**
 * MedInsight AI — Biomedical Research Assistant Page
 * Ask questions about uploaded research documents using TF-IDF keyword retrieval
 * BioIntelliX | Team led by Mr. S. K. Shrivastav
 */
import React, { useState, useEffect } from 'react';
import { Bot, AlertCircle, Send } from 'lucide-react';
import { documentsApi } from '../api/client';

const sampleQuestions = [
  'What is the main contribution of this paper?',
  'What methods were used?',
  'What datasets were used in experiments?',
  'What are the key findings?',
  'What are the limitations mentioned?',
];

export default function ResearchAssistant() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<number | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    documentsApi
      .list()
      .then(r => setDocuments(r.data.filter((d: any) => d.status === 'READY')))
      .catch(() => {});
  }, []);

  const ask = async () => {
    if (!selectedDoc || !question.trim()) return;
    setLoading(true);
    setError('');
    setAnswer(null);
    try {
      const r = await documentsApi.ask(selectedDoc, question);
      setAnswer(r.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Query failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Biomedical Research Assistant</h1>
        <p className="page-subtitle">
          Ask questions about uploaded research documents using TF-IDF keyword retrieval
        </p>
      </div>

      <div className="alert-info text-xs flex items-start gap-2">
        <Bot size={14} className="flex-shrink-0 mt-0.5" />
        <span>
          This assistant uses keyword-based retrieval (offline). For LLM-enhanced answers, configure
          LLM_PROVIDER in .env. All answers are grounded in uploaded document content only.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h2 className="section-title mb-3">Select Document</h2>
            {documents.length === 0 ? (
              <div className="text-center py-4 text-slate-500 text-sm">
                No ready documents.
                <br />
                <a href="/documents" className="text-brand-400 text-xs hover:underline">
                  Upload documents →
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDoc(d.id)}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${
                      selectedDoc === d.id
                        ? 'border-brand-500/60 bg-brand-900/20 text-white'
                        : 'border-white/10 bg-surface-800/40 text-slate-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <div className="font-medium truncate">{d.title}</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      {d.authors || '—'} · {d.year || '—'} · {d.word_count?.toLocaleString()} words
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card p-5">
            <h2 className="section-title mb-2 text-sm">Sample Questions</h2>
            <div className="space-y-1.5">
              {sampleQuestions.map(q => (
                <button
                  key={q}
                  onClick={() => setQuestion(q)}
                  className="w-full text-left text-xs text-slate-400 hover:text-white hover:bg-white/5 px-2 py-1.5 rounded-lg transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-5">
            <label className="label-text">Your Question</label>
            <div className="flex gap-2">
              <textarea
                className="input-field resize-none h-20 flex-1"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="Ask a question about the selected document…"
              />
              <button
                onClick={ask}
                disabled={!selectedDoc || !question.trim() || loading}
                className="btn-primary px-4 self-end"
              >
                {loading ? <span className="spinner" /> : <Send size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="alert-error flex items-center gap-2">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {answer && (
            <div className="space-y-4 animate-slide-up">
              <div className="glass-card p-5">
                <div className="text-xs text-slate-500 mb-2">
                  Question: <span className="text-slate-300">{answer.question}</span>
                </div>
                <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {answer.answer}
                </div>
                <div className="text-xs text-slate-600 mt-3">
                  Retrieval mode: {answer.retrieval_mode}
                </div>
              </div>
              {answer.sources?.length > 0 && (
                <div className="glass-card p-5">
                  <h3 className="section-title mb-3 text-sm">Source Passages</h3>
                  {answer.sources.map((s: any, i: number) => (
                    <div key={i} className="mb-3 p-3 bg-surface-800/60 rounded-lg border border-white/5">
                      <div className="text-[10px] text-slate-500 mb-1">
                        Chunk #{s.chunk_index} · Relevance: {s.relevance_score}
                      </div>
                      <div className="text-xs text-slate-400 leading-relaxed">{s.excerpt}…</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="alert-warning text-xs">{answer.disclaimer}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
