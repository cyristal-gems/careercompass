"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Plus,
  Clock3,
  Video,
  Pencil,
  ArrowUpRight,
} from "lucide-react";
import { api, allApplications, dateLabel, label } from "@/lib/api";
import type { Interview, Application } from "@/types";
import { Company, Empty, ErrorMessage, Loading, Modal, Toast } from "./ui";
import { InterviewForm } from "./interview-form";
export function Interviews() {
  const [items, setItems] = useState<Interview[] | null>(null),
    [apps, setApps] = useState<Application[]>([]),
    [error, setError] = useState(""),
    [tab, setTab] = useState("upcoming"),
    [editing, setEditing] = useState<Interview | "new" | null>(null),
    [notice, setNotice] = useState(""),
    [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    async function load() {
      const [interviews, applications] = await Promise.all([
        api<Interview[]>("/interviews"),
        allApplications(),
      ]);
      if (active) {
        setItems(interviews);
        setApps(applications);
      }
    }
    load().catch((e) => {
      if (active) setError(e.message);
    });
    return () => {
      active = false;
    };
  }, [version]);
  if (error) return <ErrorMessage message={error} />;
  if (!items) return <Loading />;
  const upcoming = items
    .filter((i) => ["upcoming", "rescheduled"].includes(i.status))
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  const past = items
    .filter((i) => ["completed", "cancelled"].includes(i.status))
    .sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at));
  const visible = tab === "upcoming" ? upcoming : past;
  return (
    <>
      {notice && <Toast message={notice} onDismiss={() => setNotice("")} />}
      <div className="page-heading">
        <div>
          <div className="eyebrow">MAKE A GREAT IMPRESSION</div>
          <h1>Your next conversations.</h1>
          <p>Prepare, show up, and take the next step.</p>
        </div>
        <button
          className="button primary"
          onClick={() => setEditing("new")}
          disabled={!apps.length}
        >
          <Plus size={16} />
          Schedule interview
        </button>
      </div>
      <div className="interview-banner">
        <span className="metric-icon lime">
          <CalendarDays size={24} />
        </span>
        <div>
          <strong>{upcoming.length} interviews ahead</strong>
          <p>Every conversation is a chance to find your fit.</p>
        </div>
      </div>
      <div className="tabs" role="group" aria-label="Interview period">
        <button
          aria-pressed={tab === "upcoming"}
          className={tab === "upcoming" ? "active" : ""}
          onClick={() => setTab("upcoming")}
        >
          Upcoming <span>{upcoming.length}</span>
        </button>
        <button
          aria-pressed={tab === "past"}
          className={tab === "past" ? "active" : ""}
          onClick={() => setTab("past")}
        >
          Completed / cancelled <span>{past.length}</span>
        </button>
      </div>
      <div className="interview-cards">
        {visible.map((i) => {
          const a = apps.find((a) => a.id === i.application_id);
          return (
            <article className="panel interview-card" key={i.id}>
              <div className="interview-card-top">
                <Company name={a?.company || "Interview"} />
                <span className="badge status-interview">
                  {label(i.interview_type)} · {label(i.status)}
                </span>
                <button
                  className="icon-button"
                  aria-label="Edit interview"
                  onClick={() => setEditing(i)}
                >
                  <Pencil size={15} />
                </button>
              </div>
              <h2>{a?.company || "Interview"}</h2>
              {["upcoming", "rescheduled"].includes(i.status) &&
                new Date(i.scheduled_at) < new Date() && (
                  <p>Past scheduled time · Update the interview outcome.</p>
                )}
              <p>{a?.position}</p>
              <div className="interview-meta">
                <span>
                  <CalendarDays size={16} />
                  {dateLabel(i.scheduled_at)}
                </span>
                <span>
                  <Clock3 size={16} />
                  {new Date(i.scheduled_at).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                    timeZoneName: "short",
                  })}
                </span>
                {i.interviewer_name && <span>With {i.interviewer_name}</span>}
              </div>
              <div className="interview-card-footer">
                <Link
                  className="text-link"
                  href={`/applications/${i.application_id}`}
                >
                  Application <ArrowUpRight size={15} />
                </Link>
                {i.meeting_url && (
                  <a
                    className="button"
                    href={i.meeting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Video size={15} />
                    Meeting link
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {!visible.length && (
        <section className="panel">
          <Empty
            title={
              tab === "upcoming"
                ? "No interviews scheduled."
                : "No past interviews yet"
            }
          >
            <p>
              {apps.length
                ? "Schedule interviews as your opportunities progress."
                : "Add an application first, then schedule your interview."}
            </p>
            {!apps.length && (
              <Link className="button primary" href="/applications/new">
                Add application
              </Link>
            )}
          </Empty>
        </section>
      )}
      {editing && (
        <Modal
          title={editing === "new" ? "Schedule interview" : "Edit interview"}
          onClose={() => setEditing(null)}
        >
          <InterviewForm
            applications={apps}
            initial={editing === "new" ? undefined : editing}
            onSaved={() => {
              setNotice(
                editing === "new" ? "Interview created." : "Interview updated.",
              );
              setEditing(null);
              setVersion((v) => v + 1);
            }}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </>
  );
}
