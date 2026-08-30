from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_complete_system():
    print("--- 1. Testing Authentication & 3 Roles Logins ---")
    # Admin login
    res_admin = client.post("/api/auth/login", json={"email": "admin@college.edu", "password": "admin123"})
    assert res_admin.status_code == 200
    assert res_admin.json()["role"] == "admin"
    print("[OK] Admin login successful: Dr. Sivasubramaniam")

    # Manager login
    res_mgr = client.post("/api/auth/login", json={"email": "manager@college.edu", "password": "manager123"})
    assert res_mgr.status_code == 200
    assert res_mgr.json()["role"] == "manager"
    print("[OK] Manager login successful: Dr. Jeyakannan")

    # Team member login
    res_team = client.post("/api/auth/login", json={"email": "team1@college.edu", "password": "team123"})
    assert res_team.status_code == 200
    assert res_team.json()["role"] == "team_member"
    print("[OK] Team Member login successful: Team Member 1")

    # Invalid password check
    res_invalid = client.post("/api/auth/login", json={"email": "admin@college.edu", "password": "wrongpassword"})
    assert res_invalid.status_code == 401
    print("[OK] Invalid login rejected correctly.")

    print("--- 2. Testing Admin User Provisioning & Permissions ---")
    # Create new team member
    new_user_payload = {
        "name": "Team Member 5",
        "email": "team5@college.edu",
        "password": "password123",
        "role": "team_member",
        "phone": "+91 98888 12345",
        "designation": "Assistant Placement Officer",
        "can_manage_leads": True,
        "can_upload_jd": True,
        "can_complete_drives": False,
        "can_manage_students": False,
        "can_view_reports": True
    }
    res_create = client.post("/api/auth/users", json=new_user_payload, headers={"X-User-Email": "admin@college.edu"})
    assert res_create.status_code == 200
    created_id = res_create.json()["id"]
    print(f"[OK] Admin created new staff member: {res_create.json()['name']} (ID: {created_id})")

    # Update permissions
    res_perm = client.put(f"/api/auth/users/{created_id}/permissions", json={"can_complete_drives": True}, headers={"X-User-Email": "admin@college.edu"})
    assert res_perm.status_code == 200
    assert res_perm.json()["can_complete_drives"] == True
    print("[OK] Admin successfully updated staff permissions.")

    # Get users list
    res_users = client.get("/api/auth/users", headers={"X-User-Email": "admin@college.edu"})
    assert res_users.status_code == 200
    assert len(res_users.json()) >= 6
    print(f"[OK] Retrieved {len(res_users.json())} system users.")

    print("--- 3. Testing Dashboard, Students, Matching & Reports ---")
    assert client.get("/api/dashboard", headers={"X-User-Email": "admin@college.edu"}).status_code == 200
    assert client.get("/api/students", headers={"X-User-Email": "admin@college.edu"}).status_code == 200
    assert client.get("/api/leads", headers={"X-User-Email": "admin@college.edu"}).status_code == 200
    assert client.get("/api/companies", headers={"X-User-Email": "admin@college.edu"}).status_code == 200
    assert client.get("/api/reports/company-registered", headers={"X-User-Email": "admin@college.edu"}).status_code == 200
    assert client.get("/api/reports/completed-drives", headers={"X-User-Email": "admin@college.edu"}).status_code == 200
    assert client.get("/api/reports/student-status", headers={"X-User-Email": "admin@college.edu"}).status_code == 200
    assert client.get("/api/reports/company-status", headers={"X-User-Email": "admin@college.edu"}).status_code == 200
    print("[OK] All operational endpoints online & verified.")

    print("\n>>> ALL SYSTEM & AUTH INTEGRATION TESTS PASSED WITH 100% SUCCESS! <<<\n")

if __name__ == "__main__":
    test_complete_system()
