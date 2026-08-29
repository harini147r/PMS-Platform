from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import PlacementTeamMember, CompanyLead, FollowUp, User
from app.schemas import TeamMemberOut, FollowUpCreate, FollowUpOut
from app.auth_deps import get_current_user, require_team_member
from typing import List

router = APIRouter(prefix="/team", tags=["Placement Team"])

@router.get("/members", response_model=List[TeamMemberOut])
def get_team_members(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "manager":
        raise HTTPException(
            status_code=403,
            detail="Access Denied: Managers cannot access Placement Team Member management."
        )

    # If team member, only return their own profile unless admin
    if current_user.role == "team_member" and current_user.team_member_id:
        members = db.query(PlacementTeamMember).filter(PlacementTeamMember.id == current_user.team_member_id).all()
    else:
        members = db.query(PlacementTeamMember).all()

    results = []
    for m in members:
        assigned = db.query(CompanyLead).filter(CompanyLead.team_member_id == m.id).all()
        cold = sum(1 for l in assigned if l.status == "Cold")
        warm = sum(1 for l in assigned if l.status == "Warm")
        hot = sum(1 for l in assigned if l.status == "Hot")
        completed = sum(1 for l in assigned if l.status == "Placement Completed")
        follow_ups_cnt = db.query(FollowUp).filter(FollowUp.team_member_id == m.id).count()

        results.append(TeamMemberOut(
            id=m.id,
            name=m.name,
            email=m.email,
            phone=m.phone,
            designation=m.designation,
            assigned_leads_count=len(assigned),
            cold_leads=cold,
            warm_leads=warm,
            hot_leads=hot,
            completed_placements=completed,
            follow_ups_count=follow_ups_cnt
        ))
    return results

@router.post("/follow-ups", response_model=FollowUpOut)
def add_follow_up(
    data: FollowUpCreate, 
    current_user: User = Depends(require_team_member), 
    db: Session = Depends(get_db)
):
    lead = db.query(CompanyLead).filter(CompanyLead.id == data.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    # Team member can only add follow up to their own lead
    if current_user.role == "team_member" and lead.team_member_id != current_user.team_member_id:
        raise HTTPException(
            status_code=403,
            detail="Access Denied: You can only record follow-ups for your own assigned leads."
        )

    tm_id = current_user.team_member_id if current_user.role == "team_member" else data.team_member_id
    fu = FollowUp(
        lead_id=data.lead_id,
        team_member_id=tm_id,
        notes=data.notes,
        follow_up_date=data.follow_up_date,
        next_step=data.next_step
    )
    db.add(fu)
    db.commit()
    db.refresh(fu)
    
    fu_out = FollowUpOut.from_orm(fu)
    fu_out.team_member_name = fu.team_member.name if fu.team_member else "Unknown"
    return fu_out
