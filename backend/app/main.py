import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from app.api import applications, interviews, contacts, analytics, auth, demo, account
from app.core.config import settings
from app.core.database import SessionLocal

app = FastAPI(title="CareerCompass API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings().allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    if request.method in {"POST", "PATCH", "DELETE", "PUT"}:
        origin = request.headers.get("origin")
        if origin and origin not in settings().allowed_origins:
            return JSONResponse({"detail": "Request origin is not allowed"}, status_code=403)
        if request.headers.get("sec-fetch-site") == "cross-site":
            return JSONResponse({"detail": "Cross-site requests are not allowed"}, status_code=403)
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Cache-Control"] = "no-store"
    return response


@app.exception_handler(IntegrityError)
async def integrity_error(request: Request, exc: IntegrityError):
    return JSONResponse(
        {"detail": "This record conflicts with an existing record. Check for duplicates."}, status_code=409
    )


@app.exception_handler(Exception)
async def unhandled_error(request: Request, exc: Exception):
    logging.getLogger("careercompass").exception("Request failed")
    return JSONResponse({"detail": "Something went wrong. Please try again."}, status_code=500)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/ready")
def ready():
    with SessionLocal() as db:
        db.execute(text("SELECT 1"))
    return {"status": "ready"}


for router in [
    auth.router,
    account.router,
    applications.router,
    interviews.router,
    contacts.router,
    analytics.router,
    demo.router,
]:
    app.include_router(router, prefix="/api/v1")
