from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import JobDescription, CompanyLead, Company, ActivityLog, User
from app.schemas import JobDescriptionOut, JobDescriptionCreate
from app.services.extractor import extract_text_from_pdf_bytes, extract_text_from_docx_bytes, extract_structured_jd
from app.auth_deps import get_current_user, require_team_member
import os
import json
from app.config import settings

router = APIRouter(prefix="/jd", tags=["Job Description"])

@router.post("/preview-upload")
async def preview_jd_upload(
    file: UploadFile = File(...),
    current_user: User = Depends(require_team_member)
):
    file_bytes = await file.read()
    file_name = file.filename.lower()
    
    if file_name.endswith(".pdf"):
        text = extract_text_from_pdf_bytes(file_bytes)
    elif file_name.endswith(".docx"):
        text = extract_text_from_docx_bytes(file_bytes)
    elif file_name.endswith(".txt"):
        text = file_bytes.decode("utf-8", errors="ignore")
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, DOCX, or TXT.")

    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from document. File may be empty or scanned image.")

    structured = extract_structured_jd(text)
    return {
        "file_name": file.filename,
        "raw_text": text,
        **structured
    }

@router.post("/upload", response_model=JobDescriptionOut)
async def upload_and_save_jd(
    company_name: str = Form(...),
    lead_id: int = Form(None),
    file: UploadFile = File(None),
    raw_text: str = Form(None),
    current_user: User = Depends(require_team_member),
    db: Session = Depends(get_db)
):
    if lead_id:
        lead = db.query(CompanyLead).filter(CompanyLead.id == lead_id).first()
        if not lead:
            raise HTTPException(status_code=404, detail="Associated lead not found.")
        if current_user.role == "team_member" and lead.team_member_id != current_user.team_member_id:
            raise HTTPException(status_code=403, detail="Access Denied: You cannot upload JDs for another member's company lead.")

    saved_file_name = None
    saved_file_path = None
    extracted_text = raw_text or ""

    if file:
        file_bytes = await file.read()
        saved_file_name = file.filename
        saved_file_path = os.path.join(settings.UPLOAD_DIR, f"{company_name.replace(' ', '_')}_{saved_file_name}")
        
        with open(saved_file_path, "wb") as f:
            f.write(file_bytes)

        if saved_file_name.lower().endswith(".pdf"):
            extracted_text = extract_text_from_pdf_bytes(file_bytes)
        elif saved_file_name.lower().endswith(".docx"):
            extracted_text = extract_text_from_docx_bytes(file_bytes)
        else:
            extracted_text = file_bytes.decode("utf-8", errors="ignore")

    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="Job description text is empty.")

    structured = extract_structured_jd(extracted_text)

    jd = JobDescription(
        company_name=company_name,
        file_name=saved_file_name,
        file_path=saved_file_path,
        raw_text=extracted_text,
        extracted_role=structured["extracted_role"],
        required_skills=json.dumps(structured["required_skills"]),
        qualifications=structured["qualifications"],
        experience=structured["experience"],
        responsibilities=structured["responsibilities"]
    )
    db.add(jd)
    db.flush()

    if lead_id:
        lead = db.query(CompanyLead).filter(CompanyLead.id == lead_id).first()
        if lead:
            lead.jd_id = jd.id
            if not lead.role:
                lead.role = structured["extracted_role"]
                
    act = ActivityLog(
        activity_type="JD_UPLOADED",
        title="Job Description Uploaded",
        description=f"JD uploaded and parsed for {company_name} ({structured['extracted_role']}) by {current_user.name}."
    )
    db.add(act)
    
    db.commit()
    db.refresh(jd)
    return JobDescriptionOut.from_orm(jd)

@router.get("/{jd_id}", response_model=JobDescriptionOut)
def get_jd(
    jd_id: int, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if current_user.role == "manager":
        raise HTTPException(status_code=403, detail="Access Denied: Managers cannot access company JDs.")
    jd = db.query(JobDescription).filter(JobDescription.id == jd_id).first()
    if not jd:
        raise HTTPException(status_code=404, detail="Job description not found")
    return JobDescriptionOut.from_orm(jd)
