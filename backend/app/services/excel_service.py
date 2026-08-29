import pandas as pd
import io
import re
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models import Student

REQUIRED_COLUMNS = [
    "Registration Number",
    "Name",
    "Department",
    "Course",
    "Gender",
    "Hosteller",
    "SSLC %",
    "HSC %",
    "UG %",
    "Year of Graduation",
    "Email ID",
    "Phone Number"
]

OPTIONAL_COLUMNS = [
    "PG %",
    "GitHub Link",
    "LinkedIn Link",
    "Resume Link",
    "Self Introduction Video Link",
    "Photo Link",
    "Portfolio Link"
]

def validate_and_preview_excel(file_bytes: bytes, db: Session) -> Dict[str, Any]:
    """
    Parses Excel file, validates column headers, checks data types & ranges,
    detects duplicates, and returns structured validation results for preview.
    """
    try:
        df = pd.read_excel(io.BytesIO(file_bytes))
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to read Excel file. Please ensure it is a valid .xlsx file. Error: {str(e)}",
            "total_rows": 0,
            "valid_count": 0,
            "invalid_count": 0,
            "rows": []
        }

    # Normalize column names (strip whitespace)
    df.columns = [str(c).strip() for c in df.columns]
    
    # Check missing required columns
    missing_cols = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing_cols:
        return {
            "success": False,
            "error": f"Missing required columns: {', '.join(missing_cols)}",
            "total_rows": len(df),
            "valid_count": 0,
            "invalid_count": len(df),
            "rows": []
        }

    existing_reg_nos = set(r[0] for r in db.query(Student.reg_no).all())
    existing_emails = set(r[0] for r in db.query(Student.email).all())

    seen_file_reg_nos = set()
    seen_file_emails = set()

    parsed_rows = []
    valid_count = 0
    invalid_count = 0

    for idx, row in df.iterrows():
        row_errors = []
        
        # 1. Reg No
        reg_no = str(row.get("Registration Number", "")).strip()
        if not reg_no or reg_no == "nan":
            row_errors.append("Registration Number is required")
        elif reg_no in existing_reg_nos:
            row_errors.append(f"Reg No '{reg_no}' already exists in database")
        elif reg_no in seen_file_reg_nos:
            row_errors.append(f"Duplicate Reg No '{reg_no}' in this file")
        else:
            seen_file_reg_nos.add(reg_no)

        # 2. Name
        name = str(row.get("Name", "")).strip()
        if not name or name == "nan":
            row_errors.append("Student Name is required")

        # 3. Department & Course
        dept = str(row.get("Department", "")).strip()
        course = str(row.get("Course", "")).strip()
        if not dept or dept == "nan":
            row_errors.append("Department is required")
        if not course or course == "nan":
            row_errors.append("Course is required")

        # 4. Gender
        gender = str(row.get("Gender", "")).strip()
        if not gender or gender == "nan":
            row_errors.append("Gender is required")

        hosteller_raw = str(row.get("Hosteller", "")).strip().lower()
        if hosteller_raw in ["yes", "true", "1", "y", "hosteller"]:
            is_hosteller = True
        elif hosteller_raw in ["no", "false", "0", "n", "day scholar", "dayscholar"]:
            is_hosteller = False
        else:
            is_hosteller = False
            row_errors.append("Hosteller must be Yes or No")

        # 5. Percentages
        try:
            sslc = float(row.get("SSLC %", 0))
            if not (0 <= sslc <= 100):
                row_errors.append("SSLC % must be between 0 and 100")
        except:
            row_errors.append("Invalid SSLC % value")
            sslc = 0.0

        try:
            hsc = float(row.get("HSC %", 0))
            if not (0 <= hsc <= 100):
                row_errors.append("HSC % must be between 0 and 100")
        except:
            row_errors.append("Invalid HSC % value")
            hsc = 0.0

        try:
            ug = float(row.get("UG %", 0))
            if not (0 <= ug <= 100):
                row_errors.append("UG % must be between 0 and 100")
        except:
            row_errors.append("Invalid UG % value")
            ug = 0.0

        pg = None
        if "PG %" in df.columns and pd.notna(row.get("PG %")):
            try:
                pg = float(row.get("PG %"))
                if not (0 <= pg <= 100):
                    row_errors.append("PG % must be between 0 and 100")
            except:
                row_errors.append("Invalid PG % value")

        # 6. Email
        email = str(row.get("Email ID", "")).strip()
        if not email or email == "nan" or not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
            row_errors.append("Valid Email ID is required")
        elif email in existing_emails:
            row_errors.append(f"Email '{email}' already exists in database")
        elif email in seen_file_emails:
            row_errors.append(f"Duplicate Email '{email}' in this file")
        else:
            seen_file_emails.add(email)

        # 7. Phone
        phone = str(row.get("Phone Number", "")).strip()
        if not phone or phone == "nan" or not re.match(r"^\+?[0-9][0-9\s\-()]{7,19}$", phone):
            row_errors.append("Valid Phone Number is required")

        try:
            grad_year = int(row.get("Year of Graduation"))
        except:
            grad_year = 0
            row_errors.append("Year of Graduation is required and must be a valid year")

        is_valid = len(row_errors) == 0
        if is_valid:
            valid_count += 1
        else:
            invalid_count += 1

        parsed_rows.append({
            "row_index": int(idx) + 1,
            "reg_no": reg_no,
            "name": name,
            "dept": dept,
            "course": course,
            "gender": gender,
            "is_hosteller": is_hosteller,
            "sslc_pct": sslc,
            "hsc_pct": hsc,
            "ug_pct": ug,
            "pg_pct": pg,
            "email": email,
            "phone": phone,
            "grad_year": grad_year,
            "github_url": str(row.get("GitHub Link", "")) if pd.notna(row.get("GitHub Link")) else None,
            "linkedin_url": str(row.get("LinkedIn Link", "")) if pd.notna(row.get("LinkedIn Link")) else None,
            "resume_url": str(row.get("Resume Link", "")) if pd.notna(row.get("Resume Link")) else None,
            "intro_video_url": str(row.get("Self Introduction Video Link", "")) if pd.notna(row.get("Self Introduction Video Link")) else None,
            "photo_url": str(row.get("Photo Link", "")) if pd.notna(row.get("Photo Link")) else None,
            "portfolio_url": str(row.get("Portfolio Link", "")) if pd.notna(row.get("Portfolio Link")) else None,
            "is_valid": is_valid,
            "errors": row_errors
        })

    return {
        "success": True,
        "total_rows": len(parsed_rows),
        "valid_count": valid_count,
        "invalid_count": invalid_count,
        "rows": parsed_rows
    }

def commit_valid_rows(rows_data: List[Dict[str, Any]], db: Session) -> int:
    """Inserts only valid rows into database."""
    imported_count = 0
    existing_reg_nos = set(r[0] for r in db.query(Student.reg_no).all())
    existing_emails = set(r[0] for r in db.query(Student.email).all())
    for r in rows_data:
        if not r.get("is_valid"):
            continue
        if r["reg_no"] in existing_reg_nos or r["email"] in existing_emails:
            continue
        student = Student(
            reg_no=r["reg_no"],
            name=r["name"],
            dept=r["dept"],
            course=r.get("course", "B.Tech"),
            gender=r.get("gender", "Other"),
            is_hosteller=r.get("is_hosteller", False),
            sslc_pct=r["sslc_pct"],
            hsc_pct=r["hsc_pct"],
            ug_pct=r["ug_pct"],
            pg_pct=r.get("pg_pct"),
            email=r["email"],
            phone=r["phone"],
            grad_year=r.get("grad_year", 2026),
            github_url=r.get("github_url"),
            linkedin_url=r.get("linkedin_url"),
            resume_url=r.get("resume_url"),
            intro_video_url=r.get("intro_video_url"),
            photo_url=r.get("photo_url"),
            portfolio_url=r.get("portfolio_url"),
            placement_status="Unplaced",
            is_archived=False
        )
        db.add(student)
        imported_count += 1
        existing_reg_nos.add(r["reg_no"])
        existing_emails.add(r["email"])
    db.commit()
    return imported_count
