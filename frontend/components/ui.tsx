"use client";
import { useEffect, useRef, useId } from "react";
import { X, BriefcaseBusiness, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { label, dateLabel } from "@/lib/api";
import type { Application } from "@/types";
export function Badge({ status }: { status: string }) {
  return (
    <span className={`badge status-${status}`}>
      <span />
      {label(status)}
    </span>
  );
}
export function Company({ name }: { name: string }) {
  return (
    <span className={`company-logo tone-${name.charCodeAt(0) % 5}`}>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <BriefcaseBusiness size={28} />
      <h3>{title}</h3>
      {children}
    </div>
  );
}
export function Loading() {
  return (
    <div
      className="workspace-skeleton"
      role="status"
      aria-label="Loading your workspace"
    >
      <span className="sr-only">Loading your workspace…</span>
      <div className="skeleton skeleton-title" aria-hidden="true" />
      <div className="metric-grid" aria-hidden="true">
        {[0, 1, 2, 3].map((n) => (
          <div className="panel padded" key={n}>
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-number" />
          </div>
        ))}
      </div>
      <div className="panel padded" aria-hidden="true">
        {[0, 1, 2, 3].map((n) => (
          <div className="skeleton skeleton-row" key={n} />
        ))}
      </div>
    </div>
  );
}
export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="error" role="alert">
      {message}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      trigger?.focus();
    };
  }, []);
  return (
    <dialog
      aria-labelledby={titleId}
      ref={ref}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const elements = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex='0']",
          ),
        ).filter((element) => element.getClientRects().length > 0);
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-inner">
        <header>
          <h2 id={titleId}>{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
export function Field({
  label: text,
  children,
  wide = false,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`field ${wide ? "wide" : ""}`}>
      <span>{text}</span>
      {children}
    </label>
  );
}
export function ApplicationTable({
  items,
  compact = false,
}: {
  items: Application[];
  compact?: boolean;
}) {
  if (!items.length)
    return (
      <Empty title="No applications yet">
        <p>Add an opportunity to start tracking your next chapter.</p>
      </Empty>
    );
  return (
    <>
      <div className="mobile-application-list">
        {items.map((a) => (
          <Link
            className="mobile-application-card"
            key={a.id}
            href={`/applications/${a.id}`}
          >
            <div className="mobile-application-title">
              <Company name={a.company} />
              <span>
                <strong>
                  {a.company}
                  {a.priority && (
                    <span className="priority-label"> ★ Priority</span>
                  )}
                  {a.is_archived && <small>Archived</small>}
                </strong>
                <span>{a.position}</span>
              </span>
              <ArrowUpRight size={18} />
            </div>
            <div className="mobile-application-meta">
              <Badge status={a.status} />
              <span>{dateLabel(a.applied_date)}</span>
            </div>
            {!compact && (
              <div className="mobile-application-extra">
                <span>{a.location || label(a.work_type)}</span>
                <span>{a.source || "Source not specified"}</span>
              </div>
            )}
          </Link>
        ))}
      </div>
      <div className="table-scroll application-table-desktop">
        <table>
          <thead>
            <tr>
              <th>Company & role</th>
              <th>Status</th>
              {!compact && <th>Location</th>}
              <th>Applied</th>
              {!compact && <th>Source</th>}
              <th>
                <span className="sr-only">Details</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id}>
                <td>
                  <Link className="company-cell" href={`/applications/${a.id}`}>
                    <Company name={a.company} />
                    <span>
                      <strong>
                        {a.company}
                        {a.priority && (
                          <span className="priority-label"> ★ Priority</span>
                        )}
                        {a.is_archived && <small>Archived</small>}
                      </strong>
                      <small>{a.position}</small>
                    </span>
                  </Link>
                </td>
                <td>
                  <Badge status={a.status} />
                </td>
                {!compact && (
                  <td>
                    {a.location || "—"}
                    <small>{a.work_type ? label(a.work_type) : ""}</small>
                  </td>
                )}
                <td className="muted nowrap">{dateLabel(a.applied_date)}</td>
                {!compact && <td className="muted">{a.source || "—"}</td>}
                <td>
                  <Link
                    className="icon-button"
                    aria-label={`View ${a.company} application`}
                    href={`/applications/${a.id}`}
                  >
                    <ArrowUpRight size={17} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function Toast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 6000);
    return () => clearTimeout(timer);
  }, [onDismiss]);
  return (
    <div className="toast" role="status">
      <span>{message}</span>
      <button
        type="button"
        className="icon-button"
        aria-label="Dismiss notification"
        onClick={onDismiss}
      >
        <X size={16} />
      </button>
    </div>
  );
}
