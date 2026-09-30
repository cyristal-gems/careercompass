"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ShieldCheck,
  ChartNoAxesCombined,
  BriefcaseBusiness,
} from "lucide-react";
import { api } from "@/lib/api";
import { ErrorMessage, Field } from "./ui";
export function AuthForm({
  mode,
  resetToken,
}: {
  mode: "login" | "register" | "reset";
  resetToken?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (mode === "reset") {
        const token = resetToken;
        const result = await api<{ message: string }>(
          token ? "/auth/password-reset/confirm" : "/auth/password-reset",
          {
            method: "POST",
            body: JSON.stringify(
              token
                ? { token, password: body.password }
                : { email: body.email },
            ),
          },
        );
        setMessage(result.message);
      } else {
        await api(`/auth/${mode}`, {
          method: "POST",
          body: JSON.stringify(body),
        });
        router.replace("/dashboard");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <div className="auth-story">
        <Link className="brand" href="/login">
          <span className="brand-symbol">
            J<span>↗</span>
          </span>
          JobTrackr
        </Link>
        <div className="auth-story-main">
          <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
          <h1>
            Your job search,
            <br />
            <em>in focus.</em>
          </h1>
          <p>
            Less juggling spreadsheets.
            <br />
            More moving your career forward.
          </p>
          <div className="auth-benefits">
            <span>
              <BriefcaseBusiness size={18} />
              Every opportunity, organized.
            </span>
            <span>
              <ChartNoAxesCombined size={18} />
              Your progress, in perspective.
            </span>
            <span>
              <ShieldCheck size={18} />
              Your search, just for you.
            </span>
          </div>
        </div>
        <span className="auth-footnote">Your job search, in focus.</span>
      </div>
      <div className="auth-form-side">
        <div className="auth-card">
          <span className="auth-kicker">WELCOME TO JOBTRACKR</span>
          <h2>
            {mode === "register"
              ? "Make room for what’s next."
              : mode === "reset"
                ? "Let’s get you back in."
                : "Welcome back."}
          </h2>
          <p>
            {mode === "register"
              ? "Create your personal job-search workspace."
              : mode === "reset"
                ? "Reset your password securely."
                : "Your next opportunity is waiting."}
          </p>
          {error && <ErrorMessage message={error} />}{" "}
          {message ? (
            <div className="reset-success" role="status">
              <Check />
              <p>{message}</p>
              <Link className="button primary" href="/login">
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="auth-fields">
              {mode === "register" && (
                <Field label="First name">
                  <input
                    name="first_name"
                    required
                    maxLength={80}
                    autoComplete="given-name"
                    placeholder="Your first name"
                  />
                </Field>
              )}
              {mode !== "reset" ? (
                <>
                  <Field label="Email address">
                    <input
                      name="email"
                      required
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                    />
                  </Field>
                  <Field label="Password">
                    <input
                      name="password"
                      required
                      type="password"
                      minLength={12}
                      maxLength={128}
                      autoComplete={
                        mode === "register"
                          ? "new-password"
                          : "current-password"
                      }
                      placeholder={
                        mode === "register"
                          ? "At least 12 characters"
                          : "Your password"
                      }
                    />
                  </Field>
                </>
              ) : (
                <ResetFields token={resetToken} />
              )}
              {mode === "login" && (
                <Link className="forgot-link" href="/reset-password">
                  Forgot password?
                </Link>
              )}
              <button className="button primary auth-submit" disabled={busy}>
                {busy
                  ? "Please wait…"
                  : mode === "register"
                    ? "Create your account"
                    : mode === "reset"
                      ? "Continue"
                      : "Sign in"}
                <ArrowRight size={18} />
              </button>
            </form>
          )}
          <p className="auth-switch">
            {mode === "register"
              ? "Already have an account? "
              : "New to JobTrackr? "}
            <Link href={mode === "register" ? "/login" : "/register"}>
              {mode === "register" ? "Sign in" : "Create an account"}
            </Link>
          </p>
          {mode === "reset" && (
            <p className="helper-text">
              Need help receiving a reset email?{" "}
              <a className="text-link" href="mailto:cyrisjoseph@outlook.com">
                Contact support
              </a>
              .
            </p>
          )}
          <nav className="legal-links" aria-label="Legal">
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </nav>
          <div className="auth-security">
            <ShieldCheck size={14} />
            Your applications stay private to your account.
          </div>
        </div>
      </div>
    </div>
  );
}
function ResetFields({ token }: { token?: string }) {
  return token ? (
    <Field label="New password">
      <input
        name="password"
        type="password"
        required
        minLength={12}
        maxLength={128}
        autoComplete="new-password"
        placeholder="At least 12 characters"
      />
    </Field>
  ) : (
    <Field label="Email address">
      <input
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
      />
    </Field>
  );
}
