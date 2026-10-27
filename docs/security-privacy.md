# MedInsight AI — Security, Privacy & Research Governance
**BioIntelliX | Team led by Mr. S. K. Shrivastav**  
*From Biomedical Data to Intelligent Insight.*

---

## 1. Security Architecture Principles

MedInsight AI incorporates defensible security controls across each layer of the application rather than treating security as an afterthought.

---

## 2. Authentication & Authorization Controls

1. **Password Protection**:
   - Encrypted with bcrypt using individual randomized salts.
   - Enforces a minimum password length and complexity policy.
2. **JWT Session Management**:
   - HS256-signed stateless access tokens.
   - Configurable expiration window (default: 24 hours).
   - Invalidation on credential changes.
3. **Role-Based Access Control (RBAC)**:
   - **ADMIN**: Complete system governance, user activation/deactivation, role upgrades, global audit logs.
   - **RESEARCHER**: Dataset upload, ML training, XAI analysis, report generation, research assistant document querying.
   - **STUDENT**: Read-only dataset exploration, pre-trained model inference, research paper review, platform help.
   - Enforced via server-side dependency checks (`require_admin`, `require_researcher_or_admin`).

---

## 3. Data Protection & Secure Storage

1. **Controlled File Storage**:
   - User-uploaded CSV, XLSX, and PDF files are stored on isolated server filesystem paths with randomized/sanitized names (`<user_id>_<timestamp>_<safe_name>`).
   - File paths are strictly validated to prevent directory traversal (`../`) attacks.
2. **Upload Guardrails**:
   - Strict MIME and file extension validation.
   - File size capped at 50 MB to prevent resource exhaustion and denial of service.
3. **Data Minimization**:
   - Synthetic and de-identified biomedical cohorts are prioritized for demonstrations.
   - Raw restricted clinical databases (e.g., MIMIC-IV) are never bundled or redistributed.

---

## 4. Forensic Audit Trail

Every major operational event is recorded in the `activity_logs` table:
- User logins and logout events.
- Dataset uploads, modifications, and deletions.
- ML experiment training runs and prediction calls.
- Document uploads and Q&A interactions.
- IP addresses and timestamps are logged for scientific traceability.

---

## 5. Compliance & Medical Boundaries

> **Regulatory Statement**: MedInsight AI does not claim certified HIPAA or GDPR compliance out-of-the-box. While modern technological safeguards (encryption in transit, password hashing, RBAC, audit logging) are implemented, clinical institutional deployment requires dedicated legal, organizational, and infrastructure reviews.
