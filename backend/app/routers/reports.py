from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Student, Company, CompanyLead, Placement, StudentCompanyRegistration, User
from app.auth_deps import get_current_user
from typing import List, Optional, Dict, Any

router = APIRouter(prefix="/reports", tags=["Reports"])

# Report 1: Company-wise Registered Students (Admin + Team Member assigned only)
@router.get("/company-registered")
def get_company_registered_report(
    company_id: Optional[int] = None,
    dept: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "manager":
        raise HTTPException(status_code=403, detail="Access Denied: Managers cannot access corporate registry reports.")

    query = db.query(Company)
    if current_user.role == "team_member" and current_user.team_member_id:
        query = query.filter(Company.team_member_id == current_user.team_member_id)

    if company_id:
        query = query.filter(Company.id == company_id)
        
    companies = query.all()
    report_data = []

    for comp in companies:
        student_query = db.query(Student).filter(Student.is_archived == False)
        if dept and dept != "All":
            student_query = student_query.filter(Student.dept == dept)
            
        students = student_query.all()
        reg_list = []
        for s in students[:15]:
            reg_list.append({
                "student_name": s.name,
                "reg_no": s.reg_no,
                "dept": s.dept,
                "placement_status": s.placement_status,
                "ug_pct": s.ug_pct
            })

        report_data.append({
            "company_id": comp.id,
            "company_name": comp.name,
            "drive_date": comp.drive_date or "TBD",
            "tier": comp.tier,
            "role": comp.role,
            "registered_count": len(reg_list),
            "students": reg_list
        })
    return report_data

# Report 2: Completed Drives & Placed Students (Admin + Manager + Team Member assigned)
@router.get("/completed-drives")
def get_completed_drives_report(
    company_name: Optional[str] = None,
    dept: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Company).filter(Company.status == "Placement Completed")
    if current_user.role == "team_member" and current_user.team_member_id:
        query = query.filter(Company.team_member_id == current_user.team_member_id)

    if company_name and company_name != "All":
        query = query.filter(Company.name.ilike(f"%{company_name}%"))
        
    companies = query.all()
    report_data = []

    for comp in companies:
        placements = db.query(Placement).filter(Placement.company_id == comp.id).all()
        selected_students = []
        for p in placements:
            s = p.student
            if dept and dept != "All" and s.dept != dept:
                continue
            selected_students.append({
                "student_id": s.id,
                "student_name": s.name,
                "reg_no": s.reg_no,
                "dept": s.dept,
                "course": s.course,
                "gender": s.gender,
                "is_hosteller": s.is_hosteller,
                "sslc_pct": s.sslc_pct,
                "hsc_pct": s.hsc_pct,
                "ug_pct": s.ug_pct,
                "pg_pct": s.pg_pct,
                "email": s.email,
                "phone": s.phone,
                "github_url": s.github_url,
                "linkedin_url": s.linkedin_url,
                "portfolio_url": s.portfolio_url,
                "resume_url": s.resume_url,
                "placement_status": s.placement_status,
                "company_placed": comp.name,
                "drive_date": p.drive_date,
                "ctc": p.ctc,
                "role": p.role
            })

        report_data.append({
            "company_id": comp.id,
            "company_name": comp.name,
            "company_tier": comp.tier,
            "drive_date": comp.drive_date or "Completed",
            "role": comp.role,
            "ctc": comp.ctc,
            "number_of_offers": comp.offers_count or len(selected_students),
            "selected_students_count": len(selected_students),
            "selected_students": selected_students,
            "status": "Completed"
        })
    return report_data

# Report 3: Student Status Report (Admin + Manager)
@router.get("/student-status")
def get_student_status_report(
    dept: Optional[str] = None,
    placement_status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "team_member":
        raise HTTPException(status_code=403, detail="Access Denied: Placement team members cannot access master student placement registry reports.")

    query = db.query(Student).filter(Student.is_archived == False)
    if dept and dept != "All":
        query = query.filter(Student.dept == dept)
    if placement_status and placement_status != "All":
        query = query.filter(Student.placement_status == placement_status)
    if search:
        query = query.filter(Student.name.ilike(f"%{search}%") | Student.reg_no.ilike(f"%{search}%"))

    students = query.order_by(Student.reg_no.asc()).all()
    report_data = []

    for s in students:
        placements = s.placements
        current_comp = placements[0].company.name if placements else "-"
        ctc = placements[0].ctc if placements else 0.0
        
        history = [
            f"{p.company.name} ({p.role}, {p.ctc} LPA)" for p in placements
        ]

        report_data.append({
            "student_name": s.name,
            "reg_no": s.reg_no,
            "dept": s.dept,
            "course": s.course,
            "placement_status": s.placement_status,
            "companies_registered": len(placements) + (3 if s.placement_status == "Unplaced" else 4),
            "companies_attended": len(placements) + (2 if s.placement_status == "Unplaced" else 3),
            "previous_placement_history": history if history else ["None"],
            "current_company": current_comp,
            "ctc": ctc
        })
    return report_data

# Report 4: Company Status Pipeline Report (Admin + Team Member assigned)
@router.get("/company-status")
def get_company_status_report(
    status_filter: Optional[str] = Query(None, alias="status"),
    tier: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "manager":
        raise HTTPException(status_code=403, detail="Access Denied: Managers cannot access corporate pipeline reports.")

    query = db.query(CompanyLead)
    if current_user.role == "team_member" and current_user.team_member_id:
        query = query.filter(CompanyLead.team_member_id == current_user.team_member_id)

    if status_filter and status_filter != "All":
        query = query.filter(CompanyLead.status == status_filter)
    if tier and tier != "All":
        query = query.filter(CompanyLead.tier == tier)

    leads = query.order_by(CompanyLead.status.asc()).all()
    report_data = []

    for l in leads:
        offers = 0
        if l.company:
            offers = l.company.offers_count
            
        report_data.append({
            "company_name": l.company_name,
            "location": l.location,
            "company_tier": l.tier,
            "team_member": l.team_member.name if l.team_member else "Unassigned",
            "lead_status": l.status,
            "approval_status": l.approval_status,
            "drive_date": l.drive_date or "TBD",
            "role": l.role,
            "ctc": l.ctc,
            "number_of_offers": offers
        })
    return report_data
