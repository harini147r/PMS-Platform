from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Company, JobDescription, Student, User
from app.schemas import CompanyMatchingDashboardOut, ResumeMatchResult
from app.services.matching import calculate_ats_score
from app.services.extractor import extract_text_from_url
from app.auth_deps import get_current_user, require_team_member_or_admin
import json
from typing import List, Optional

router = APIRouter(prefix="/matching", tags=["Resume-JD Matching"])

@router.get("/company/{company_id}", response_model=CompanyMatchingDashboardOut)
async def get_company_matching_dashboard(
    company_id: int,
    dept: Optional[str] = None,
    category: Optional[str] = None,
    current_user: User = Depends(require_team_member_or_admin),
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Team member can only match for their assigned company
    if current_user.role == "team_member" and company.team_member_id != current_user.team_member_id:
        raise HTTPException(
            status_code=403,
            detail="Access Denied: You can only view candidate matching for your assigned company."
        )

    jd = company.jd
    if not jd and company.lead and company.lead.jd:
        jd = company.lead.jd
        
    if not jd:
        jd = db.query(JobDescription).filter(JobDescription.company_name.ilike(f"%{company.name}%")).first()

    if not jd:
        default_skills = ["Data Structures", "Algorithms", "Python", "Java", "SQL", "Problem Solving", "System Design"]
        raw_text = f"Company: {company.name}\nRole: {company.role}\nTier: {company.tier}\nPackage: {company.ctc} LPA.\nRequired Skills: {', '.join(default_skills)}.\nEligibility: B.Tech / B.E / MCA with minimum 65% aggregate."
        jd = JobDescription(
            company_name=company.name,
            file_name=f"{company.name.lower().replace(' ', '_')}_jd.txt",
            raw_text=raw_text,
            extracted_role=company.role,
            required_skills=json.dumps(default_skills),
            qualifications="B.Tech / B.E / MCA with minimum 65% aggregate.",
            experience="Freshers (2026 Batch)",
            responsibilities=f"Design, build and maintain software solutions for {company.name} as a {company.role}."
        )
        db.add(jd)
        db.flush()
        company.jd_id = jd.id
        db.commit()

    required_skills = []
    if jd.required_skills:
        try:
            required_skills = json.loads(jd.required_skills)
        except:
            required_skills = [s.strip() for s in jd.required_skills.split(",") if s.strip()]
    if not required_skills:
        required_skills = ["Data Structures", "Algorithms", "Java", "Python", "SQL", "Problem Solving"]

    student_query = db.query(Student).filter(Student.is_archived == False)
    if dept and dept != "All":
        student_query = student_query.filter(Student.dept == dept)

    students = student_query.all()

    ranked_results: List[ResumeMatchResult] = []
    cat_counts = {"O": 0, "S": 0, "A": 0, "B": 0, "D": 0}

    for s in students:
        resume_content = s.resume_text or ""
        if not resume_content and s.resume_url:
            resume_content = await extract_text_from_url(s.resume_url)
            if resume_content:
                s.resume_text = resume_content

        if not resume_content:
            resume_content = f"Candidate: {s.name}, Dept: {s.dept}, Course: {s.course}. Academic Score: {s.ug_pct}% UG. Core skills: Data Structures, Algorithms, {s.dept} Engineering fundamentals."

        score, cat, matched, missing = calculate_ats_score(
            jd_text=jd.raw_text,
            jd_skills=required_skills,
            resume_text=resume_content,
            student_dept=s.dept,
            student_ug=s.ug_pct
        )

        cat_counts[cat] = cat_counts.get(cat, 0) + 1

        if not category or category == "All" or cat == category:
            snippet = resume_content[:200] + "..." if len(resume_content) > 200 else resume_content
            ranked_results.append(ResumeMatchResult(
                student_id=s.id,
                student_name=s.name,
                reg_no=s.reg_no,
                dept=s.dept,
                course=s.course,
                placement_status=s.placement_status,
                ats_score=score,
                category=cat,
                matched_skills=matched,
                missing_skills=missing,
                resume_url=s.resume_url,
                resume_snippet=snippet
            ))

    ranked_results.sort(key=lambda x: x.ats_score, reverse=True)
    matching_count = sum(cat_counts[c] for c in ["O", "S", "A"])

    return CompanyMatchingDashboardOut(
        company_id=company.id,
        company_name=company.name,
        role=company.role,
        jd_id=jd.id,
        required_skills=required_skills,
        total_evaluated=len(students),
        matching_students_count=matching_count,
        category_counts=cat_counts,
        ranked_students=ranked_results
    )
