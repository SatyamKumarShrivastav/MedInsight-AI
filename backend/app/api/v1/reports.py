"""
MedInsight AI — Report Generation API
BioIntelliX | Team led by Mr. S. K. Shrivastav
"""
import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.core.database import get_db
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.__init_models__ import Report, Experiment, MLModel, ModelMetric, ReportType, JobStatus, ActivityLog

router = APIRouter(prefix="/reports", tags=["Reports"])


def _log(db, user_id, action, resource_id=None, details=None):
    db.add(ActivityLog(user_id=user_id, action=action, resource_type="report",
                       resource_id=resource_id, details=details))
    db.commit()


class ReportRequest(BaseModel):
    title: str
    experiment_id: Optional[int] = None
    report_type: str = "PDF"   # PDF, CSV, XLSX
    include_sections: Optional[List[str]] = None


def _generate_pdf_report(report: Report, exp: Optional[Experiment], db: Session) -> str:
    """Generate a PDF research report using ReportLab."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    from reportlab.lib.enums import TA_CENTER, TA_LEFT

    filename = f"report_{report.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    filepath = os.path.join(settings.REPORT_DIR, filename)

    doc = SimpleDocTemplate(filepath, pagesize=A4,
                            rightMargin=2*cm, leftMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    story = []

    # Title
    title_style = ParagraphStyle("Title", parent=styles["Title"],
                                  fontSize=18, textColor=colors.HexColor("#0f172a"),
                                  spaceAfter=6, alignment=TA_CENTER)
    sub_style = ParagraphStyle("Sub", parent=styles["Normal"],
                                fontSize=11, textColor=colors.HexColor("#1e40af"),
                                spaceAfter=4, alignment=TA_CENTER)
    body_style = ParagraphStyle("Body", parent=styles["Normal"],
                                 fontSize=10, spaceAfter=6, leading=14)
    h2_style = ParagraphStyle("H2", parent=styles["Heading2"],
                               fontSize=13, textColor=colors.HexColor("#1e3a5f"),
                               spaceBefore=12, spaceAfter=6)

    story.append(Paragraph("MedInsight AI — Research Report", title_style))
    story.append(Paragraph("BioIntelliX | Developed by Mr. S. K. Shrivastav", sub_style))
    story.append(Paragraph("From Biomedical Data to Intelligent Insight.", sub_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1e40af")))
    story.append(Spacer(1, 12))

    story.append(Paragraph(f"Report Title: {report.title}", body_style))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", body_style))
    story.append(Paragraph(f"Report ID: {report.id}", body_style))
    story.append(Spacer(1, 12))

    # Disclaimer
    story.append(Paragraph("⚠ IMPORTANT DISCLAIMER", h2_style))
    disclaimer = (
        "MedInsight AI is an academic and research-oriented software platform. "
        "It provides data-driven analytical and model-generated insights using biomedical datasets. "
        "It is NOT a medical diagnostic system, does NOT replace qualified healthcare professionals, "
        "and should NOT be used to make medical decisions. "
        "All outputs are research estimates and statistical associations, not clinical findings."
    )
    story.append(Paragraph(disclaimer, body_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
    story.append(Spacer(1, 12))

    if exp:
        story.append(Paragraph("1. Experiment Summary", h2_style))
        exp_data = [
            ["Field", "Value"],
            ["Experiment Name", exp.name],
            ["Description", (exp.description or "—")[:100]],
            ["Task Type", str(exp.task_type)],
            ["Target Column", exp.target_column],
            ["Dataset ID", str(exp.dataset_id)],
            ["Status", str(exp.status)],
            ["Created At", str(exp.created_at)[:19]],
        ]
        t = Table(exp_data, colWidths=[5*cm, 11*cm])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a5f")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ]))
        story.append(t)
        story.append(Spacer(1, 12))

        # Models
        story.append(Paragraph("2. Model Evaluation Metrics", h2_style))
        for m in exp.models:
            story.append(Paragraph(f"Algorithm: {m.algorithm.upper()}", body_style))
            m_metrics = {met.metric_name: met.metric_value for met in m.metrics if met.metric_value is not None}
            if m_metrics:
                metric_data = [["Metric", "Value"]] + [[k, f"{v:.4f}" if isinstance(v, float) else str(v)] for k, v in m_metrics.items() if k != "confusion_matrix"]
                mt = Table(metric_data, colWidths=[7*cm, 9*cm])
                mt.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0369a1")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ]))
                story.append(mt)
                story.append(Spacer(1, 6))

    story.append(Paragraph("References", h2_style))
    refs = [
        "1. Petridis et al. (2026). Holistic AI in medicine; improved performance and explainability. npj Digital Medicine.",
        "2. Kim, Gadgil & Lee (2025/26). Transparency of medical artificial intelligence systems. Nature Reviews Bioengineering.",
        "3. Patlatzoglou et al. (2025). The cost of explainability in AI-enhanced ECG models. npj Digital Medicine.",
        "4. Gliner et al. (2025). Clinically meaningful interpretability of an AI model for ECG classification. npj Digital Medicine.",
        "5. van der Valk et al. (2026). Explainable ECG Analysis by Explicit Information Disentanglement With VAEs. IEEE TBME.",
        "6. Taleban et al. (2026). Explainable AI in electrocardiography: A systematic review. Biomedical Signal Processing and Control.",
        "7. Pe et al. (2026). Contrastive explainable AI in healthcare: systematic review. BMC Medical Informatics.",
        "8. Jeon et al. (2026). Hierarchical RAG enhances a pharmacogenomic AI assistant. Computers in Biology and Medicine.",
        "9. Han et al. (2026). CLEAR: an auditable foundation model for radiology. Nature Biomedical Engineering.",
    ]
    for ref in refs:
        story.append(Paragraph(ref, body_style))

    story.append(Spacer(1, 24))
    story.append(Paragraph(
        "Developed by BioIntelliX (Team led by Mr. S. K. Shrivastav) | MedInsight AI v1.0.0",
        ParagraphStyle("Footer", parent=styles["Normal"], fontSize=8,
                       textColor=colors.grey, alignment=TA_CENTER)
    ))

    doc.build(story)
    return filepath


@router.post("/generate")
def generate_report(
    req: ReportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if req.report_type not in ["PDF", "CSV", "XLSX"]:
        raise HTTPException(400, "report_type must be PDF, CSV, or XLSX")

    exp = None
    if req.experiment_id:
        exp = db.query(Experiment).filter(Experiment.id == req.experiment_id).first()
        if exp and current_user.role.value != "ADMIN" and exp.user_id != current_user.id:
            raise HTTPException(403, "Not authorized to use this experiment")

    report = Report(
        title=req.title[:500],
        experiment_id=req.experiment_id,
        user_id=current_user.id,
        report_type=ReportType(req.report_type),
        status=JobStatus.RUNNING,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    try:
        if req.report_type == "PDF":
            filepath = _generate_pdf_report(report, exp, db)
        elif req.report_type == "CSV":
            # Generate a summary CSV
            import csv
            filename = f"report_{report.id}.csv"
            filepath = os.path.join(settings.REPORT_DIR, filename)
            with open(filepath, "w", newline="", encoding="utf-8") as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow(["MedInsight AI — Research Report", "BioIntelliX"])
                writer.writerow(["Title", req.title])
                writer.writerow(["Generated", datetime.now().isoformat()])
                if exp:
                    writer.writerow(["Experiment", exp.name])
                    writer.writerow(["Task Type", str(exp.task_type)])
                    writer.writerow([])
                    writer.writerow(["Algorithm", "Metric", "Value"])
                    for m in exp.models:
                        for met in m.metrics:
                            if met.metric_value is not None:
                                writer.writerow([m.algorithm, met.metric_name, round(met.metric_value, 4)])
        elif req.report_type == "XLSX":
            import openpyxl
            filename = f"report_{report.id}.xlsx"
            filepath = os.path.join(settings.REPORT_DIR, filename)
            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = "Report"
            ws.append(["MedInsight AI — Research Report", "BioIntelliX"])
            ws.append(["Title", req.title])
            ws.append(["Generated", datetime.now().isoformat()])
            if exp:
                ws.append(["Experiment", exp.name])
                ws.append(["Task Type", str(exp.task_type)])
                ws.append([])
                ws.append(["Algorithm", "Metric", "Value"])
                for m in exp.models:
                    for met in m.metrics:
                        if met.metric_value is not None:
                            ws.append([m.algorithm, met.metric_name, round(met.metric_value, 4)])
            wb.save(filepath)

        report.file_path = filepath
        report.status = JobStatus.COMPLETED
        db.commit()
        _log(db, current_user.id, "REPORT_GENERATED", report.id, {"type": req.report_type})

        return {
            "report_id": report.id,
            "title": report.title,
            "report_type": req.report_type,
            "status": "COMPLETED",
            "created_at": report.created_at,
        }

    except Exception as e:
        report.status = JobStatus.FAILED
        db.commit()
        raise HTTPException(500, f"Report generation failed: {e}")


@router.get("/")
def list_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Report)
    if current_user.role.value != "ADMIN":
        q = q.filter(Report.user_id == current_user.id)
    reports = q.order_by(Report.created_at.desc()).limit(50).all()
    return [
        {
            "id": r.id, "title": r.title, "report_type": r.report_type,
            "experiment_id": r.experiment_id, "status": r.status,
            "created_at": r.created_at,
        }
        for r in reports
    ]


@router.get("/{report_id}/download")
def download_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    r = db.query(Report).filter(Report.id == report_id).first()
    if not r:
        raise HTTPException(404, "Report not found")
    if current_user.role.value != "ADMIN" and r.user_id != current_user.id:
        raise HTTPException(403, "Not authorized")
    if r.status != JobStatus.COMPLETED or not r.file_path:
        raise HTTPException(400, "Report not ready")
    if not os.path.exists(r.file_path):
        raise HTTPException(404, "Report file not found on disk")

    media_types = {
        "PDF": "application/pdf",
        "CSV": "text/csv",
        "XLSX": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }
    return FileResponse(
        r.file_path,
        media_type=media_types.get(str(r.report_type), "application/octet-stream"),
        filename=os.path.basename(r.file_path),
    )
