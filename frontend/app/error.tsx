"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="standalone">
      <h1>Something didn’t load.</h1>
      <p>Please try again.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
