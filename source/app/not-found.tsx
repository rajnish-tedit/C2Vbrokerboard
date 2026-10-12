import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-24">
      <div className="text-center">
        <p className="font-mono text-sm text-gold-700">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-navy-950">
          Page not found
        </h1>
        <p className="mt-3 text-slate-600">
          This page is not part of the Broker prototype.
        </p>
        <Button href="/broker/dashboard" className="mt-6">
          Go to Broker dashboard
        </Button>
      </div>
    </main>
  );
}
