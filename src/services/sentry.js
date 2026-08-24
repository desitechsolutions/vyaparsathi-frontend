import * as Sentry from "@sentry/react";

export const initSentry = () => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      integrations: [
        new Sentry.Replay(),
      ],
      replaySessionSampleRate: 0.1,
      replayOnErrorSampleRate: 1.0,
    });
  }
};

export const captureException = (error, context = {}) => {
  Sentry.captureException(error, { contexts: { custom: context } });
};

export const captureMessage = (message, level = 'info') => {
  Sentry.captureMessage(message, level);
};
