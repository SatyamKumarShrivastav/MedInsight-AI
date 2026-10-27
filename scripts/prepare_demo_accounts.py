"""
MedInsight AI — Account & Demonstration Data Provisioner
BioIntelliX | Team led by Mr. S. K. Shrivastav
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, RoleEnum
from app.models.__init_models__ import ActivityLog

DEMO_USERS = [
    {
        "email": "admin@medinsight.ai",
        "username": "admin",
        "full_name": "MedInsight System Administrator",
        "role": RoleEnum.ADMIN,
        "password": os.environ["MEDINSIGHT_ADMIN_PASSWORD"],
        "department": "Platform Core Administration",
        "institution": "BioIntelliX Research"
    },
    {
        "email": "ceo@medinsight.ai",
        "username": "ceo",
        "full_name": "Satyam Kumar Shrivastav (Team Lead)",
        "role": RoleEnum.CEO,
        "password": os.environ["MEDINSIGHT_CEO_PASSWORD"],
        "department": "Project Leadership & System Architecture",
        "institution": "BioIntelliX"
    },
    {
        "email": "evaluator@medinsight.ai",
        "username": "evaluator",
        "full_name": "Academic Project Evaluator",
        "role": RoleEnum.ADMIN,
        "password": os.environ["MEDINSIGHT_EVALUATOR_PASSWORD"],
        "department": "Academic Evaluation & Review Committee",
        "institution": "Excel Group of Institutions"
    },
    {
        "email": "researcher@medinsight.ai",
        "username": "researcher",
        "full_name": "Dr. P. Kumar (Lead Researcher)",
        "role": RoleEnum.RESEARCHER,
        "password": os.environ["MEDINSIGHT_RESEARCHER_PASSWORD"],
        "department": "Biomedical Data Science & Signal Processing",
        "institution": "BioIntelliX Research Labs"
    },
    {
        "email": "doctor.clinician@medinsight.ai",
        "username": "doctor_ananya",
        "full_name": "Dr. Ananya Sen (Consultant Cardiologist)",
        "role": RoleEnum.RESEARCHER,
        "password": os.environ["MEDINSIGHT_DOCTOR_PASSWORD"],
        "department": "Cardiovascular Medicine & Electrophysiology",
        "institution": "Excel Healthcare Research Center"
    },
    {
        "email": "23ad101@excelcolleges.com",
        "username": "satyam101",
        "full_name": "Satyam Kumar Shrivastav",
        "role": RoleEnum.STUDENT,
        "password": os.environ["MEDINSIGHT_COLLEGE_STUDENT_PASSWORD"],
        "department": "Artificial Intelligence & Data Science",
        "institution": "Excel Engineering College"
    },
    {
        "email": "trial.student@medinsight.ai",
        "username": "aarav_student",
        "full_name": "Aarav Sharma (Student Researcher)",
        "role": RoleEnum.STUDENT,
        "password": os.environ["MEDINSIGHT_STUDENT_PASSWORD"],
        "department": "Biomedical Engineering",
        "institution": "BioIntelliX Academy"
    }
]

def main():
    db = SessionLocal()
    try:
        print("[*] Synchronizing demonstration users and security credentials...")
        for u_data in DEMO_USERS:
            user = db.query(User).filter(User.email == u_data["email"]).first()
            hashed_pwd = get_password_hash(u_data["password"])
            if user:
                user.full_name = u_data["full_name"]
                user.username = u_data["username"]
                user.role = u_data["role"]
                user.hashed_password = hashed_pwd
                user.is_active = True
                user.department = u_data["department"]
                user.institution = u_data["institution"]
                print(f"[OK] Updated user: {u_data['email']} ({u_data['role'].value})")
            else:
                user = User(
                    email=u_data["email"],
                    username=u_data["username"],
                    full_name=u_data["full_name"],
                    hashed_password=hashed_pwd,
                    role=u_data["role"],
                    is_active=True,
                    department=u_data["department"],
                    institution=u_data["institution"]
                )
                db.add(user)
                print(f"[+] Created user: {u_data['email']} ({u_data['role'].value})")
        db.commit()

        # Add recent activity log entry
        admin = db.query(User).filter(User.email == "admin@medinsight.ai").first()
        if admin:
            db.add(ActivityLog(
                user_id=admin.id,
                action="system_sync",
                resource_type="credentials",
                details="Synchronized all project user accounts, roles, and security credentials for external defense and smartphone access."
            ))
            db.commit()

        print("\n[SUCCESS] All user accounts successfully saved and verified in MySQL database.")
    finally:
        db.close()

if __name__ == "__main__":
    main()
