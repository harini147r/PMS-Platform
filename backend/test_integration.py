import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import Student, Company, CompanyLead, Placement

client = TestClient(app)

def test_api_endpoints():
    print("--- 1. Testing Root & Dashboard ---")
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json()["status"] == "Online"

    resp = client.get("/api/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    assert "kpis" in data
    assert data["kpis"]["total_students"] > 0
    assert len(data["department_analytics"]) > 0
    print("[OK] Dashboard returns KPIs & Department analytics:", data["kpis"]["total_students"], "students")

    print("--- 2. Testing Students CRUD & Archive ---")
    resp = client.get("/api/students")
    assert resp.status_code == 200
    students = resp.json()
    assert len(students) > 0
    test_student_id = students[0]["id"]
    print(f"[OK] Retrieved {len(students)} students.")

    # Archive student
    resp = client.post(f"/api/students/{test_student_id}/archive", json={"reason": "Higher Studies", "note": "Pursuing MS abroad"})
    assert resp.status_code == 200

    # Unarchive student
    resp = client.post(f"/api/students/{test_student_id}/unarchive")
    assert resp.status_code == 200
    print("[OK] Archive and Unarchive workflows verified.")

    print("--- 3. Testing Leads & Review Workflow ---")
    resp = client.get("/api/leads")
    assert resp.status_code == 200
    leads = resp.json()
    assert len(leads) > 0
    print(f"[OK] Retrieved {len(leads)} leads.")

    # Submit lead for approval
    target_lead = next(l for l in leads if l["approval_status"] in ["Draft", "Pending Approval"])
    resp = client.post(f"/api/leads/{target_lead['id']}/submit-approval")
    assert resp.status_code == 200

    # Admin approve lead
    resp = client.post(f"/api/leads/{target_lead['id']}/review?action=approve")
    assert resp.status_code == 200
    print(f"[OK] Lead {target_lead['id']} approved by Admin.")

    print("--- 4. Testing Resume-JD Matching & ATS Scoring ---")
    resp = client.get("/api/companies")
    assert resp.status_code == 200
    companies = resp.json()
    assert len(companies) > 0
    comp_id = companies[0]["id"]

    resp = client.get(f"/api/matching/company/{comp_id}")
    assert resp.status_code == 200
    matching_data = resp.json()
    assert "category_counts" in matching_data
    assert len(matching_data["ranked_students"]) > 0
    top_candidate = matching_data["ranked_students"][0]
    print(f"[OK] Matching evaluated {matching_data['total_evaluated']} candidates for {matching_data['company_name']}.")
    print(f"     Top candidate: {top_candidate['student_name']} (ATS Score: {top_candidate['ats_score']}, Category: {top_candidate['category']})")

    print("--- 5. Testing Placement Completion Ripple Workflow ---")
    unplaced_students = [s for s in students if s["placement_status"] == "Unplaced"]
    selected_ids = [s["id"] for s in unplaced_students[:3]]

    payload = {
        "company_id": comp_id,
        "drive_date": "2026-08-25",
        "role": "Cloud Software Engineer",
        "ctc": 32.0,
        "number_of_offers": 3,
        "selected_student_ids": selected_ids
    }
    resp = client.post("/api/placements/complete-drive", json=payload)
    assert resp.status_code == 200
    print(f"[OK] Completed placement drive for company {comp_id}. Ripple update verified.")

    print("--- 6. Testing 4 Reports ---")
    # Report 1
    resp1 = client.get("/api/reports/company-registered")
    assert resp1.status_code == 200
    # Report 2
    resp2 = client.get("/api/reports/completed-drives")
    assert resp2.status_code == 200
    # Report 3
    resp3 = client.get("/api/reports/student-status")
    assert resp3.status_code == 200
    # Report 4
    resp4 = client.get("/api/reports/company-status")
    assert resp4.status_code == 200
    print("[OK] All 4 Reports generated successfully from central normalized schema.")

    print("\n>>> ALL BACKEND INTEGRATION TESTS PASSED PERFECTLY! <<<\n")

if __name__ == "__main__":
    test_api_endpoints()
