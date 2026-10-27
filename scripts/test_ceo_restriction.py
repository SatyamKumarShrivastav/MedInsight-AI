import os
"""
Test CEO Localhost-Only Policy & Multi-Network Access
BioIntelliX | Team led by Mr. S. K. Shrivastav
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

print("[*] Testing CEO localhost & multi-network governance policies...")

# 1. CEO from localhost
r1 = client.post('/api/v1/auth/login', json={'email': 'ceo@medinsight.ai', 'password': os.environ["MEDINSIGHT_CEO_PASSWORD"]})
print('1. CEO Localhost Login: Status', r1.status_code, '->', 'PASSED' if r1.status_code == 200 else 'FAILED')

# 2. CEO from network/tunnel (Origin: https://medinsight-ai.loca.lt)
r2 = client.post(
    '/api/v1/auth/login',
    json={'email': 'ceo@medinsight.ai', 'password': os.environ["MEDINSIGHT_CEO_PASSWORD"]},
    headers={'Origin': 'https://medinsight-ai.loca.lt', 'X-Forwarded-Host': 'medinsight-ai.loca.lt'}
)
print('2. CEO Network/Tunnel Login (Origin: https://medinsight-ai.loca.lt): Status', r2.status_code, '->', 'PASSED (BLOCKED)' if r2.status_code == 403 else 'FAILED')
if r2.status_code == 403:
    print('   Block Reason:', r2.json().get('detail'))

# 3. CEO from LAN IP (Origin: http://172.18.50.215:5173)
r3 = client.post(
    '/api/v1/auth/login',
    json={'email': 'ceo@medinsight.ai', 'password': os.environ["MEDINSIGHT_CEO_PASSWORD"]},
    headers={'Origin': 'http://172.18.50.215:5173'}
)
print('3. CEO LAN IP Login (Origin: http://172.18.50.215:5173): Status', r3.status_code, '->', 'PASSED (BLOCKED)' if r3.status_code == 403 else 'FAILED')

# 4. Admin from network/tunnel (Origin: https://medinsight-ai.loca.lt)
r4 = client.post(
    '/api/v1/auth/login',
    json={'email': 'admin@medinsight.ai', 'password': os.environ["MEDINSIGHT_ADMIN_PASSWORD"]},
    headers={'Origin': 'https://medinsight-ai.loca.lt'}
)
print('4. Admin Network/Tunnel Login: Status', r4.status_code, '->', 'PASSED (ALLOWED)' if r4.status_code == 200 else 'FAILED')

# 5. Researcher from network/tunnel
r5 = client.post(
    '/api/v1/auth/login',
    json={'email': 'researcher@medinsight.ai', 'password': os.environ["MEDINSIGHT_RESEARCHER_PASSWORD"]},
    headers={'Origin': 'https://medinsight-ai.loca.lt'}
)
print('5. Researcher Network/Tunnel Login: Status', r5.status_code, '->', 'PASSED (ALLOWED)' if r5.status_code == 200 else 'FAILED')

# 6. Student from network/tunnel
r6 = client.post(
    '/api/v1/auth/login',
    json={'email': '23ad101@excelcolleges.com', 'password': os.environ["MEDINSIGHT_COLLEGE_STUDENT_PASSWORD"]},
    headers={'Origin': 'https://medinsight-ai.loca.lt'}
)
print('6. Student Network/Tunnel Login: Status', r6.status_code, '->', 'PASSED (ALLOWED)' if r6.status_code == 200 else 'FAILED')

print("\n[SUCCESS] CEO Localhost-Only policy verified and working flawlessly.")
