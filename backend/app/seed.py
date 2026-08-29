import json
import random
from app.database import SessionLocal, engine, Base
from app.models import (
    User, PlacementTeamMember, Student, JobDescription,
    CompanyLead, Company, Placement, FollowUp, ActivityLog
)

def seed_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("Seeding database with realistic placement ecosystem & 3 user logins...")

    # 1. 3 Standard User Accounts & Team Members
    team_data = [
        {
            "name": "Dr. Rajesh Kumar", 
            "email": "admin@college.edu", 
            "password": "admin123",
            "phone": "+91 98765 43210", 
            "designation": "Head of Placement", 
            "role": "admin",
            "perms": { "can_manage_leads": True, "can_upload_jd": True, "can_complete_drives": True, "can_manage_students": True, "can_view_reports": True }
        },
        {
            "name": "Dr. Meenakshi Sundaram", 
            "email": "manager@college.edu", 
            "password": "manager123",
            "phone": "+91 94432 55667", 
            "designation": "Placement Manager & Student Dean", 
            "role": "manager",
            "perms": { "can_manage_leads": False, "can_upload_jd": False, "can_complete_drives": False, "can_manage_students": True, "can_view_reports": True }
        },
        {
            "name": "Prof. Ananya Sen", 
            "email": "team@college.edu", 
            "password": "team123",
            "phone": "+91 98450 11223", 
            "designation": "Senior Placement Officer", 
            "role": "team_member",
            "perms": { "can_manage_leads": True, "can_upload_jd": True, "can_complete_drives": True, "can_manage_students": False, "can_view_reports": True }
        },
        {
            "name": "Prof. Karthik Rao", 
            "email": "karthik.rao@college.edu", 
            "password": "team123",
            "phone": "+91 97412 33445", 
            "designation": "Placement Coordinator (Tech)", 
            "role": "team_member",
            "perms": { "can_manage_leads": True, "can_upload_jd": True, "can_complete_drives": True, "can_manage_students": False, "can_view_reports": True }
        }
    ]

    team_members = []
    for td in team_data:
        tm = PlacementTeamMember(
            name=td["name"],
            email=td["email"],
            phone=td["phone"],
            designation=td["designation"]
        )
        db.add(tm)
        db.flush()
        team_members.append(tm)

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

    # 2. Sample Job Descriptions
    jds_raw = [
        {
            "company_name": "Google Cloud",
            "role": "Cloud Software Engineer",
            "skills": ["Python", "Golang", "Kubernetes", "Docker", "GCP", "Distributed Systems", "Data Structures", "Algorithms", "Linux"],
            "exp": "0 - 1 Years",
            "qual": "B.Tech / M.Tech in CSE / IT with minimum 75% aggregate",
            "resp": "Design and build scalable cloud-native microservices, automate distributed deployment pipelines, and optimize containerized workloads.",
            "text": "Google Cloud is hiring Cloud Software Engineers. Qualifications: B.Tech / M.Tech in CSE / IT with minimum 75% aggregate. Required Skills: Python, Golang, Kubernetes, Docker, GCP, Distributed Systems, Data Structures, Algorithms, Linux. Responsibilities: Design and build scalable cloud-native microservices, automate distributed deployment pipelines, and optimize containerized workloads."
        },
        {
            "company_name": "Microsoft",
            "role": "Software Development Engineer (SDE 1)",
            "skills": ["C++", "C#", "Data Structures", "Algorithms", "System Design", "Azure", "SQL", "OOPs", "Multithreading"],
            "exp": "0 - 2 Years",
            "qual": "B.Tech / B.E in CSE, ECE, IT with minimum 70% aggregate",
            "resp": "Develop performant backend systems, write robust unit tests, design data structures, and participate in peer architecture reviews.",
            "text": "Microsoft SDE 1 Campus Drive. Qualifications: B.Tech / B.E in CSE, ECE, IT with minimum 70% aggregate. Required Skills: C++, C#, Data Structures, Algorithms, System Design, Azure, SQL, OOPs, Multithreading. Responsibilities: Develop performant backend systems, write robust unit tests, design data structures, and participate in peer architecture reviews."
        },
        {
            "company_name": "Amazon",
            "role": "Full Stack Developer",
            "skills": ["React", "JavaScript", "TypeScript", "Node.js", "Java", "AWS", "DynamoDB", "REST APIs", "Tailwind CSS"],
            "exp": "0 - 1 Years",
            "qual": "B.Tech / MCA with minimum 65% aggregate",
            "resp": "Build dynamic customer-facing web interfaces, develop resilient REST APIs, and integrate AWS cloud services.",
            "text": "Amazon Full Stack Developer Recruitment. Qualifications: B.Tech / MCA with minimum 65% aggregate. Required Skills: React, JavaScript, TypeScript, Node.js, Java, AWS, DynamoDB, REST APIs, Tailwind CSS. Responsibilities: Build dynamic customer-facing web interfaces, develop resilient REST APIs, and integrate AWS cloud services."
        },
        {
            "company_name": "Zoho Corporation",
            "role": "Product Developer",
            "skills": ["Java", "C", "Data Structures", "OOPs", "MySQL", "Web Technologies", "Problem Solving"],
            "exp": "Freshers (2026 Batch)",
            "qual": "Any Engineering Degree with no active backlogs",
            "resp": "Solve core algorithmic problems, design software modules for Zoho SaaS applications, and ensure high code quality.",
            "text": "Zoho Corporation Product Developer Hiring. Qualifications: Any Engineering Degree with no active backlogs. Required Skills: Java, C, Data Structures, OOPs, MySQL, Web Technologies, Problem Solving. Responsibilities: Solve core algorithmic problems, design software modules for Zoho SaaS applications, and ensure high code quality."
        }
    ]

    jd_objects = []
    for jd_info in jds_raw:
        jd = JobDescription(
            company_name=jd_info["company_name"],
            file_name=f"{jd_info['company_name'].lower().replace(' ', '_')}_jd.pdf",
            file_path=f"uploads/{jd_info['company_name'].lower().replace(' ', '_')}_jd.pdf",
            raw_text=jd_info["text"],
            extracted_role=jd_info["role"],
            required_skills=json.dumps(jd_info["skills"]),
            qualifications=jd_info["qual"],
            experience=jd_info["exp"],
            responsibilities=jd_info["resp"]
        )
        db.add(jd)
        db.flush()
        jd_objects.append(jd)

    # 3. Company Leads & Approved Companies
    leads_data = [
        {
            "name": "Google Cloud", "loc": "Bengaluru, Karnataka", "poc": "Sunil Verma",
            "email": "sunil.v@google.com", "phone": "+91 80 6721 8000",
            "tier": "Super Dream", "ctc": 32.0, "role": "Cloud Software Engineer",
            "status": "Hot", "approval": "Approved", "date": "2026-09-15", "jd_idx": 0, "tm_idx": 2
        },
        {
            "name": "Microsoft", "loc": "Hyderabad, Telangana", "poc": "Pooja Hegde",
            "email": "pooja.h@microsoft.com", "phone": "+91 40 6695 0000",
            "tier": "Super Dream", "ctc": 28.5, "role": "Software Development Engineer (SDE 1)",
            "status": "Placement Completed", "approval": "Approved", "date": "2026-08-10", "jd_idx": 1, "tm_idx": 3
        },
        {
            "name": "Amazon", "loc": "Chennai, Tamil Nadu", "poc": "Rahul Dravid",
            "email": "rahul.d@amazon.com", "phone": "+91 44 6700 1100",
            "tier": "Super Dream", "ctc": 24.0, "role": "Full Stack Developer",
            "status": "Warm", "approval": "Approved", "date": "2026-09-22", "jd_idx": 2, "tm_idx": 2
        },
        {
            "name": "Zoho Corporation", "loc": "Chennai, Tamil Nadu", "poc": "Kavitha Rangarajan",
            "email": "kavitha.r@zohocorp.com", "phone": "+91 44 6744 7070",
            "tier": "Dream", "ctc": 9.5, "role": "Product Developer",
            "status": "Placement Completed", "approval": "Approved", "date": "2026-08-01", "jd_idx": 3, "tm_idx": 3
        },
        {
            "name": "Qualcomm", "loc": "Bengaluru, Karnataka", "poc": "Naveen Reddy",
            "email": "nreddy@qualcomm.com", "phone": "+91 80 4015 1000",
            "tier": "Dream", "ctc": 16.0, "role": "Embedded Software Engineer",
            "status": "Hot", "approval": "Pending Approval", "date": "2026-09-28", "jd_idx": None, "tm_idx": 2
        },
        {
            "name": "Deloitte", "loc": "Hyderabad, Telangana", "poc": "Aakash Mehta",
            "email": "amehta@deloitte.com", "phone": "+91 40 7111 8800",
            "tier": "Tier 1", "ctc": 7.6, "role": "Technology Analyst",
            "status": "Warm", "approval": "Draft", "date": "2026-10-05", "jd_idx": None, "tm_idx": 3
        },
        {
            "name": "TCS Digital", "loc": "Chennai, Tamil Nadu", "poc": "Divya Krishnan",
            "email": "divya.k@tcs.com", "phone": "+91 44 6616 2222",
            "tier": "Tier 2", "ctc": 7.0, "role": "Digital Software Engineer",
            "status": "Cold", "approval": "Draft", "date": "2026-10-12", "jd_idx": None, "tm_idx": 2
        },
        {
            "name": "Infosys", "loc": "Bengaluru, Karnataka", "poc": "Ramesh Swamy",
            "email": "ramesh.s@infosys.com", "phone": "+91 80 2852 0261",
            "tier": "Tier 2", "ctc": 6.5, "role": "Systems Engineer Specialist",
            "status": "Cold", "approval": "Draft", "date": "2026-10-18", "jd_idx": None, "tm_idx": 3
        }
    ]

    company_lead_objs = []
    company_objs = []

    for ld in leads_data:
        jd_id = jd_objects[ld["jd_idx"]].id if ld["jd_idx"] is not None else None
        lead = CompanyLead(
            company_name=ld["name"],
            location=ld["loc"],
            poc_name=ld["poc"],
            poc_email=ld["email"],
            poc_phone=ld["phone"],
            team_member_id=team_members[ld["tm_idx"]].id,
            tier=ld["tier"],
            ctc=ld["ctc"],
            role=ld["role"],
            status=ld["status"],
            approval_status=ld["approval"],
            drive_date=ld["date"],
            jd_id=jd_id
        )
        db.add(lead)
        db.flush()
        company_lead_objs.append(lead)

        fu = FollowUp(
            lead_id=lead.id,
            team_member_id=team_members[ld["tm_idx"]].id,
            notes=f"Discussed 2026 campus hiring numbers and eligibility criteria for {lead.role}.",
            follow_up_date="2026-08-20",
            next_step="Finalize test slot and coordinate slot approval with Head of Placement."
        )
        db.add(fu)

        if ld["approval"] == "Approved":
            comp = Company(
                name=ld["name"],
                location=ld["loc"],
                tier=ld["tier"],
                role=ld["role"],
                ctc=ld["ctc"],
                drive_date=ld["date"],
                status=ld["status"] if ld["status"] == "Placement Completed" else "Approved",
                offers_count=0,
                team_member_id=team_members[ld["tm_idx"]].id,
                lead_id=lead.id,
                jd_id=jd_id
            )
            db.add(comp)
            db.flush()
            company_objs.append(comp)

    # 4. Realistic Students across Departments
    departments = ["CSE", "IT", "ECE", "EEE", "MECH", "MBA"]
    first_names = [
        "Aarav", "Aditi", "Ananya", "Arjun", "Bhavya", "Chetan", "Deepika", "Dev", "Divya", "Gaurav",
        "Harini", "Harsh", "Ishaan", "Janani", "Karthik", "Kavya", "Madhav", "Manish", "Meera", "Neha",
        "Nikhil", "Pooja", "Pranav", "Priya", "Rahul", "Rhea", "Rohan", "Sanjay", "Shreya", "Siddharth",
        "Sneha", "Surya", "Tanvi", "Varun", "Vignesh", "Vikram", "Yash", "Zoya", "Aakash", "Preeti"
    ]
    last_names = ["Sharma", "Verma", "Patel", "Reddy", "Iyer", "Sundaram", "Nair", "Gupta", "Menon", "Rao", "Joshi", "Bose", "Kumar", "Singh", "Das"]

    students = []
    reg_counter = 101

    sample_resumes = [
        "Skilled in Python, Golang, Docker, Kubernetes, Linux, GCP and Cloud Architecture. Built scalable microservice backends, RESTful APIs, and CI/CD pipelines. Strong foundation in Data Structures and Algorithms.",
        "Experienced in C++, C#, Data Structures, Algorithms, OOPs, Azure, SQL and Distributed System Design. Solved 450+ LeetCode problems. Winner of Smart India Hackathon.",
        "Full stack engineer with React, JavaScript, TypeScript, Node.js, Express, Tailwind CSS, PostgreSQL and AWS. Built e-commerce web applications and real-time collaboration tools.",
        "Passionate Java developer with Spring Boot, Microservices, Hibernate, REST APIs, MySQL, and Docker. Strong knowledge in System Design and unit testing with JUnit.",
        "Core electronics and embedded engineer with C, C++, Embedded Systems, IoT, Microcontrollers, Python and Robotics. Experience with PCB design and Arduino/Raspberry Pi.",
        "Data Analyst and Business Strategist proficient in Python, SQL, Tableau, Power BI, Excel, Data Analysis and Agile Project Management. Excellent communication skills."
    ]

    for i in range(40):
        fn = first_names[i % len(first_names)]
        ln = last_names[i % len(last_names)]
        name = f"{fn} {ln}"
        dept = departments[i % len(departments)]
        gender = "Female" if i % 2 == 0 else "Male"
        reg_no = f"2022{dept}{reg_counter + i:03d}"
        email = f"{fn.lower()}.{ln.lower()}{i+1}@college.edu"
        phone = f"+91 9{random.randint(1000, 9999)} {random.randint(10000, 99999)}"
        sslc = round(random.uniform(82.0, 98.5), 1)
        hsc = round(random.uniform(78.0, 97.0), 1)
        ug = round(random.uniform(68.0, 96.0), 1)

        resume_snippet = sample_resumes[i % len(sample_resumes)]
        resume_full = f"{name}\nRegistration No: {reg_no}\nDepartment: {dept}\nEmail: {email} | Phone: {phone}\n\nPROFILE SUMMARY:\n{resume_snippet}\n\nEDUCATION:\nB.Tech {dept}, CGPA: {ug/10.0:.2f}/10 ({ug}%)\nSenior Secondary (HSC): {hsc}%\nSecondary School (SSLC): {sslc}%\n\nPROJECTS:\n1. Scalable Distributed Engine using modern engineering best practices.\n2. Cloud Microservice Infrastructure with Docker and CI/CD automation."

        student = Student(
            reg_no=reg_no,
            name=name,
            dept=dept,
            course="B.Tech" if dept != "MBA" else "MBA",
            gender=gender,
            is_hosteller=(i % 3 == 0),
            sslc_pct=sslc,
            hsc_pct=hsc,
            ug_pct=ug,
            pg_pct=None,
            github_url=f"https://github.com/{fn.lower()}{ln.lower()}",
            linkedin_url=f"https://linkedin.com/in/{fn.lower()}-{ln.lower()}",
            resume_url=f"https://drive.google.com/file/d/sample_resume_{reg_no}/view",
            resume_text=resume_full,
            intro_video_url=f"https://youtube.com/watch?v=intro_{reg_no}",
            photo_url=f"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" if gender == "Female" else "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
            grad_year=2026,
            portfolio_url=f"https://{fn.lower()}{ln.lower()}.dev",
            email=email,
            phone=phone,
            placement_status="Unplaced",
            is_archived=False
        )
        db.add(student)
        db.flush()
        students.append(student)

    # 5. Record Placements for Completed Drives (Microsoft and Zoho)
    msft_company = next((c for c in company_objs if c.name == "Microsoft"), None)
    zoho_company = next((c for c in company_objs if c.name == "Zoho Corporation"), None)

    if msft_company:
        msft_placed = [students[1], students[7], students[13], students[19], students[25], students[31]]
        msft_company.offers_count = len(msft_placed)
        for s in msft_placed:
            s.placement_status = "Placed"
            p = Placement(
                student_id=s.id,
                company_id=msft_company.id,
                drive_date="2026-08-10",
                role=msft_company.role,
                ctc=msft_company.ctc
            )
            db.add(p)

    if zoho_company:
        zoho_placed = [students[3], students[9], students[15], students[21], students[27], students[33], students[4], students[10]]
        zoho_company.offers_count = len(zoho_placed)
        for s in zoho_placed:
            s.placement_status = "Placed"
            p = Placement(
                student_id=s.id,
                company_id=zoho_company.id,
                drive_date="2026-08-01",
                role=zoho_company.role,
                ctc=zoho_company.ctc
            )
            db.add(p)

    # 6. Seed Recent Activities
    activities = [
        {"type": "PLACEMENT_COMPLETED", "title": "Microsoft Drive Completed", "desc": "6 students selected for SDE 1 at 28.5 LPA."},
        {"type": "PLACEMENT_COMPLETED", "title": "Zoho Corporation Drive Completed", "desc": "8 students selected for Product Developer at 9.5 LPA."},
        {"type": "COMPANY_APPROVED", "title": "Google Cloud Drive Approved", "desc": "Head of Placement approved Google Cloud campus drive for Cloud Software Engineer (32.0 LPA)."},
        {"type": "JD_UPLOADED", "title": "Amazon JD Extracted", "desc": "JD parsed and candidate pool prepared for Full Stack Developer role."},
        {"type": "NEW_LEAD", "title": "Qualcomm Lead Initiated", "desc": "New lead created for Embedded Software Engineer role at 16.0 LPA."}
    ]
    for act in activities:
        a = ActivityLog(activity_type=act["type"], title=act["title"], description=act["desc"])
        db.add(a)

    db.commit()
    print("Database seeded successfully with users & logins!")

if __name__ == "__main__":
    seed_database()
