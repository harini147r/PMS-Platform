from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password = Column(String(200), nullable=False, default="password123")
    role = Column(String(50), nullable=False, default="admin") # 'admin', 'team_member', 'manager'
    is_active = Column(Boolean, default=True)
    team_member_id = Column(Integer, ForeignKey("placement_team_members.id"), nullable=True)
    
    # Granular Access Controls
    can_manage_leads = Column(Boolean, default=True)
    can_upload_jd = Column(Boolean, default=True)
    can_complete_drives = Column(Boolean, default=True)
    can_manage_students = Column(Boolean, default=True)
    can_view_reports = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    team_member = relationship("PlacementTeamMember", back_populates="user", uselist=False)

class PlacementTeamMember(Base):
    __tablename__ = "placement_team_members"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    phone = Column(String(30), nullable=False)
    designation = Column(String(100), default="Placement Officer")
    
    user = relationship("User", back_populates="team_member", uselist=False)
    leads = relationship("CompanyLead", back_populates="team_member")
    follow_ups = relationship("FollowUp", back_populates="team_member")

class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    reg_no = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    dept = Column(String(100), nullable=False)
    course = Column(String(50), nullable=False, default="B.Tech")
    gender = Column(String(20), nullable=False)
    is_hosteller = Column(Boolean, default=False)
    sslc_pct = Column(Float, nullable=False)
    hsc_pct = Column(Float, nullable=False)
    ug_pct = Column(Float, nullable=False)
    pg_pct = Column(Float, nullable=True)
    github_url = Column(String(255), nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    resume_url = Column(String(500), nullable=True)
    resume_text = Column(Text, nullable=True)
    intro_video_url = Column(String(255), nullable=True)
    photo_url = Column(String(255), nullable=True)
    grad_year = Column(Integer, nullable=False, default=2026)
    portfolio_url = Column(String(255), nullable=True)
    email = Column(String(150), unique=True, nullable=False)
    phone = Column(String(30), nullable=False)
    placement_status = Column(String(50), default="Unplaced")
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    placements = relationship("Placement", back_populates="student")
    archive_records = relationship("ArchiveRecord", back_populates="student")

class ArchiveRecord(Base):
    __tablename__ = "archive_records"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    reason = Column(String(255), nullable=False)
    note = Column(Text, nullable=True)
    archived_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="archive_records")

class JobDescription(Base):
    __tablename__ = "job_descriptions"
    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(150), nullable=False)
    file_name = Column(String(255), nullable=True)
    file_path = Column(String(500), nullable=True)
    raw_text = Column(Text, nullable=False)
    extracted_role = Column(String(150), nullable=True)
    required_skills = Column(Text, nullable=True)
    qualifications = Column(Text, nullable=True)
    experience = Column(String(100), nullable=True)
    responsibilities = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class CompanyLead(Base):
    __tablename__ = "company_leads"
    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(150), nullable=False)
    location = Column(String(150), nullable=False)
    poc_name = Column(String(100), nullable=False)
    poc_email = Column(String(150), nullable=False)
    poc_phone = Column(String(30), nullable=False)
    team_member_id = Column(Integer, ForeignKey("placement_team_members.id"), nullable=False)
    tier = Column(String(50), nullable=False, default="Tier 2")
    ctc = Column(Float, nullable=False)
    role = Column(String(100), nullable=False)
    status = Column(String(50), default="Cold")
    approval_status = Column(String(50), default="Draft")
    drive_date = Column(String(50), nullable=True)
    jd_id = Column(Integer, ForeignKey("job_descriptions.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    team_member = relationship("PlacementTeamMember", back_populates="leads")
    jd = relationship("JobDescription")
    follow_ups = relationship("FollowUp", back_populates="lead", cascade="all, delete-orphan")
    company = relationship("Company", back_populates="lead", uselist=False)

class FollowUp(Base):
    __tablename__ = "follow_ups"
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("company_leads.id"), nullable=False)
    team_member_id = Column(Integer, ForeignKey("placement_team_members.id"), nullable=False)
    notes = Column(Text, nullable=False)
    follow_up_date = Column(String(50), nullable=False)
    next_step = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    lead = relationship("CompanyLead", back_populates="follow_ups")
    team_member = relationship("PlacementTeamMember", back_populates="follow_ups")

class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    location = Column(String(150), nullable=False)
    tier = Column(String(50), nullable=False, default="Tier 2")
    role = Column(String(100), nullable=False)
    ctc = Column(Float, nullable=False)
    drive_date = Column(String(50), nullable=True)
    status = Column(String(50), default="Approved")
    offers_count = Column(Integer, default=0)
    team_member_id = Column(Integer, ForeignKey("placement_team_members.id"), nullable=False)
    lead_id = Column(Integer, ForeignKey("company_leads.id"), nullable=True)
    jd_id = Column(Integer, ForeignKey("job_descriptions.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    lead = relationship("CompanyLead", back_populates="company")
    jd = relationship("JobDescription")
    team_member = relationship("PlacementTeamMember")
    placements = relationship("Placement", back_populates="company")
    registrations = relationship("StudentCompanyRegistration", back_populates="company")

class StudentCompanyRegistration(Base):
    __tablename__ = "student_company_registrations"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    registered_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="Registered")

    student = relationship("Student")
    company = relationship("Company", back_populates="registrations")

class Placement(Base):
    __tablename__ = "placements"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    drive_date = Column(String(50), nullable=False)
    role = Column(String(100), nullable=False)
    ctc = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="placements")
    company = relationship("Company", back_populates="placements")

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(Integer, primary_key=True, index=True)
    activity_type = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
