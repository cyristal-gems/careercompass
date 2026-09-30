import Link from "next/link";
export default function NotFound() {
  return (
    <main className="standalone">
      <h1>This page isn’t here.</h1>
      <p>Let’s get you back to your job search.</p>
      <Link className="button primary" href="/dashboard">
        Go to dashboard
      </Link>
    </main>
  );
}
