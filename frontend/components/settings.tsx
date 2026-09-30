"use client";
import { Toast } from "./ui";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserRound, Database, Trash2, LogOut } from "lucide-react";
import { api } from "@/lib/api";
import { useUser, useUpdateUser } from "./shell";
import type { User } from "@/types";
import { ExportButton } from "./export-button";
import { Field, ErrorMessage, Modal } from "./ui";
export function Settings() {
  const user = useUser();
  const updateUser = useUpdateUser();
  const router = useRouter();
  const [action, setAction] = useState<"delete" | "logout" | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  const [actionError, setActionError] = useState("");
  async function accountAction(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setActionError("");
    try {
      await api(action === "delete" ? "/account" : "/account/logout-all", {
        method: action === "delete" ? "DELETE" : "POST",
        ...(action === "delete"
          ? { body: JSON.stringify({ confirmation, password }) }
          : {}),
      });
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setActionError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [demo, setDemo] = useState(false);
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const updated = await api<User>("/account/profile", {
        method: "PATCH",
        body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
      });
      updateUser(updated);
      setMessage("Profile updated.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function loadDemo() {
    setBusy(true);
    setError("");
    try {
      await api("/demo", { method: "POST" });
      setDemo(false);
      setMessage(
        "Sample applications added. Explore your dashboard to see them.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="narrow">
      <div className="page-heading">
        <div>
          <div className="eyebrow">MAKE YOURSELF AT HOME</div>
          <h1>Your workspace.</h1>
          <p>Manage your account and keep your data in your hands.</p>
        </div>
      </div>
      {error && <ErrorMessage message={error} />}{" "}
      {message && <Toast message={message} onDismiss={() => setMessage("")} />}
      <div className="stack">
        <section className="panel padded">
          <div className="section-icon-title">
            <UserRound size={20} />
            <h2>Personal information</h2>
          </div>
          <form onSubmit={save}>
            <div className="form-grid">
              <Field label="First name">
                <input
                  name="first_name"
                  required
                  maxLength={80}
                  defaultValue={user?.first_name}
                />
              </Field>
              <Field label="Email address">
                <input
                  readOnly
                  value={user?.email || ""}
                  aria-describedby="email-note"
                />
              </Field>
            </div>
            <p id="email-note" className="helper-text">
              Your email identifies your account.
            </p>
            <div className="form-actions">
              <button className="button primary" disabled={busy}>
                {busy ? "Saving…" : "Save profile"}
              </button>
            </div>
          </form>
        </section>
        <section className="panel padded">
          <div className="section-icon-title">
            <ShieldCheck size={20} />
            <h2>Security</h2>
          </div>
          <p className="muted">
            Password resets sign you out of all existing sessions.
          </p>
          <Link className="button" href="/reset-password">
            Reset password
          </Link>
          <div className="settings-divider" />
          <p className="muted">
            Sign out everywhere, including this device. You can sign back in
            with your password.
          </p>
          <button
            className="button"
            onClick={() => {
              setActionError("");
              setAction("logout");
            }}
          >
            <LogOut size={16} /> Sign out of all devices
          </button>
        </section>
        <section className="panel padded">
          <div className="section-icon-title">
            <Database size={20} />
            <h2>Your data</h2>
          </div>
          <p className="muted">
            Download your applications as a CSV file whenever you need them.
          </p>
          <ExportButton label="Export applications" />
          <div className="settings-divider" />
          <h3>Explore with sample data</h3>
          <p className="muted">
            Add a fictional job search to an empty workspace. Sample
            applications can be edited or deleted like any other record.
          </p>
          <button className="button" onClick={() => setDemo(true)}>
            Add sample applications
          </button>
        </section>
        <section className="panel padded danger-zone">
          <div className="section-icon-title">
            <Trash2 size={20} />
            <h2>Danger Zone</h2>
          </div>
          <h3>Delete account</h3>
          <p className="muted">
            Permanently delete your account and all associated applications,
            interviews, contacts, status history, and sessions. This cannot be
            undone.
          </p>
          <button
            className="button danger"
            onClick={() => {
              setActionError("");
              setConfirmation("");
              setPassword("");
              setAction("delete");
            }}
          >
            Delete my account
          </button>
        </section>
      </div>
      {action && (
        <Modal
          title={
            action === "delete"
              ? "Permanently delete your account?"
              : "Sign out of all devices?"
          }
          onClose={() => {
            if (!busy) setAction(null);
          }}
        >
          <form onSubmit={accountAction}>
            {actionError && <ErrorMessage message={actionError} />}
            {action === "delete" ? (
              <>
                <p className="muted">
                  All your job-search records will be permanently deleted.
                  Export your applications first if you need a copy.
                </p>
                <div className="stack">
                  <Field label="Current password">
                    <input
                      type="password"
                      autoComplete="current-password"
                      required
                      minLength={12}
                      maxLength={128}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </Field>
                  <Field label="Type DELETE to confirm">
                    <input
                      required
                      autoComplete="off"
                      value={confirmation}
                      onChange={(e) => setConfirmation(e.target.value)}
                    />
                  </Field>
                </div>
              </>
            ) : (
              <p className="muted">
                All active sessions will end, including this one.
              </p>
            )}
            <div className="form-actions">
              <button
                type="button"
                className="button"
                disabled={busy}
                onClick={() => setAction(null)}
              >
                Cancel
              </button>
              <button
                className={`button ${action === "delete" ? "destructive" : "primary"}`}
                disabled={
                  busy || (action === "delete" && confirmation !== "DELETE")
                }
              >
                {busy
                  ? "Please wait…"
                  : action === "delete"
                    ? "Permanently delete account"
                    : "Sign out everywhere"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {demo && (
        <Modal
          title="Add sample applications?"
          onClose={() => {
            if (!busy) setDemo(false);
          }}
        >
          <p className="muted">
            This adds fictional applications, contacts, interviews, and history
            to your account. It only works if your application list is empty.
          </p>
          <div className="form-actions">
            <button className="button" onClick={() => setDemo(false)}>
              Cancel
            </button>
            <button
              className="button primary"
              disabled={busy}
              onClick={loadDemo}
            >
              {busy ? "Adding…" : "Add sample data"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
