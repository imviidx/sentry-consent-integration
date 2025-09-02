/**
 * Configuration keys that are managed by the Sentry Consent Integration
 *
 * These keys represent the Sentry client options that are dynamically
 * modified based on consent state to ensure privacy compliance.
 *
 * Categories:
 * - Core functionality: sampleRate, autoSessionTracking
 * - Analytics features: attachStacktrace, maxBreadcrumbs, tracesSampleRate, profilesSampleRate
 * - Privacy features: sendDefaultPii, replaysSessionSampleRate, replaysOnErrorSampleRate
 */
export const SENTRY_CONSENT_CONFIG_KEYS = [
  'attachStacktrace',
  'autoSessionTracking',
  'maxBreadcrumbs',
  'profilesSampleRate',
  'replaysOnErrorSampleRate',
  'replaysSessionSampleRate',
  'sampleRate',
  'sendDefaultPii',
  'tracesSampleRate',
] as const;

/**
 * Type representing the configuration keys managed by the consent integration
 */
export type SentryConsentConfigKey =
  (typeof SENTRY_CONSENT_CONFIG_KEYS)[number];

/**
 * Configuration descriptions for display purposes
 */
export const SENTRY_CONFIG_DESCRIPTIONS: Record<
  SentryConsentConfigKey,
  string
> = {
  attachStacktrace: 'Attach stack traces to all events',
  autoSessionTracking: 'Automatically track user sessions',
  maxBreadcrumbs: 'Maximum number of breadcrumbs to store',
  profilesSampleRate: 'Percentage of transactions to profile',
  replaysOnErrorSampleRate: 'Percentage of error sessions to record',
  replaysSessionSampleRate: 'Percentage of sessions to record',
  sampleRate: 'Percentage of events to send to Sentry',
  sendDefaultPii: 'Send personally identifiable information',
  tracesSampleRate: 'Percentage of transactions to trace',
} as const;

/**
 * Configuration keys that are typically restricted based on consent categories
 */
export const CONSENT_RESTRICTED_CONFIG_KEYS = {
  analytics: [
    'attachStacktrace',
    'maxBreadcrumbs',
    'tracesSampleRate',
    'profilesSampleRate',
  ] as const,
  preferences: [
    'sendDefaultPii',
    'replaysSessionSampleRate',
    'replaysOnErrorSampleRate',
  ] as const,
  functional: ['sampleRate', 'autoSessionTracking'] as const,
} as const;

/**
 * Default values for Sentry configuration options
 * These match Sentry's built-in defaults
 */
export const SENTRY_DEFAULT_CONFIG: Record<SentryConsentConfigKey, any> = {
  attachStacktrace: false,
  autoSessionTracking: true,
  maxBreadcrumbs: 100,
  profilesSampleRate: 0.0,
  replaysOnErrorSampleRate: 0.0,
  replaysSessionSampleRate: 0.0,
  sampleRate: 1.0,
  sendDefaultPii: false,
  tracesSampleRate: 0.0,
} as const;
