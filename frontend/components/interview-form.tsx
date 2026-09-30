"use client";
import { useState } from "react";
import { api, label } from "@/lib/api";
import { interviewTypes, type Interview, type Application } from "@/types";
import { ErrorMessage, Field } from "./ui";
export function InterviewForm({
  applicationId,
  applications,
  initial,
  onSaved,
  onCancel,
}: {
  applicationId?: string;
  applications?: Application[];
  initial?: Interview;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const scheduled = initial
    ? new Date(
        new Date(initial.scheduled_at).getTime() -
          new Date(initial.scheduled_at).getTimezoneOffset() * 60000,
      )
        .toISOString()
        .slice(0, 16)
    : "";
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries([...form].map(([k, v]) => [k, v || null]));
    body.scheduled_at = new Date(String(body.scheduled_at)).toISOString();
    if (!initial) body.application_id = applicationId || body.application_id;
    try {
      await api(initial ? `/interviews/${initial.id}` : "/interviews", {
        method: initial ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      {error && <ErrorMessage message={error} />}
      <div className="form-grid">
        {!applicationId && !initial && (
          <Field label="Application *" wide>
            <select name="application_id" required defaultValue="">
              <option value="" disabled>
                Select application
              </option>
              {applications?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.company} · {a.position}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Interview type *">
          <select
            name="interview_type"
            defaultValue={initial?.interview_type || "recruiter_call"}
          >
            {interviewTypes.map((t) => (
              <option key={t} value={t}>
                {label(t)}
                {[
                  "technical",
                  "behavioral",
                  "final",
                  "panel",
                  "hiring_manager",
                ].includes(t)
                  ? " Interview"
                  : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date & time (your timezone) *">
          <input
            type="datetime-local"
            name="scheduled_at"
            required
            defaultValue={scheduled}
          />
        </Field>
        <Field label="Interview status">
          <select name="status" defaultValue={initial?.status || "upcoming"}>
            {["upcoming", "completed", "cancelled", "rescheduled"].map(
              (status) => (
                <option value={status} key={status}>
                  {label(status)}
                </option>
              ),
            )}
          </select>
        </Field>
        <Field label="Location">
          <input
            name="location"
            maxLength={200}
            defaultValue={initial?.location || ""}
            placeholder="Remote or office address"
          />
        </Field>
        <Field label="Meeting link">
          <input
            name="meeting_url"
            type="url"
            defaultValue={initial?.meeting_url || ""}
            placeholder="https://…"
          />
        </Field>
        <Field label="Interviewer">
          <input
            name="interviewer_name"
            maxLength={120}
            defaultValue={initial?.interviewer_name || ""}
          />
        </Field>
        <Field label="Interviewer email">
          <input
            name="interviewer_email"
            type="email"
            defaultValue={initial?.interviewer_email || ""}
          />
        </Field>
        {(
          ["preparation_notes", "questions_to_ask", "outcome_notes"] as const
        ).map((key) => (
          <Field label={label(key)} wide key={key}>
            <textarea
              name={key}
              rows={3}
              maxLength={20000}
              defaultValue={initial?.[key] || ""}
            />
          </Field>
        ))}
        <Field label="Notes" wide>
          <textarea
            name="notes"
            rows={3}
            maxLength={20000}
            defaultValue={initial?.notes || ""}
          />
        </Field>
      </div>
      <div className="form-actions">
        <button type="button" className="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="button primary" disabled={busy}>
          {busy ? "Saving…" : "Save interview"}
        </button>
      </div>
    </form>
  );
}
