"""
MedInsight AI -- Database Seed Script
BioIntelliX | Team led by Mr. S. K. Shrivastav

Initialises database tables, creates default admin & researcher accounts,
and seeds synthetic biomedical datasets into the database.
"""
import os
import sys
import shutil
import pandas as pd

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.config import settings
from app.core.database import create_database, init_db, SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, RoleEnum
from app.models.dataset import Dataset, DatasetColumn, DatasetStatus


def seed():
    print("[*] Initialising MedInsight AI database...")
    create_database()
    init_db()

    db = SessionLocal()
    try:
        # 1. Seed Users
        admin = db.query(User).filter(User.email == "admin@medinsight.ai").first()
        if not admin:
            admin = User(
                email="admin@medinsight.ai",
                username="admin",
                hashed_password=get_password_hash(os.environ["MEDINSIGHT_ADMIN_PASSWORD"]),
                full_name="MedInsight System Administrator",
                role=RoleEnum.ADMIN,
                is_active=True,
                is_verified=True,
                institution="BioIntelliX Institute",
                bio="Platform Administrator for MedInsight AI Biomedical Analytics.",
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print("[OK] Admin user created: admin@medinsight.ai")
        else:
            print("[INFO] Admin user already exists.")

        researcher = db.query(User).filter(User.email == "researcher@medinsight.ai").first()
        if not researcher:
            researcher = User(
                email="researcher@medinsight.ai",
                username="researcher",
                hashed_password=get_password_hash(os.environ["MEDINSIGHT_RESEARCHER_PASSWORD"]),
                full_name="Dr. Shrivastav Researcher",
                role=RoleEnum.RESEARCHER,
                is_active=True,
                is_verified=True,
                institution="BioIntelliX Research Lab",
                bio="Biomedical researcher specializing in predictive clinical analytics and ECG signal analysis.",
            )
            db.add(researcher)
            db.commit()
            db.refresh(researcher)
            print("[OK] Researcher user created: researcher@medinsight.ai")
        else:
            print("[INFO] Researcher user already exists.")

        # Ensure upload directory exists
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

        # 2. Seed Datasets
        datasets_dir = os.path.join(os.path.dirname(__file__), "..", "datasets")
        seed_files = [
            {
                "filename": "synthetic_heart_disease.csv",
                "name": "Synthetic Heart Disease Dataset",
                "description": "1,000 synthetic patient records with 13 clinical features for cardiovascular risk classification.",
                "source": "UCI Heart Disease Inspired (Synthetic)",
                "license": "CC0 - Public Domain (Synthetic Demo Data)",
            },
            {
                "filename": "synthetic_diabetes.csv",
                "name": "Synthetic Diabetes Dataset",
                "description": "800 synthetic metabolic records with diagnostic measurements for diabetes prediction.",
                "source": "Pima Indians Diabetes Inspired (Synthetic)",
                "license": "CC0 - Public Domain (Synthetic Demo Data)",
            },
            {
                "filename": "synthetic_ecg_signal.csv",
                "name": "Synthetic ECG Lead-II Signal",
                "description": "10-second single-lead synthetic electrocardiogram sampled at 250 Hz with simulated noise & baseline wander.",
                "source": "BioIntelliX Synthetic Signal Generator",
                "license": "CC0 - Public Domain (Synthetic Demo Data)",
            },
        ]

        for item in seed_files:
            src_path = os.path.join(datasets_dir, item["filename"])
            if not os.path.exists(src_path):
                print(f"[WARN] Source file not found: {src_path}. Skipping.")
                continue

            existing = db.query(Dataset).filter(Dataset.name == item["name"]).first()
            if existing:
                print(f"[INFO] Dataset '{item['name']}' already registered.")
                continue

            # Copy file to uploads directory
            dest_path = os.path.join(settings.UPLOAD_DIR, f"seeded_{item['filename']}")
            shutil.copyfile(src_path, dest_path)
            file_size = os.path.getsize(dest_path)

            df = pd.read_csv(dest_path)
            num_rows, num_cols = df.shape

            ds = Dataset(
                name=item["name"],
                description=item["description"],
                source=item["source"],
                file_format="csv",
                file_path=dest_path,
                file_size_bytes=file_size,
                num_rows=num_rows,
                num_columns=num_cols,
                license_info=item["license"],
                status=DatasetStatus.READY,
                owner_id=admin.id,
            )
            db.add(ds)
            db.commit()
            db.refresh(ds)

            # Add column metadata
            for col in df.columns:
                series = df[col]
                is_num = pd.api.types.is_numeric_dtype(series)
                col_rec = DatasetColumn(
                    dataset_id=ds.id,
                    name=str(col)[:255],
                    dtype=str(series.dtype),
                    null_count=int(series.isnull().sum()),
                    unique_count=int(series.nunique()),
                    min_value=float(series.min()) if is_num and not series.dropna().empty else None,
                    max_value=float(series.max()) if is_num and not series.dropna().empty else None,
                    mean_value=float(series.mean()) if is_num and not series.dropna().empty else None,
                    std_value=float(series.std()) if is_num and not series.dropna().empty else None,
                    sample_values=series.dropna().head(5).astype(str).tolist(),
                )
                db.add(col_rec)
            db.commit()
            print(f"[OK] Seeded dataset '{item['name']}' ({num_rows} rows, {num_cols} cols).")

        # 3. Seed 2025-2026 Recommended Research Papers
        from app.models.__init_models__ import ResearchDocument, DocumentChunk, DocStatus
        import hashlib, re

        def extract_kw(text, top_n=8):
            stopwords = {"the","and","for","that","this","with","from","across","have","been","were","which","their","into","over","more"}
            words = re.findall(r"[a-zA-Z]{4,}", text.lower())
            freq = {}
            for w in words:
                if w not in stopwords:
                    freq[w] = freq.get(w, 0) + 1
            return sorted(freq, key=lambda x: -freq[x])[:top_n]

        papers_meta = [
            ("01_holistic_ai_in_medicine_2026.txt", "Holistic AI in Medicine: Improved Performance and Explainability", "Petridis et al.", 2026, "npj Digital Medicine (Nature)", "10.1038/s41746-025-02298-3"),
            ("02_transparency_medical_ai_systems_2026.txt", "Transparency of Medical Artificial Intelligence Systems", "Kim, Gadgil & Lee", 2026, "Nature Reviews Bioengineering", "10.1038/s44222-025-00363-w"),
            ("03_cost_of_explainability_ecg_2025.txt", "The Cost of Explainability in AI-Enhanced ECG Models", "Patlatzoglou et al.", 2025, "npj Digital Medicine", "10.1038/s41746-025-02122-y"),
            ("04_clinically_meaningful_interpretability_ecg_2025.txt", "Clinically Meaningful Interpretability of an AI Model for ECG Classification", "Gliner et al.", 2025, "npj Digital Medicine", "10.1038/s41746-025-01467-8"),
            ("05_explainable_ecg_vae_disentanglement_2026.txt", "Explainable ECG Analysis by Explicit Information Disentanglement With VAEs", "van der Valk et al.", 2026, "IEEE Transactions on Biomedical Engineering", "10.1109/TBME.2026.41212713"),
            ("06_xai_in_electrocardiography_review_2026.txt", "Explainable Artificial Intelligence in Electrocardiography: A Systematic Review", "Taleban et al.", 2026, "Biomedical Signal Processing and Control", "10.1016/j.bspc.2026.107892"),
            ("07_contrastive_xai_in_healthcare_2026.txt", "Contrastive Explainable AI in Healthcare: A Systematic Review", "Pe et al.", 2026, "BMC Medical Informatics and Decision Making", "10.1186/s12911-026-02845-x"),
            ("08_hierarchical_rag_biomedical_assistant_2026.txt", "Hierarchical RAG Enhances a Pharmacogenomic AI Assistant in Guideline Related Queries", "Jeon et al.", 2026, "Computers in Biology and Medicine", "10.1016/j.compbiomed.2026.109842"),
            ("09_foundation_models_ecg_interpretation_2026.txt", "Foundation Models for Electrocardiogram Interpretation: Clinical Implications", "Cardiovascular AI Consortium", 2026, "European Heart Journal", "10.1093/eurheartj/ehae891"),
            ("10_clear_auditable_foundation_model_2026.txt", "CLEAR: An Auditable Foundation Model for Radiology Grounded in Clinical Concepts", "Han et al.", 2026, "Nature Biomedical Engineering", "10.1038/s41551-026-01741-4"),
            ("11_healthcare_data_analytics_tertiary_study_2023.txt", "Data Analytics in Healthcare: A Tertiary Study", "Taipalus et al.", 2023, "SN Computer Science (Springer Nature)", "10.1007/s42979-022-01490-6"),
            ("12_systematic_reviews_ml_in_healthcare_2024.txt", "Systematic reviews of machine learning in healthcare: a literature review", "Kolasa et al.", 2024, "Expert Review of Pharmacoeconomics & Outcomes Research", "10.1080/14737167.2023.2279107"),
            ("13_transforming_healthcare_big_data_ai_mapping_2019.txt", "Transforming healthcare with big data analytics and artificial intelligence: A systematic mapping study", "Mehta, Pandit & Shukla", 2019, "Journal of Biomedical Informatics", "10.1016/j.jbi.2019.103311"),
            ("14_stages_based_ecg_signal_analysis_survey_2020.txt", "Stages-Based ECG Signal Analysis From Traditional Signal Processing to Machine Learning Approaches: A Survey", "Wasimuddin et al.", 2020, "IEEE Access", "10.1109/ACCESS.2020.3026968"),
            ("15_teaching_llms_reference_answers_biomedical_2024.txt", "How do you know that? Teaching Generative Language Models to Reference Answers to Biomedical Questions", "Bašaragin et al.", 2024, "BioNLP 2024 @ ACL", "2024.bionlp-1.44"),
            ("16_rationale_guided_medical_rag_2025.txt", "Rationale-Guided Retrieval Augmented Generation for Medical Question Answering (RAG^2)", "Sohn, Park, Kang et al.", 2025, "NAACL 2025", "2025.naacl-long.635"),
            ("17_pubmed_reasoner_dynamic_grounded_qa_2026.txt", "PubMed Reasoner: Dynamic Reasoning-based Retrieval for Evidence-Grounded Biomedical Question Answering", "Zhang, Liu & Murai", 2026, "ACL 2026", "2026.acl-long.763"),
        ]

        papers_dir = os.path.join(datasets_dir, "research_papers")
        for fname, title, authors, year, source, doi in papers_meta:
            fpath = os.path.join(papers_dir, fname)
            if not os.path.exists(fpath):
                continue
            existing = db.query(ResearchDocument).filter(ResearchDocument.title == title).first()
            if existing:
                print(f"[INFO] Research document '{title}' already seeded.")
                continue

            with open(fpath, "r", encoding="utf-8") as f:
                content = f.read()

            checksum = hashlib.sha256(content.encode()).hexdigest()
            words = content.split()
            word_count = len(words)

            doc = ResearchDocument(
                title=title,
                authors=authors,
                year=year,
                source=source,
                doi=doi,
                file_path=fpath,
                file_format="txt",
                checksum=checksum,
                owner_id=admin.id,
                status=DocStatus.READY,
                word_count=word_count,
            )
            db.add(doc)
            db.commit()
            db.refresh(doc)

            # Chunk document (chunks of ~250 words with 50 words overlap)
            chunk_size = 250
            overlap = 50
            idx = 0
            c_num = 0
            while idx < len(words):
                chunk_text = " ".join(words[idx : idx + chunk_size])
                kw = extract_kw(chunk_text)
                c_rec = DocumentChunk(
                    document_id=doc.id,
                    chunk_index=c_num,
                    content=chunk_text,
                    keywords=kw,
                    page_number=c_num + 1,
                )
                db.add(c_rec)
                c_num += 1
                idx += chunk_size - overlap
            db.commit()
            print(f"[OK] Seeded research paper: '{title}' ({c_num} chunks).")

        print("\n[SUCCESS] MedInsight AI database seeding complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
