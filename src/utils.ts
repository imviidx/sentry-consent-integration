import {
  SENTRY_CONSENT_CONFIG_KEYS,
  SENTRY_DEFAULT_CONFIG,
  type SentryConsentConfigKey,
} from './configurationKeys';

/**
 * Utility to build a configuration object with only the tracked keys
 */
export function buildTrackedConfigObject(
  source: Record<string, any>
): Record<SentryConsentConfigKey, any> {
  const result = {} as Record<SentryConsentConfigKey, any>;

  SENTRY_CONSENT_CONFIG_KEYS.forEach((key) => {
    result[key] = source[key] ?? SENTRY_DEFAULT_CONFIG[key];
  });

  return result;
}

/**
 * Utility to check if a configuration key is managed by the consent integration
 */
export function isTrackedConfigKey(key: string): key is SentryConsentConfigKey {
  return (SENTRY_CONSENT_CONFIG_KEYS as readonly string[]).includes(key);
}

/**
 * Utility to get all configuration keys as a readonly array
 */
export function getTrackedConfigKeys(): readonly SentryConsentConfigKey[] {
  return SENTRY_CONSENT_CONFIG_KEYS;
}
