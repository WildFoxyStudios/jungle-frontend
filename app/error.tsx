"use client";

import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      // In production, report to an error monitoring service here
      // e.g. Sentry.captureException(error)
    } else {
      console.error("[RootError]", error);
    }
  }, [error]);

  return (
    <main>
      <h1>Algo salió mal</h1>
      <p>{error.message || "Ha ocurrido un error inesperado."}</p>
      <button onClick={reset}>Intentar de nuevo</button>
    </main>
  );
}
