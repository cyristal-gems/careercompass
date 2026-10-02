from datetime import date
from typing import Literal
from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import current_user
from app.models.entities import User, StatusHistory
from app.schemas.records import (
    ApplicationCreate,
    ApplicationPatch,
    ApplicationOut,
    ApplicationDetail,
    ApplicationPage,
    Status,
    WorkType,
    EmploymentType,
    HistoryOut,
)
from app.services import application_service as service

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.get("", response_model=ApplicationPage)
def list_applications(
    view: Literal["all", "active", "interviews", "offers", "followups", "archived"] = "all",
    priority: bool | None = None,
    is_archived: bool | None = None,
    search: str | None = Query(None, max_length=200),
    status: Status | None = None,
    company: str | None = None,
    position: str | None = None,
    location: str | None = None,
    work_type: WorkType | None = None,
    employment_type: EmploymentType | None = None,
    source: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    salary_min: int | None = Query(None, ge=0),
    salary_max: int | None = Query(None, ge=0),
    sort: str = "-applied_date",
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    query, total = service.query_applications(db, user.id, locals())
    return {
        "items": db.scalars(query.offset((page - 1) * page_size).limit(page_size)).all(),
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/export/csv")
def export(db: Session = Depends(get_db), user: User = Depends(current_user)):
    query, _ = service.query_applications(db, user.id, {})
    return Response(
        service.export_csv(db.scalars(query).all()),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="careercompass-applications.csv"'},
    )


@router.post("/import/csv")
async def import_file(
    file: UploadFile = File(...), db: Session = Depends(get_db), user: User = Depends(current_user)
):
    content = await file.read(2_000_001)
    if len(content) > 2_000_000:
        raise HTTPException(413, "CSV file must be under 2 MB")
    return service.import_csv(db, user.id, content)


@router.post("", response_model=ApplicationOut, status_code=201)
def create(data: ApplicationCreate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    item = service.create(db, user.id, data)
    db.commit()
    return item


@router.get("/{record_id}", response_model=ApplicationDetail)
def get(record_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return service.owned(db, user.id, record_id)


@router.get("/{record_id}/history", response_model=list[HistoryOut])
def history(
    record_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)
) -> list[StatusHistory]:
    return service.owned(db, user.id, record_id).history


@router.patch("/{record_id}", response_model=ApplicationOut)
def update(
    record_id: str, data: ApplicationPatch, db: Session = Depends(get_db), user: User = Depends(current_user)
):
    item = service.update(db, service.owned(db, user.id, record_id, lock=True), data)
    db.commit()
    return item


@router.delete("/{record_id}", status_code=204)
def delete(record_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    db.delete(service.owned(db, user.id, record_id, lock=True))
    db.commit()
