import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, Request, Response
from pwdlib import PasswordHash
from sqlalchemy import delete, select
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.entities import AuthSession, AuthAttempt, User, utcnow

password_hash = PasswordHash.recommended()
DUMMY_HASH = password_hash.hash(secrets.token_urlsafe(24))
COOKIE = "jobtrackr_session"


def digest(value: str) -> str:
    return hmac.new(settings().secret_key.encode(), value.encode(), hashlib.sha256).hexdigest()


def aware(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


def current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get(COOKIE)
    session = db.get(AuthSession, digest(token)) if token else None
    if not session or aware(session.expires_at) <= utcnow():
        raise HTTPException(401, "Please sign in to continue")
    user = db.get(User, session.user_id)
    if not user:
        raise HTTPException(401, "Please sign in to continue")
    return user


def issue_session(db: Session, user: User, response: Response) -> None:
    token = secrets.token_urlsafe(48)
    ttl = settings().access_token_expire_minutes * 60
    db.execute(delete(AuthSession).where(AuthSession.expires_at < utcnow()))
    db.add(
        AuthSession(token_hash=digest(token), user_id=user.id, expires_at=utcnow() + timedelta(seconds=ttl))
    )
    db.commit()
    response.set_cookie(
        COOKIE,
        token,
        max_age=ttl,
        httponly=True,
        secure=settings().environment == "production",
        samesite="lax",
        path="/",
    )


def throttle(db: Session, key: str, limit: int = 10) -> None:
    key = digest(key)
    row = db.scalar(select(AuthAttempt).where(AuthAttempt.key == key).with_for_update())
    now = utcnow()
    if not row:
        row = AuthAttempt(key=key, count=0, window_start=now)
        db.add(row)
    if aware(row.window_start) < now - timedelta(minutes=15):
        row.count, row.window_start = 0, now
    if row.count >= limit:
        raise HTTPException(429, "Too many attempts. Please try again in 15 minutes.")
    row.count += 1
    db.commit()
