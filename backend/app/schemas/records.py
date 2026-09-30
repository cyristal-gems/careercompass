from datetime import date, datetime
from enum import StrEnum
from typing import Annotated
from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl, AwareDatetime, model_validator


class Status(StrEnum):
    saved = "saved"
    applied = "applied"
    screening = "screening"
    interview = "interview"
    assessment = "assessment"
    final_interview = "final_interview"
    offer = "offer"
    accepted = "accepted"
    rejected = "rejected"
    withdrawn = "withdrawn"
    ghosted = "ghosted"


class WorkType(StrEnum):
    remote = "remote"
    hybrid = "hybrid"
    on_site = "on_site"


class EmploymentType(StrEnum):
    full_time = "full_time"
    part_time = "part_time"
    contract = "contract"
    internship = "internship"
    temporary = "temporary"


class InterviewState(StrEnum):
    upcoming = "upcoming"
    completed = "completed"
    cancelled = "cancelled"
    rescheduled = "rescheduled"


class InterviewType(StrEnum):
    recruiter_call = "recruiter_call"
    phone_screen = "phone_screen"
    technical = "technical"
    behavioral = "behavioral"
    hiring_manager = "hiring_manager"
    panel = "panel"
    final = "final"


class Input(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Output(BaseModel):
    model_config = ConfigDict(from_attributes=True)


Text200 = Annotated[str, Field(min_length=1, max_length=200)]
Salary = Annotated[int, Field(ge=0, le=100000000)]


class ApplicationCreate(Input):
    company: Text200
    position: Text200
    status: Status
    applied_date: date
    location: Annotated[str, Field(max_length=200)] | None = None
    employment_type: EmploymentType | None = None
    work_type: WorkType | None = None
    salary_min: Salary | None = None
    salary_max: Salary | None = None
    company_website: HttpUrl | None = None
    priority: bool = False
    is_archived: bool = False
    job_url: HttpUrl | None = None
    source: Annotated[str, Field(max_length=80)] | None = None
    follow_up_date: date | None = None
    notes: Annotated[str, Field(max_length=20000)] | None = None

    @model_validator(mode="after")
    def salary_order(self):
        if self.salary_min is not None and self.salary_max is not None and self.salary_min > self.salary_max:
            raise ValueError("Minimum salary must not exceed maximum salary")
        return self


class ApplicationPatch(Input):
    company: Text200 | None = None
    position: Text200 | None = None
    status: Status | None = None
    applied_date: date | None = None
    location: Annotated[str, Field(max_length=200)] | None = None
    employment_type: EmploymentType | None = None
    work_type: WorkType | None = None
    salary_min: Salary | None = None
    salary_max: Salary | None = None
    company_website: HttpUrl | None = None
    priority: bool = False
    is_archived: bool = False
    job_url: HttpUrl | None = None
    source: Annotated[str, Field(max_length=80)] | None = None
    follow_up_date: date | None = None
    notes: Annotated[str, Field(max_length=20000)] | None = None


class ApplicationOut(Output):
    id: str
    company: str
    position: str
    status: str
    applied_date: date
    location: str | None
    employment_type: str | None
    work_type: str | None
    salary_min: int | None
    salary_max: int | None
    company_website: str | None
    priority: bool
    is_archived: bool
    job_url: str | None
    source: str | None
    follow_up_date: date | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


class InterviewCreate(Input):
    application_id: str
    status: InterviewState = InterviewState.upcoming
    preparation_notes: Annotated[str, Field(max_length=20000)] | None = None
    questions_to_ask: Annotated[str, Field(max_length=20000)] | None = None
    outcome_notes: Annotated[str, Field(max_length=20000)] | None = None
    interview_type: InterviewType
    scheduled_at: AwareDatetime
    location: Annotated[str, Field(max_length=200)] | None = None
    meeting_url: HttpUrl | None = None
    interviewer_name: Annotated[str, Field(max_length=120)] | None = None
    interviewer_email: EmailStr | None = None
    notes: Annotated[str, Field(max_length=20000)] | None = None


class InterviewPatch(Input):
    status: InterviewState | None = None
    preparation_notes: Annotated[str, Field(max_length=20000)] | None = None
    questions_to_ask: Annotated[str, Field(max_length=20000)] | None = None
    outcome_notes: Annotated[str, Field(max_length=20000)] | None = None
    interview_type: InterviewType | None = None
    scheduled_at: AwareDatetime | None = None
    location: Annotated[str, Field(max_length=200)] | None = None
    meeting_url: HttpUrl | None = None
    interviewer_name: Annotated[str, Field(max_length=120)] | None = None
    interviewer_email: EmailStr | None = None
    notes: Annotated[str, Field(max_length=20000)] | None = None


class InterviewOut(Output):
    id: str
    application_id: str
    status: str
    preparation_notes: str | None
    questions_to_ask: str | None
    outcome_notes: str | None
    interview_type: str
    scheduled_at: datetime
    location: str | None
    meeting_url: str | None
    interviewer_name: str | None
    interviewer_email: str | None
    notes: str | None


class ContactCreate(Input):
    application_id: str
    name: Annotated[str, Field(min_length=1, max_length=120)]
    title: Annotated[str, Field(max_length=120)] | None = None
    email: EmailStr | None = None
    phone: Annotated[str, Field(max_length=40)] | None = None
    linkedin_url: HttpUrl | None = None


class ContactOut(Output):
    id: str
    application_id: str
    name: str
    title: str | None
    email: str | None
    phone: str | None
    linkedin_url: str | None


class HistoryOut(Output):
    id: str
    old_status: str | None
    new_status: str
    changed_at: datetime


class ApplicationDetail(ApplicationOut):
    interviews: list[InterviewOut]
    contacts: list[ContactOut]
    history: list[HistoryOut]


class ApplicationPage(BaseModel):
    items: list[ApplicationOut]
    total: int
    page: int
    page_size: int
