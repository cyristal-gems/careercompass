from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import COOKIE, current_user, digest, issue_session, throttle
from app.models.entities import AuthSession, User
from app.schemas.user import Credentials, Register, UserOut, ResetRequest, ResetConfirm, ProfilePatch
from app.services import auth_service as service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut, status_code=201)
def register(data: Register, request: Request, response: Response, db: Session = Depends(get_db)):
    throttle(db, "register:" + str(request.client.host), 20)
    user = service.register(db, data)
    issue_session(db, user, response)
    return user


@router.post("/login", response_model=UserOut)
def login(data: Credentials, request: Request, response: Response, db: Session = Depends(get_db)):
    throttle(db, "login:" + str(data.email).lower())
    throttle(db, "login-ip:" + str(request.client.host), 100)
    user = service.authenticate(db, data)
    issue_session(db, user, response)
    return user


@router.post("/logout", status_code=204)
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get(COOKIE)
    session = db.get(AuthSession, digest(token)) if token else None
    if session:
        db.delete(session)
        db.commit()
    response.delete_cookie(COOKIE, path="/")


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return user


@router.patch("/me", response_model=UserOut)
def profile(data: ProfilePatch, user: User = Depends(current_user), db: Session = Depends(get_db)):
    user.first_name = data.first_name
    db.commit()
    return user


@router.post("/password-reset")
def request_reset(data: ResetRequest, request: Request, db: Session = Depends(get_db)):
    throttle(db, "reset:" + str(request.client.host), 10)
    service.request_reset(db, str(data.email))
    return {"message": "If an account exists, a password reset link will be sent."}


@router.post("/password-reset/confirm")
def confirm_reset(data: ResetConfirm, db: Session = Depends(get_db)):
    service.reset_password(db, data.token, data.password)
    return {"message": "Password updated. Please sign in."}
