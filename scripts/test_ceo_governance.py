import os
import requests

BASE = 'http://127.0.0.1:8000/api/v1'

# 1. Login as CEO
res_ceo = requests.post(f'{BASE}/auth/login', json={'email': 'ceo@medinsight.ai', 'password': os.environ["MEDINSIGHT_CEO_PASSWORD"]})
assert res_ceo.status_code == 200, f'CEO login failed: {res_ceo.text}'
ceo_token = res_ceo.json()['access_token']
ceo_headers = {'Authorization': f'Bearer {ceo_token}'}
print('[OK] 1. CEO Login successful: Satyam Kumar Shrivastav')

# 2. Check Governance
gov = requests.get(f'{BASE}/admin/governance', headers=ceo_headers).json()
assert gov['ceo_name'] == 'Satyam Kumar Shrivastav', 'CEO name mismatch'
print(f"[OK] 2. Governance verified: CEO={gov['ceo_name']}, Max Admins={gov['max_admins']}, Active Admins={gov['current_active_admins']}")

# 3. CEO updates max admins quota
set_quota = requests.put(f'{BASE}/admin/governance/max-admins', json={'max_admins': 8}, headers=ceo_headers)
assert set_quota.status_code == 200, f'Failed to set quota: {set_quota.text}'
gov2 = requests.get(f'{BASE}/admin/governance', headers=ceo_headers).json()
assert gov2['max_admins'] == 8, 'Max admins update failed'
print('[OK] 3. CEO updated max admins quota to 8')

# 4. Attempt to promote another user to CEO (Must fail - only 1 CEO can exist)
users = requests.get(f'{BASE}/admin/users', headers=ceo_headers).json()
student = next(u for u in users if u['role'] == 'STUDENT')
promote_ceo = requests.put(f'{BASE}/admin/users/{student["id"]}/role', json={'role': 'CEO'}, headers=ceo_headers)
assert promote_ceo.status_code == 400, 'Assigning second CEO did not fail as expected'
print('[OK] 4. Only 1 CEO account allowed: prevented second CEO assignment')

# 5. Normal admin cannot promote someone to ADMIN without CEO
res_admin = requests.post(f'{BASE}/auth/login', json={'email': 'admin@medinsight.ai', 'password': os.environ["MEDINSIGHT_ADMIN_PASSWORD"]})
admin_token = res_admin.json()['access_token']
admin_headers = {'Authorization': f'Bearer {admin_token}'}

promote_admin = requests.put(f'{BASE}/admin/users/{student["id"]}/role', json={'role': 'ADMIN'}, headers=admin_headers)
assert promote_admin.status_code == 403, f'Admin promoting without CEO should fail: {promote_admin.text}'
print('[OK] 5. Non-CEO Admin prevented from appointing new Admin without CEO approval (403 Forbidden)')

# 6. CEO updates his own profile
ceo_profile_update = requests.put(f'{BASE}/auth/me', json={'bio': 'Founder & CEO of BioIntelliX | Team led by Mr. S. K. Shrivastav. Platform Governance.'}, headers=ceo_headers)
assert ceo_profile_update.status_code == 200, 'CEO failed to update own data'
print('[OK] 6. CEO successfully updated his own data')

# 7. CEO account cannot be deleted
ceo_user = next(u for u in users if u['role'] == 'CEO')
del_ceo_id = requests.delete(f'{BASE}/admin/users/{ceo_user["id"]}', headers=ceo_headers)
assert del_ceo_id.status_code == 400, 'Deleting CEO account should be forbidden'
print('[OK] 7. CEO account deletion forbidden and protected')

print('\nALL CEO SUPER ADMIN GOVERNANCE REQUIREMENTS VALIDATED SUCCESSFULLY!')
