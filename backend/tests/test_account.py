from datetime import timedelta
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from app.main import app
from app.models.entities import (
    Application,
    AuthSession,
    Contact,
    Interview,
    ResetToken,
    StatusHistory,
    User,
    utcnow,
)
from app.core.security import digest

BASE = "/api/v1"
LOGIN = {"email": "alex@example.com", "password": "secure-password-123"}


def test_logout_all_sessions(client):
    with TestClient(app) as second, TestClient(app) as other:
        assert second.post(BASE + "/auth/login", json=LOGIN).status_code == 200
        other.post(
            BASE + "/auth/register", json={**LOGIN, "email": "other@example.com", "first_name": "Other"}
        )
        assert client.post(BASE + "/account/logout-all").status_code == 204
        assert client.get(BASE + "/auth/me").status_code == 401
        assert second.get(BASE + "/auth/me").status_code == 401
        assert other.get(BASE + "/auth/me").status_code == 200
        assert second.post(BASE + "/auth/login", json=LOGIN).status_code == 200


def test_account_deletion(client, database):
    user = client.get(BASE + "/auth/me").json()
    record = client.post(
        BASE + "/applications",
        json={
            "company": "Example",
            "position": "Engineer",
            "status": "applied",
            "applied_date": "2026-09-27",
        },
    ).json()
    client.post(BASE + "/contacts", json={"application_id": record["id"], "name": "Recruiter"})
    client.post(
        BASE + "/interviews",
        json={
            "application_id": record["id"],
            "interview_type": "technical",
            "scheduled_at": "2026-10-01T15:00:00Z",
        },
    )
    with database() as db:
        db.add(
            ResetToken(
                token_hash=digest("account-delete-reset-token"),
                user_id=user["id"],
                expires_at=utcnow() + timedelta(minutes=30),
            )
        )
        db.commit()
    with TestClient(app) as second, TestClient(app) as other:
        second.post(BASE + "/auth/login", json=LOGIN)
        other.post(
            BASE + "/auth/register", json={**LOGIN, "email": "other@example.com", "first_name": "Other"}
        )
        other_record = other.post(
            BASE + "/applications",
            json={
                "company": "Other",
                "position": "Engineer",
                "status": "applied",
                "applied_date": "2026-09-27",
            },
        ).json()
        assert (
            client.request(
                "DELETE", BASE + "/account", json={"confirmation": "DELETE", "password": LOGIN["password"]}
            ).status_code
            == 204
        )
        assert second.get(BASE + "/auth/me").status_code == 401
        assert client.get(BASE + "/auth/me").status_code == 401
        assert other.get(BASE + "/applications/" + other_record["id"]).status_code == 200
        assert second.post(BASE + "/auth/login", json=LOGIN).status_code == 401
        with database() as db:
            assert db.get(User, user["id"]) is None
            assert db.get(Application, record["id"]) is None
            for model in (Contact, Interview, ResetToken):
                assert db.scalar(select(func.count()).select_from(model)) == 0
            assert (
                db.scalar(
                    select(func.count())
                    .select_from(StatusHistory)
                    .where(StatusHistory.application_id == record["id"])
                )
                == 0
            )
            assert (
                db.scalar(
                    select(func.count()).select_from(AuthSession).where(AuthSession.user_id == user["id"])
                )
                == 0
            )


def test_account_deletion_requires_confirmation_and_password(client):
    assert (
        client.request(
            "DELETE", BASE + "/account", json={"confirmation": "delete", "password": LOGIN["password"]}
        ).status_code
        == 422
    )
    assert (
        client.request(
            "DELETE", BASE + "/account", json={"confirmation": "DELETE", "password": "incorrect-password"}
        ).status_code
        == 403
    )
    assert client.get(BASE + "/auth/me").status_code == 200


def test_account_endpoints_require_authentication():
    with TestClient(app) as anonymous:
        assert anonymous.post(BASE + "/account/logout-all").status_code == 401
        assert (
            anonymous.request(
                "DELETE", BASE + "/account", json={"confirmation": "DELETE", "password": LOGIN["password"]}
            ).status_code
            == 401
        )


def test_reset_support_fallback(client, monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings(), "smtp_host", None)
    result = client.post(BASE + "/auth/password-reset", json={"email": LOGIN["email"]})
    assert result.status_code == 503
    assert "cyrisjoseph@outlook.com" in result.json()["detail"]
