"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { api } from "@/lib/api";
import type { Analytics as AnalyticsData } from "@/types";
import { Funnel, StatusChart, TrendChart } from "./charts";
import { Empty, ErrorMessage, Loading } from "./ui";
export function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null),
    [days, setDays] = useState(30),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api<AnalyticsData>(`/analytics?days=${days}&scoped=true`)
      .then((d) => {
        if (active) {
          setData(d);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [days]);
  if (error) return <ErrorMessage message={error} />;
  if (!data) return <Loading />;
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">TURN ACTIVITY INTO INSIGHT</div>
          <h1>See the bigger picture.</h1>
          <p>Understand what’s working and where to focus next.</p>
        </div>
        <span className="count-label">
          Applications from the last {days} days
        </span>
      </div>
      {data.summary.total_applications === 0 && (
        <section className="panel">
          <Empty title="Not enough data yet.">
            <p>Add a few applications to start seeing trends.</p>
          </Empty>
        </section>
      )}
      <div className="analytics-metrics">
        {[
          { key: "total_applications", name: "Total applications" },
          { key: "response_rate", name: "Response rate", suffix: "%" },
          { key: "interview_rate", name: "Interview conversion", suffix: "%" },
          { key: "offer_rate", name: "Offer rate", suffix: "%" },
          { key: "rejection_rate", name: "Rejection rate", suffix: "%" },
          {
            key: "active_application_rate",
            name: "Active application rate",
            suffix: "%",
          },
        ].map((m) => (
          <section className="metric-card" key={m.key}>
            <div className="metric-top">
              <span>{m.name}</span>
              <ArrowUpRight size={16} />
            </div>
            <strong className="metric-value">
              {data.summary[m.key] ?? 0}
              <span>{m.suffix}</span>
            </strong>
          </section>
        ))}
      </div>
      <div className="dashboard-primary">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Applications over time</h2>
              <p>Find your rhythm.</p>
            </div>
            <select
              aria-label="Analytics range"
              value={days}
              onChange={(e) => {
                setData(null);
                setDays(Number(e.target.value));
              }}
            >
              {[
                { d: 7, t: "7 days" },
                { d: 30, t: "30 days" },
                { d: 90, t: "90 days" },
                { d: 180, t: "6 months" },
                { d: 365, t: "1 year" },
              ].map((r) => (
                <option key={r.d} value={r.d}>
                  Last {r.t}
                </option>
              ))}
            </select>
          </div>
          <TrendChart data={data.trends} />
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>Conversion funnel</h2>
          </div>
          <Funnel data={data.funnel} />
        </section>
      </div>
      <div className="time-metrics">
        {[
          { key: "average_time_to_response", name: "Application → response" },
          { key: "average_time_to_interview", name: "Application → interview" },
          { key: "average_time_interview_to_offer", name: "Interview → offer" },
        ].map((m) => (
          <section className="panel padded" key={m.key}>
            <span className="muted">{m.name}</span>
            <strong>
              {data.summary[m.key] ?? "—"}
              <small>
                {data.summary[m.key] == null
                  ? "No recorded timings"
                  : "days on average"}
              </small>
            </strong>
          </section>
        ))}
      </div>
      <div className="dashboard-secondary">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Where opportunities come from</h2>
              <p>Interview conversion by job source.</p>
            </div>
          </div>
          {data.sources.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Applied</th>
                    <th>Interviews</th>
                    <th>Interview rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sources.map((s) => (
                    <tr key={s.source}>
                      <td>
                        <strong>{s.source}</strong>
                      </td>
                      <td>{s.applications}</td>
                      <td>{s.interviews}</td>
                      <td>
                        <div className="source-rate">
                          <span>{s.interview_rate}%</span>
                          <div className="bar-track">
                            <div style={{ width: `${s.interview_rate}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty title="Discover your strongest sources">
              <p>Add applications with a job source to see your results.</p>
            </Empty>
          )}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>Status breakdown</h2>
          </div>
          <StatusChart data={data.statuses} />
        </section>
      </div>
      <div className="dashboard-secondary">
        <section className="panel padded">
          <h2>Applications by weekday</h2>
          <div className="distribution">
            {data.weekdays.map((item) => (
              <div key={item.weekday}>
                <span>{item.weekday}</span>
                <meter
                  min={0}
                  max={Math.max(1, ...data.weekdays.map((d) => d.count))}
                  value={item.count}
                  aria-label={item.weekday}
                />
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        </section>
        <section className="panel padded">
          <h2>Time to response</h2>
          <p className="muted">
            Recorded response times; missing dates are excluded.
          </p>
          <div className="distribution">
            {data["response-times"].map((item) => (
              <div key={item.range}>
                <span>{item.range}</span>
                <meter
                  min={0}
                  max={Math.max(
                    1,
                    ...data["response-times"].map((d) => d.count),
                  )}
                  value={item.count}
                  aria-label={item.range}
                />
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
      <details className="metric-definitions">
        <summary>How these numbers are calculated</summary>
        <p>
          Rates use submitted applications, excluding records currently saved.
          Response includes screening, assessment, interview, offer, acceptance,
          or rejection. Interview conversion includes completed interviews and
          interview or later milestones. Interviews must be marked completed and
          their scheduled time must have passed to count as completed. Cancelled
          interviews do not count. Funnel stages retain recorded progress even
          if an application is later withdrawn or rejected.
        </p>
        <p>
          Averages use dated status changes and completed interview records. The
          initial imported or manually entered status does not establish a
          response date. Missing timings display a dash. All metrics on this
          page use applications submitted within the selected range. Dashboard
          summaries show all-time performance.
        </p>
      </details>
    </>
  );
}
