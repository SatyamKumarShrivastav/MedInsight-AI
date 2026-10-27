"""
MedInsight AI — Unit Tests: Biomedical Research Assistant & RAG Engine
BioIntelliX | Team led by Mr. S. K. Shrivastav
From Biomedical Data to Intelligent Insight.
"""
import pytest
from research_assistant.rag_engine import (
    extract_keywords_from_text,
    hierarchical_chunk_text,
    search_document_chunks,
    synthesize_evidence_answer,
)


def test_keyword_extraction():
    sample_text = (
        "Electrocardiogram signals demonstrate distinct morphological features "
        "including QRS complex widening and ST segment elevation in acute myocardial infarction. "
        "Explainable artificial intelligence provides concept attribution."
    )
    keywords = extract_keywords_from_text(sample_text, top_n=5)
    assert isinstance(keywords, list)
    assert len(keywords) > 0
    assert any("electrocardiogram" in k or "morphological" in k or "infarction" in k for k in keywords)


def test_hierarchical_chunking():
    long_text = " ".join([f"word_{i} biomedical clinical electrocardiogram observation" for i in range(300)])
    chunks = hierarchical_chunk_text(long_text, chunk_size=100, overlap=20)
    assert len(chunks) >= 3
    assert all("chunk_index" in c and "content" in c and "keywords" in c for c in chunks)


def test_tfidf_document_search_and_retrieval():
    chunks = [
        {"chunk_index": 0, "content": "Patient electrocardiogram indicates sinus rhythm with normal PR interval and QT duration."},
        {"chunk_index": 1, "content": "Metabolic panel demonstrates elevated fasting glucose and impaired insulin sensitivity in diabetes."},
        {"chunk_index": 2, "content": "Deep learning convolutional models require robust bandpass filtering to remove 50 Hz powerline noise."},
    ]
    results = search_document_chunks("diabetes fasting glucose insulin", chunks, top_k=2)
    assert len(results) > 0
    # Chunk 1 should be the top hit
    assert results[0]["chunk_index"] == 1
    assert results[0]["score"] > 0


def test_evidence_grounded_answer_synthesis():
    chunks = [
        {"chunk_index": 0, "score": 0.85, "content": "SHAP feature attributions highlighted troponin levels and ST elevation as the primary contributors to the cardiovascular risk score."},
    ]
    res = synthesize_evidence_answer("What were the main contributors?", "xHAIM Multimodal Paper", chunks)
    assert "answer" in res
    assert "sources" in res
    assert "disclaimer" in res
    assert len(res["sources"]) == 1
    assert "xHAIM Multimodal Paper" in res["answer"]
    assert "Academic research assistant only" in res["disclaimer"]
