from datetime import date, datetime, timezone
from uuid import uuid4
from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def identifier() -> str:
    return str(uuid4())


class Record:
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class User(Record, Base):
    __tablename__ = "users"
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    first_name: Mapped[str] = mapped_column(String(80))


class AuthSession(Base):
    __tablename__ = "auth_sessions"
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class ResetToken(Base):
    __tablename__ = "reset_tokens"
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class AuthAttempt(Base):
    __tablename__ = "auth_attempts"
    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    count: Mapped[int] = mapped_column(default=0)
    window_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Application(Record, Base):
    __tablename__ = "applications"
    __table_args__ = (
        CheckConstraint("salary_min IS NULL OR salary_min >= 0"),
        CheckConstraint("salary_max IS NULL OR salary_max >= 0"),
        CheckConstraint("salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max"),
        CheckConstraint(
            "status IN ('saved','applied','screening','interview','assessment','final_interview','offer','accepted','rejected','withdrawn','ghosted')"
        ),
        UniqueConstraint("user_id", "company", "position", "applied_date", name="uq_application_identity"),
    )
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    company: Mapped[str] = mapped_column(String(200), index=True)
    position: Mapped[str] = mapped_column(String(200))
    location: Mapped[str | None] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(30), index=True)
    employment_type: Mapped[str | None] = mapped_column(String(30))
    work_type: Mapped[str | None] = mapped_column(String(20))
    salary_min: Mapped[int | None]
    salary_max: Mapped[int | None]
    job_url: Mapped[str | None] = mapped_column(String(2048))
    company_website: Mapped[str | None] = mapped_column(String(2048))
    priority: Mapped[bool] = mapped_column(default=False, server_default="false")
    is_archived: Mapped[bool] = mapped_column(default=False, server_default="false")
    source: Mapped[str | None] = mapped_column(String(80))
    applied_date: Mapped[date] = mapped_column(index=True)
    follow_up_date: Mapped[date | None] = mapped_column(index=True)
    notes: Mapped[str | None] = mapped_column(Text)
    interviews: Mapped[list["Interview"]] = relationship(
        cascade="all, delete-orphan", order_by="Interview.scheduled_at"
    )
    contacts: Mapped[list["Contact"]] = relationship(cascade="all, delete-orphan")
    history: Mapped[list["StatusHistory"]] = relationship(
        cascade="all, delete-orphan", order_by="StatusHistory.changed_at"
    )


class Interview(Record, Base):
    __tablename__ = "interviews"
    application_id: Mapped[str] = mapped_column(ForeignKey("applications.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(20), default="upcoming", server_default="upcoming")
    preparation_notes: Mapped[str | None] = mapped_column(Text)
    questions_to_ask: Mapped[str | None] = mapped_column(Text)
    outcome_notes: Mapped[str | None] = mapped_column(Text)
    interview_type: Mapped[str] = mapped_column(String(40))
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    location: Mapped[str | None] = mapped_column(String(200))
    meeting_url: Mapped[str | None] = mapped_column(String(2048))
    interviewer_name: Mapped[str | None] = mapped_column(String(120))
    interviewer_email: Mapped[str | None] = mapped_column(String(254))
    notes: Mapped[str | None] = mapped_column(Text)


class Contact(Record, Base):
    __tablename__ = "contacts"
    application_id: Mapped[str] = mapped_column(ForeignKey("applications.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    title: Mapped[str | None] = mapped_column(String(120))
    email: Mapped[str | None] = mapped_column(String(254))
    phone: Mapped[str | None] = mapped_column(String(40))
    linkedin_url: Mapped[str | None] = mapped_column(String(2048))


class StatusHistory(Base):
    __tablename__ = "status_history"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    application_id: Mapped[str] = mapped_column(ForeignKey("applications.id", ondelete="CASCADE"), index=True)
    old_status: Mapped[str | None] = mapped_column(String(30))
    new_status: Mapped[str] = mapped_column(String(30))
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
