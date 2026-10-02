"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { ErrorMessage, Toast } from "./ui";
export function ExportButton({ label = "Export" }: { label?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function download() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/v1/applications/export/csv", {
        credentials: "same-origin",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          typeof body.detail === "string"
            ? body.detail
            : "Unable to export applications. Please try again.",
        );
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "careercompass-applications.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("CSV exported.");
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button className="button" disabled={busy} onClick={download}>
        <Download size={16} />
        {busy ? "Exporting…" : label}
      </button>
      {error && <ErrorMessage message={error} />}
      {message && <Toast message={message} onDismiss={() => setMessage("")} />}
    </>
  );
}
