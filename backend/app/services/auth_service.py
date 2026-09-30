import secrets
import smtplib
from email.message import EmailMessage
from datetime import timedelta
from urllib.parse import urlencode
from fastapi import HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import DUMMY_HASH, aware, digest, password_hash
from app.models.entities import User, ResetToken, AuthSession, utcnow


def register(db: Session, data) -> User:
    email = str(data.email).lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(
            409, "Unable to register with this email. Try signing in or resetting your password."
        )
    user = User(email=email, first_name=data.first_name, password_hash=password_hash.hash(data.password))
    db.add(user)
    db.commit()
    return user


def authenticate(db: Session, data) -> User:
    user = db.scalar(select(User).where(User.email == str(data.email).lower()))
    valid = password_hash.verify(data.password, user.password_hash if user else DUMMY_HASH)
    if not user or not valid:
        raise HTTPException(401, "Email or password is incorrect")
    return user


def request_reset(db: Session, email: str) -> None:
    config = settings()
    if not config.smtp_host or not config.smtp_from:
        raise HTTPException(503, "Password reset delivery is not configured. Contact cyrisjoseph@outlook.com for help.")
    user = db.scalar(select(User).where(User.email == email.lower()))
    if not user:
        return
    token = secrets.token_urlsafe(48)
    db.execute(delete(ResetToken).where(ResetToken.user_id == user.id))
    db.add(ResetToken(token_hash=digest(token), user_id=user.id, expires_at=utcnow() + timedelta(minutes=30)))
    message = EmailMessage()
    message["Subject"] = "Reset your JobTrackr password"
    message["From"], message["To"] = config.smtp_from, user.email
    url = config.frontend_url.rstrip("/") + "/reset-password?" + urlencode({"token": token})
    message.set_content(
        f"Reset your password using this link within 30 minutes:\n{url}\n\nIf you did not request this, ignore this email."
    )
    try:
        with smtplib.SMTP(config.smtp_host, config.smtp_port, timeout=15) as server:
            server.starttls()
            if config.smtp_username:
                server.login(config.smtp_username, config.smtp_password or "")
            server.send_message(message)
    except (OSError, smtplib.SMTPException):
        db.rollback()
        raise HTTPException(503, "Unable to deliver reset email. Try again later or contact cyrisjoseph@outlook.com.")
    db.commit()


def reset_password(db: Session, token: str, password: str) -> None:
    row = db.scalar(select(ResetToken).where(ResetToken.token_hash == digest(token)).with_for_update())
    if not row or aware(row.expires_at) <= utcnow():
        raise HTTPException(400, "This reset link is invalid or expired")
    user = db.get(User, row.user_id)
    user.password_hash = password_hash.hash(password)
    db.execute(delete(AuthSession).where(AuthSession.user_id == user.id))
    db.execute(delete(ResetToken).where(ResetToken.user_id == user.id))
    db.commit()
