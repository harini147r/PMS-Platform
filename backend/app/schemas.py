from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

# User & Auth
class UserBase(BaseModel):
    name: str
    email: str
    role: str
    team_member_id: Optional[int] = None

class UserOut(UserBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Team Member
class TeamMemberBase(BaseModel):
    name: str
    email: str
    phone: str
    designation: Optional[str] = "Placement Officer"

class TeamMemberOut(TeamMemberBase):
    id: int
    assigned_leads_count: Optional[int] = 0
    cold_leads: Optional[int] = 0
    warm_leads: Optional[int] = 0
    hot_leads: Optional[int] = 0
    completed_placements: Optional[int] = 0
    follow_ups_count: Optional[int] = 0
    class Config:
        from_attributes = True

# Student
class StudentBase(BaseModel):
    reg_no: str
    name: str
    dept: str
    course: str = "B.Tech"
    gender: str
    is_hosteller: bool = False
    sslc_pct: float = Field(..., ge=0, le=100)
    hsc_pct: float = Field(..., ge=0, le=100)
    ug_pct: float = Field(..., ge=0, le=100)
    pg_pct: Optional[float] = Field(None, ge=0, le=100)
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    resume_url: Optional[str] = None
    resume_text: Optional[str] = None
    intro_video_url: Optional[str] = None
    photo_url: Optional[str] = None
    grad_year: int = 2026
    portfolio_url: Optional[str] = None
    email: str
    phone: str

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    dept: Optional[str] = None
    course: Optional[str] = None
    gender: Optional[str] = None
    is_hosteller: Optional[bool] = None
    sslc_pct: Optional[float] = None
    hsc_pct: Optional[float] = None
    ug_pct: Optional[float] = None
    pg_pct: Optional[float] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    resume_url: Optional[str] = None
    resume_text: Optional[str] = None
    intro_video_url: Optional[str] = None
    photo_url: Optional[str] = None
    grad_year: Optional[int] = None
    portfolio_url: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    placement_status: Optional[str] = None

class PlacementHistoryOut(BaseModel):
    company_name: str
    drive_date: str
    role: str
    ctc: float
    status: str
    created_at: datetime
    class Config:
        from_attributes = True

class StudentOut(StudentBase):
    id: int
    placement_status: str
    is_archived: bool
    created_at: datetime
    placement_history: Optional[List[PlacementHistoryOut]] = []
    class Config:
        from_attributes = True

class ArchiveRequest(BaseModel):
    reason: str
    note: Optional[str] = None

# Job Description
class JobDescriptionBase(BaseModel):
    company_name: str
    raw_text: str
    extracted_role: Optional[str] = None
    required_skills: Optional[str] = None
    qualifications: Optional[str] = None
    experience: Optional[str] = None
    responsibilities: Optional[str] = None

class JobDescriptionCreate(BaseModel):
    company_name: str
    raw_text: Optional[str] = None
    extracted_role: Optional[str] = None
    required_skills: Optional[List[str]] = None
    qualifications: Optional[str] = None
    experience: Optional[str] = None
    responsibilities: Optional[str] = None

class JobDescriptionOut(BaseModel):
    id: int
    company_name: str
    file_name: Optional[str] = None
    raw_text: str
    extracted_role: Optional[str] = None
    required_skills: Optional[str] = None
    qualifications: Optional[str] = None
    experience: Optional[str] = None
    responsibilities: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# Company Leads & Follow-ups
class FollowUpBase(BaseModel):
    notes: str
    follow_up_date: str
    next_step: Optional[str] = None

class FollowUpCreate(FollowUpBase):
    lead_id: int
    team_member_id: int

class FollowUpOut(FollowUpBase):
    id: int
    lead_id: int
    team_member_id: int
    team_member_name: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class CompanyLeadBase(BaseModel):
    company_name: str
    location: str
    poc_name: str
    poc_email: str
    poc_phone: str
    team_member_id: int
    tier: str = "Tier 2"
    ctc: float
    role: str
    status: str = "Cold" # Cold, Warm, Hot, Placement Completed
    approval_status: str = "Draft" # Draft, Pending Approval, Approved, Rejected
    drive_date: Optional[str] = None

class CompanyLeadCreate(CompanyLeadBase):
    jd_id: Optional[int] = None

class CompanyLeadUpdate(BaseModel):
    company_name: Optional[str] = None
    location: Optional[str] = None
    poc_name: Optional[str] = None
    poc_email: Optional[str] = None
    poc_phone: Optional[str] = None
    team_member_id: Optional[int] = None
    tier: Optional[str] = None
    ctc: Optional[float] = None
    role: Optional[str] = None
    status: Optional[str] = None
    approval_status: Optional[str] = None
    drive_date: Optional[str] = None
    jd_id: Optional[int] = None

class CompanyLeadOut(CompanyLeadBase):
    id: int
    jd_id: Optional[int] = None
    team_member_name: Optional[str] = None
    jd_file_name: Optional[str] = None
    created_at: datetime
    follow_ups: List[FollowUpOut] = []
    class Config:
        from_attributes = True

# Company
class CompanyOut(BaseModel):
    id: int
    name: str
    location: str
    tier: str
    role: str
    ctc: float
    drive_date: Optional[str] = None
    status: str
    offers_count: int
    team_member_id: int
    team_member_name: Optional[str] = None
    lead_id: Optional[int] = None
    jd_id: Optional[int] = None
    created_at: datetime
    class Config:
        from_attributes = True

# Placement Completion
class PlacementCompletionRequest(BaseModel):
    company_id: int
    drive_date: str
    role: str
    ctc: float
    number_of_offers: int
    selected_student_ids: List[int]

# Resume Matching
class ResumeMatchResult(BaseModel):
    student_id: int
    student_name: str
    reg_no: str
    dept: str
    course: str
    placement_status: str
    ats_score: float
    category: str # 'O', 'S', 'A', 'B', 'D'
    matched_skills: List[str]
    missing_skills: List[str]
    resume_url: Optional[str] = None
    resume_snippet: Optional[str] = None

class CompanyMatchingDashboardOut(BaseModel):
    company_id: Optional[int] = None
    company_name: str
    role: str
    jd_id: int
    required_skills: List[str]
    total_evaluated: int
    matching_students_count: int
    category_counts: Dict[str, int]
    ranked_students: List[ResumeMatchResult]

# Dashboard Stats
class KPICards(BaseModel):
    total_students: int
    placed_students: int
    unplaced_students: int
    total_companies: int
    completed_drives: int
    total_offers: int
    placement_percentage: float
    average_ctc: float

class DeptAnalytics(BaseModel):
    dept: str
    total_students: int
    placed_students: int
    unplaced_students: int
    placement_percentage: float

class PipelineStageCount(BaseModel):
    stage: str
    count: int
    companies: List[str]

class RecentActivityOut(BaseModel):
    id: int
    activity_type: str
    title: str
    description: str
    created_at: datetime
    class Config:
        from_attributes = True

class TeamPerformanceOut(BaseModel):
    team_member_id: int
    team_member_name: str
    assigned_companies: int
    cold_leads: int
    warm_leads: int
    hot_leads: int
    completed_drives: int
    follow_ups: int
    total_offers: int
    overall_contribution: int

class DashboardDataOut(BaseModel):
    kpis: KPICards
    department_analytics: List[DeptAnalytics]
    company_pipeline: List[PipelineStageCount]
    recent_activities: List[RecentActivityOut]
    team_performance: List[TeamPerformanceOut] = []
