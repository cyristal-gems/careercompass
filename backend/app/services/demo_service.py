from datetime import datetime, time, timedelta, timezone
from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.models.entities import Application, Contact, Interview, StatusHistory, User, utcnow


def seed(db: Session, user_id: str) -> dict:
    db.scalar(select(User).where(User.id == user_id).with_for_update())
    if db.scalar(select(func.count()).select_from(Application).where(Application.user_id == user_id)):
        raise HTTPException(409, "Sample data can only be added to an empty workspace")
    today = utcnow().date()
    records = [
        ("Linear", "Product Designer", "interview", 2, "Referral", "New York, NY", "hybrid", 125000, 165000),
        (
            "Notion",
            "Frontend Engineer",
            "applied",
            3,
            "Company Website",
            "San Francisco, CA",
            "remote",
            140000,
            180000,
        ),
        ("Stripe", "Security Engineer", "screening", 4, "LinkedIn", "New York, NY", "hybrid", 155000, 195000),
        ("Figma", "Product Engineer", "offer", 17, "Referral", "San Francisco, CA", "remote", 150000, 190000),
        (
            "Vercel",
            "Developer Experience Engineer",
            "applied",
            6,
            "Company Website",
            "Remote",
            "remote",
            130000,
            170000,
        ),
        ("CrowdStrike", "SOC Analyst", "interview", 8, "LinkedIn", "Austin, TX", "remote", 85000, 105000),
        (
            "Microsoft",
            "Security Analyst",
            "assessment",
            10,
            "Indeed",
            "Seattle, WA",
            "hybrid",
            100000,
            135000,
        ),
        (
            "Cloudflare",
            "Solutions Engineer",
            "rejected",
            15,
            "LinkedIn",
            "Austin, TX",
            "hybrid",
            120000,
            160000,
        ),
        ("GitHub", "Software Engineer", "applied", 12, "Company Website", "Remote", "remote", 135000, 175000),
        ("Spotify", "Platform Engineer", "ghosted", 34, "Indeed", "New York, NY", "hybrid", 130000, 170000),
        (
            "Asana",
            "Product Designer",
            "withdrawn",
            21,
            "LinkedIn",
            "San Francisco, CA",
            "on_site",
            115000,
            155000,
        ),
        ("Dropbox", "Frontend Engineer", "saved", 1, "Company Website", "Remote", "remote", 130000, 160000),
        ("Datadog", "Security Engineer", "applied", 2, "Recruiter", "Boston, MA", "hybrid", 135000, 180000),
        ("Canva", "Frontend Engineer", "applied", 3, "Handshake", "Austin, TX", "remote", 110000, 150000),
        ("Atlassian", "Software Engineer", "rejected", 24, "Career Fair", "Remote", "remote", 130000, 170000),
        ("Twilio", "Security Analyst", "applied", 7, "Glassdoor", "Denver, CO", "remote", 95000, 125000),
    ]
    for n, (company, position, status, ago, source, location, work, low, high) in enumerate(records):
        applied = today - timedelta(days=ago)
        stamp = datetime.combine(applied, time(14), tzinfo=timezone.utc)
        item = Application(
            user_id=user_id,
            company=company,
            position=position,
            status=status,
            applied_date=applied,
            source=source,
            location=location,
            work_type=work,
            employment_type="full_time",
            salary_min=low,
            salary_max=high,
            job_url=None,
            follow_up_date=today + timedelta(days=n - 2) if n in [2, 3, 4] else None,
            notes="Fictional sample application. Replace these notes with your own research and preparation.",
            created_at=stamp,
            updated_at=utcnow(),
        )
        item.history.append(
            StatusHistory(
                old_status=None, new_status="saved" if status == "saved" else "applied", changed_at=stamp
            )
        )
        prior = "applied"
        if status in {"interview", "offer", "assessment", "screening"}:
            item.history.append(
                StatusHistory(old_status=prior, new_status="screening", changed_at=stamp + timedelta(days=1))
            )
            prior = "screening"
        if status == "offer":
            item.history.append(
                StatusHistory(old_status=prior, new_status="interview", changed_at=stamp + timedelta(days=5))
            )
            prior = "interview"
            item.interviews.append(
                Interview(
                    interview_type="technical",
                    status="completed",
                    scheduled_at=stamp + timedelta(days=5),
                    interviewer_name="Jordan Lee",
                    notes="Sample: discussed product architecture.",
                )
            )
        if status not in {"applied", "saved", "screening"}:
            item.history.append(
                StatusHistory(
                    old_status=prior, new_status=status, changed_at=stamp + timedelta(days=min(ago, 9))
                )
            )
        if n in [0, 5]:
            item.interviews.append(
                Interview(
                    interview_type="hiring_manager" if n == 0 else "technical",
                    scheduled_at=datetime.combine(
                        today + timedelta(days=1 if n == 0 else 3),
                        time(18 if n == 0 else 15),
                        tzinfo=timezone.utc,
                    ),
                    interviewer_name="Taylor Morgan",
                    notes="Sample: prepare questions about the team and role.",
                )
            )
            item.contacts.append(Contact(name="Taylor Morgan", title="Recruiter", email="taylor@example.com"))
        db.add(item)
    db.commit()
    return {"created": len(records)}
