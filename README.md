# JobTrackr

> Your job search, in focus.

## Summary

JobTrackr is a full-stack job application tracking and analytics platform that helps users manage applications, interviews, recruiter contacts, follow-ups, salary details, and application history in one private workspace. It also provides job-search analytics such as response rates, interview conversion, offer rates, application trends, source performance, and timing metrics through a responsive, dark-first interface designed for desktop, tablet, and mobile use.

## Key Features

- **Application Tracking:** Manage job applications, statuses, salaries, notes, and job sources from one dashboard.
- **Interview Management:** Track upcoming interviews, interview types, recruiter details, and meeting information.
- **Follow-Up Tracking:** Set follow-up dates and quickly see which applications need attention.
- **Job Search Analytics:** Review response rates, interview conversion, offer rates, application trends, and source performance.
- **Search & Filtering:** Find applications quickly by company, status, location, work type, date, or other criteria.
- **Status History:** Keep a timeline of how each application moves through the hiring process.
- **Data Import & Export:** Export application records to CSV and import validated data with duplicate detection.
- **Secure Accounts:** Keep each user's applications, interviews, contacts, and analytics private and separated.
- **Responsive Dark UI:** Use JobTrackr across desktop, tablet, and mobile with a clean dark-first interface.

## Tech Stack

- ***Python*** — Powers JobTrackr's backend logic, analytics, validation workflows, and data-processing features.
- ***FastAPI*** — Provides the REST API layer that connects the frontend to backend services and handles routing, dependencies, and API responses.
- ***SQLAlchemy*** — Manages communication between the Python backend and PostgreSQL through structured ORM models and relationships.
- ***Pydantic*** — Validates request and response data so application, interview, account, and analytics records follow the expected structure.
- ***Alembic*** — Manages version-controlled database migrations as JobTrackr's schema evolves.
- ***PostgreSQL*** — Stores user accounts, applications, interviews, contacts, status history, and other persistent platform data.
- ***Next.js*** — Provides the frontend framework, routing, rendering, and production-ready web application structure.
- ***React*** — Powers the interactive dashboard, forms, filters, application views, interview displays, and reusable interface components.
- ***TypeScript*** — Adds static typing to frontend code and helps keep API responses, application data, and component behavior consistent.
- ***Tailwind CSS*** — Builds the responsive dark-first interface, including layouts, typography, spacing, forms, cards, and status indicators.
- ***pytest*** — Verifies backend behavior across application management, analytics, authentication, validation, and user data isolation.
- ***GitHub Actions*** — Runs automated checks such as testing, linting, and build validation when changes are pushed to the repository.

## View the Trackr Here

[JobTrackr](https://jobtrackr.vercel.app.com)

## Contact

- **LinkedIn:** [linkedin.com/in/cyristalj](https://www.linkedin.com/in/cyristalj)
- **GitHub:** [github.com/cyristal-gems](https://github.com/cyristal-gems)
- **Email:** [cyrisjoseph@outlook.com](mailto:cyrisjoseph@outlook.com)
