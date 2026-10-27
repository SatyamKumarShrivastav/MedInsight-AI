"""
MedInsight AI — FastAPI Application Entry Point
BioIntelliX | Team led by Mr. S. K. Shrivastav
From Biomedical Data to Intelligent Insight.
"""
import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import create_database, init_db

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)s  %(name)s  %(message)s",
)
logger = logging.getLogger("medinsight")


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("MedInsight AI starting — BioIntelliX")
    # Ensure directories exist
    for d in [settings.UPLOAD_DIR, settings.ARTIFACT_DIR, settings.REPORT_DIR, settings.DATASET_DIR]:
        os.makedirs(d, exist_ok=True)
    # Initialise database
    try:
        create_database()
        init_db()
        logger.info("Database initialised successfully.")
    except Exception as exc:
        logger.error(f"Database initialisation failed: {exc}")
    yield
    logger.info("MedInsight AI shutting down.")


# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    description="An Explainable AI-Powered Biomedical Data Analytics and Predictive Decision-Support Platform — BioIntelliX",
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static Files (uploads served securely via endpoints, not directly) ────────
# Note: We serve reports/artifacts only via authenticated endpoints

# ── Routers ───────────────────────────────────────────────────────────────────
from app.api.v1 import auth, datasets, quality, preprocessing, eda, ml_models, predictions, xai, anomaly, signals, documents, reports, admin, dashboard, activity

app.include_router(auth.router, prefix="/api/v1")
app.include_router(datasets.router, prefix="/api/v1")
app.include_router(quality.router, prefix="/api/v1")
app.include_router(preprocessing.router, prefix="/api/v1")
app.include_router(eda.router, prefix="/api/v1")
app.include_router(ml_models.router, prefix="/api/v1")
app.include_router(predictions.router, prefix="/api/v1")
app.include_router(xai.router, prefix="/api/v1")
app.include_router(anomaly.router, prefix="/api/v1")
app.include_router(signals.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(activity.router, prefix="/api/v1")


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "team": settings.TEAM,
        "leader": settings.LEADER,
    }
