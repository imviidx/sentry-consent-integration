import ReactDOM from 'react-dom/client';
import { App } from './components/App';
import './style.css';
import * as Sentry from '@sentry/browser';
import { sentryConsentIntegration } from '../../src/index';
import { zaraz } from 'zaraz-ts';
import { purposeMapping, initFakeZarazShort } from './fake-zaraz.js';

initFakeZarazShort();

Sentry.init({
  dsn: 'https://abc123def456789@o123456.ingest.sentry.io/123456',
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 0.8,
  autoSessionTracking: true,
  sendDefaultPii: true,
  maxBreadcrumbs: 87,
  attachStacktrace: true,
  sampleRate: 0.66,
  replaysSessionSampleRate: 0.3,
  replaysOnErrorSampleRate: 0.2,
  profilesSampleRate: 0.2,
  initialScope: {
    user: { id: 'demo-user', email: 'demo@example.com' },
    tags: { demo: 'true', version: '1.0.0' },
  },

  integrations: [
    // Configure Session Replay with privacy-safe defaults BEFORE the consent integration
    Sentry.replayIntegration({
      maskAllText: true, // Privacy-safe: mask all text content
      maskAllInputs: true, // Privacy-safe: mask all input values
      blockAllMedia: true, // Privacy-safe: block all media content
      networkCaptureBodies: false, // Privacy-safe: don't capture request/response bodies
      stickySession: true, // Can be enabled as it doesn't expose PII
    }),
    Sentry.captureConsoleIntegration({
      levels: ['error'],
    }),
    // The consent integration will control when replay is active via sample rates
    sentryConsentIntegration({
      consentStateGetters: {
        functional: () => zaraz.consent.get('YYY') ?? false,
        analytics: () => zaraz.consent.get('USeX') ?? false,
        marketing: () => zaraz.consent.get('dqVA') ?? false,
        preferences: () => zaraz.consent.get('NNN') ?? false,
      },
      onConsentChange: (trigger) => {
        document.addEventListener('zarazConsentChoicesUpdated', trigger);
        document.addEventListener('zarazConsentAPIReady', trigger);
        return () => {
          document.removeEventListener('zarazConsentChoicesUpdated', trigger);
          document.removeEventListener('zarazConsentAPIReady', trigger);
        };
      },
      debug: true,
    }),
  ],

  beforeSend(event: any) {
    return event;
  },
});

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
