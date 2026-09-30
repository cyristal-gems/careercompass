from typing import Annotated, Literal
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import Field
from sqlalchemy import delete, select
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import COOKIE, current_user, password_hash, throttle
from app.models.entities import Application, AuthSession, ResetToken, User
from app.schemas.records import Input
from app.schemas.user import ProfilePatch, UserOut

router = APIRouter(prefix="/account", tags=["Account"])


class DeleteAccount(Input):
    confirmation: Literal["DELETE"]
    password: Annotated[str, Field(min_length=12, max_length=128)]


@router.patch("/profile", response_model=UserOut)
def profile(data: ProfilePatch, user: User = Depends(current_user), db: Session = Depends(get_db)):
    user.first_name = data.first_name
    db.commit()
    return user


@router.post("/logout-all", status_code=204)
def logout_all(response: Response, user: User = Depends(current_user), db: Session = Depends(get_db)):
    db.execute(delete(AuthSession).where(AuthSession.user_id == user.id))
    db.commit()
    response.delete_cookie(COOKIE, path="/")


@router.delete("", status_code=204)
def delete_account(
    data: DeleteAccount,
    response: Response,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    throttle(db, "delete-account:" + user.id, 5)
    if not password_hash.verify(data.password, user.password_hash):
        raise HTTPException(403, "Your password is incorrect. Your account has not been deleted.")
    # ORM cascades remove related records on both SQLite and PostgreSQL.
    for application in db.scalars(select(Application).where(Application.user_id == user.id)).all():
        db.delete(application)
    db.execute(delete(AuthSession).where(AuthSession.user_id == user.id))
    db.execute(delete(ResetToken).where(ResetToken.user_id == user.id))
    db.delete(user)
    db.commit()
    response.delete_cookie(COOKIE, path="/")
