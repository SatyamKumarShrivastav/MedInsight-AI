import os
import urllib.request
import json

def post(url, data, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers)
    return json.loads(urllib.request.urlopen(req).read().decode())

def get(url, token=None):
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, headers=headers)
    return json.loads(urllib.request.urlopen(req).read().decode())

print("[1] Registering a Citizen account with Address and Voter ID...")
citizen_data = {
    'email': 'citizen.test@medinsight.ai',
    'username': 'citizentest',
    'password': os.environ["MEDINSIGHT_WORKFLOW_CITIZEN_PASSWORD"],
    'full_name': 'Ramesh Kumar',
    'role': 'CITIZEN',
    'address': '42 Health St, Ward 5, Bengaluru, Karnataka, 560001',
    'country': 'India',
    'identification_number': 'VTR-88492019'
}
try:
    reg_res = post('http://127.0.0.1:8000/api/v1/auth/register', citizen_data)
    print(f"  [OK] Registered Citizen: {reg_res['username']} (Role: {reg_res['role']}, Address: {reg_res['address']}, ID: {reg_res['identification_number']})")
except Exception as e:
    print("  [INFO] User already registered or:", e)

print("[2] Logging in as Citizen...")
login_res = post('http://127.0.0.1:8000/api/v1/auth/login', {'email': 'citizen.test@medinsight.ai', 'password': os.environ["MEDINSIGHT_WORKFLOW_CITIZEN_PASSWORD"]})
cit_token = login_res['access_token']
print("  [OK] Citizen login successful.")

print("[3] Citizen requesting a password change...")
req_res = post('http://127.0.0.1:8000/api/v1/auth/me/password', {'current_password': os.environ["MEDINSIGHT_WORKFLOW_CITIZEN_PASSWORD"], 'new_password': os.environ["MEDINSIGHT_WORKFLOW_APPROVED_PASSWORD"]}, token=cit_token)
print(f"  [OK] Password change requested: {req_res['message']} (Status: {req_res['status']})")

print("[4] Administrator reviewing and approving pending password request...")
admin_login = post('http://127.0.0.1:8000/api/v1/auth/login', {'email': 'admin@medinsight.ai', 'password': os.environ["MEDINSIGHT_ADMIN_PASSWORD"]})
admin_token = admin_login['access_token']
users = get('http://127.0.0.1:8000/api/v1/admin/users', token=admin_token)
cit_user = next(u for u in users if u['email'] == 'citizen.test@medinsight.ai')
print(f"  [OK] Found user in Admin panel: @{cit_user['username']} | has_pending_password: {cit_user['has_pending_password']}")

approve_req = urllib.request.Request(
    f"http://127.0.0.1:8000/api/v1/admin/users/{cit_user['id']}/approve-password",
    data=b"",
    headers={'Authorization': f'Bearer {admin_token}'}
)
approve_res = json.loads(urllib.request.urlopen(approve_req).read().decode())
print(f"  [OK] Admin approved: {approve_res['message']}")

print("[5] Verifying Citizen can log in with newly approved password...")
new_login = post('http://127.0.0.1:8000/api/v1/auth/login', {'email': 'citizen.test@medinsight.ai', 'password': os.environ["MEDINSIGHT_WORKFLOW_APPROVED_PASSWORD"]})
print(f"  [SUCCESS] Citizen successfully authenticated with approved password! Access Token: {new_login['access_token'][:25]}...")
