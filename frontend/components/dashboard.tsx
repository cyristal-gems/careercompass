"use client";
import { Toast } from "./ui";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  Trophy,
  Send,
  ArrowRight,
  Clock3,
  CheckCheck,
} from "lucide-react";
import { api, allApplications, dateLabel, label, localDate } from "@/lib/api";
import type { Analytics, Application, Interview } from "@/types";
import { useUser } from "./shell";
import { ApplicationTable, Company, Empty, ErrorMessage, Loading } from "./ui";
import { Funnel, TrendChart, StatusChart } from "./charts";
export function Dashboard() {
  const user = useUser();
  const [data, setData] = useState<Analytics | null>(null),
    [apps, setApps] = useState<Application[]>([]),
    [interviews, setInterviews] = useState<Interview[]>([]),
    [error, setError] = useState(""),
    [days, setDays] = useState(30),
    [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([
      api<Analytics>(`/analytics?days=${days}`),
      allApplications(),
      api<Interview[]>("/interviews"),
    ])
      .then(([a, b, c]) => {
        if (active) {
          setData(a);
          setApps(b);
          setInterviews(c);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [days]);
  async function complete(id: string) {
    try {
      await api(`/applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ follow_up_date: null }),
      });
      setApps(
        apps.map((a) => (a.id === id ? { ...a, follow_up_date: null } : a)),
      );
      setNotice("Follow-up marked complete.");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  if (error) return <ErrorMessage message={error} />;
  if (!data) return <Loading />;
  const s = data.summary,
    upcoming = interviews
      .filter(
        (i) =>
          ["upcoming", "rescheduled"].includes(i.status) &&
          new Date(i.scheduled_at) >= new Date() &&
          !apps.find((a) => a.id === i.application_id)?.is_archived,
      )
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  const followups = apps
    .filter((a) => a.follow_up_date && !a.is_archived)
    .sort((a, b) => a.follow_up_date!.localeCompare(b.follow_up_date!));
  const today = localDate(),
    tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = localDate(tomorrowDate);
  const metrics = [
    {
      title: "Total applications",
      value: s.total_applications,
      icon: BriefcaseBusiness,
      note: `${s.applications_this_month} applied this month`,
      tone: "lime",
    },
    {
      title: "Active applications",
      value: s.active_applications,
      icon: Send,
      note: "Opportunities in progress",
      tone: "blue",
    },
    {
      title: "Interviews",
      value: s.interviews,
      icon: CalendarDays,
      note: `${upcoming.length} upcoming interviews`,
      tone: "amber",
    },
    {
      title: "Rejections",
      value: s.rejections,
      icon: BriefcaseBusiness,
      note: "Closed opportunities",
      tone: "amber",
    },
    {
      title: "Applications this month",
      value: s.applications_this_month,
      icon: Send,
      note: "Your current month’s activity",
      tone: "blue",
    },
    {
      title: "Offers received",
      value: s.offers,
      icon: Trophy,
      note: "Your hard work, paying off",
      tone: "green",
    },
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR JOB SEARCH, IN FOCUS</div>
          <h1>
            Let’s make your next move
            {user?.first_name ? `, ${user.first_name}` : ""}.
          </h1>
          <p>Every application is a step forward. Here’s where you stand.</p>
        </div>
        <Link className="button primary" href="/applications/new">
          <Plus size={17} />
          Add application
        </Link>
      </div>
      <div className="metric-grid">
        {metrics.map((m) => (
          <section className="metric-card" key={m.title}>
            <div className="metric-top">
              <span>{m.title}</span>
              <span className={`metric-icon ${m.tone}`}>
                <m.icon size={18} />
              </span>
            </div>
            <strong className="metric-value">{m.value ?? 0}</strong>
            <small>{m.note}</small>
          </section>
        ))}
      </div>
      <div className="rate-strip">
        {[
          { name: "Response rate", key: "response_rate" },
          { name: "Interview rate", key: "interview_rate" },
          { name: "Offer rate", key: "offer_rate" },
        ].map((m) => (
          <div key={m.key}>
            <span>{m.name}</span>
            <strong>
              {s[m.key] ?? 0}
              <small>%</small>
            </strong>
          </div>
        ))}
        <Link href="/analytics">
          Explore analytics <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="dashboard-primary">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Application activity</h2>
              <p>A little consistency goes a long way.</p>
            </div>
            <select
              aria-label="Activity period"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={180}>Last 6 months</option>
              <option value={365}>Last year</option>
            </select>
          </div>
          <TrendChart data={data.trends} />
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Application funnel</h2>
              <p>From first click to the next chapter.</p>
            </div>
            <ArrowUpRight size={18} className="muted" />
          </div>
          <Funnel data={data.funnel} />
        </section>
      </div>
      <div className="dashboard-secondary">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Recent applications</h2>
              <p>Your latest opportunities, all in one place.</p>
            </div>
            <Link className="text-link" href="/applications">
              View all <ArrowRight size={15} />
            </Link>
          </div>
          <ApplicationTable items={apps.slice(0, 5)} compact />
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>Coming up next</h2>
            <CalendarDays size={18} className="muted" />
          </div>
          <div className="interview-list">
            {upcoming.slice(0, 3).map((i) => {
              const a = apps.find((a) => a.id === i.application_id);
              return (
                <Link
                  className="interview-preview"
                  href={`/applications/${i.application_id}`}
                  key={i.id}
                >
                  <span className="date-tile">
                    <small>
                      {new Date(i.scheduled_at).toLocaleDateString("en-US", {
                        month: "short",
                      })}
                    </small>
                    <strong>{new Date(i.scheduled_at).getDate()}</strong>
                  </span>
                  <span>
                    <strong>{a?.company || "Interview"}</strong>
                    <small>{label(i.interview_type)}</small>
                    <span className="interview-time">
                      <Clock3 size={12} />
                      {new Date(i.scheduled_at).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </span>
                  <ArrowUpRight size={15} />
                </Link>
              );
            })}
            {!upcoming.length && (
              <Empty title="Room for what’s next">
                <p>Your scheduled interviews will appear here.</p>
              </Empty>
            )}
          </div>
          <Link className="panel-bottom-link" href="/interviews">
            View interview schedule <ArrowRight size={15} />
          </Link>
        </section>
      </div>
      <div className="dashboard-secondary">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Follow-ups</h2>
              <p>Keep the conversation moving.</p>
            </div>
            <span className="count-label">{followups.length} scheduled</span>
          </div>
          {notice && <Toast message={notice} onDismiss={() => setNotice("")} />}
          <div className="followups">
            {followups.slice(0, 5).map((a) => (
              <div className="followup" key={a.id}>
                <Company name={a.company} />
                <Link href={`/applications/${a.id}`}>
                  <strong>{a.company}</strong>
                  <small>{a.position}</small>
                </Link>
                <span
                  className={`due-label ${a.follow_up_date! <= today ? "due" : ""}`}
                >
                  {a.follow_up_date! < today
                    ? "Overdue"
                    : a.follow_up_date === today
                      ? "Due today"
                      : a.follow_up_date === tomorrow
                        ? "Due tomorrow"
                        : dateLabel(a.follow_up_date!)}
                </span>
                <button
                  className="icon-button"
                  aria-label={`Complete follow-up for ${a.company}`}
                  onClick={() => complete(a.id)}
                >
                  <CheckCheck size={18} />
                </button>
              </div>
            ))}
            {!followups.length && (
              <Empty title="You’re all caught up">
                <p>Add a follow-up date to any application.</p>
              </Empty>
            )}
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>Status breakdown</h2>
            <span className="count-label">All time</span>
          </div>
          <StatusChart data={data.statuses} />
        </section>
      </div>
    </>
  );
}
