// Main exports from the Sentry Consent Integration
export {
  sentryConsentIntegration,
  SentryConsentIntegrationClass,
  type Integration,
  type ConsentState,
  type SentryConsentIntegrationOptions,
} from './SentryConsentIntegration';

export { logEvent } from './eventLogger';

// Configuration constants and types
export {
  SENTRY_CONSENT_CONFIG_KEYS,
  SENTRY_CONFIG_DESCRIPTIONS,
  CONSENT_RESTRICTED_CONFIG_KEYS,
  SENTRY_DEFAULT_CONFIG,
  type SentryConsentConfigKey,
} from './configurationKeys';

// Utility functions
export {
  buildTrackedConfigObject,
  isTrackedConfigKey,
  getTrackedConfigKeys,
} from './utils';
