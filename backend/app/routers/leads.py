from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import CompanyLead, Company, PlacementTeamMember, JobDescription, ActivityLog, User
from app.schemas import CompanyLeadCreate, CompanyLeadUpdate, CompanyLeadOut, FollowUpOut
from app.auth_deps import get_current_user, require_admin, require_team_member
from typing import List

router = APIRouter(prefix="/leads", tags=["Company Leads"])

@router.get("", response_model=List[CompanyLeadOut])
def get_leads(
    status: str = None, 
    approval_status: str = None, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "manager":
        raise HTTPException(
            status_code=403,
            detail="Access Denied: Managers cannot access corporate leads."
        )

    query = db.query(CompanyLead)
    
    # Ownership filter: team members only see their assigned leads
    if current_user.role == "team_member" and current_user.team_member_id:
        query = query.filter(CompanyLead.team_member_id == current_user.team_member_id)

    if status and status != "All":
        query = query.filter(CompanyLead.status == status)
    if approval_status and approval_status != "All":
        query = query.filter(CompanyLead.approval_status == approval_status)
        
    leads = query.order_by(CompanyLead.created_at.desc()).all()
    results = []
    for l in leads:
        follow_ups = [
            FollowUpOut(
                id=f.id,
                lead_id=f.lead_id,
                team_member_id=f.team_member_id,
                team_member_name=f.team_member.name if f.team_member else "",
                notes=f.notes,
                follow_up_date=f.follow_up_date,
                next_step=f.next_step,
                created_at=f.created_at
            ) for f in l.follow_ups
        ]
        out = CompanyLeadOut.from_orm(l)
        out.team_member_name = l.team_member.name if l.team_member else "Unknown"
        out.jd_file_name = l.jd.file_name if l.jd else None
        out.follow_ups = follow_ups
        results.append(out)
    return results

@router.post("", response_model=CompanyLeadOut)
def create_lead(
    data: CompanyLeadCreate, 
    current_user: User = Depends(require_team_member), 
    db: Session = Depends(get_db)
):
    lead_dict = data.dict()
    # If team member, ensure lead is assigned to themselves
    if current_user.role == "team_member" and current_user.team_member_id:
        lead_dict["team_member_id"] = current_user.team_member_id

    lead = CompanyLead(**lead_dict)
    db.add(lead)
    
    activity = ActivityLog(
        activity_type="NEW_LEAD",
        title=f"New Company Lead Added",
        description=f"{data.company_name} ({data.role}, {data.ctc} LPA) added by {current_user.name}."
    )
    db.add(activity)
    
    db.commit()
    db.refresh(lead)
    
    out = CompanyLeadOut.from_orm(lead)
    out.team_member_name = lead.team_member.name if lead.team_member else ""
    return out

@router.put("/{lead_id}", response_model=CompanyLeadOut)
def update_lead(
    lead_id: int, 
    data: CompanyLeadUpdate, 
    current_user: User = Depends(require_team_member), 
    db: Session = Depends(get_db)
):
    lead = db.query(CompanyLead).filter(CompanyLead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    # Strict ownership check: team member can only edit their own lead
    if current_user.role == "team_member" and lead.team_member_id != current_user.team_member_id:
        raise HTTPException(
            status_code=403,
            detail="Access Denied: You cannot modify leads assigned to another placement team member."
        )

    # Team members cannot modify approval_status directly
    update_data = data.dict(exclude_unset=True)
    if current_user.role == "team_member" and "approval_status" in update_data:
        if update_data["approval_status"] in ["Approved", "Rejected"]:
            raise HTTPException(
                status_code=403,
                detail="Access Denied: Only Head of Placement (Admin) can approve or reject leads."
            )

    for key, value in update_data.items():
        setattr(lead, key, value)
        
    db.commit()
    db.refresh(lead)
    
    out = CompanyLeadOut.from_orm(lead)
    out.team_member_name = lead.team_member.name if lead.team_member else ""
    return out

@router.delete("/{lead_id}")
def delete_lead(
    lead_id: int, 
    current_user: User = Depends(require_team_member), 
    db: Session = Depends(get_db)
):
    lead = db.query(CompanyLead).filter(CompanyLead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    if current_user.role == "team_member" and lead.team_member_id != current_user.team_member_id:
        raise HTTPException(
            status_code=403,
            detail="Access Denied: You can only delete your own assigned leads."
        )

    db.delete(lead)
    db.commit()
    return {"message": "Lead deleted successfully"}

@router.post("/{lead_id}/submit-approval")
def submit_for_approval(
    lead_id: int, 
    current_user: User = Depends(require_team_member), 
    db: Session = Depends(get_db)
):
    lead = db.query(CompanyLead).filter(CompanyLead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    if current_user.role == "team_member" and lead.team_member_id != current_user.team_member_id:
        raise HTTPException(
            status_code=403,
            detail="Access Denied: You can only submit your own assigned leads for approval."
        )
        
    lead.approval_status = "Pending Approval"
    db.commit()
    return {"message": "Lead submitted for Admin approval", "lead_id": lead.id}

@router.post("/{lead_id}/review")
def review_lead(
    lead_id: int, 
    action: str, 
    current_user: User = Depends(require_admin), # STRICTLY Admin only
    db: Session = Depends(get_db)
):
    """Admin reviews and Approves or Rejects lead."""
    lead = db.query(CompanyLead).filter(CompanyLead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    if action.lower() == "approve":
        lead.approval_status = "Approved"
        
        existing_comp = db.query(Company).filter(Company.lead_id == lead.id).first()
        if not existing_comp:
            company = Company(
                name=lead.company_name,
                location=lead.location,
                tier=lead.tier,
                role=lead.role,
                ctc=lead.ctc,
                drive_date=lead.drive_date,
                status="Approved",
                offers_count=0,
                team_member_id=lead.team_member_id,
                lead_id=lead.id,
                jd_id=lead.jd_id
            )
            db.add(company)
            
        activity = ActivityLog(
            activity_type="COMPANY_APPROVED",
            title="Company Approved",
            description=f"{lead.company_name} ({lead.role}) approved by Head of Placement."
        )
        db.add(activity)
    elif action.lower() == "reject":
        lead.approval_status = "Rejected"
    else:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")
        
    db.commit()
    return {"message": f"Lead {action}d successfully", "lead_id": lead.id, "status": lead.approval_status}
