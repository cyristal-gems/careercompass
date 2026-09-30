"use client";
import { Toast } from "./ui";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  ExternalLink,
  Plus,
  MapPin,
  CalendarDays,
  Mail,
  Clock3,
} from "lucide-react";
import { api, label, dateLabel, salary } from "@/lib/api";
import { statuses, type Detail, type Interview, type Contact } from "@/types";
import { Badge, Company, Empty, ErrorMessage, Loading, Modal } from "./ui";
import { ApplicationForm } from "./application-form";
import { InterviewForm } from "./interview-form";
import { ContactForm } from "./contact-form";
export function ApplicationDetail({
  id,
  contactError = false,
  created = false,
}: {
  id: string;
  contactError?: boolean;
  created?: boolean;
}) {
  const router = useRouter();
  const [data, setData] = useState<Detail | null>(null),
    [error, setError] = useState(
      contactError
        ? "Application saved, but the recruiter contact could not be added. Add the contact in the People section."
        : "",
    ),
    [version, setVersion] = useState(0),
    [editing, setEditing] = useState(false),
    [interview, setInterview] = useState<Interview | "new" | null>(null),
    [contact, setContact] = useState<Contact | "new" | null>(null),
    [deleting, setDeleting] = useState<{
      path: string;
      title: string;
      application?: boolean;
    } | null>(null),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(created ? "Application created." : "");
  useEffect(() => {
    let active = true;
    api<Detail>(`/applications/${id}`)
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id, version]);
  function refresh(message = "Changes saved.") {
    setEditing(false);
    setInterview(null);
    setContact(null);
    setVersion((v) => v + 1);
    setNotice(message);
  }
  async function organize(key: "priority" | "is_archived", value: boolean) {
    setBusy(true);
    try {
      await api(`/applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ [key]: value }),
      });
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function status(value: string) {
    setBusy(true);
    try {
      await api(`/applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: value }),
      });
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(deleting.path, { method: "DELETE" });
      if (deleting.application) router.push("/applications?deleted=1");
      else {
        setDeleting(null);
        refresh("Record deleted.");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!data) return error ? <ErrorMessage message={error} /> : <Loading />;
  return (
    <>
      <Link className="back-link" href="/applications">
        <ArrowLeft size={16} />
        All applications
      </Link>
      <div className="page-heading detail-heading">
        <div className="detail-title">
          <Company name={data.company} />
          <div>
            <div className="eyebrow">{data.company}</div>
            <h1>{data.position}</h1>
            <p>
              <MapPin size={15} />
              {data.location || "Location not specified"}
              <span>·</span>Applied {dateLabel(data.applied_date)}
            </p>
          </div>
        </div>
        <div className="heading-actions">
          <button
            className={`button ${data.priority ? "selected" : ""}`}
            aria-pressed={data.priority}
            disabled={busy}
            onClick={() => organize("priority", !data.priority)}
          >
            ★ Priority
          </button>
          <button
            className="button"
            disabled={busy}
            onClick={() => organize("is_archived", !data.is_archived)}
          >
            {data.is_archived ? "Unarchive" : "Archive"}
          </button>
          <button className="button" onClick={() => setEditing(true)}>
            <Pencil size={15} />
            Edit
          </button>
          <button
            className="icon-button danger"
            aria-label="Delete application"
            onClick={() =>
              setDeleting({
                path: `/applications/${id}`,
                title: "Delete this application?",
                application: true,
              })
            }
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      {error && <ErrorMessage message={error} />}{" "}
      {notice && <Toast message={notice} onDismiss={() => setNotice("")} />}
      <div className="detail-grid">
        <div className="stack">
          <section className="panel padded">
            <div className="panel-heading flush">
              <h2>Opportunity details</h2>
              <Badge status={data.status} />
            </div>
            <dl className="detail-fields">
              {[
                {
                  k: "Salary range · USD / year",
                  v: salary(data.salary_min, data.salary_max),
                },
                { k: "Work type", v: label(data.work_type) },
                { k: "Employment type", v: label(data.employment_type) },
                { k: "Job source", v: data.source || "Not specified" },
                {
                  k: "Follow-up date",
                  v: data.follow_up_date
                    ? dateLabel(data.follow_up_date)
                    : "Not scheduled",
                },
                { k: "Application date", v: dateLabel(data.applied_date) },
              ].map((f) => (
                <div key={f.k}>
                  <dt>{f.k}</dt>
                  <dd>{f.v}</dd>
                </div>
              ))}
            </dl>
            {data.company_website && (
              <a
                className="button"
                href={data.company_website}
                target="_blank"
                rel="noopener noreferrer"
              >
                Company website <ExternalLink size={15} />
              </a>
            )}
            {data.job_url && (
              <a
                href={data.job_url}
                className="button"
                target="_blank"
                rel="noopener noreferrer"
              >
                View job posting <ExternalLink size={15} />
              </a>
            )}
            <label className="status-control">
              Update status
              <select
                value={data.status}
                disabled={busy}
                onChange={(e) => status(e.target.value)}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {label(s)}
                  </option>
                ))}
              </select>
            </label>
          </section>
          <section className="panel padded">
            <div className="panel-heading flush">
              <h2>Notes</h2>
              <button
                className="icon-button"
                aria-label="Edit notes"
                onClick={() => setEditing(true)}
              >
                <Pencil size={16} />
              </button>
            </div>
            <p className="notes">
              {data.notes ||
                "Add notes about the role, your conversations, or what to prepare next."}
            </p>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>Interviews</h2>
              <button className="text-link" onClick={() => setInterview("new")}>
                <Plus size={15} />
                Schedule
              </button>
            </div>
            {data.interviews.map((i) => (
              <div className="record-row" key={i.id}>
                <CalendarDays size={21} />
                <div className="record-main">
                  <strong>
                    {label(i.interview_type)} · {label(i.status)}
                  </strong>
                  <small>
                    {dateLabel(i.scheduled_at)} ·{" "}
                    {new Date(i.scheduled_at).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </small>
                  {i.interviewer_name && (
                    <small>With {i.interviewer_name}</small>
                  )}
                  {i.location && <small>{i.location}</small>}
                  {i.meeting_url && (
                    <a
                      className="text-link"
                      href={i.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Meeting link <ExternalLink size={13} />
                    </a>
                  )}
                  {i.notes && <p className="notes">{i.notes}</p>}
                  {[
                    ["Preparation", i.preparation_notes],
                    ["Questions to ask", i.questions_to_ask],
                    ["Outcome", i.outcome_notes],
                  ].map(
                    ([name, value]) =>
                      value && (
                        <div key={name}>
                          <small>{name}</small>
                          <p className="notes">{value}</p>
                        </div>
                      ),
                  )}
                </div>
                <button
                  className="icon-button"
                  aria-label="Edit interview"
                  onClick={() => setInterview(i)}
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="icon-button danger"
                  aria-label="Delete interview"
                  onClick={() =>
                    setDeleting({
                      path: `/interviews/${i.id}`,
                      title: "Delete this interview?",
                    })
                  }
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {!data.interviews.length && (
              <Empty title="No interviews scheduled">
                <p>Your conversations and interview notes will live here.</p>
              </Empty>
            )}
          </section>
        </div>
        <div className="stack">
          <section className="panel">
            <div className="panel-heading">
              <h2>People</h2>
              <button className="text-link" onClick={() => setContact("new")}>
                <Plus size={15} />
                Add contact
              </button>
            </div>
            {data.contacts.map((c) => (
              <div className="contact-record" key={c.id}>
                <div className="record-row">
                  <span className="avatar">{c.name[0]}</span>
                  <div className="record-main">
                    <strong>{c.name}</strong>
                    <small>{c.title || "Contact"}</small>
                  </div>
                  <button
                    className="icon-button"
                    aria-label={`Edit ${c.name}`}
                    onClick={() => setContact(c)}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="icon-button danger"
                    aria-label={`Delete ${c.name}`}
                    onClick={() =>
                      setDeleting({
                        path: `/contacts/${c.id}`,
                        title: "Delete this contact?",
                      })
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="contact-links">
                  {c.email && (
                    <a href={`mailto:${c.email}`}>
                      <Mail size={14} />
                      {c.email}
                    </a>
                  )}
                  {c.phone && <span>{c.phone}</span>}
                  {c.linkedin_url && (
                    <a
                      href={c.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      LinkedIn <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              </div>
            ))}
            {!data.contacts.length && (
              <Empty title="Keep your contacts close">
                <p>Add a recruiter or someone on the hiring team.</p>
              </Empty>
            )}
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>Application history</h2>
              <Clock3 size={17} />
            </div>
            <ol className="timeline">
              {[...data.history].reverse().map((h) => (
                <li key={h.id}>
                  <span className={`timeline-dot status-${h.new_status}`} />
                  <strong>
                    {h.old_status
                      ? `${label(h.old_status)} → ${label(h.new_status)}`
                      : `Added as ${label(h.new_status)}`}
                  </strong>
                  <small>
                    {dateLabel(h.changed_at)} ·{" "}
                    {new Date(h.changed_at).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </small>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
      {editing && (
        <Modal title="Edit application" onClose={() => setEditing(false)}>
          <ApplicationForm
            initial={data}
            onSaved={() => refresh("Application updated.")}
            onCancel={() => setEditing(false)}
          />
        </Modal>
      )}
      {interview && (
        <Modal
          title={interview === "new" ? "Schedule interview" : "Edit interview"}
          onClose={() => setInterview(null)}
        >
          <InterviewForm
            applicationId={id}
            initial={interview === "new" ? undefined : interview}
            onSaved={() =>
              refresh(
                interview === "new"
                  ? "Interview created."
                  : "Interview updated.",
              )
            }
            onCancel={() => setInterview(null)}
          />
        </Modal>
      )}
      {contact && (
        <Modal
          title={contact === "new" ? "Add contact" : "Edit contact"}
          onClose={() => setContact(null)}
        >
          <ContactForm
            applicationId={id}
            initial={contact === "new" ? undefined : contact}
            onSaved={() => refresh("Contact saved.")}
            onCancel={() => setContact(null)}
          />
        </Modal>
      )}
      {deleting && (
        <Modal
          title={deleting.title}
          onClose={() => !busy && setDeleting(null)}
        >
          {error && <ErrorMessage message={error} />}
          <p className="muted">
            {deleting.application
              ? "This permanently removes the application, interviews, contacts, and status history."
              : "This permanently removes the record."}
          </p>
          <div className="form-actions">
            <button
              className="button"
              disabled={busy}
              onClick={() => setDeleting(null)}
            >
              Cancel
            </button>
            <button
              className="button destructive"
              disabled={busy}
              onClick={remove}
            >
              {busy ? "Deleting…" : "Delete"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
