if (process.env.NODE_ENV === "production") {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (dsn && !dsn.includes("...")) {
    import(/* webpackIgnore: true */ "@sentry/nextjs").then((Sentry) => {
      Sentry.init({
        dsn,
        environment: process.env.NODE_ENV,
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0.01,
        replaysOnErrorSampleRate: 1.0,
        integrations: [
          Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        beforeSend(event: { request?: { headers?: Record<string, string> } }) {
          if (event.request?.headers) {
            delete event.request.headers["authorization"];
            delete event.request.headers["x-service-secret"];
          }
          return event;
        },
      });
    });
  }
}
