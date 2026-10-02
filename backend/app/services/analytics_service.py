from collections import Counter, defaultdict
from datetime import timedelta
from statistics import mean
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from app.core.security import aware
from app.models.entities import Application, utcnow

RESPONSE = {"screening", "interview", "assessment", "final_interview", "offer", "accepted", "rejected"}
INTERVIEW = {"interview", "final_interview", "offer", "accepted"}
OFFER = {"offer", "accepted"}
ACTIVE = {"applied", "screening", "interview", "assessment", "final_interview"}


def calculate(db: Session, user_id: str, days: int = 30, scoped: bool = False) -> dict:
    apps = db.scalars(
        select(Application)
        .where(Application.user_id == user_id)
        .options(selectinload(Application.history), selectinload(Application.interviews))
    ).all()
    today = utcnow().date()
    if scoped:
        apps = [a for a in apps if today - timedelta(days=days - 1) <= a.applied_date <= today]
    submitted = [a for a in apps if a.status != "saved"]
    denominator = len(submitted)

    def rate(count: int) -> float:
        return round(count / denominator * 100, 1) if denominator else 0

    responded = interviewed = offers = 0
    response_times, interview_times, offer_times = [], [], []
    sources = defaultdict(lambda: {"applications": 0, "interviews": 0})
    for app in submitted:
        reached = {h.new_status for h in app.history} | {app.status}
        completed = [
            aware(i.scheduled_at).date()
            for i in app.interviews
            if i.status == "completed" and aware(i.scheduled_at) <= utcnow()
        ]
        had_interview = bool(reached & INTERVIEW or completed)
        had_response = bool(reached & RESPONSE or completed)
        responded += had_response
        interviewed += had_interview
        offers += bool(reached & OFFER)
        source = sources[app.source or "Other"]
        source["applications"] += 1
        source["interviews"] += had_interview

        # Initial status snapshots prove a stage was reached, but do not invent its date.
        def first(stage):
            dates = [
                aware(h.changed_at).date()
                for h in app.history
                if h.old_status is not None and h.new_status in stage
            ]
            return min(dates) if dates else None

        response_date = first(RESPONSE)
        interview_dates = completed + ([first(INTERVIEW)] if first(INTERVIEW) else [])
        interview_date = min(interview_dates) if interview_dates else None
        offer_date = first(OFFER)
        if response_date and response_date >= app.applied_date:
            response_times.append((response_date - app.applied_date).days)
        if interview_date and interview_date >= app.applied_date:
            interview_times.append((interview_date - app.applied_date).days)
        if offer_date and interview_date and offer_date >= interview_date:
            offer_times.append((offer_date - interview_date).days)

    def avg(items: list[int]) -> float | None:
        return round(mean(items), 1) if items else None

    active = sum(a.status in ACTIVE and not a.is_archived for a in apps)
    rejections = sum(a.status == "rejected" for a in apps)
    counts = Counter(a.status for a in apps)
    dates = Counter(a.applied_date for a in submitted)
    return {
        "summary": {
            "total_applications": len(apps),
            "submitted_applications": denominator,
            "applications_this_month": sum(
                a.applied_date.year == today.year and a.applied_date.month == today.month for a in submitted
            ),
            "active_applications": active,
            "interviews": interviewed,
            "offers": offers,
            "rejections": rejections,
            "response_rate": rate(responded),
            "interview_rate": rate(interviewed),
            "offer_rate": rate(offers),
            "rejection_rate": rate(rejections),
            "active_application_rate": rate(active),
            "average_time_to_response": avg(response_times),
            "average_time_to_interview": avg(interview_times),
            "average_time_interview_to_offer": avg(offer_times),
        },
        "funnel": [
            {"stage": stage, "count": count}
            for stage, count in [
                ("Applied", denominator),
                ("Responded", responded),
                ("Interviewed", interviewed),
                ("Offer", offers),
            ]
        ],
        "trends": [
            {
                "date": (today - timedelta(days=offset)).isoformat(),
                "count": dates[today - timedelta(days=offset)],
            }
            for offset in reversed(range(days))
        ],
        "statuses": [{"status": status, "count": count} for status, count in sorted(counts.items())],
        "weekdays": [
            {"weekday": name, "count": sum(a.applied_date.weekday() == index for a in submitted)}
            for index, name in enumerate(
                ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            )
        ],
        "response-times": [
            {"range": name, "count": sum(low <= days <= high for days in response_times)}
            for name, low, high in [
                ("0–2 days", 0, 2),
                ("3–7 days", 3, 7),
                ("8–14 days", 8, 14),
                ("15–30 days", 15, 30),
                ("31+ days", 31, float("inf")),
            ]
        ],
        "sources": [
            {
                "source": key,
                **value,
                "interview_rate": round(value["interviews"] / value["applications"] * 100, 1),
            }
            for key, value in sorted(sources.items(), key=lambda pair: -pair[1]["applications"])
        ],
    }
