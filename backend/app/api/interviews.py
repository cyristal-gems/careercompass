from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import current_user
from app.models.entities import Interview, User
from app.schemas.records import InterviewCreate, InterviewOut, InterviewPatch
from app.services import related_service as service

router = APIRouter(prefix="/interviews", tags=["Interviews"])


@router.get("", response_model=list[InterviewOut])
def listing(
    application_id: str | None = None, db: Session = Depends(get_db), user: User = Depends(current_user)
):
    return service.listing(db, user.id, Interview, application_id)


@router.post("", response_model=InterviewOut, status_code=201)
def create(data: InterviewCreate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return service.create(db, user.id, Interview, data)


@router.get("/{record_id}", response_model=InterviewOut)
def get(record_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return service.owned_related(db, user.id, Interview, record_id)


@router.patch("/{record_id}", response_model=InterviewOut)
def update(
    record_id: str, data: InterviewPatch, db: Session = Depends(get_db), user: User = Depends(current_user)
):
    return service.update_interview(db, user.id, record_id, data)


@router.delete("/{record_id}", status_code=204)
def delete(record_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    service.delete(db, user.id, Interview, record_id)
