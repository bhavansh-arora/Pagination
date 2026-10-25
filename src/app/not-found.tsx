import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mesh grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <div className="text-5xl">🌫️</div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Nothing here</h1>
        <p className="mt-2 text-sm text-muted">This page or mind doesn&apos;t exist, or isn&apos;t live yet.</p>
        <Link href="/" className="mt-6 inline-block rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">
          Go home
        </Link>
      </div>
    </div>
  );
}
