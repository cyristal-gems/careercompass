from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import current_user
from app.models.entities import User
from app.services.analytics_service import calculate

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("")
def all_analytics(
    days: int = Query(30, ge=1, le=366),
    scoped: bool = False,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    return calculate(db, user.id, days, scoped)


@router.get("/{section}")
def section(
    section: str,
    days: int = Query(30, ge=1, le=366),
    scoped: bool = False,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    if section not in {
        "summary",
        "funnel",
        "trends",
        "statuses",
        "response-rate",
        "sources",
        "weekdays",
        "response-times",
    }:
        raise HTTPException(404, "Analytics section not found")
    result = calculate(db, user.id, days, scoped)
    return (
        {"response_rate": result["summary"]["response_rate"]}
        if section == "response-rate"
        else result[section]
    )
