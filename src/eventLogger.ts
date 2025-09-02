// Event logging utility for debugging and monitoring
export function logEvent(message: string, data?: any) {
  // Only log in development/debug mode
  if (
    process.env.NODE_ENV === 'development' ||
    (typeof window !== 'undefined' && (window as any).__SENTRY_DEBUG__)
  ) {
    console.log(`[SentryConsentIntegration] ${message}`, data);
  }
}
