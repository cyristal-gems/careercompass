from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import current_user
from app.models.entities import Contact, User
from app.schemas.records import ContactCreate, ContactOut
from app.services import related_service as service

router = APIRouter(prefix="/contacts", tags=["Contacts"])


@router.get("", response_model=list[ContactOut])
def listing(
    application_id: str | None = None, db: Session = Depends(get_db), user: User = Depends(current_user)
):
    return service.listing(db, user.id, Contact, application_id)


@router.post("", response_model=ContactOut, status_code=201)
def create(data: ContactCreate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return service.create(db, user.id, Contact, data)


@router.get("/{record_id}", response_model=ContactOut)
def get(record_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return service.owned_related(db, user.id, Contact, record_id)


@router.patch("/{record_id}", response_model=ContactOut)
def update(
    record_id: str, data: ContactCreate, db: Session = Depends(get_db), user: User = Depends(current_user)
):
    return service.update_contact(db, user.id, record_id, data)


@router.delete("/{record_id}", status_code=204)
def delete(record_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    service.delete(db, user.id, Contact, record_id)
