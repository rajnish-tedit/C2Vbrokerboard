"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/Button";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-24">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-navy-950">
          Something went wrong
        </h1>
        <p className="mt-3 text-slate-600">
          The prototype hit an unexpected error.
        </p>
        <Button onClick={reset} className="mt-6">
          Try again
        </Button>
      </div>
    </main>
  );
}
