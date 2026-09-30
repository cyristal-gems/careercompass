from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.security import aware
from app.models.entities import Application, Interview, Contact
from app.schemas.records import InterviewCreate
from app.services.application_service import owned, values


def listing(db: Session, user_id: str, model, application_id: str | None = None):
    query = select(model).join(Application).where(Application.user_id == user_id)
    if application_id:
        owned(db, user_id, application_id)
        query = query.where(model.application_id == application_id)
    return db.scalars(query.order_by(model.created_at)).all()


def owned_related(db: Session, user_id: str, model, record_id: str):
    item = db.scalar(
        select(model).join(Application).where(model.id == record_id, Application.user_id == user_id)
    )
    if not item:
        raise HTTPException(404, "Record not found")
    return item


def create(db: Session, user_id: str, model, data):
    owned(db, user_id, data.application_id)
    item = model(**values(data))
    db.add(item)
    db.commit()
    return item


def update_interview(db: Session, user_id: str, record_id: str, data):
    item = owned_related(db, user_id, Interview, record_id)
    changes = values(data, True)
    try:
        InterviewCreate.model_validate(
            {
                k: aware(getattr(item, k)) if k == "scheduled_at" else getattr(item, k)
                for k in InterviewCreate.model_fields
            }
            | changes
        )
    except ValidationError:
        raise HTTPException(422, "Interview type and a timezone-aware date are required")
    for key, value in changes.items():
        setattr(item, key, value)
    db.commit()
    return item


def update_contact(db: Session, user_id: str, record_id: str, data):
    item = owned_related(db, user_id, Contact, record_id)
    owned(db, user_id, data.application_id)
    for key, value in values(data).items():
        setattr(item, key, value)
    db.commit()
    return item


def delete(db: Session, user_id: str, model, record_id: str):
    db.delete(owned_related(db, user_id, model, record_id))
    db.commit()
