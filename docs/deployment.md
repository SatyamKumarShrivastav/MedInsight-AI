# MedInsight AI — Deployment & Setup Guide
**BioIntelliX | Team led by Mr. S. K. Shrivastav**  
*From Biomedical Data to Intelligent Insight.*

---

## 1. Local Development Setup

### 1.1 Prerequisites
- Python 3.11 or higher
- Node.js 18 or higher (with npm)
- MySQL Server 8.0 running on `localhost:3306`

### 1.2 Environment Configuration
Copy `.env.example` to `.env`:
```powershell
cp .env.example .env
```
Ensure your MySQL credentials match:
```ini
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD_HERE
DB_NAME=medinsight_ai
```
Set `SECRET_KEY`, `DB_PASSWORD`, and the `MEDINSIGHT_*_PASSWORD` values in `.env` before seeding. Use distinct, strong account passwords; the seed scripts read them from the environment and do not print them.

### 1.3 Backend Installation & Seeding
```powershell
cd backend
pip install -r requirements.txt

# Seed database with initial Admin/Researcher users, synthetic datasets, and 2025-2026 papers
python ..\scripts\seed_db.py

# Launch FastAPI backend server
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
- API Docs: `http://localhost:8000/api/docs`

### 1.4 Frontend Installation & Launch
```powershell
cd ..\frontend
npm install
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 2. Default Access Credentials

| Role | Email | Password | Permissions |
|---|---|---|---|
| **ADMIN** | `admin@medinsight.ai` | `Admin@12345` | Global admin, user management, audit logs, all features |
| **RESEARCHER** | `researcher@medinsight.ai` | `Researcher@12345` | Model training, XAI, signal processing, research papers |
| **STUDENT** | Self-registered via `/register` | User defined | Inference, data exploration, paper reading |

---

## 3. Docker & Containerized Deployment

Using `docker-compose`:
```bash
docker-compose up --build
```
This boots:
1. `db`: MySQL 8.0 container on port 3306 with persistent volume.
2. `backend`: FastAPI Python service on port 8000.
3. `frontend`: Vite React service on port 5173.
