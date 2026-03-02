import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn && !dsn.includes("...")) {
Sentry.init({
  dsn,
  environment: process.env.NODE_ENV,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  beforeSend(event) {
    // Strip sensitive headers before they reach Sentry
    if (event.request?.headers) {
      delete event.request.headers["authorization"];
      delete event.request.headers["x-service-secret"];
      delete event.request.headers["cookie"];
    }
    return event;
  },
});
}
