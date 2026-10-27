import os
import sys
import mysql.connector

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.security import get_password_hash

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Kri&Satya$19@sql",
    port=3306,
    database="medinsight_ai",
    autocommit=True
)
cur = conn.cursor(dictionary=True, buffered=True)

# Check if CEO exists
cur.execute("SELECT id, email, username FROM users WHERE role = 'CEO'")
existing_ceo = cur.fetchone()

hashed = get_password_hash(os.environ["MEDINSIGHT_CEO_PASSWORD"])

if existing_ceo:
    cur.execute("""
        UPDATE users
        SET full_name = 'Satyam Kumar Shrivastav',
            email = 'ceo@medinsight.ai',
            username = 'ceo',
            hashed_password = %s,
            is_active = 1,
            is_verified = 1,
            institution = 'BioIntelliX Institute',
            department = 'Executive Leadership & AI Strategy',
            country = 'India',
            identification_number = 'CEO-BIOINTELLIX-01',
            bio = 'Founder & CEO of BioIntelliX. Chief Executive Officer & Super Administrator with ultimate platform governance and administrative authority.'
        WHERE id = %s
    """, (hashed, existing_ceo["id"]))
    print(f"[OK] CEO account verified & updated: Satyam Kumar Shrivastav (@ceo, ID: {existing_ceo['id']})")
else:
    # Check if ceo@medinsight.ai exists under another role
    cur.execute("SELECT id FROM users WHERE email = 'ceo@medinsight.ai' OR username = 'ceo'")
    existing_user = cur.fetchone()
    if existing_user:
        cur.execute("""
            UPDATE users
            SET role = 'CEO',
                full_name = 'Satyam Kumar Shrivastav',
                email = 'ceo@medinsight.ai',
                username = 'ceo',
                hashed_password = %s,
                is_active = 1,
                is_verified = 1,
                institution = 'BioIntelliX Institute',
                department = 'Executive Leadership & AI Strategy',
                country = 'India',
                identification_number = 'CEO-BIOINTELLIX-01',
                bio = 'Founder & CEO of BioIntelliX. Chief Executive Officer & Super Administrator with ultimate platform governance and administrative authority.'
            WHERE id = %s
        """, (hashed, existing_user["id"]))
        print(f"[OK] Upgraded existing user to CEO: Satyam Kumar Shrivastav (ID: {existing_user['id']})")
    else:
        cur.execute("""
            INSERT INTO users (
                email, username, hashed_password, full_name, role, is_active, is_verified,
                institution, department, country, identification_number, bio, created_at
            ) VALUES (
                'ceo@medinsight.ai', 'ceo', %s, 'Satyam Kumar Shrivastav', 'CEO', 1, 1,
                'BioIntelliX Institute', 'Executive Leadership & AI Strategy', 'India', 'CEO-BIOINTELLIX-01',
                'Founder & CEO of BioIntelliX. Chief Executive Officer & Super Administrator with ultimate platform governance and administrative authority.',
                NOW()
            )
        """, (hashed,))
        print("[OK] Created Super Admin CEO: Satyam Kumar Shrivastav (@ceo, email: ceo@medinsight.ai)")

cur.execute("SELECT id, username, email, full_name, role FROM users WHERE role = 'CEO'")
print("[CEO RECORD]:", cur.fetchall())

cur.close()
conn.close()
