"""
MedInsight AI — Research Document Library & Assistant API
BioIntelliX | Team led by Mr. S. K. Shrivastav
"""
import os, hashlib, re
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import math
from datetime import datetime

from app.core.database import get_db
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.__init_models__ import ResearchDocument, DocumentChunk, DocStatus, ActivityLog

router = APIRouter(prefix="/documents", tags=["Research Documents"])

ALLOWED_DOC_EXTS = {"pdf", "txt"}


def _log(db, user_id, action, resource_id=None, details=None):
    db.add(ActivityLog(user_id=user_id, action=action, resource_type="document",
                       resource_id=resource_id, details=details))
    db.commit()


def _extract_text(file_path: str, file_format: str) -> str:
    if file_format == "txt":
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            return f.read()
    elif file_format == "pdf":
        try:
            import pdfplumber
            text = ""
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    pt = page.extract_text()
                    if pt:
                        text += pt + "\n"
            return text
        except Exception as e:
            raise ValueError(f"PDF extraction failed: {e}")
    return ""


def _chunk_text(text: str, chunk_size: int = 800, overlap: int = 100) -> List[str]:
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i: i + chunk_size])
        chunks.append(chunk)
        i += chunk_size - overlap
    return [c for c in chunks if len(c.strip()) > 20]


def _extract_keywords(text: str, top_n: int = 10) -> List[str]:
    """Simple keyword extraction using word frequency."""
    stop_words = {
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
        "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
        "has", "have", "had", "will", "would", "could", "should", "may", "can",
        "this", "that", "these", "those", "it", "its", "we", "our", "their", "as",
    }
    words = re.findall(r"[a-zA-Z]{4,}", text.lower())
    freq = {}
    for w in words:
        if w not in stop_words:
            freq[w] = freq.get(w, 0) + 1
    return sorted(freq, key=lambda x: -freq[x])[:top_n]


def _tfidf_search(query: str, chunks: List[str], top_k: int = 5) -> List[dict]:
    """Lightweight TF-IDF keyword retrieval (no external dependencies)."""
    query_words = set(query.lower().split())
    scores = []
    for i, chunk in enumerate(chunks):
        chunk_words = chunk.lower().split()
        chunk_set = set(chunk_words)
        overlap = len(query_words & chunk_set)
        tf_score = sum(chunk_words.count(w) for w in query_words) / max(len(chunk_words), 1)
        score = overlap + tf_score
        scores.append((score, i, chunk))
    scores.sort(key=lambda x: -x[0])
    return [{"chunk_index": idx, "score": round(s, 4), "content": c} for s, idx, c in scores[:top_k] if s > 0]


@router.post("/upload", status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    authors: str = Form(""),
    year: Optional[int] = Form(None),
    source: str = Form(""),
    doi: str = Form(""),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_DOC_EXTS:
        raise HTTPException(400, "Only PDF and TXT documents are supported")

    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(413, "Document too large (max 20 MB)")

    checksum = hashlib.sha256(content).hexdigest()

    stored_name = f"doc_{current_user.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, stored_name)
    with open(file_path, "wb") as f:
        f.write(content)

    doc = ResearchDocument(
        title=title[:500],
        authors=authors[:500] if authors else None,
        year=year,
        source=source[:500] if source else None,
        doi=doi[:255] if doi else None,
        file_path=file_path,
        file_format=ext,
        checksum=checksum,
        owner_id=current_user.id,
        status=DocStatus.PROCESSING,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Extract and chunk text
    try:
        text = _extract_text(file_path, ext)
        doc.word_count = len(text.split())
        chunks = _chunk_text(text)
        for i, chunk_text in enumerate(chunks):
            keywords = _extract_keywords(chunk_text)
            db.add(DocumentChunk(
                document_id=doc.id,
                chunk_index=i,
                content=chunk_text[:4000],
                keywords=keywords,
            ))
        doc.status = DocStatus.READY
        db.commit()
        _log(db, current_user.id, "DOCUMENT_UPLOAD", doc.id, {"title": title, "chunks": len(chunks)})
        return {
            "id": doc.id, "title": doc.title, "status": "READY",
            "word_count": doc.word_count, "chunks_created": len(chunks),
        }
    except Exception as e:
        doc.status = DocStatus.ERROR
        db.commit()
        raise HTTPException(500, f"Document processing failed: {e}")


@router.get("/")
def list_documents(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(ResearchDocument)
    if current_user.role.value != "ADMIN":
        q = q.filter(ResearchDocument.owner_id == current_user.id)
    docs = q.order_by(ResearchDocument.created_at.desc()).offset(skip).limit(limit).all()
    return [
        {
            "id": d.id, "title": d.title, "authors": d.authors,
            "year": d.year, "source": d.source, "doi": d.doi,
            "file_format": d.file_format, "status": d.status,
            "word_count": d.word_count, "created_at": d.created_at,
        }
        for d in docs
    ]


@router.get("/{doc_id}/summary")
def document_summary(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = db.query(ResearchDocument).filter(ResearchDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    if current_user.role.value != "ADMIN" and doc.owner_id != current_user.id:
        raise HTTPException(403, "Not authorized")
    if doc.status != DocStatus.READY:
        raise HTTPException(400, "Document is not yet processed")

    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).order_by(DocumentChunk.chunk_index).all()
    if not chunks:
        raise HTTPException(404, "No content chunks found")

    # Summarise: take first 3 chunks as abstract/intro, extract all keywords
    intro = " ".join(c.content for c in chunks[:3])
    all_keywords = []
    for c in chunks:
        if c.keywords:
            all_keywords.extend(c.keywords)
    # Frequency count keywords
    kw_freq = {}
    for kw in all_keywords:
        kw_freq[kw] = kw_freq.get(kw, 0) + 1
    top_kw = sorted(kw_freq, key=lambda x: -kw_freq[x])[:20]

    return {
        "id": doc.id, "title": doc.title, "authors": doc.authors,
        "year": doc.year, "word_count": doc.word_count,
        "n_chunks": len(chunks),
        "summary_excerpt": intro[:1000],
        "top_keywords": top_kw,
    }


@router.post("/{doc_id}/ask")
def ask_document(
    doc_id: int,
    question: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Research assistant: keyword retrieval-based Q&A over a document."""
    doc = db.query(ResearchDocument).filter(ResearchDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    if current_user.role.value != "ADMIN" and doc.owner_id != current_user.id:
        raise HTTPException(403, "Not authorized")
    if doc.status != DocStatus.READY:
        raise HTTPException(400, "Document not processed yet")

    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).all()
    chunk_texts = [c.content for c in chunks]

    if not chunk_texts:
        return {"answer": "No content available in this document.", "sources": []}

    # Retrieve relevant chunks
    relevant = _tfidf_search(question, chunk_texts, top_k=3)

    if not relevant:
        answer = (
            "The retrieved document does not appear to contain information "
            "directly relevant to your query based on keyword matching. "
            "Consider rephrasing your question or uploading additional documents."
        )
    else:
        context = "\n\n".join(r["content"] for r in relevant)
        # Offline mode: return context with disclaimer
        answer = (
            f"Based on the most relevant passages retrieved from '{doc.title}':\n\n"
            f"{context[:1200]}\n\n"
            "[Note: This answer is generated by keyword-based retrieval. "
            "No external LLM is configured. For enhanced question answering, "
            "configure an LLM_PROVIDER in .env. — MedInsight AI, BioIntelliX]"
        )

    _log(db, current_user.id, "DOCUMENT_QA", doc_id, {"question": question[:200]})
    return {
        "question": question,
        "answer": answer,
        "sources": [{"chunk_index": r["chunk_index"], "relevance_score": r["score"], "excerpt": r["content"][:300]} for r in relevant],
        "document_title": doc.title,
        "retrieval_mode": "keyword_tfidf",
        "disclaimer": "This is a research assistant response based on document content retrieval. Not medical advice.",
    }


@router.delete("/{doc_id}")
def delete_document(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = db.query(ResearchDocument).filter(ResearchDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    if current_user.role.value != "ADMIN" and doc.owner_id != current_user.id:
        raise HTTPException(403, "Not authorized")
    try:
        if os.path.exists(doc.file_path):
            os.remove(doc.file_path)
    except Exception:
        pass
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted"}
