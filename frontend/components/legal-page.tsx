import { BrandMark } from "./brand-mark";
import Link from "next/link";
export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="legal-page">
      <Link className="brand" href="/login">
        <BrandMark />
        CareerCompass
      </Link>
      <p className="muted">Your job search, in focus.</p>
      <article className="panel padded">
        <h1>{title}</h1>
        {children}
      </article>
      <footer className="legal-links">
        <Link href="/login">Sign in</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <a href="mailto:cyrisjoseph@outlook.com">Contact</a>
      </footer>
    </main>
  );
}
