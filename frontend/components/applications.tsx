"use client";
import { Toast } from "./ui";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  SlidersHorizontal,
  Upload,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { ExportButton } from "./export-button";
import { api, label } from "@/lib/api";
import { statuses, sources, type Page } from "@/types";
import { ApplicationTable, Empty, ErrorMessage, Field, Loading } from "./ui";
export function Applications({ deleted = false }: { deleted?: boolean }) {
  const [data, setData] = useState<Page | null>(null),
    [view, setView] = useState("all"),
    [search, setSearch] = useState(""),
    [filters, setFilters] = useState<Record<string, string>>({}),
    [advanced, setAdvanced] = useState(false),
    [sort, setSort] = useState("-applied_date"),
    [page, setPage] = useState(1),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(deleted ? "Application deleted." : ""),
    [version, setVersion] = useState(0),
    [loading, setLoading] = useState(true),
    [importing, setImporting] = useState(false);
  const upload = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      const params = new URLSearchParams({
        search,
        view,
        sort,
        page: String(page),
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
      });
      setLoading(true);
      api<Page>(`/applications?${params}`)
        .then((d) => {
          if (active) {
            setData(d);
            setError("");
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, view, filters, sort, page, version]);
  function filter(key: string, value: string) {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  }
  async function importFile(file: File) {
    setImporting(true);
    setError("");
    const body = new FormData();
    body.append("file", file);
    try {
      const result = await api<{
        imported: number;
        duplicates_skipped: number;
      }>("/applications/import/csv", { method: "POST", body });
      setNotice(
        `Imported ${result.imported} applications. ${result.duplicates_skipped} duplicates skipped.`,
      );
      setVersion((v) => v + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setImporting(false);
      if (upload.current) upload.current.value = "";
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">EVERY OPPORTUNITY, ORGANIZED</div>
          <h1>
            Applications{" "}
            <span className="heading-count">{data?.total ?? "—"}</span>
          </h1>
          <p>Keep your search moving, one opportunity at a time.</p>
        </div>
        <div className="heading-actions">
          <ExportButton />
          <Link href="/applications/new" className="button primary">
            <Plus size={16} />
            Add application
          </Link>
        </div>
      </div>
      <nav className="quick-views" aria-label="Application quick views">
        {[
          ["all", "All"],
          ["active", "Active"],
          ["interviews", "Interviews"],
          ["followups", "Follow-Ups"],
          ["offers", "Offers"],
          ["archived", "Archived"],
        ].map(([key, name]) => (
          <button
            key={key}
            className={`button ${view === key ? "selected" : ""}`}
            aria-pressed={view === key}
            onClick={() => {
              setView(key);
              setPage(1);
            }}
          >
            {name}
          </button>
        ))}
      </nav>
      <section className="panel applications-panel">
        <div className="filter-toolbar">
          <label className="search-input">
            <Search size={18} />
            <input
              aria-label="Search applications"
              placeholder="Search company, role, or keyword…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            {search && (
              <button
                className="icon-button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
              >
                <X size={14} />
              </button>
            )}
          </label>
          <select
            aria-label="Filter by status"
            value={filters.status || ""}
            onChange={(e) => filter("status", e.target.value)}
          >
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>
          <select
            aria-label="Sort applications"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            <option value="-applied_date">Newest first</option>
            <option value="applied_date">Oldest first</option>
            <option value="company">Company A–Z</option>
            <option value="position">Position A–Z</option>
            <option value="status">Status</option>
            <option value="-salary_min">Highest salary</option>
            <option value="follow_up_date">Follow-up date</option>
          </select>
          <button
            className={`button ${advanced ? "selected" : ""}`}
            aria-expanded={advanced}
            onClick={() => setAdvanced(!advanced)}
          >
            <SlidersHorizontal size={16} />
            Filters
          </button>
        </div>
        {advanced && (
          <div className="advanced-filters form-grid">
            {["company", "position", "location"].map((key) => (
              <Field key={key} label={label(key)}>
                <input
                  value={filters[key] || ""}
                  onChange={(e) => filter(key, e.target.value)}
                  placeholder={`Any ${key}`}
                />
              </Field>
            ))}
            <Field label="Priority">
              <select
                value={filters.priority || ""}
                onChange={(e) => filter("priority", e.target.value)}
              >
                <option value="">Any priority</option>
                <option value="true">Priority only</option>
                <option value="false">Other applications</option>
              </select>
            </Field>
            <Field label="Archive status">
              <select
                value={filters.is_archived || ""}
                onChange={(e) => filter("is_archived", e.target.value)}
              >
                <option value="">Any archive status</option>
                <option value="false">Not archived</option>
                <option value="true">Archived</option>
              </select>
            </Field>
            <Field label="Work type">
              <select
                value={filters.work_type || ""}
                onChange={(e) => filter("work_type", e.target.value)}
              >
                <option value="">Any work type</option>
                {["remote", "hybrid", "on_site"].map((s) => (
                  <option key={s} value={s}>
                    {label(s)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Employment type">
              <select
                value={filters.employment_type || ""}
                onChange={(e) => filter("employment_type", e.target.value)}
              >
                <option value="">Any employment type</option>
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
            <Field label="Job source">
              <select
                value={filters.source || ""}
                onChange={(e) => filter("source", e.target.value)}
              >
                <option value="">Any source</option>
                {sources.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            {[
              { key: "date_from", name: "Applied after", type: "date" },
              { key: "date_to", name: "Applied before", type: "date" },
              { key: "salary_min", name: "Salary from (USD)", type: "number" },
              { key: "salary_max", name: "Salary to (USD)", type: "number" },
            ].map((f) => (
              <Field label={f.name} key={f.key}>
                <input
                  type={f.type}
                  min={f.type === "number" ? 0 : undefined}
                  value={filters[f.key] || ""}
                  onChange={(e) => filter(f.key, e.target.value)}
                />
              </Field>
            ))}
            <button
              className="button"
              onClick={() => {
                setFilters({});
                setSearch("");
                setPage(1);
              }}
            >
              Clear filters
            </button>
          </div>
        )}
        {notice && <Toast message={notice} onDismiss={() => setNotice("")} />}
        {error && <ErrorMessage message={error} />}
        <div aria-busy={loading}>
          {loading ? (
            <Loading />
          ) : data?.items.length ? (
            <ApplicationTable items={data.items} />
          ) : (
            <Empty
              title={
                view !== "all" || search || Object.values(filters).some(Boolean)
                  ? "No matches found"
                  : "No applications yet."
              }
            >
              <p>
                {view !== "all" ||
                search ||
                Object.values(filters).some(Boolean)
                  ? "Try another search or clear your filters."
                  : "Start tracking your search by adding your first opportunity."}
              </p>
              <Link href="/applications/new" className="button primary">
                <Plus size={16} />
                Add application
              </Link>
            </Empty>
          )}
        </div>
        <div className="table-footer">
          <button
            className="text-link"
            disabled={importing}
            onClick={() => upload.current?.click()}
          >
            <Upload size={15} />
            {importing ? "Importing…" : "Import CSV"}
          </button>
          <input
            className="sr-only"
            ref={upload}
            type="file"
            accept=".csv,text/csv"
            aria-label="Import application CSV"
            onChange={(e) => {
              if (e.target.files?.[0]) void importFile(e.target.files[0]);
            }}
          />
          <span>
            {data
              ? `${data.total} applications · Page ${page} of ${Math.max(1, Math.ceil(data.total / 25))}`
              : ""}
          </span>
          <div className="pagination">
            <button
              className="icon-button"
              aria-label="Previous page"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className="icon-button"
              aria-label="Next page"
              disabled={!data || page * 25 >= data.total}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>
      <p className="helper-text">
        CSV imports accept up to 5,000 records. Matching company, role, and
        application date are treated as duplicates.
      </p>
    </>
  );
}
