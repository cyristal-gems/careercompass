"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import type { Contact } from "@/types";
import { Field, ErrorMessage } from "./ui";
export function ContactForm({
  applicationId,
  initial,
  onSaved,
  onCancel,
}: {
  applicationId: string;
  initial?: Contact;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const body = {
      ...Object.fromEntries(
        [...new FormData(e.currentTarget)].map(([k, v]) => [k, v || null]),
      ),
      application_id: applicationId,
    };
    try {
      await api(initial ? `/contacts/${initial.id}` : "/contacts", {
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
        <Field label="Name *">
          <input
            name="name"
            required
            maxLength={120}
            defaultValue={initial?.name}
          />
        </Field>
        <Field label="Title">
          <input
            name="title"
            maxLength={120}
            defaultValue={initial?.title || ""}
            placeholder="Recruiter"
          />
        </Field>
        <Field label="Email">
          <input
            name="email"
            type="email"
            defaultValue={initial?.email || ""}
          />
        </Field>
        <Field label="Phone">
          <input
            name="phone"
            type="tel"
            maxLength={40}
            defaultValue={initial?.phone || ""}
          />
        </Field>
        <Field label="LinkedIn URL" wide>
          <input
            name="linkedin_url"
            type="url"
            defaultValue={initial?.linkedin_url || ""}
          />
        </Field>
      </div>
      <div className="form-actions">
        <button className="button" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="button primary" disabled={busy}>
          {busy ? "Saving…" : "Save contact"}
        </button>
      </div>
    </form>
  );
}
