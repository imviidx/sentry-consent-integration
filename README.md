# Sentry Consent Integration

[![npm version](https://badge.fury.io/js/sentry-consent-integration.svg)](https://badge.fury.io/js/sentry-consent-integration)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A TypeScript integration that dynamically adjusts Sentry configuration based on user consent preferences, ensuring GDPR and privacy compliance while maintaining optimal error tracking and performance monitoring.

**🌐 [Live Demo](https://pod666.github.io/sentry-consent-integration/)**

## What's New in 2.0.0

🚨 **Major Breaking Changes**: This release transforms the package from Zaraz-specific to a **generic consent integration** that works with any consent management platform.

### Key Changes

- **Package Renamed**: `sentry-zaraz-consent-integration` → `sentry-consent-integration`
- **Generic API**: Now works with any consent platform through callback functions
- **Platform Agnostic**: No longer tied to Cloudflare Zaraz or any specific platform
- **Getter-Based Architecture**: Uses individual getter functions for better control
- **Cleaner Dependencies**: Removed all platform-specific dependencies, only peer dependencies remain

### Migration Path

The new generic API requires you to implement your own consent getters and change listeners for your specific consent management platform:

```typescript
// Before (v1.x - Zaraz-specific)
import { sentryZarazConsentIntegration } from 'sentry-zaraz-consent-integration';

// After (v2.0 - Generic, works with any platform)
import { sentryConsentIntegration } from 'sentry-consent-integration';

sentryConsentIntegration({
  consentStateGetters: {
    functional: () => yourConsentPlatform.hasConsent('functional'),
    analytics: () => yourConsentPlatform.hasConsent('analytics'),
    marketing: () => yourConsentPlatform.hasConsent('marketing'),
    preferences: () => yourConsentPlatform.hasConsent('preferences'),
  },
  onConsentChange: (trigger) => {
    const cleanup = yourConsentPlatform.onChange(() => trigger());
    return cleanup;
  },
});
```

## Features

- **🎯 Generic Consent Management**: Works with any consent management platform through callbacks
- **⚡ Real-time Updates**: Automatically adjust Sentry settings when consent changes
- **📦 Event Queuing**: Queue events during consent determination, process when granted
- **🛡️ Privacy Compliant**: Respect user consent for different data processing purposes
- **🔧 Configurable**: Flexible callback-based architecture with timeout settings
- **📊 Debug Support**: Comprehensive logging for troubleshooting
- **🌐 Platform Agnostic**: Not tied to any specific consent management platform

## Quick Start

### Installation

```bash
npm install sentry-consent-integration
```

**Note**: This package requires `@sentry/react` (or another Sentry SDK) and `@sentry/types` as peer dependencies in your project.

### Basic Usage

```typescript
import { sentryConsentIntegration } from 'sentry-consent-integration';
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'your-sentry-dsn',
  integrations: [
    sentryConsentIntegration({
      consentStateGetters: {
        functional: () => myConsentTool.isGranted('essential'),
        analytics: () => myConsentTool.isGranted('analytics'),
        marketing: () => myConsentTool.isGranted('marketing'),
        preferences: () => myConsentTool.isGranted('preferences'),
      },
      onConsentChange: (trigger) => {
        const cleanup = myConsentTool.onChange(() => trigger());
        return cleanup;
      },
      debug: true, // Enable debug logging
    }),
  ],
});
```

## Platform Examples

The generic API allows you to integrate with any consent management platform. Here are examples for popular platforms:

### Cookiebot

```typescript
sentryConsentIntegration({
  consentStateGetters: {
    functional: () => window.Cookiebot?.consent?.necessary ?? false,
    analytics: () => window.Cookiebot?.consent?.statistics ?? false,
    marketing: () => window.Cookiebot?.consent?.marketing ?? false,
    preferences: () => window.Cookiebot?.consent?.preferences ?? false,
  },
  onConsentChange: (trigger) => {
    window.addEventListener('CookiebotOnConsentReady', trigger);
    window.addEventListener('CookiebotOnDialogDisplay', trigger);
    return () => {
      window.removeEventListener('CookiebotOnConsentReady', trigger);
      window.removeEventListener('CookiebotOnDialogDisplay', trigger);
    };
  },
});
```

### OneTrust

```typescript
sentryConsentIntegration({
  consentStateGetters: {
    functional: () =>
      window.OneTrust?.IsAlertBoxClosed() &&
      window.OnetrustActiveGroups?.includes('C0001'),
    analytics: () =>
      window.OneTrust?.IsAlertBoxClosed() &&
      window.OnetrustActiveGroups?.includes('C0002'),
    marketing: () =>
      window.OneTrust?.IsAlertBoxClosed() &&
      window.OnetrustActiveGroups?.includes('C0004'),
    preferences: () =>
      window.OneTrust?.IsAlertBoxClosed() &&
      window.OnetrustActiveGroups?.includes('C0003'),
  },
  onConsentChange: (trigger) => {
    window.addEventListener('OneTrustGroupsUpdated', trigger);
    return () => window.removeEventListener('OneTrustGroupsUpdated', trigger);
  },
});
```

### Cloudflare Zaraz

```typescript
sentryConsentIntegration({
  consentStateGetters: {
    functional: () => window.zaraz?.consent?.get('functional') ?? false,
    analytics: () => window.zaraz?.consent?.get('analytics') ?? false,
    marketing: () => window.zaraz?.consent?.get('marketing') ?? false,
    preferences: () => window.zaraz?.consent?.get('preferences') ?? false,
  },
  onConsentChange: (trigger) => {
    document.addEventListener('zarazConsentChoicesUpdated', trigger);
    document.addEventListener('zarazConsentAPIReady', trigger);
    return () => {
      document.removeEventListener('zarazConsentChoicesUpdated', trigger);
      document.removeEventListener('zarazConsentAPIReady', trigger);
    };
  },
});
```

### Custom Consent Management

```typescript
// For your own custom consent management solution
sentryConsentIntegration({
  consentStateGetters: {
    functional: () => localStorage.getItem('consent-functional') === 'true',
    analytics: () => localStorage.getItem('consent-analytics') === 'true',
    marketing: () => localStorage.getItem('consent-marketing') === 'true',
    preferences: () => localStorage.getItem('consent-preferences') === 'true',
  },
  onConsentChange: (trigger) => {
    const listener = (event) => {
      if (event.key?.startsWith('consent-')) {
        trigger();
      }
    };
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  },
});
```

## Purpose Mapping

The integration supports four consent categories that map to different Sentry features:

| Purpose         | Sentry Features                                                       | Description                                          |
| --------------- | --------------------------------------------------------------------- | ---------------------------------------------------- |
| **Functional**  | Core error tracking, session tracking, unhandled rejections           | Essential functionality for error monitoring         |
| **Analytics**   | Performance monitoring, traces, profiling, breadcrumbs                | Performance metrics and optimization data            |
| **Preferences** | Session replay, PII collection, user context, personalization         | Personal data and customized experiences             |
| **Marketing**   | User identification for A/B testing, feature flags, campaign tracking | User interaction and behavior analysis for marketing |

> **Session Tracking Note**: Basic session status tracking for release health (`autoSessionTracking`) is categorized under **functional** consent as it's essential for error monitoring. Detailed session analytics integrations that track user adoption patterns over time would be categorized under **analytics** consent.

## Configuration

### SentryConsentIntegrationOptions

```typescript
interface ConsentStateGetters {
  functional: () => boolean;
  analytics: () => boolean;
  marketing: () => boolean;
  preferences: () => boolean;
}

interface SentryConsentIntegrationOptions {
  /**
   * Object containing getter functions for each consent purpose
   * Each getter should return a boolean indicating current consent status
   */
  consentStateGetters: ConsentStateGetters;

  /**
   * Function to listen for consent changes
   * Should call the provided trigger function when consent changes
   * Should return a cleanup function to remove the listener
   */
  onConsentChange: (trigger: () => void) => () => void;

  /**
   * Timeout in milliseconds to wait for initial consent state
   * @default 30000 (30 seconds)
   */
  consentTimeout?: number;

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;
}
```

### Consent State Structure

```typescript
interface ConsentState {
  functional?: boolean; // Core functionality
  analytics?: boolean; // Performance monitoring and detailed context
  preferences?: boolean; // PII and session replay (privacy-sensitive)
  marketing?: boolean; // User identification and behavioral analysis
}
```

## Integration Behavior

### Event Processing Flow

1. **Event Captured**: Sentry attempts to capture an event
2. **Consent Check**: Integration checks current consent status
3. **Decision Making**:
   - ✅ **Consent Granted**: Event is allowed through
   - ❌ **Consent Denied**: Event is blocked
   - ⏳ **Consent Unknown**: Event is blocked (no queuing by default)
4. **Real-time Updates**: When consent changes, Sentry configuration updates immediately

> **Note**: Since v1.1.0, events are not queued when consent is unknown. The integration maintains strict privacy by default and only processes events when explicit consent is granted.

### Sentry Configuration Adjustments

Based on consent status, the integration automatically adjusts:

```typescript
// Functional consent affects core tracking
autoSessionTracking: functionalConsent;
captureUnhandledRejections: functionalConsent;
enabled: functionalConsent;

// Analytics consent affects performance monitoring and detailed context
tracesSampleRate: analyticsConsent ? originalRate : 0;
profilesSampleRate: analyticsConsent ? originalRate : 0;
maxBreadcrumbs: analyticsConsent ? originalValue : 0;
attachStacktrace: analyticsConsent;

// Preferences consent affects PII and session replay (most privacy-sensitive)
sendDefaultPii: preferencesConsent;
replaysSessionSampleRate: preferencesConsent ? originalRate : 0;
replaysOnErrorSampleRate: preferencesConsent ? originalRate : 0;

// Marketing consent affects user identification and behavioral tracking
initialScope: marketingConsent
  ? {
      user: { id: userId, segment: userSegment },
      tags: { campaign: campaignId, cohort: userCohort },
    }
  : {};
```

> **Privacy by Default**: Even when `preferences` consent is granted, Session Replay uses Sentry's safest defaults (maskAllText: true, maskAllInputs: true, blockAllMedia: true). Developers must explicitly override these settings if they need to capture unmasked content for debugging purposes.

## Development

### Building

```bash
# Build the integration
npm run build

# Build in watch mode
npm run build:watch

# Build demo project
npm run demo:build
```

### Project Structure

```
├── src/
│   ├── index.ts                          # Main exports
│   ├── SentryConsentIntegration.ts       # Generic consent integration
│   └── eventLogger.ts                    # Logging utilities
├── demo/
│   ├── index.html                        # Demo interface
│   ├── src/
│   │   └── main.tsx                      # Demo application
│   └── README.md                         # Demo documentation
├── dist/                                 # Compiled JavaScript
└── CHANGELOG.md                          # Version history
```

## Browser Compatibility

- ES2020+ support required
- Modern browsers (Chrome 80+, Firefox 74+, Safari 13.1+, Edge 80+)
- ES Modules support
- Fetch API support

## Dependencies

### Required Peer Dependencies

- `@sentry/react` (^8.29.0 or compatible Sentry SDK)
- `@sentry/types` (^8.29.0)

### Package Dependencies

- No required runtime dependencies (peer dependencies only)

## Package Exports

The package provides a clean, generic API for consent integration:

### Main Package (`sentry-consent-integration`)

```typescript
import {
  sentryConsentIntegration,
  SentryConsentIntegrationClass,
  type ConsentState,
  type ConsentStateGetters,
  type SentryConsentIntegrationOptions,
  logEvent,
} from 'sentry-consent-integration';
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and add tests
4. Update CHANGELOG.md with your changes
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- 🌐 [Live Demo](https://pod666.github.io/sentry-consent-integration/)
- 📚 [Demo Documentation](demo/README.md)
- 🐛 [Issue Tracker](https://github.com/POD666/sentry-consent-integration/issues)
- 📝 [Changelog](CHANGELOG.md)
