from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Student, ArchiveRecord, Placement, Company, User
from app.schemas import StudentCreate, StudentUpdate, StudentOut, ArchiveRequest, PlacementHistoryOut
from app.services.extractor import extract_text_from_url
from app.auth_deps import get_current_user, require_manager_or_admin
from typing import List, Optional

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("", response_model=List[StudentOut])
def get_students(
    dept: Optional[str] = None,
    placement_status: Optional[str] = None,
    is_archived: bool = False,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Team members cannot view archived students list
    if current_user.role == "team_member" and is_archived:
        raise HTTPException(
            status_code=403,
            detail="Placement team members do not have permission to view archived student records."
        )

    query = db.query(Student).filter(Student.is_archived == is_archived)
    if dept and dept != "All":
        query = query.filter(Student.dept == dept)
    if placement_status and placement_status != "All":
        query = query.filter(Student.placement_status == placement_status)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Student.name.ilike(search_pattern)) | 
            (Student.reg_no.ilike(search_pattern)) | 
            (Student.email.ilike(search_pattern))
        )
    
    students = query.order_by(Student.reg_no.asc()).all()
    
    results = []
    for s in students:
        history = []
        for p in s.placements:
            history.append(PlacementHistoryOut(
                company_name=p.company.name if p.company else "Unknown",
                drive_date=p.drive_date,
                role=p.role,
                ctc=p.ctc,
                status="Placed",
                created_at=p.created_at
            ))
        student_dict = StudentOut.from_orm(s)
        student_dict.placement_history = history
        results.append(student_dict)
        
    return results

@router.get("/{student_id}", response_model=StudentOut)
def get_student(student_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    if current_user.role == "team_member" and student.is_archived:
        raise HTTPException(status_code=403, detail="Placement team members cannot view archived student profiles.")

    history = []
    for p in student.placements:
        history.append(PlacementHistoryOut(
            company_name=p.company.name if p.company else "Unknown",
            drive_date=p.drive_date,
            role=p.role,
            ctc=p.ctc,
            status="Placed",
            created_at=p.created_at
        ))
    student_dict = StudentOut.from_orm(student)
    student_dict.placement_history = history
    return student_dict

@router.post("", response_model=StudentOut)
async def create_student(
    data: StudentCreate, 
    current_user: User = Depends(require_manager_or_admin), 
    db: Session = Depends(get_db)
):
    if db.query(Student).filter(Student.reg_no == data.reg_no).first():
        raise HTTPException(status_code=400, detail=f"Registration Number '{data.reg_no}' already exists")
    if db.query(Student).filter(Student.email == data.email).first():
        raise HTTPException(status_code=400, detail=f"Email '{data.email}' already exists")

    resume_text = data.resume_text
    if data.resume_url and not resume_text:
        extracted = await extract_text_from_url(data.resume_url)
        if extracted:
            resume_text = extracted

    student = Student(
        **data.dict(exclude={"resume_text"}),
        resume_text=resume_text,
        placement_status="Unplaced",
        is_archived=False
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return StudentOut.from_orm(student)

@router.put("/{student_id}", response_model=StudentOut)
async def update_student(
    student_id: int, 
    data: StudentUpdate, 
    current_user: User = Depends(require_manager_or_admin), 
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    update_data = data.dict(exclude_unset=True)
    if "resume_url" in update_data and update_data["resume_url"] and not update_data.get("resume_text"):
        extracted = await extract_text_from_url(update_data["resume_url"])
        if extracted:
            update_data["resume_text"] = extracted

    for key, value in update_data.items():
        setattr(student, key, value)
        
    db.commit()
    db.refresh(student)
    return StudentOut.from_orm(student)

@router.post("/{student_id}/archive")
def archive_student(
    student_id: int, 
    req: ArchiveRequest, 
    current_user: User = Depends(require_manager_or_admin), 
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    student.is_archived = True
    record = ArchiveRecord(
        student_id=student.id,
        reason=req.reason,
        note=req.note
    )
    db.add(record)
    db.commit()
    return {"message": "Student archived successfully", "student_id": student.id}

@router.post("/{student_id}/unarchive")
def unarchive_student(
    student_id: int, 
    current_user: User = Depends(require_manager_or_admin), 
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    student.is_archived = False
    db.commit()
    return {"message": "Student recovered successfully", "student_id": student.id}

@router.delete("/{student_id}")
def delete_student(
    student_id: int, 
    current_user: User = Depends(require_manager_or_admin), 
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    db.delete(student)
    db.commit()
    return {"message": "Student deleted permanently"}
