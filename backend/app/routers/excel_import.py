from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.excel_service import validate_and_preview_excel, commit_valid_rows
from app.models import User
from app.auth_deps import require_manager_or_admin
from pydantic import BaseModel
from typing import List, Dict, Any
from openpyxl import Workbook
from io import BytesIO

router = APIRouter(prefix="/excel", tags=["Excel Import"])

TEMPLATE_COLUMNS = [
    "Registration Number",
    "Name",
    "Department",
    "Course",
    "Gender",
    "Hosteller",
    "SSLC %",
    "HSC %",
    "UG %",
    "PG %",
    "GitHub Link",
    "LinkedIn Link",
    "Resume Link",
    "Self Introduction Video Link",
    "Photo Link",
    "Year of Graduation",
    "Portfolio Link",
    "Email ID",
    "Phone Number",
]

@router.get("/student-template")
def download_student_template(current_user: User = Depends(require_manager_or_admin)):
    wb = Workbook()
    ws = wb.active
    ws.title = "Student Import"
    ws.append(TEMPLATE_COLUMNS)
    ws.append([
        "2022CSE301",
        "Kiran Patel",
        "CSE",
        "B.Tech",
        "Male",
        "No",
        92.5,
        90.0,
        85.5,
        None,
        "https://github.com/kiranp",
        "https://linkedin.com/in/kiranp",
        "https://drive.google.com/sample_resume",
        "https://video.example.com/kiran",
        "https://images.example.com/kiran.jpg",
        2026,
        "https://kiran.dev",
        "kiran.p301@college.edu",
        "+91 98841 22334",
    ])
    stream = BytesIO()
    wb.save(stream)
    stream.seek(0)
    headers = {"Content-Disposition": "attachment; filename=student_import_template.xlsx"}
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )

@router.post("/preview")
async def preview_excel_import(
    file: UploadFile = File(...), 
    current_user: User = Depends(require_manager_or_admin),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .xlsx Excel files are supported.")
        
    file_bytes = await file.read()
    preview_result = validate_and_preview_excel(file_bytes, db)
    return preview_result

class CommitImportRequest(BaseModel):
    rows: List[Dict[str, Any]]

@router.post("/confirm")
def confirm_excel_import(
    req: CommitImportRequest, 
    current_user: User = Depends(require_manager_or_admin),
    db: Session = Depends(get_db)
):
    if not req.rows:
        raise HTTPException(status_code=400, detail="No rows provided for import.")
        
    imported = commit_valid_rows(req.rows, db)
    return {
        "success": True,
        "imported_count": imported,
        "message": f"Successfully imported {imported} student records."
    }
