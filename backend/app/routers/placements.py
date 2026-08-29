from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Company, Student, Placement, ActivityLog, CompanyLead, User
from app.schemas import PlacementCompletionRequest
from app.auth_deps import require_team_member
from typing import List

router = APIRouter(prefix="/placements", tags=["Placements"])

@router.post("/complete-drive")
def complete_placement_drive(
    req: PlacementCompletionRequest, 
    current_user: User = Depends(require_team_member), 
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(Company.id == req.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    if company.team_member_id != current_user.team_member_id:
        raise HTTPException(
            status_code=403,
            detail="Access Denied: You can only complete placement drives for companies assigned to you."
        )

    company.status = "Placement Completed"
    company.offers_count = req.number_of_offers
    company.ctc = req.ctc
    company.drive_date = req.drive_date

    if company.lead:
        company.lead.status = "Placement Completed"

    placed_names = []
    for student_id in req.selected_student_ids:
        student = db.query(Student).filter(Student.id == student_id).first()
        if student:
            student.placement_status = "Placed"
            placed_names.append(student.name)
            
            existing_p = db.query(Placement).filter(
                Placement.student_id == student.id,
                Placement.company_id == company.id
            ).first()
            if not existing_p:
                placement = Placement(
                    student_id=student.id,
                    company_id=company.id,
                    drive_date=req.drive_date,
                    role=req.role,
                    ctc=req.ctc
                )
                db.add(placement)

    student_summary = f"{len(placed_names)} students ({', '.join(placed_names[:3])}{'...' if len(placed_names) > 3 else ''})"
    act = ActivityLog(
        activity_type="PLACEMENT_COMPLETED",
        title="Placement Drive Completed",
        description=f"{company.name} completed drive for {req.role} ({req.ctc} LPA). {req.number_of_offers} offers recorded by {current_user.name}."
    )
    db.add(act)

    db.commit()
    return {
        "success": True,
        "message": "Placement drive completed successfully and student records updated.",
        "company_name": company.name,
        "placed_students_count": len(placed_names),
        "total_offers": req.number_of_offers
    }
