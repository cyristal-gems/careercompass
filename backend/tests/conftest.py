import os
import secrets

os.environ.setdefault("SECRET_KEY", secrets.token_urlsafe(48))
os.environ.setdefault("DATABASE_URL", "sqlite://")
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.core.database import Base, get_db
from app.main import app


@pytest.fixture()
def database():
    url = os.environ.get("TEST_DATABASE_URL", "sqlite://")
    options = (
        {"connect_args": {"check_same_thread": False}, "poolclass": StaticPool} if url == "sqlite://" else {}
    )
    engine = create_engine(url, **options)
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)

    def override():
        with factory() as db:
            yield db

    app.dependency_overrides[get_db] = override
    yield factory
    app.dependency_overrides.clear()
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture()
def client(database):
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/auth/register",
            json={"email": "alex@example.com", "password": "secure-password-123", "first_name": "Alex"},
        )
        assert response.status_code == 201
        yield client
