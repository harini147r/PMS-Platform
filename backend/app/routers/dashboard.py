from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Student, Company, CompanyLead, Placement, ActivityLog, User, PlacementTeamMember, FollowUp
from app.schemas import DashboardDataOut, KPICards, DeptAnalytics, PipelineStageCount, RecentActivityOut, TeamPerformanceOut
from app.auth_deps import get_current_user
from typing import List

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardDataOut)
def get_dashboard_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role = (current_user.role or "").lower()
    tm_id = current_user.team_member_id

    # 1. KPIs
    total_students = db.query(Student).filter(Student.is_archived == False).count()
    placed_students = db.query(Student).filter(Student.is_archived == False, Student.placement_status == "Placed").count()
    unplaced_students = total_students - placed_students
    
    if role == "team_member" and tm_id:
        total_companies = db.query(Company).filter(Company.team_member_id == tm_id).count()
        completed_drives = db.query(Company).filter(Company.team_member_id == tm_id, Company.status == "Placement Completed").count()
        total_offers = db.query(func.coalesce(func.sum(Company.offers_count), 0)).filter(Company.team_member_id == tm_id).scalar() or 0
        avg_ctc_query = db.query(func.coalesce(func.avg(Placement.ctc), 0.0)).join(Company).filter(Company.team_member_id == tm_id).scalar()
        avg_ctc = round(float(avg_ctc_query or 0.0), 2)
    else:
        total_companies = db.query(Company).count()
        completed_drives = db.query(Company).filter(Company.status == "Placement Completed").count()
        total_offers = db.query(func.coalesce(func.sum(Company.offers_count), 0)).scalar() or 0
        avg_ctc_query = db.query(func.coalesce(func.avg(Placement.ctc), 0.0)).scalar()
        avg_ctc = round(float(avg_ctc_query or 0.0), 2)

    placement_percentage = round((placed_students / max(1, total_students)) * 100.0, 1)

    kpis = KPICards(
        total_students=total_students,
        placed_students=placed_students,
        unplaced_students=unplaced_students,
        total_companies=total_companies,
        completed_drives=completed_drives,
        total_offers=int(total_offers),
        placement_percentage=placement_percentage,
        average_ctc=avg_ctc
    )

    # 2. Department Analytics
    departments = ["CSE", "IT", "ECE", "EEE", "MECH", "MBA"]
    dept_analytics: List[DeptAnalytics] = []
    
    for dept in departments:
        dept_total = db.query(Student).filter(Student.dept == dept, Student.is_archived == False).count()
        dept_placed = db.query(Student).filter(Student.dept == dept, Student.placement_status == "Placed", Student.is_archived == False).count()
        dept_unplaced = dept_total - dept_placed
        dept_pct = round((dept_placed / max(1, dept_total)) * 100.0, 1) if dept_total > 0 else 0.0
        
        dept_analytics.append(DeptAnalytics(
            dept=dept,
            total_students=dept_total,
            placed_students=dept_placed,
            unplaced_students=dept_unplaced,
            placement_percentage=dept_pct
        ))

    # 3. Company Pipeline
    stages = ["Cold", "Warm", "Hot", "Placement Completed"]
    pipeline: List[PipelineStageCount] = []
    
    if role != "manager":
        for stage in stages:
            query = db.query(CompanyLead).filter(CompanyLead.status == stage)
            if role == "team_member" and tm_id:
                query = query.filter(CompanyLead.team_member_id == tm_id)
            leads = query.all()
            company_names = [l.company_name for l in leads]
            pipeline.append(PipelineStageCount(
                stage=stage,
                count=len(leads),
                companies=company_names
            ))

    # 4. Recent Activities
    activities = db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(10).all()

    team_performance: List[TeamPerformanceOut] = []
    if role in ["admin", "manager"]:
        team_users = db.query(User).filter(func.lower(User.role) == "team_member").order_by(User.name.asc()).all()
        for team_user in team_users:
            member = team_user.team_member
            member_id = member.id if member else None
            lead_query = db.query(CompanyLead).filter(CompanyLead.team_member_id == member_id) if member_id else db.query(CompanyLead).filter(False)
            assigned = lead_query.count()
            cold = lead_query.filter(CompanyLead.status == "Cold").count()
            warm = lead_query.filter(CompanyLead.status == "Warm").count()
            hot = lead_query.filter(CompanyLead.status == "Hot").count()
            completed = lead_query.filter(CompanyLead.status == "Placement Completed").count()
            follow_ups = db.query(FollowUp).filter(FollowUp.team_member_id == member_id).count() if member_id else 0
            total_offers = 0
            if member_id:
                total_offers = db.query(func.coalesce(func.sum(Company.offers_count), 0)).filter(
                    Company.team_member_id == member_id
                ).scalar() or 0
            team_performance.append(TeamPerformanceOut(
                team_member_id=member_id or team_user.id,
                team_member_name=member.name if member else team_user.name,
                assigned_companies=assigned,
                cold_leads=cold,
                warm_leads=warm,
                hot_leads=hot,
                completed_drives=completed,
                follow_ups=follow_ups,
                total_offers=int(total_offers),
                overall_contribution=assigned + follow_ups + completed + int(total_offers)
            ))
    
    return DashboardDataOut(
        kpis=kpis,
        department_analytics=dept_analytics,
        company_pipeline=pipeline,
        recent_activities=activities,
        team_performance=team_performance
    )
