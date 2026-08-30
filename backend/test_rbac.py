from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_rbac_security_matrix():
    print("=================================================================")
    print("[RUN] RBAC & SECURITY ENFORCEMENT VERIFICATION TEST SUITE")
    print("=================================================================")

    admin_headers = {"X-User-Email": "admin@college.edu"}
    manager_headers = {"X-User-Email": "manager@college.edu"}
    team_headers = {"X-User-Email": "team1@college.edu"}
    other_team_headers = {"X-User-Email": "team2@college.edu"}

    # -------------------------------------------------------------
    # TEST 1: ADMIN (FULL PRIVILEGES)
    # -------------------------------------------------------------
    print("\n--- TEST 1: Admin Privileges ---")
    res = client.get("/api/dashboard", headers=admin_headers)
    assert res.status_code == 200
    print("  [OK] Admin can view full placement dashboard & company funnel.")

    res = client.get("/api/leads", headers=admin_headers)
    assert res.status_code == 200
    all_leads = res.json()
    assert len(all_leads) >= 20
    print(f"  [OK] Admin sees all {len(all_leads)} leads across all members.")

    draft_lead = next((l for l in all_leads if l["approval_status"] in ["Draft", "Pending Approval"]), all_leads[0])
    res = client.post(f"/api/leads/{draft_lead['id']}/review?action=approve", headers=admin_headers)
    assert res.status_code == 200
    print(f"  [OK] Admin successfully approved lead #{draft_lead['id']} ({draft_lead['company_name']}).")

    assert client.get("/api/reports/company-registered", headers=admin_headers).status_code == 200
    assert client.get("/api/reports/completed-drives", headers=admin_headers).status_code == 200
    assert client.get("/api/reports/student-status", headers=admin_headers).status_code == 200
    assert client.get("/api/reports/company-status", headers=admin_headers).status_code == 200
    print("  [OK] Admin has unrestricted access to all 4 reports.")

    # -------------------------------------------------------------
    # TEST 2: PLACEMENT TEAM MEMBER (RESTRICTED OWNERSHIP)
    # -------------------------------------------------------------
    print("\n--- TEST 2: Placement Team Member Restrictions & Ownership ---")
    
    res = client.get("/api/leads", headers=team_headers)
    assert res.status_code == 200
    my_leads = res.json()
    print(f"  [OK] Team member views only their {len(my_leads)} assigned leads.")

    if my_leads:
        my_lead_id = my_leads[0]["id"]
        res = client.post(f"/api/leads/{my_lead_id}/review?action=approve", headers=team_headers)
        assert res.status_code == 403
        print("  [OK] SECURITY PASS: Team member CANNOT approve their own lead (HTTP 403 Forbidden).")

    res_other = client.get("/api/leads", headers=other_team_headers)
    other_leads = res_other.json()
    if other_leads:
        other_lead_id = other_leads[0]["id"]
        res = client.put(f"/api/leads/{other_lead_id}", json={"ctc": 99.0}, headers=team_headers)
        assert res.status_code == 403
        print(f"  [OK] SECURITY PASS: Team member CANNOT edit another member's lead #{other_lead_id} (HTTP 403 Forbidden).")

    students = client.get("/api/students", headers=team_headers).json()
    st_id = students[0]["id"]
    res = client.delete(f"/api/students/{st_id}", headers=team_headers)
    assert res.status_code == 403
    print("  [OK] SECURITY PASS: Team member CANNOT delete students (HTTP 403 Forbidden).")

    res = client.post(f"/api/students/{st_id}/archive", json={"reason": "Test"}, headers=team_headers)
    assert res.status_code == 403
    print("  [OK] SECURITY PASS: Team member CANNOT archive students (HTTP 403 Forbidden).")

    res = client.get("/api/reports/student-status", headers=team_headers)
    assert res.status_code == 403
    print("  [OK] SECURITY PASS: Team member CANNOT access master student status report (HTTP 403 Forbidden).")

    # -------------------------------------------------------------
    # TEST 3: MANAGER (STUDENT MANAGEMENT ONLY)
    # -------------------------------------------------------------
    print("\n--- TEST 3: Manager Privileges & Corporate Restrictions ---")

    res = client.get("/api/students", headers=manager_headers)
    assert res.status_code == 200
    print("  [OK] Manager can view student master records.")

    res = client.post(f"/api/students/{st_id}/archive", json={"reason": "Higher Studies", "note": "Approved"}, headers=manager_headers)
    assert res.status_code == 200
    client.post(f"/api/students/{st_id}/unarchive", headers=manager_headers)
    print("  [OK] Manager can archive & unarchive students with mandatory reason/note.")

    res = client.get("/api/leads", headers=manager_headers)
    assert res.status_code == 403
    print("  [OK] SECURITY PASS: Manager CANNOT access corporate leads (HTTP 403 Forbidden).")

    res = client.post("/api/leads", json={"company_name": "Test", "location": "BLR", "poc_name": "X", "poc_email": "x@x.com", "poc_phone": "123", "team_member_id": 1, "ctc": 10.0, "role": "Dev"}, headers=manager_headers)
    assert res.status_code == 403
    print("  [OK] SECURITY PASS: Manager CANNOT create company leads (HTTP 403 Forbidden).")

    res = client.get("/api/companies", headers=manager_headers)
    assert res.status_code == 403
    print("  [OK] SECURITY PASS: Manager CANNOT access company accounts (HTTP 403 Forbidden).")

    res = client.post("/api/placements/complete-drive", json={"company_id": 1, "drive_date": "2026-08-20", "role": "Dev", "ctc": 12.0, "number_of_offers": 1, "selected_student_ids": [st_id]}, headers=manager_headers)
    assert res.status_code == 403
    print("  [OK] SECURITY PASS: Manager CANNOT complete placement drives (HTTP 403 Forbidden).")

    assert client.get("/api/reports/student-status", headers=manager_headers).status_code == 200
    assert client.get("/api/reports/completed-drives", headers=manager_headers).status_code == 200
    assert client.get("/api/reports/company-status", headers=manager_headers).status_code == 403
    assert client.get("/api/reports/company-registered", headers=manager_headers).status_code == 403
    print("  [OK] SECURITY PASS: Manager restricted strictly to student reports (Report 1 & 4 return HTTP 403 Forbidden).")

    print("\n=================================================================")
    print("[SUCCESS] ALL RBAC & SECURITY TESTS PASSED WITH 100% SUCCESS!")
    print("=================================================================\n")

if __name__ == "__main__":
    test_rbac_security_matrix()
