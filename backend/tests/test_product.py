import csv
import io
from datetime import timedelta
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import digest
from app.models.entities import ResetToken, utcnow

BASE = "/api/v1"
PAYLOAD = {
    "company": "CrowdStrike",
    "position": "SOC Analyst",
    "status": "applied",
    "applied_date": "2026-09-18",
    "work_type": "remote",
}


def create(client, **changes):
    result = client.post(BASE + "/applications", json=PAYLOAD | changes)
    assert result.status_code == 201, result.text
    return result.json()


def test_create_application(client):
    data = create(client)
    assert data["company"] == "CrowdStrike"
    assert "user_id" not in data


def test_get_application(client):
    data = create(client)
    result = client.get(BASE + "/applications/" + data["id"]).json()
    assert result["history"][0]["new_status"] == "applied"


def test_update_application(client):
    data = create(client)
    url = BASE + "/applications/" + data["id"]
    assert client.patch(url, json={"status": "interview"}).status_code == 200
    client.patch(url, json={"notes": "Prepare questions"})
    result = client.get(url).json()
    assert len(result["history"]) == 2
    assert result["history"][1]["old_status"] == "applied"
    assert client.patch(url, json={"company": None}).status_code == 422


def test_delete_application(client):
    data = create(client)
    url = BASE + "/applications/" + data["id"]
    assert client.delete(url).status_code == 204
    assert client.get(url).status_code == 404


@pytest.mark.parametrize(
    "patch",
    [
        {"status": "invalid"},
        {"salary_min": -1},
        {"salary_min": 100, "salary_max": 10},
        {"user_id": "someone"},
        {"job_url": "javascript:alert(1)"},
    ],
)
def test_invalid_application_status(client, patch):
    assert client.post(BASE + "/applications", json=PAYLOAD | patch).status_code == 422


def test_search_filter_sort(client):
    create(client)
    create(client, company="Microsoft", position="Security Analyst", work_type="hybrid")
    result = client.get(BASE + "/applications?search=analyst&work_type=remote&sort=company").json()
    assert result["total"] == 1
    assert result["items"][0]["company"] == "CrowdStrike"
    assert client.get(BASE + "/applications?sort=password_hash").status_code == 422
    assert client.get(BASE + "/applications?search=%25").json()["total"] == 0


def test_create_interview(client):
    app = create(client)
    result = client.post(
        BASE + "/interviews",
        json={
            "application_id": app["id"],
            "interview_type": "technical",
            "scheduled_at": "2026-10-01T15:00:00Z",
        },
    )
    assert result.status_code == 201
    assert len(client.get(BASE + "/applications/" + app["id"]).json()["interviews"]) == 1


def test_update_interview(client):
    app = create(client)
    record = client.post(
        BASE + "/interviews",
        json={
            "application_id": app["id"],
            "interview_type": "technical",
            "scheduled_at": "2026-10-01T15:00:00Z",
        },
    ).json()
    url = BASE + "/interviews/" + record["id"]
    assert client.patch(url, json={"notes": "System design"}).status_code == 200
    assert client.patch(url, json={"scheduled_at": None}).status_code == 422
    assert client.delete(url).status_code == 204


def test_analytics_summary(client):
    create(client)
    create(client, company="Linear", status="offer")
    result = client.get(BASE + "/analytics/summary").json()
    assert result["total_applications"] == 2
    assert result["response_rate"] == 50
    assert result["offer_rate"] == 50
    assert result["average_time_to_response"] is None


def test_application_funnel(client):
    app = create(client)
    client.patch(BASE + "/applications/" + app["id"], json={"status": "offer"})
    client.patch(BASE + "/applications/" + app["id"], json={"status": "withdrawn"})
    result = client.get(BASE + "/analytics/funnel").json()
    assert [item["count"] for item in result] == [1, 1, 1, 1]


def test_export_csv(client):
    create(client, company="=HYPERLINK(1)")
    result = client.get(BASE + "/applications/export/csv")
    assert result.status_code == 200
    rows = list(csv.DictReader(io.StringIO(result.text)))
    assert rows[0]["company"].startswith("'=")


def test_import_atomic_and_duplicates(client):
    bad = "company,position,status,applied_date\nA,Engineer,applied,2026-09-20\nB,Engineer,nope,2026-09-20"
    assert (
        client.post(BASE + "/applications/import/csv", files={"file": ("apps.csv", bad)}).status_code == 422
    )
    assert client.get(BASE + "/applications").json()["total"] == 0
    good = bad.replace("nope", "applied")
    assert (
        client.post(BASE + "/applications/import/csv", files={"file": ("apps.csv", good)}).json()["imported"]
        == 2
    )
    assert (
        client.post(BASE + "/applications/import/csv", files={"file": ("apps.csv", good)}).json()[
            "duplicates_skipped"
        ]
        == 2
    )


def test_user_cannot_access_another_users_application(client):
    record = create(client)
    interview = client.post(
        BASE + "/interviews",
        json={
            "application_id": record["id"],
            "interview_type": "technical",
            "scheduled_at": "2026-10-01T15:00:00Z",
        },
    ).json()
    contact = client.post(
        BASE + "/contacts", json={"application_id": record["id"], "name": "Recruiter"}
    ).json()
    with TestClient(app) as other:
        other.post(
            BASE + "/auth/register",
            json={"email": "other@example.com", "password": "secure-password-123", "first_name": "Other"},
        )
        url = BASE + "/applications/" + record["id"]
        assert other.get(url).status_code == 404
        assert other.patch(url, json={"status": "offer"}).status_code == 404
        assert other.delete(url).status_code == 404
        assert other.get(url + "/history").status_code == 404
        assert other.get(BASE + "/interviews/" + interview["id"]).status_code == 404
        assert other.delete(BASE + "/contacts/" + contact["id"]).status_code == 404
        assert other.get(BASE + "/analytics/summary").json()["total_applications"] == 0
        assert other.get(BASE + "/applications").json()["total"] == 0
        assert len(list(csv.DictReader(io.StringIO(other.get(BASE + "/applications/export/csv").text)))) == 0
        assert (
            other.post(
                BASE + "/contacts", json={"application_id": record["id"], "name": "Intruder"}
            ).status_code
            == 404
        )


def test_login_logout_expiration_and_csrf(client):
    cookie = client.cookies.get("jobtrackr_session")
    assert client.post(BASE + "/auth/logout").status_code == 204
    assert client.get(BASE + "/auth/me").status_code == 401
    client.cookies.set("jobtrackr_session", cookie)
    assert client.get(BASE + "/auth/me").status_code == 401
    client.cookies.clear()
    assert (
        client.post(
            BASE + "/auth/login", json={"email": "alex@example.com", "password": "secure-password-123"}
        ).status_code
        == 200
    )
    assert (
        client.post(
            BASE + "/applications", json=PAYLOAD, headers={"origin": "https://evil.example"}
        ).status_code
        == 403
    )


def test_password_reset_revokes_sessions(client, database):
    user = client.get(BASE + "/auth/me").json()
    token = "test-reset-token-of-sufficient-length"
    with database() as db:
        db.add(
            ResetToken(
                token_hash=digest(token), user_id=user["id"], expires_at=utcnow() + timedelta(minutes=10)
            )
        )
        db.commit()
    data = {"token": token, "password": "a-new-secure-password"}
    assert client.post(BASE + "/auth/password-reset/confirm", json=data).status_code == 200
    assert client.get(BASE + "/auth/me").status_code == 401
    assert client.post(BASE + "/auth/password-reset/confirm", json=data).status_code == 400
    assert (
        client.post(
            BASE + "/auth/login", json={"email": user["email"], "password": data["password"]}
        ).status_code
        == 200
    )


def test_session_expiration(client, database):
    from app.models.entities import AuthSession

    cookie = client.cookies.get("jobtrackr_session")
    with database() as db:
        session = db.get(AuthSession, digest(cookie))
        session.expires_at = utcnow() - timedelta(seconds=1)
        db.commit()
    assert client.get(BASE + "/auth/me").status_code == 401


def test_contact_crud_and_cascade(client):
    item = create(client)
    payload = {"application_id": item["id"], "name": "Taylor", "email": "taylor@example.com"}
    contact = client.post(BASE + "/contacts", json=payload)
    assert contact.status_code == 201
    url = BASE + "/contacts/" + contact.json()["id"]
    assert client.patch(url, json=payload | {"title": "Recruiter"}).json()["title"] == "Recruiter"
    client.delete(BASE + "/applications/" + item["id"])
    assert client.get(url).status_code == 404
    assert client.get(BASE + "/contacts").json() == []


def test_analytics_timing_and_source(client, database):
    from app.models.entities import Application, Interview, StatusHistory

    item = create(client, applied_date=(utcnow().date() - timedelta(days=20)).isoformat(), source="Referral")
    with database() as db:
        app = db.get(Application, item["id"])
        app.status = "offer"
        app.history.extend(
            [
                StatusHistory(
                    old_status="applied", new_status="screening", changed_at=utcnow() - timedelta(days=18)
                ),
                StatusHistory(
                    old_status="screening", new_status="interview", changed_at=utcnow() - timedelta(days=15)
                ),
                StatusHistory(
                    old_status="interview", new_status="offer", changed_at=utcnow() - timedelta(days=10)
                ),
            ]
        )
        app.interviews.append(
            Interview(
                interview_type="technical", status="completed", scheduled_at=utcnow() - timedelta(days=15)
            )
        )
        db.commit()
    result = client.get(BASE + "/analytics").json()
    assert result["summary"]["average_time_to_response"] == 2
    assert result["summary"]["average_time_to_interview"] == 5
    assert result["summary"]["average_time_interview_to_offer"] == 5
    assert result["sources"][0]["interview_rate"] == 100


def test_saved_and_future_interview_excluded(client):
    create(client, company="Saved Company", status="saved")
    item = create(client)
    client.post(
        BASE + "/interviews",
        json={
            "application_id": item["id"],
            "interview_type": "technical",
            "scheduled_at": (utcnow() + timedelta(days=30)).isoformat(),
        },
    )
    summary = client.get(BASE + "/analytics/summary").json()
    assert summary["total_applications"] == 2
    assert summary["submitted_applications"] == 1
    assert summary["interviews"] == 0
    assert summary["response_rate"] == 0


def test_demo_only_empty_workspace(client):
    assert client.post(BASE + "/demo").status_code == 201
    assert client.get(BASE + "/applications").json()["total"] == 16
    assert client.post(BASE + "/demo").status_code == 409


def test_throttle_login(client):
    for _ in range(10):
        assert (
            client.post(
                BASE + "/auth/login", json={"email": "alex@example.com", "password": "wrong-password-123"}
            ).status_code
            == 401
        )
    assert (
        client.post(
            BASE + "/auth/login", json={"email": "alex@example.com", "password": "wrong-password-123"}
        ).status_code
        == 429
    )


def test_reset_email_delivery(client, monkeypatch):
    from app.core.config import settings
    from app.services import auth_service
    from urllib.parse import urlparse, parse_qs

    messages = []

    class SMTP:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def starttls(self):
            pass

        def send_message(self, message):
            messages.append(message)

    monkeypatch.setattr(settings(), "smtp_host", "smtp.example.com")
    monkeypatch.setattr(settings(), "smtp_from", "security@example.com")
    monkeypatch.setattr(auth_service.smtplib, "SMTP", SMTP)
    response = client.post(BASE + "/auth/password-reset", json={"email": "alex@example.com"})
    assert response.status_code == 200
    assert "token" not in response.text
    assert len(messages) == 1
    url = next(line for line in messages[0].get_content().splitlines() if line.startswith("http"))
    token = parse_qs(urlparse(url).query)["token"][0]
    assert (
        client.post(
            BASE + "/auth/password-reset/confirm", json={"token": token, "password": "reset-via-email-123"}
        ).status_code
        == 200
    )


def test_csv_row_limits_and_duplicate_creation(client):
    create(client)
    assert client.post(BASE + "/applications", json=PAYLOAD).status_code == 409
    response = client.post(BASE + "/applications/import/csv", files={"file": ("large.csv", "a" * 2_000_001)})
    assert response.status_code == 413


def test_salary_partial_update_validation(client):
    item = create(client, salary_min=100000, salary_max=120000)
    url = BASE + "/applications/" + item["id"]
    assert client.patch(url, json={"salary_min": 130000}).status_code == 422
    assert client.patch(url, json={"salary_max": None}).status_code == 200
    assert client.get(url).json()["salary_max"] is None


def test_organization_filters_and_csv_roundtrip(client):
    item = create(client, priority=True, is_archived=True, company_website="https://example.com")
    create(client, company="Active", status="interview")
    assert client.get(BASE + "/applications?priority=true").json()["total"] == 1
    assert client.get(BASE + "/applications?priority=false").json()["total"] == 1
    assert client.get(BASE + "/applications?view=archived").json()["items"][0]["id"] == item["id"]
    assert client.get(BASE + "/applications?view=active").json()["total"] == 1
    content = client.get(BASE + "/applications/export/csv").content
    client.delete(BASE + "/applications/" + item["id"])
    result = client.post(BASE + "/applications/import/csv", files={"file": ("export.csv", content)})
    assert result.status_code == 200
    restored = client.get(BASE + "/applications?priority=true").json()["items"][0]
    assert restored["is_archived"] is True
    assert restored["company_website"] == "https://example.com/"
    assert (
        client.patch(BASE + "/applications/" + restored["id"], json={"notes": "Updated"}).json()["priority"]
        is True
    )


def test_cancelled_interview_does_not_count_as_completed(client):
    item = create(client)
    interview = client.post(
        BASE + "/interviews",
        json={
            "application_id": item["id"],
            "interview_type": "technical",
            "scheduled_at": (utcnow() - timedelta(days=1)).isoformat(),
            "status": "cancelled",
            "preparation_notes": "Review systems",
            "questions_to_ask": "Team size?",
        },
    ).json()
    assert client.get(BASE + "/analytics/summary").json()["interviews"] == 0
    assert (
        client.patch(
            BASE + "/interviews/" + interview["id"],
            json={"status": "completed", "outcome_notes": "Positive discussion"},
        ).status_code
        == 200
    )
    assert client.get(BASE + "/analytics/summary").json()["interviews"] == 1
    assert (
        client.patch(BASE + "/interviews/" + interview["id"], json={"status": "invalid"}).status_code == 422
    )


def test_analytics_range_and_distributions(client):
    create(client, applied_date=(utcnow().date() - timedelta(days=60)).isoformat())
    create(client, company="Recent", applied_date=utcnow().date().isoformat())
    assert client.get(BASE + "/analytics?days=7&scoped=true").json()["summary"]["total_applications"] == 1
    assert client.get(BASE + "/analytics?days=90&scoped=true").json()["summary"]["total_applications"] == 2
    assert sum(x["count"] for x in client.get(BASE + "/analytics/weekdays").json()) == 2
    assert sum(x["count"] for x in client.get(BASE + "/analytics/response-times").json()) == 0
