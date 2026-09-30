"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle } from "lucide-react";
import { api, label, localDate } from "@/lib/api";
import { sources, statuses, type Application } from "@/types";
import { Field, ErrorMessage } from "./ui";
export function ApplicationForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: Application;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {};
    for (const [key, value] of form)
      if (!key.startsWith("recruiter"))
        body[key] =
          value === ""
            ? null
            : key.startsWith("salary_")
              ? Number(value)
              : value;
    body.priority = form.get("priority") === "on";
    body.is_archived = form.get("is_archived") === "on";
    try {
      const result = await api<Application>(
        initial ? `/applications/${initial.id}` : "/applications",
        { method: initial ? "PATCH" : "POST", body: JSON.stringify(body) },
      );
      if (!initial && form.get("recruiter_name")) {
        try {
          await api("/contacts", {
            method: "POST",
            body: JSON.stringify({
              application_id: result.id,
              name: form.get("recruiter_name"),
              title: "Recruiter",
              email: form.get("recruiter_email") || null,
            }),
          });
        } catch {
          router.push(`/applications/${result.id}?contact_error=1`);
          return;
        }
      }
      if (onSaved) onSaved();
      else router.push(`/applications/${result.id}?created=1`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="application-form">
      {error && <ErrorMessage message={error} />}
      <div className="form-section-title">
        <span>01</span>
        <div>
          <h3>The opportunity</h3>
          <p>Start with the essentials.</p>
        </div>
      </div>
      <div className="form-grid">
        <Field label="Company *">
          <input
            name="company"
            required
            maxLength={200}
            defaultValue={initial?.company}
            placeholder="e.g. CrowdStrike"
          />
        </Field>
        <Field label="Position *">
          <input
            name="position"
            required
            maxLength={200}
            defaultValue={initial?.position}
            placeholder="e.g. Security Analyst"
          />
        </Field>
        <Field label="Application date *">
          <input
            name="applied_date"
            type="date"
            required
            defaultValue={initial?.applied_date || localDate()}
          />
        </Field>
        <Field label="Status *">
          <select name="status" defaultValue={initial?.status || "applied"}>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Location">
          <input
            name="location"
            maxLength={200}
            defaultValue={initial?.location || ""}
            placeholder="City, state, or anywhere"
          />
        </Field>
        <Field label="Job posting link">
          <input
            name="job_url"
            type="url"
            maxLength={2048}
            defaultValue={initial?.job_url || ""}
            placeholder="https://…"
          />
        </Field>
        <Field label="Company website">
          <input
            name="company_website"
            type="url"
            maxLength={2048}
            defaultValue={initial?.company_website || ""}
            placeholder="https://…"
          />
        </Field>
        <div className="organization-options">
          <label>
            <input
              type="checkbox"
              name="priority"
              defaultChecked={initial?.priority}
            />{" "}
            ★ Priority application
          </label>
          <label>
            <input
              type="checkbox"
              name="is_archived"
              defaultChecked={initial?.is_archived}
            />{" "}
            Archived
          </label>
        </div>
      </div>
      <div className="form-section-title">
        <span>02</span>
        <div>
          <h3>The details</h3>
          <p>Keep the things that matter in one place.</p>
        </div>
      </div>
      <div className="form-grid">
        <Field label="Work type">
          <select name="work_type" defaultValue={initial?.work_type || ""}>
            <option value="">Select work type</option>
            {["remote", "hybrid", "on_site"].map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Employment type">
          <select
            name="employment_type"
            defaultValue={initial?.employment_type || ""}
          >
            <option value="">Select employment type</option>
            {[
              "full_time",
              "part_time",
              "contract",
              "internship",
              "temporary",
            ].map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Salary minimum (USD / year)">
          <input
            name="salary_min"
            type="number"
            min={0}
            max={100000000}
            defaultValue={initial?.salary_min ?? ""}
            placeholder="85,000"
          />
        </Field>
        <Field label="Salary maximum (USD / year)">
          <input
            name="salary_max"
            type="number"
            min={0}
            max={100000000}
            defaultValue={initial?.salary_max ?? ""}
            placeholder="105,000"
          />
        </Field>
        <Field label="Job source">
          <select name="source" defaultValue={initial?.source || ""}>
            <option value="">Select source</option>
            {[
              ...new Set([
                ...sources,
                ...(initial?.source ? [initial.source] : []),
              ]),
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Follow-up date">
          <input
            name="follow_up_date"
            type="date"
            defaultValue={initial?.follow_up_date || ""}
          />
        </Field>
        {!initial && (
          <>
            <Field label="Recruiter name">
              <input
                name="recruiter_name"
                maxLength={120}
                placeholder="Who are you talking to?"
              />
            </Field>
            <Field label="Recruiter email">
              <input
                name="recruiter_email"
                type="email"
                placeholder="recruiter@company.com"
              />
            </Field>
          </>
        )}
        <Field label="Notes" wide>
          <textarea
            name="notes"
            rows={4}
            maxLength={20000}
            defaultValue={initial?.notes || ""}
            placeholder="What stands out about this role? Add anything you want to remember."
          />
        </Field>
      </div>
      <div className="form-actions">
        <span className="muted">* Required fields</span>
        <button
          className="button"
          type="button"
          onClick={onCancel || (() => router.back())}
        >
          Cancel
        </button>
        <button className="button primary" disabled={busy}>
          {busy ? (
            <LoaderCircle size={16} className="spin" />
          ) : (
            <Check size={16} />
          )}{" "}
          {busy ? "Saving…" : initial ? "Save changes" : "Add application"}
        </button>
      </div>
    </form>
  );
}
