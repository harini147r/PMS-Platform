import sys
import os
import math
import json
from pathlib import Path

# Ensure backend directory is in sys.path for direct script execution
CURRENT_FILE = Path(__file__).resolve()
BACKEND_DIR = CURRENT_FILE.parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import pandas as pd
from app.database import SessionLocal, engine, Base
from app.models import (
    User, PlacementTeamMember, Student, JobDescription,
    CompanyLead, Company, Placement, ActivityLog, FollowUp
)

def get_data_dir() -> Path:
    """Dynamically locates the /data directory containing source Excel files."""
    project_root = BACKEND_DIR.parent             # .../ (Placement Management System root)
    
    candidates = [
        project_root / "data",
        BACKEND_DIR / "data",
        Path.cwd() / "data",
        Path.cwd().parent / "data",
    ]
    
    for candidate in candidates:
        if candidate.exists() and (candidate / "100_Students_List.xlsx").exists():
            return candidate.resolve()
            
    searched_paths = "\n  - " + "\n  - ".join(str(c) for c in candidates)
    raise FileNotFoundError(
        f"Could not locate the 'data' directory containing '100_Students_List.xlsx'.\n"
        f"Searched paths:{searched_paths}"
    )

def seed_database():
    # 1. Recreate tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    print("Populating database with Rathinam College data...")

    # Locate data directory dynamically
    data_dir = get_data_dir()
    excel_students_path = data_dir / "100_Students_List.xlsx"
    excel_companies_path = data_dir / "Companies_List.xlsx"
    
    if not excel_students_path.exists():
        raise FileNotFoundError(f"Student data file missing at: {excel_students_path}")
    if not excel_companies_path.exists():
        raise FileNotFoundError(f"Companies data file missing at: {excel_companies_path}")

    print(f"Loading source data from: {data_dir}")

    # 2. Setup the Rathinam Access Hierarchy Users & Team Members
    team_data = [
        {
            "name": "Dr. Sivasubramaniam",
            "email": "admin@college.edu",
            "password": "admin123",
            "phone": "+91 98765 11111",
            "designation": "Head of Placement",
            "role": "admin",
            "perms": { "can_manage_leads": True, "can_upload_jd": True, "can_complete_drives": True, "can_manage_students": True, "can_view_reports": True }
        },
        {
            "name": "Dr. Jeyakannan",
            "email": "manager@college.edu",
            "password": "manager123",
            "phone": "+91 98765 22222",
            "designation": "Placement Manager",
            "role": "manager",
            "perms": { "can_manage_leads": False, "can_upload_jd": False, "can_complete_drives": False, "can_manage_students": True, "can_view_reports": True }
        },
        {
            "name": "Team Member 1",
            "email": "team1@college.edu",
            "password": "team123",
            "phone": "+91 98765 33301",
            "designation": "Placement Officer - Tier 1 Accounts",
            "role": "team_member",
            "perms": { "can_manage_leads": True, "can_upload_jd": True, "can_complete_drives": True, "can_manage_students": False, "can_view_reports": True }
        },
        {
            "name": "Team Member 2",
            "email": "team2@college.edu",
            "password": "team123",
            "phone": "+91 98765 33302",
            "designation": "Placement Officer - IT & CS",
            "role": "team_member",
            "perms": { "can_manage_leads": True, "can_upload_jd": True, "can_complete_drives": True, "can_manage_students": False, "can_view_reports": True }
        },
        {
            "name": "Team Member 3",
            "email": "team3@college.edu",
            "password": "team123",
            "phone": "+91 98765 33303",
            "designation": "Placement Officer - Engineering & Core",
            "role": "team_member",
            "perms": { "can_manage_leads": True, "can_upload_jd": True, "can_complete_drives": True, "can_manage_students": False, "can_view_reports": True }
        },
        {
            "name": "Team Member 4",
            "email": "team4@college.edu",
            "password": "team123",
            "phone": "+91 98765 33304",
            "designation": "Placement Coordinator - MBA",
            "role": "team_member",
            "perms": { "can_manage_leads": True, "can_upload_jd": True, "can_complete_drives": True, "can_manage_students": False, "can_view_reports": True }
        }
    ]

    team_members = {}
    user_objects = []
    
    for idx, td in enumerate(team_data):
        tm = PlacementTeamMember(
            name=td["name"],
            email=td["email"],
            phone=td["phone"],
            designation=td["designation"]
        )
        db.add(tm)
        db.flush()
        team_members[td["name"]] = tm
        
        u = User(
            name=td["name"],
            email=td["email"],
            password=td["password"],
            role=td["role"],
            is_active=True,
            team_member_id=tm.id,
            **td["perms"]
        )
        db.add(u)
        user_objects.append(u)

    print("Created users and placement team members.")

    # 3. Import Students from 100_Students_List.xlsx (header=3)
    df_students = pd.read_excel(excel_students_path, sheet_name="Students Directory (100)", header=3)
    
    # Clean trailing empty rows or header residues
    df_students = df_students[df_students["Roll No"].notna() & (df_students["Roll No"].astype(str).str.strip() != "")]
    
    student_map = {}
    for _, row in df_students.iterrows():
        reg_no = str(row["Roll No"]).strip()
        
        # Parse hosteller
        stype = str(row.get("Student Type", "Day Scholar")).strip().lower()
        is_hostel = "hostel" in stype or stype == "yes" or stype == "1"
        
        # Clean numeric percentages
        sslc = float(row.get("SSLC %", 0.0))
        hsc = float(row.get("HSC %", 0.0))
        ug = float(row.get("UG %", 0.0))
        
        pg_val = row.get("PG %")
        pg = None
        if pd.notna(pg_val):
            try:
                pg = float(pg_val)
            except:
                pg = None
                
        email = str(row.get("Personal Email ID", row.get("College Email ID", f"{reg_no.lower()}@college.edu"))).strip()
        phone = str(row.get("Mobile No", "+91 98765 00000")).strip()
        
        student = Student(
            reg_no=reg_no,
            name=str(row["Name"]).strip(),
            dept=str(row["Department"]).strip(),
            course=str(row.get("Course", "B.Tech")).strip(),
            gender=str(row.get("Gender", "Male")).strip(),
            is_hosteller=is_hostel,
            sslc_pct=sslc,
            hsc_pct=hsc,
            ug_pct=ug,
            pg_pct=pg,
            github_url=str(row.get("GitHub ID", "")) if pd.notna(row.get("GitHub ID")) else None,
            linkedin_url=str(row.get("LinkedIn ID", "")) if pd.notna(row.get("LinkedIn ID")) else None,
            resume_url=str(row.get("Resume Link", "")) if pd.notna(row.get("Resume Link")) else None,
            intro_video_url=str(row.get("Self Introduction Video Link", "")) if pd.notna(row.get("Self Introduction Video Link")) else None,
            photo_url=str(row.get("Student Photo", "")) if pd.notna(row.get("Student Photo")) else None,
            grad_year=2026,
            portfolio_url=str(row.get("Portfolio", "")) if pd.notna(row.get("Portfolio")) else None,
            email=email,
            phone=phone,
            placement_status="Unplaced", # Will update this when mapping placement history
            is_archived=False
        )
        db.add(student)
        db.flush()
        student_map[reg_no] = student

    print(f"Imported {len(student_map)} students.")

    # 4. Import Companies & JDs from Companies_List.xlsx (header=3)
    df_companies = pd.read_excel(excel_companies_path, sheet_name="Companies & Job Drives", header=3)
    
    # Filter out empty or overall average rows
    df_companies = df_companies[
        df_companies["Company Name"].notna() & 
        (df_companies["Company Name"].astype(str).str.strip() != "") & 
        (~df_companies["Company Name"].astype(str).str.contains("Overall", case=False))
    ]
    
    company_map = {}
    company_leads = {}
    
    # Keep list of team members to rotate assignments
    tm_list = [team_members["Team Member 1"], team_members["Team Member 2"], team_members["Team Member 3"], team_members["Team Member 4"]]
    
    for idx, (_, row) in enumerate(df_companies.iterrows()):
        comp_name = str(row["Company Name"]).strip()
        role = str(row["Job Title / Role"]).strip()
        ctc = float(row["CTC (LPA)"])
        loc = str(row["Location"]).strip()
        
        # Create Job Description record
        jd_summary = str(row.get("Job Description Summary", f"Core hiring for {role} role.")).strip()
        jd_pdf = str(row.get("JD PDF Link (Rendering)", "")).strip()
        careers = str(row.get("Official Careers Link", "")).strip()
        
        # Attempt to parse skills out of summary or use defaults
        default_skills = ["Data Structures", "Algorithms", "Problem Solving"]
        if "python" in jd_summary.lower(): default_skills.append("Python")
        if "java" in jd_summary.lower(): default_skills.append("Java")
        if "sql" in jd_summary.lower(): default_skills.append("SQL")
        if "cloud" in jd_summary.lower() or "azure" in jd_summary.lower() or "aws" in jd_summary.lower(): default_skills.append("Cloud Computing")
        
        jd = JobDescription(
            company_name=comp_name,
            file_name=os.path.basename(jd_pdf) if jd_pdf else f"{comp_name.lower().replace(' ', '_')}_jd.pdf",
            file_path=jd_pdf if jd_pdf else f"uploads/{comp_name.lower().replace(' ', '_')}_jd.pdf",
            raw_text=jd_summary,
            extracted_role=role,
            required_skills=json.dumps(default_skills),
            qualifications="B.Tech / B.E / MCA / MBA with good academic standing",
            experience="Freshers (2026 Batch)",
            responsibilities=jd_summary
        )
        db.add(jd)
        db.flush()
        
        # Evenly assign to one of the 4 team members
        assigned_tm = tm_list[idx % len(tm_list)]
        
        # Map Opportunity Status
        opp_status = str(row.get("Opportunity Status", "Warm")).strip()
        if opp_status == "DRIVE_COMPLETED":
            opp_status = "Placement Completed"
        elif opp_status not in ["Cold", "Warm", "Hot", "Placement Completed"]:
            opp_status = "Warm"
            
        # Map Job Status to Lead Approval status
        job_status = str(row.get("Job Status", "APPROVED")).strip()
        approval_status = "Approved"
        if job_status == "PENDING_APPROVAL":
            approval_status = "Pending Approval"
            
        # Create Company Lead
        lead = CompanyLead(
            company_name=comp_name,
            location=loc,
            poc_name="Campus Recruiter",
            poc_email=str(row.get("Contact Email", f"recruitment@{comp_name.lower().replace(' ', '')}.com")).strip(),
            poc_phone=str(row.get("Contact Mobile", "+91 98765 00000")).strip(),
            team_member_id=assigned_tm.id,
            tier="Tier 1" if ctc >= 15.0 else ("Tier 2" if ctc >= 6.0 else "Tier 3"),
            ctc=ctc,
            role=role,
            status=opp_status,
            approval_status=approval_status,
            drive_date="2026-08-15",
            jd_id=jd.id
        )
        db.add(lead)
        db.flush()
        company_leads[comp_name] = lead
        
        # Create Company (approved drives)
        comp = Company(
            name=comp_name,
            location=loc,
            tier=lead.tier,
            role=role,
            ctc=ctc,
            drive_date="2026-08-15",
            status="Placement Completed" if opp_status == "Placement Completed" else "Approved",
            offers_count=0, # Will update based on placements
            team_member_id=assigned_tm.id,
            lead_id=lead.id,
            jd_id=jd.id
        )
        db.add(comp)
        db.flush()
        company_map[comp_name] = comp

        # Log follow up for context
        fu = FollowUp(
            lead_id=lead.id,
            team_member_id=assigned_tm.id,
            notes=f"Discussed hiring requirements for {role} at {ctc} LPA with point of contact.",
            follow_up_date="2026-08-10",
            next_step="Coordinate online assessment schedule."
        )
        db.add(fu)

    print(f"Imported {len(company_map)} companies & job descriptions.")

    # 5. Import Placements from 100_Students_List.xlsx sheet 'Placements & Drives (100)'
    df_placements = pd.read_excel(excel_students_path, sheet_name="Placements & Drives (100)", header=3)
    df_placements = df_placements[
        df_placements["Roll No"].notna() & 
        (df_placements["Roll No"].astype(str).str.strip() != "") & 
        (~df_placements["Roll No"].astype(str).str.contains("Average", case=False))
    ]
    
    placements_count = 0
    company_offers_map = {}
    
    for _, row in df_placements.iterrows():
        reg_no = str(row["Roll No"]).strip()
        p_status = str(row.get("Placement Status", "YET_TO_BE_PLACED")).strip()
        
        student = student_map.get(reg_no)
        if not student:
            continue
            
        if p_status == "PLACED":
            student.placement_status = "Placed"
            
            comp_placed = str(row.get("Company Placed", "")).strip()
            # Match company name with mapped companies
            company = company_map.get(comp_placed)
            if not company:
                # Fallback: find key containing name
                for k in company_map.keys():
                    if k.lower() in comp_placed.lower() or comp_placed.lower() in k.lower():
                        company = company_map[k]
                        break
            
            if company:
                p = Placement(
                    student_id=student.id,
                    company_id=company.id,
                    drive_date=str(row.get("Placement Date", "2026-08-15")).strip(),
                    role=str(row.get("Role Offered", company.role)).strip(),
                    ctc=float(row.get("Package CTC (LPA)", company.ctc))
                )
                db.add(p)
                placements_count += 1
                company_offers_map[company.id] = company_offers_map.get(company.id, 0) + 1
            else:
                print(f"Warning: Could not resolve company placement for {comp_placed}")
        else:
            student.placement_status = "Unplaced"
            
    # Update offers count in companies
    for comp_id, offers in company_offers_map.items():
        comp = db.query(Company).filter(Company.id == comp_id).first()
        if comp:
            comp.offers_count = offers
            if comp.lead:
                comp.lead.status = "Placement Completed"

    # 6. Seed initial audit log activities
    activities = [
        {"type": "PLACEMENT_COMPLETED", "title": "Placement Master Seeded", "desc": f"Successfully imported {len(student_map)} students and {len(company_map)} company drives."},
        {"type": "USER_CREATED", "title": "Access Hierarchy Initiated", "desc": "Dr. Sivasubramaniam (Admin) and Dr. Jeyakannan (Manager) accounts provisioned successfully."}
    ]
    for act in activities:
        a = ActivityLog(activity_type=act["type"], title=act["title"], description=act["desc"])
        db.add(a)
        
    db.commit()
    
    # 7. Print Seed Validation Summary
    print("\n==============================================")
    print("SUCCESS: SEED COMPLETED - DATA VALIDATION SUMMARY:")
    print("==============================================")
    print(f"Total Users Created:        {db.query(User).count()}")
    print(f"Total Students Imported:    {db.query(Student).count()}")
    print(f"Total Placed Students:      {db.query(Student).filter(Student.placement_status == 'Placed').count()}")
    print(f"Total Unplaced Students:    {db.query(Student).filter(Student.placement_status == 'Unplaced').count()}")
    print(f"Total Companies Imported:   {db.query(Company).count()}")
    print(f"Total Placements Recorded:  {db.query(Placement).count()}")
    print("==============================================")
    
    db.close()

if __name__ == "__main__":
    seed_database()
