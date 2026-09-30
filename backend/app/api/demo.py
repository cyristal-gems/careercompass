from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import current_user
from app.models.entities import User
from app.services.demo_service import seed

router = APIRouter(tags=["Sample data"])


@router.post("/demo", status_code=201)
def demo(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return seed(db, user.id)
