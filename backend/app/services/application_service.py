import csv
import io
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session
from app.models.entities import Application, StatusHistory
from app.schemas.records import ApplicationCreate, ApplicationPatch

FIELDS = list(ApplicationCreate.model_fields)


def values(schema, exclude_unset: bool = False) -> dict:
    data = schema.model_dump(exclude_unset=exclude_unset)
    return {
        key: str(value) if (key.endswith("url") or key == "company_website") and value is not None else value
        for key, value in data.items()
    }


def owned(db: Session, user_id: str, record_id: str, lock: bool = False) -> Application:
    query = select(Application).where(Application.id == record_id, Application.user_id == user_id)
    item = db.scalar(query.with_for_update() if lock else query)
    if not item:
        raise HTTPException(404, "Application not found")
    return item


def create(db: Session, user_id: str, data: ApplicationCreate) -> Application:
    item = Application(user_id=user_id, **values(data))
    item.history.append(StatusHistory(old_status=None, new_status=data.status))
    db.add(item)
    db.flush()
    return item


def update(db: Session, item: Application, data: ApplicationPatch) -> Application:
    changes = values(data, True)
    merged = {key: getattr(item, key) for key in FIELDS} | changes
    try:
        ApplicationCreate.model_validate(merged)
    except ValidationError:
        raise HTTPException(422, "Check required fields and salary range")
    if "status" in changes and changes["status"] != item.status:
        item.history.append(StatusHistory(old_status=item.status, new_status=changes["status"]))
    for key, value in changes.items():
        setattr(item, key, value)
    db.flush()
    return item


def query_applications(db: Session, user_id: str, filters: dict):
    query = select(Application).where(Application.user_id == user_id)
    for key in ["priority", "is_archived"]:
        if filters.get(key) is not None:
            query = query.where(getattr(Application, key) == filters[key])
    view = filters.get("view", "all")
    if view == "archived":
        query = query.where(Application.is_archived.is_(True))
    elif view != "all":
        query = query.where(Application.is_archived.is_(False))
        if view == "active":
            query = query.where(
                Application.status.in_(["applied", "screening", "interview", "assessment", "final_interview"])
            )
        elif view == "interviews":
            query = query.where(Application.status.in_(["interview", "final_interview"]))
        elif view == "offers":
            query = query.where(Application.status.in_(["offer", "accepted"]))
        elif view == "followups":
            query = query.where(Application.follow_up_date.is_not(None))
    for key in ["status", "work_type", "employment_type", "source"]:
        if filters.get(key):
            query = query.where(getattr(Application, key) == filters[key])
    for key in ["company", "position", "location"]:
        if filters.get(key):
            query = query.where(getattr(Application, key).icontains(filters[key], autoescape=True))
    if filters.get("search"):
        text = filters["search"]
        query = query.where(
            or_(
                *[
                    getattr(Application, key).icontains(text, autoescape=True)
                    for key in ["company", "position", "location", "notes"]
                ]
            )
        )
    for key, column, op in [
        ("date_from", Application.applied_date, "ge"),
        ("date_to", Application.applied_date, "le"),
        ("salary_min", Application.salary_max, "ge"),
        ("salary_max", Application.salary_min, "le"),
    ]:
        if filters.get(key) is not None:
            query = query.where(column >= filters[key] if op == "ge" else column <= filters[key])
    total = db.scalar(select(func.count()).select_from(query.subquery()))
    sort = filters.get("sort", "-applied_date")
    key = sort.lstrip("-")
    if key not in [
        "applied_date",
        "company",
        "position",
        "status",
        "salary_min",
        "follow_up_date",
        "created_at",
    ]:
        raise HTTPException(422, "Unsupported sort field")
    column = getattr(Application, key)
    query = query.order_by(
        (column.desc() if sort.startswith("-") else column.asc()).nulls_last(), Application.id
    )
    return query, total


def export_csv(items: list[Application]) -> str:
    stream = io.StringIO()
    writer = csv.DictWriter(stream, fieldnames=FIELDS)
    writer.writeheader()
    for item in items:
        row = {key: getattr(item, key) for key in FIELDS}
        for key, value in row.items():
            if isinstance(value, str) and value.lstrip().startswith(("=", "+", "-", "@", "\t", "\r")):
                row[key] = "'" + value
        writer.writerow(row)
    return stream.getvalue()


def import_csv(db: Session, user_id: str, content: bytes) -> dict:
    try:
        reader = csv.DictReader(io.StringIO(content.decode("utf-8-sig")))
        if not reader.fieldnames or not {"company", "position", "status", "applied_date"}.issubset(
            reader.fieldnames
        ):
            raise HTTPException(422, "CSV must include company, position, status, and applied_date")
        if set(reader.fieldnames) - set(FIELDS) or len(set(reader.fieldnames)) != len(reader.fieldnames):
            raise HTTPException(422, "CSV has unknown or duplicate columns")
        parsed = []
        errors = []
        for number, row in enumerate(reader, 2):
            if number > 5001:
                raise HTTPException(413, "Import is limited to 5,000 rows")
            try:
                if None in row:
                    raise ValueError("Too many columns")
                data = {k: (v if v else None) for k, v in row.items()}
                if data.get("status"):
                    data["status"] = data["status"].lower().replace(" ", "_")
                parsed.append(ApplicationCreate.model_validate(data))
            except (ValidationError, ValueError):
                errors.append({"row": number, "message": "Invalid fields, date, status, or salary range"})
        if errors:
            raise HTTPException(
                422, {"message": "No rows imported. Correct these rows and try again.", "errors": errors[:50]}
            )
    except (UnicodeDecodeError, csv.Error):
        raise HTTPException(422, "Upload a valid UTF-8 CSV file")
    existing = set(
        db.execute(
            select(Application.company, Application.position, Application.applied_date).where(
                Application.user_id == user_id
            )
        ).all()
    )
    added = skipped = 0
    for item in parsed:
        identity = (item.company, item.position, item.applied_date)
        if identity in existing:
            skipped += 1
            continue
        create(db, user_id, item)
        existing.add(identity)
        added += 1
    db.commit()
    return {"imported": added, "duplicates_skipped": skipped}
