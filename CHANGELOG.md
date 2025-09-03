# Changelog

## [0.1.0] - 2025-09-03

### 🎉 Initial Release

A comprehensive Sentry integration that manages error tracking and monitoring based on user consent preferences. The integration provides a platform-agnostic approach to GDPR compliance with flexible consent management.

### ✨ Core Features

- **Generic Consent Integration**: Platform-agnostic integration that works with any consent management platform (Cookiebot, OneTrust, Zaraz, custom solutions)
- **Purpose-Based Consent Mapping**: Support for functional, analytics, marketing, and preferences consent purposes
- **Event-Driven Architecture**: Real-time consent monitoring with proper event listeners and trigger functions
- **Event Queuing System**: Queue Sentry events during consent determination and process them when consent is granted
- **Dynamic Configuration**: Real-time Sentry settings adjustment based on consent state changes
- **GDPR Compliance**: Enhanced privacy compliance with proper data categorization and consent granularity

### 🔧 Technical Implementation

- **Getter-Based API**: Uses callback functions for each consent purpose to determine current state
- **Trigger Functions**: Event-driven updates only when consent state changes
- **Modern Sentry API**: Uses latest Sentry v8+ APIs (`getClient()`, `getCurrentScope()`) with proper deprecation handling
- **TypeScript Support**: Comprehensive type definitions for all integration options and configurations
- **Configurable Timeout**: Customizable consent determination timeout (default: 30s)
- **Error Handling**: Robust error handling and fallback behavior for various edge cases

### 📦 Package Structure

```typescript
// Main API
import { sentryConsentIntegration } from 'sentry-consent-integration';

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
  debug: true,
});
```

### 🎯 Consent Purpose Mapping

- **Functional**: Core error tracking, session tracking, unhandled rejections - Essential functionality
- **Analytics**: Performance monitoring, traces, profiling, breadcrumbs - Performance metrics and optimization
- **Preferences**: Session replay, PII collection, user context, personalization - Personal data and customized experiences
- **Marketing**: User identification for A/B testing, feature flags, campaign tracking - User interaction and behavior analysis

### 🌐 Interactive Demo

- **Live Demo**: Interactive web demo showcasing all integration features
- **Vite-Powered**: Modern development stack with TypeScript, Vite, and Tailwind CSS v4
- **Real-Time Testing**: Console monitoring, consent toggles, and Sentry event testing
- **Development Tools**: Hot module replacement, source maps, and comprehensive debugging

### 🔒 Privacy & Security

- **Privacy-by-Default**: Session Replay uses Sentry's safest defaults (maskAllText, maskAllInputs, blockAllMedia)
- **Data Minimization**: Supports GDPR data minimization by properly categorizing privacy-sensitive features
- **Clean Dependencies**: Only essential Sentry SDK peer dependencies, no platform-specific code
- **Resource Efficient**: No polling mechanisms - all updates are event-driven for optimal performance

### 📋 Development Experience

- **Clean API**: Simplified integration focused solely on consent monitoring (no consent setting functionality)
- **Documentation**: Comprehensive README with examples for popular consent platforms
- **Build Tools**: Modern build pipeline with TypeScript compilation and ES module support
- **Testing**: Comprehensive demo project for integration validation and debugging
