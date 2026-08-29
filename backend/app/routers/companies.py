from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Company, JobDescription, User
from app.schemas import CompanyOut
from app.auth_deps import get_current_user
from typing import List

router = APIRouter(prefix="/companies", tags=["Companies"])

@router.get("", response_model=List[CompanyOut])
def get_companies(
    status: str = None, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "manager":
        raise HTTPException(
            status_code=403,
            detail="Access Denied: Managers do not have permission to view or manage companies."
        )

    query = db.query(Company)
    # Team members only view companies assigned to them
    if current_user.role == "team_member" and current_user.team_member_id:
        query = query.filter(Company.team_member_id == current_user.team_member_id)

    if status and status != "All":
        query = query.filter(Company.status == status)
        
    companies = query.order_by(Company.created_at.desc()).all()
    results = []
    for c in companies:
        out = CompanyOut.from_orm(c)
        out.team_member_name = c.team_member.name if c.team_member else "Unknown"
        results.append(out)
    return results

@router.get("/{company_id}", response_model=CompanyOut)
def get_company(
    company_id: int, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "manager":
        raise HTTPException(status_code=403, detail="Access Denied.")

    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    if current_user.role == "team_member" and company.team_member_id != current_user.team_member_id:
        raise HTTPException(status_code=403, detail="Access Denied: This company is assigned to another team member.")

    out = CompanyOut.from_orm(company)
    out.team_member_name = company.team_member.name if company.team_member else "Unknown"
    return out
