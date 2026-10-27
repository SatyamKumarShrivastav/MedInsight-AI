"""
MedInsight AI — Biomedical Research Assistant & RAG Engine
BioIntelliX | Team led by Mr. S. K. Shrivastav
From Biomedical Data to Intelligent Insight.
"""
from typing import List, Dict, Any, Optional
import re
import math


def extract_keywords_from_text(text: str, top_n: int = 10) -> List[str]:
    """Extract salient biomedical and technical keywords using word frequency and length filtering."""
    stop_words = {
        "the", "and", "for", "that", "this", "with", "from", "across", "have", "been",
        "were", "which", "their", "into", "over", "more", "also", "between", "under",
        "than", "such", "these", "those", "when", "where", "while", "both", "each",
    }
    words = re.findall(r"[a-zA-Z]{4,}", text.lower())
    freq: Dict[str, int] = {}
    for w in words:
        if w not in stop_words:
            freq[w] = freq.get(w, 0) + 1
    return sorted(freq, key=lambda x: -freq[x])[:top_n]


def hierarchical_chunk_text(text: str, chunk_size: int = 250, overlap: int = 50) -> List[Dict[str, Any]]:
    """Split long scientific documents into overlapping chunks with keywords."""
    words = text.split()
    chunks = []
    idx = 0
    chunk_index = 0

    while idx < len(words):
        chunk_words = words[idx : idx + chunk_size]
        chunk_content = " ".join(chunk_words)
        kw = extract_keywords_from_text(chunk_content, top_n=6)
        chunks.append({
            "chunk_index": chunk_index,
            "content": chunk_content,
            "keywords": kw,
            "word_count": len(chunk_words),
            "page_approx": (idx // 300) + 1,
        })
        chunk_index += 1
        idx += chunk_size - overlap

    return chunks


def search_document_chunks(
    query: str,
    chunks: List[Dict[str, Any]],
    top_k: int = 3,
) -> List[Dict[str, Any]]:
    """Perform TF-IDF ranked retrieval across document chunks."""
    query_words = [w.lower() for w in re.findall(r"[a-zA-Z]{3,}", query)]
    if not query_words or not chunks:
        return []

    # Compute document frequencies
    n_docs = len(chunks)
    doc_freqs: Dict[str, int] = {}
    for c in chunks:
        words_in_c = set(re.findall(r"[a-zA-Z]{3,}", c["content"].lower()))
        for qw in query_words:
            if qw in words_in_c:
                doc_freqs[qw] = doc_freqs.get(qw, 0) + 1

    scored = []
    for c in chunks:
        c_words = re.findall(r"[a-zA-Z]{3,}", c["content"].lower())
        c_len = len(c_words) if c_words else 1
        score = 0.0

        for qw in query_words:
            tf = c_words.count(qw) / c_len
            df = doc_freqs.get(qw, 0)
            idf = math.log((n_docs + 1) / (df + 1)) + 1.0
            score += tf * idf

        if score > 0.0001:
            scored.append({
                "chunk_index": c.get("chunk_index", 0),
                "score": round(score, 4),
                "content": c["content"],
                "keywords": c.get("keywords", []),
                "page_approx": c.get("page_approx", 1),
            })

    scored.sort(key=lambda x: -x["score"])
    return scored[:top_k]


def synthesize_evidence_answer(
    query: str,
    document_title: str,
    relevant_chunks: List[Dict[str, Any]],
    llm_provider: Optional[str] = "none",
) -> Dict[str, Any]:
    """Generate evidence-grounded answer with source references and clinical disclaimers."""
    if not relevant_chunks:
        return {
            "query": query,
            "answer": (
                f"The document '{document_title}' does not contain passages with sufficient "
                "relevance to your query based on indexed biomedical terminology. "
                "Try refining your search terms or reviewing other uploaded papers."
            ),
            "sources": [],
            "retrieval_mode": "hierarchical_tfidf_offline",
            "disclaimer": "Academic research assistant only. Not intended for clinical diagnosis or prescription.",
        }

    evidence_text = "\n\n---\n\n".join(
        f"[Source Chunk #{r['chunk_index']} | Relevance Score: {r['score']}]:\n{r['content']}"
        for r in relevant_chunks
    )

    answer = (
        f"Based on evidence retrieved from '{document_title}':\n\n"
        f"{evidence_text}\n\n"
        f"[Retrieval Mode: Hierarchical Keyword & Passage Retrieval (Offline Mode). "
        f"Grounded directly in indexed research literature. — BioIntelliX | MedInsight AI]"
    )

    return {
        "query": query,
        "answer": answer,
        "sources": [
            {
                "chunk_index": r["chunk_index"],
                "score": r["score"],
                "excerpt": r["content"][:300] + "...",
            }
            for r in relevant_chunks
        ],
        "document_title": document_title,
        "retrieval_mode": "hierarchical_tfidf_offline",
        "disclaimer": "Academic research assistant only. Not intended for clinical diagnosis or medical decisions.",
    }
