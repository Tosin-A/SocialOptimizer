export async function register() {
  if (process.env.NODE_ENV !== "production") return;

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn || dsn.includes("...")) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    const mod = await import(/* webpackIgnore: true */ "@sentry/nextjs");
    mod.init({
      dsn,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      beforeSend(event: { request?: { headers?: Record<string, string> } }) {
        if (event.request?.headers) {
          delete event.request.headers["authorization"];
          delete event.request.headers["x-service-secret"];
          delete event.request.headers["cookie"];
        }
        return event;
      },
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    const mod = await import(/* webpackIgnore: true */ "@sentry/nextjs");
    mod.init({
      dsn,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
    });
  }
}
