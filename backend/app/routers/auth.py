from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, PlacementTeamMember, ActivityLog
from app.auth_deps import require_admin
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["Authentication & Access Control"])

class LoginRequest(BaseModel):
    email: str
    password: str

class UserPermissions(BaseModel):
    can_manage_leads: bool = True
    can_upload_jd: bool = True
    can_complete_drives: bool = True
    can_manage_students: bool = True
    can_view_reports: bool = True

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    team_member_id: Optional[int] = None
    can_manage_leads: bool
    can_upload_jd: bool
    can_complete_drives: bool
    can_manage_students: bool
    can_view_reports: bool
    created_at: datetime
    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    name: str
    email: str
    password: str = "password123"
    role: str # 'admin', 'team_member', 'manager'
    phone: Optional[str] = "+91 98765 00000"
    designation: Optional[str] = "Placement Officer"
    can_manage_leads: bool = True
    can_upload_jd: bool = True
    can_complete_drives: bool = True
    can_manage_students: bool = True
    can_view_reports: bool = True

class UserPermissionsUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    can_manage_leads: Optional[bool] = None
    can_upload_jd: Optional[bool] = None
    can_complete_drives: Optional[bool] = None
    can_manage_students: Optional[bool] = None
    can_view_reports: Optional[bool] = None

@router.post("/login", response_model=UserOut)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if user.password != req.password:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled. Please contact the Head of Placement.")
        
    return UserOut.from_orm(user)

@router.get("/users", response_model=List[UserOut])
def get_users(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.asc()).all()
    return [UserOut.from_orm(u) for u in users]

@router.post("/users", response_model=UserOut)
def create_user(data: UserCreate, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email.strip().lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"User with email '{data.email}' already exists.")

    tm_id = None
    if data.role in ["team_member", "admin", "manager"]:
        # Also create or link PlacementTeamMember
        tm = PlacementTeamMember(
            name=data.name,
            email=data.email.strip().lower(),
            phone=data.phone or "+91 98765 00000",
            designation=data.designation or ("Placement Officer" if data.role == "team_member" else "Placement Manager")
        )
        db.add(tm)
        db.flush()
        tm_id = tm.id

    user = User(
        name=data.name,
        email=data.email.strip().lower(),
        password=data.password,
        role=data.role,
        is_active=True,
        team_member_id=tm_id,
        can_manage_leads=data.can_manage_leads,
        can_upload_jd=data.can_upload_jd,
        can_complete_drives=data.can_complete_drives,
        can_manage_students=data.can_manage_students,
        can_view_reports=data.can_view_reports
    )
    db.add(user)
    
    act = ActivityLog(
        activity_type="USER_CREATED",
        title="New User Created",
        description=f"{data.name} created as {data.role.upper()} with customized access permissions."
    )
    db.add(act)

    db.commit()
    db.refresh(user)
    return UserOut.from_orm(user)

@router.put("/users/{user_id}/permissions", response_model=UserOut)
def update_user_permissions(user_id: int, data: UserPermissionsUpdate, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    for key, val in data.dict(exclude_unset=True).items():
        setattr(user, key, val)
        
    db.commit()
    db.refresh(user)
    return UserOut.from_orm(user)

@router.delete("/users/{user_id}")
def delete_user(user_id: int, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.email == "admin@college.edu":
        raise HTTPException(status_code=400, detail="Primary Admin account cannot be deleted.")
        
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}
