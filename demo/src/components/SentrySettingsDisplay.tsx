import React, { useState, useEffect } from 'react';
import * as Sentry from '@sentry/browser';
import {
  SENTRY_CONSENT_CONFIG_KEYS,
  SENTRY_CONFIG_DESCRIPTIONS,
  CONSENT_RESTRICTED_CONFIG_KEYS,
  type SentryConsentConfigKey,
} from 'sentry-consent-integration';

interface SentrySettingsDisplayProps {
  className?: string;
}

interface ConfigItem {
  key: string;
  defaultValue: any;
  currentValue: any;
  isOverridden: boolean;
  isForbidden: boolean;
  description?: string;
}

interface IntegrationItem {
  name: string;
  enabled: boolean;
  isDefault: boolean;
  config?: any;
}

export const SentrySettingsDisplay: React.FC<SentrySettingsDisplayProps> = ({
  className = '',
}) => {
  const [sentrySettings, setSentrySettings] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [asyncData, setAsyncData] = useState<{
    userCodedConfig: any;
    userCodedIntegrations: any;
    highlightedCurrentConfig: string;
    highlightedUserCodedConfig: string;
    highlightedCurrentIntegrations: string;
    highlightedUserCodedIntegrations: string;
  }>({
    userCodedConfig: {},
    userCodedIntegrations: {},
    highlightedCurrentConfig: '',
    highlightedUserCodedConfig: '',
    highlightedCurrentIntegrations: '',
    highlightedUserCodedIntegrations: '',
  });

  // Get actual Sentry defaults using available Sentry functions
  const getSentryDefaults = async () => {
    // Get default integrations from Sentry - this is available
    const defaultIntegrations = (Sentry as any).getDefaultIntegrations({});

    // Use applyDefaultOptions - this must be available
    if (typeof (Sentry as any).applyDefaultOptions !== 'function') {
      throw new Error('applyDefaultOptions is not available in Sentry');
    }

    const appliedDefaults = (Sentry as any).applyDefaultOptions({});
    const defaultConfig = {
      attachStacktrace: appliedDefaults.attachStacktrace ?? false,
      autoSessionTracking: appliedDefaults.autoSessionTracking ?? true,
      maxBreadcrumbs: appliedDefaults.maxBreadcrumbs ?? '100',
      profilesSampleRate: appliedDefaults.profilesSampleRate ?? 0.0,
      replaysOnErrorSampleRate: appliedDefaults.replaysOnErrorSampleRate ?? 0.0,
      replaysSessionSampleRate: appliedDefaults.replaysSessionSampleRate ?? 0.0,
      sampleRate: appliedDefaults.sampleRate ?? 1.0,
      sendClientReports: appliedDefaults.sendClientReports ?? true,
      sendDefaultPii: appliedDefaults.sendDefaultPii ?? false,
      tracesSampleRate: appliedDefaults.tracesSampleRate ?? 0.0,
    };

    return {
      config: defaultConfig,
      integrations: defaultIntegrations.reduce((acc: any, integration: any) => {
        acc[integration.name] = { enabled: true, isDefault: true };
        return acc;
      }, {}),
    };
  };

  const getSentrySettings = async () => {
    try {
      const client = Sentry.getClient();
      if (!client) {
        return { error: 'Sentry client not available' };
      }

      const options = client.getOptions();

      // Get actual Sentry defaults (now async)
      const sentryDefaults = await getSentryDefaults();

      // Build configuration comparison
      const configItems: Record<string, ConfigItem> = {};

      SENTRY_CONSENT_CONFIG_KEYS.forEach((key) => {
        const currentValue = (options as any)[key];
        const defaultValue = (sentryDefaults.config as any)[key];
        const isOverridden = currentValue !== defaultValue;
        const isForbidden = determineForbiddenState(
          key,
          currentValue,
          defaultValue
        );

        configItems[key] = {
          key,
          defaultValue,
          currentValue,
          isOverridden,
          isForbidden,
          description: getConfigDescription(key),
        };
      });

      // Get active integrations
      const activeIntegrations: Record<string, IntegrationItem> = {};
      try {
        if (options.integrations && Array.isArray(options.integrations)) {
          options.integrations.forEach((integration: any) => {
            const name = integration?.name || 'UnknownIntegration';
            activeIntegrations[name] = {
              name,
              enabled: true,
              isDefault: sentryDefaults.integrations[name]?.isDefault || false,
              config: integration,
            };
          });
        }

        // Add missing default integrations as disabled
        Object.entries(sentryDefaults.integrations).forEach(
          ([name, defaultIntegration]: [string, any]) => {
            if (!activeIntegrations[name]) {
              activeIntegrations[name] = {
                ...defaultIntegration,
                enabled: false,
              };
            }
          }
        );
      } catch (integrationError) {
        console.error('Error processing integrations:', integrationError);
      }

      return {
        configItems,
        activeIntegrations,
        rawOptions: options,
        sentryDefaults,
      };
    } catch (err) {
      return { error: `Failed to get Sentry settings: ${err}` };
    }
  };

  const getConfigDescription = (key: string): string => {
    return (
      SENTRY_CONFIG_DESCRIPTIONS[key as SentryConsentConfigKey] ||
      'Sentry configuration option'
    );
  };

  const determineForbiddenState = (
    key: string,
    currentValue: any,
    defaultValue: any
  ): boolean => {
    // Logic to determine if a setting is forbidden based on consent restrictions
    // This simulates the consent integration's behavior

    // Check if this key is consent-restricted using the exported constants
    const allRestrictedKeys = [
      ...CONSENT_RESTRICTED_CONFIG_KEYS.analytics,
      ...CONSENT_RESTRICTED_CONFIG_KEYS.preferences,
    ];

    if (allRestrictedKeys.includes(key as any)) {
      // If current value is more restrictive than default, it might be due to consent restrictions
      if (
        typeof currentValue === 'number' &&
        typeof defaultValue === 'number'
      ) {
        return currentValue < defaultValue;
      }
      if (
        typeof currentValue === 'boolean' &&
        typeof defaultValue === 'boolean'
      ) {
        return !currentValue && defaultValue;
      }
    }

    return false;
  };

  const getOriginalUserConfiguration = async () => {
    try {
      const client = Sentry.getClient();
      if (!client) {
        return { config: {}, integrations: {} };
      }

      const options = client.getOptions();
      if (!options.integrations) {
        return { config: {}, integrations: {} };
      }

      // Find the consent integration - try multiple possible names
      let consentIntegration: any = null;
      const possibleNames = [
        'SentryConsentIntegration',
        'sentryConsentIntegration',
      ];

      for (const integration of options.integrations) {
        if (possibleNames.includes(integration.name)) {
          consentIntegration = integration;
          break;
        }
      }

      if (!consentIntegration) {
        return { config: {}, integrations: {} };
      }

      // Check if the method exists
      if (!consentIntegration.getOriginalSentryConfig) {
        return { config: {}, integrations: {} };
      }

      // Get the original configuration from the consent integration
      const originalConfig = consentIntegration.getOriginalSentryConfig();

      // Get the original integrations that were passed by the user
      const sentryDefaults = await getSentryDefaults();
      const userIntegrations: any = {};

      if (options.integrations && Array.isArray(options.integrations)) {
        options.integrations.forEach((integration: any) => {
          const name = integration?.name || 'UnknownIntegration';
          userIntegrations[name] = {
            enabled: true,
            isDefault: sentryDefaults.integrations[name]?.isDefault || false,
          };
        });
      }

      return {
        config: originalConfig,
        integrations: userIntegrations,
      };
    } catch (err) {
      console.error(
        'Error getting original user configuration from consent integration:',
        err
      );
      return { config: {}, integrations: {} };
    }
  };

  const refreshSettings = async () => {
    try {
      setError(null);
      const settings = await getSentrySettings();
      setSentrySettings(settings);

      // Calculate async data for rendering
      if (settings && !settings.error) {
        const userCodedConfig = await buildUserCodedConfigObject();
        const userCodedIntegrations = await buildUserCodedIntegrationsObject();

        const currentConfigJson = JSON.stringify(
          buildCurrentConfigObject(settings.configItems || {}),
          null,
          2
        );
        const userCodedConfigJson = JSON.stringify(userCodedConfig, null, 2);
        const currentIntegrationsJson = JSON.stringify(
          buildCurrentIntegrationsObject(settings.activeIntegrations || {}),
          null,
          2
        );
        const userCodedIntegrationsJson = JSON.stringify(
          userCodedIntegrations,
          null,
          2
        );

        // Generate highlighted versions
        const highlightedCurrentConfig = await highlightCurrentDifferences(
          currentConfigJson,
          settings.configItems
        );
        const highlightedUserCodedConfig = await highlightUserCodedDifferences(
          userCodedConfigJson,
          settings.sentryDefaults
        );
        const highlightedCurrentIntegrations =
          await highlightCurrentDifferences(
            currentIntegrationsJson,
            undefined,
            settings.activeIntegrations
          );
        const highlightedUserCodedIntegrations =
          await highlightUserCodedDifferences(
            userCodedIntegrationsJson,
            settings.sentryDefaults
          );

        setAsyncData({
          userCodedConfig,
          userCodedIntegrations,
          highlightedCurrentConfig,
          highlightedUserCodedConfig,
          highlightedCurrentIntegrations,
          highlightedUserCodedIntegrations,
        });
      }
    } catch (err) {
      setError(`Error getting Sentry settings: ${err}`);
      setSentrySettings(null);
    }
  };

  useEffect(() => {
    // Initial load
    refreshSettings();

    // Refresh every 2 seconds to catch changes
    const interval = setInterval(refreshSettings, 2000);

    return () => clearInterval(interval);
  }, []);

  const buildDefaultConfigObject = (sentryDefaults: any) => {
    if (!sentryDefaults?.config) return {};

    const result: any = {};
    SENTRY_CONSENT_CONFIG_KEYS.forEach((key) => {
      result[key] = (sentryDefaults.config as any)[key];
    });
    return result;
  };

  const buildUserCodedConfigObject = async () => {
    // Get the original user configuration from consent integration
    const originalConfig = await getOriginalUserConfiguration();
    return originalConfig.config || {};
  };

  const buildCurrentConfigObject = (
    configItems: Record<string, ConfigItem>
  ) => {
    const result: any = {};
    Object.entries(configItems).forEach(([key, item]) => {
      result[key] = item.currentValue;
    });
    return result;
  };

  const buildUserCodedIntegrationsObject = async () => {
    // Get the original user integrations from consent integration
    const originalConfig = await getOriginalUserConfiguration();
    return originalConfig.integrations || {};
  };

  const buildDefaultIntegrationsObject = (sentryDefaults: any) => {
    if (!sentryDefaults?.integrations) return {};
    return sentryDefaults.integrations;
  };

  const buildCurrentIntegrationsObject = (
    activeIntegrations: Record<string, IntegrationItem>
  ) => {
    const result: any = {};
    Object.entries(activeIntegrations).forEach(([key, item]) => {
      result[key] = {
        enabled: item.enabled,
        isDefault: item.isDefault,
      };
    });
    return result;
  };

  const highlightCurrentDifferences = async (
    jsonString: string,
    configItems?: Record<string, ConfigItem>,
    activeIntegrations?: Record<string, IntegrationItem>
  ) => {
    if (!configItems && !activeIntegrations) return jsonString;

    let highlightedJson = jsonString;

    // Get original user config from consent integration
    const originalUserConfig = await getOriginalUserConfiguration();

    // Highlight config values based on their relationship to user-coded and default values
    if (configItems && originalUserConfig.config) {
      Object.entries(configItems).forEach(([key, item]) => {
        const userCodedValue = originalUserConfig.config[key];
        const currentValue = item.currentValue;
        const defaultValue = item.defaultValue;

        // Check if current value matches user-coded value
        const matchesUserCode =
          userCodedValue !== undefined && currentValue === userCodedValue;
        // Check if current value differs from user-coded value
        const isModifiedFromUserCode =
          userCodedValue !== undefined && currentValue !== userCodedValue;
        // Check if user had overridden the default
        const userOverrodeDefault =
          userCodedValue !== undefined && userCodedValue !== defaultValue;

        let shouldHighlight = false;
        let bgColor = '';
        let textColor = '';

        if (item.isForbidden) {
          // Always highlight forbidden values in amber
          shouldHighlight = true;
          bgColor = 'bg-amber-200';
          textColor = 'text-amber-800';
        } else if (matchesUserCode && userOverrodeDefault) {
          // Current value matches user config AND user had overridden default -> green (overridden from default)
          shouldHighlight = true;
          bgColor = 'bg-green-200';
          textColor = 'text-green-800';
        } else if (isModifiedFromUserCode) {
          // Current value differs from user config -> orange (modified from user config)
          shouldHighlight = true;
          bgColor = 'bg-orange-200';
          textColor = 'text-orange-800';
        }

        if (shouldHighlight) {
          const valueStr = JSON.stringify(currentValue);
          // Check if valueStr is a valid string before using replace
          if (valueStr && typeof valueStr === 'string') {
            // More flexible regex that matches the key-value pair in JSON
            const regex = new RegExp(
              `("${key}")(:)(\\s*)(${valueStr.replace(
                /[.*+?^${}()|[\]\\]/g,
                '\\$&'
              )})`,
              'g'
            );
            highlightedJson = highlightedJson.replace(
              regex,
              `$1$2$3<span class="${bgColor} ${textColor} px-1 rounded font-semibold">$4</span>`
            );
          }
        }
      });
    }

    // Highlight integration differences from user-coded integrations
    if (activeIntegrations && originalUserConfig.integrations) {
      Object.entries(activeIntegrations).forEach(([key, item]) => {
        const userHadIntegration = originalUserConfig.integrations[key];
        const isModifiedFromUserCode =
          userHadIntegration?.enabled !== item.enabled;

        if (isModifiedFromUserCode || !item.isDefault) {
          // Highlight modified or custom integrations
          const regex = new RegExp(`("${key}")(:)`, 'g');
          const bgColor = !item.isDefault ? 'bg-blue-200' : 'bg-orange-200';
          const textColor = !item.isDefault
            ? 'text-blue-800'
            : 'text-orange-800';
          highlightedJson = highlightedJson.replace(
            regex,
            `<span class="${bgColor} ${textColor} px-1 rounded font-semibold">$1</span>$2`
          );
        }
      });
    }

    return highlightedJson;
  };

  const highlightUserCodedDifferences = async (
    jsonString: string,
    sentryDefaults?: any
  ) => {
    // Get original user config from consent integration
    const originalUserData = await getOriginalUserConfiguration();

    if (
      !originalUserData.config &&
      !originalUserData.integrations &&
      !sentryDefaults
    )
      return jsonString;

    let highlightedJson = jsonString;

    // Highlight config values that differ from default (user overrides)
    if (originalUserData.config && sentryDefaults) {
      Object.entries(originalUserData.config).forEach(([key, userValue]) => {
        const defaultValue = (sentryDefaults.config as any)[key];
        const isUserOverride = userValue !== defaultValue;

        if (isUserOverride) {
          const valueStr = JSON.stringify(userValue);
          // Check if valueStr is a valid string before using replace
          if (valueStr && typeof valueStr === 'string') {
            // More flexible regex that matches the key-value pair in JSON
            const regex = new RegExp(
              `("${key}")(:)(\\s*)(${valueStr.replace(
                /[.*+?^${}()|[\]\\]/g,
                '\\$&'
              )})`,
              'g'
            );
            highlightedJson = highlightedJson.replace(
              regex,
              `$1$2$3<span class="bg-green-200 text-green-800 px-1 rounded font-semibold">$4</span>`
            );
          }
        }
      });
    }

    // Highlight custom integrations (non-default)
    if (originalUserData.integrations) {
      Object.entries(originalUserData.integrations).forEach(
        ([key, integration]: [string, any]) => {
          if (!integration.isDefault) {
            // Highlight custom integrations
            const regex = new RegExp(`("${key}")(:)`, 'g');
            highlightedJson = highlightedJson.replace(
              regex,
              `<span class="bg-blue-200 text-blue-800 px-1 rounded font-semibold">$1</span>$2`
            );
          }
        }
      );
    }

    return highlightedJson;
  };

  return (
    <div className={`bg-white rounded-lg p-6 shadow-sm ${className}`}>
      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-slate-800 text-xl font-semibold m-0'>
          Sentry Configuration Diff
        </h2>
        <button
          onClick={refreshSettings}
          className='px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4'>
          {error}
        </div>
      )}

      {sentrySettings ? (
        <div className='space-y-6'>
          {sentrySettings.error ? (
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
              {sentrySettings.error}
            </div>
          ) : (
            <>
              {/* Legend */}
              <div className='flex flex-wrap gap-4 p-4 bg-slate-50 rounded-lg'>
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 bg-green-200 rounded'></div>
                  <span className='text-sm text-slate-600'>
                    Overridden from default
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 bg-orange-200 rounded'></div>
                  <span className='text-sm text-slate-600'>
                    Modified from user config
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 bg-amber-200 rounded'></div>
                  <span className='text-sm text-slate-600'>
                    Restricted by consent
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 bg-blue-200 rounded'></div>
                  <span className='text-sm text-slate-600'>
                    Custom integration
                  </span>
                </div>
              </div>

              {/* Client Configuration Comparison */}
              <div>
                <h3 className='text-lg font-medium text-slate-700 mb-4'>
                  Client Configuration
                </h3>
                <div className='grid grid-cols-3 gap-4'>
                  {/* Default Config */}
                  <div>
                    <h4 className='text-sm font-medium text-slate-600 mb-2 p-2 bg-gray-100 rounded-t'>
                      Default Configuration
                    </h4>
                    <pre className='bg-slate-900 text-slate-300 p-4 rounded-b text-xs'>
                      <code>
                        {JSON.stringify(
                          buildDefaultConfigObject(
                            sentrySettings.sentryDefaults
                          ),
                          null,
                          2
                        )}
                      </code>
                    </pre>
                  </div>

                  {/* User Coded Config */}
                  <div>
                    <h4 className='text-sm font-medium text-slate-600 mb-2 p-2 bg-blue-100 rounded-t'>
                      User coded Configuration
                    </h4>
                    <pre className='bg-slate-900 text-slate-300 p-4 rounded-b text-xs'>
                      <code
                        dangerouslySetInnerHTML={{
                          __html: asyncData.highlightedUserCodedConfig,
                        }}
                      />
                    </pre>
                  </div>

                  {/* Current Config */}
                  <div>
                    <h4 className='text-sm font-medium text-slate-600 mb-2 p-2 bg-gray-100 rounded-t'>
                      Current Configuration
                    </h4>
                    <pre className='bg-slate-900 text-slate-300 p-4 rounded-b text-xs'>
                      <code
                        dangerouslySetInnerHTML={{
                          __html: asyncData.highlightedCurrentConfig,
                        }}
                      />
                    </pre>
                  </div>
                </div>
              </div>

              {/* Active Integrations Comparison */}
              <div>
                <h3 className='text-lg font-medium text-slate-700 mb-4'>
                  Active Integrations
                </h3>
                <div className='grid grid-cols-3 gap-4'>
                  {/* Default Integrations */}
                  <div>
                    <h4 className='text-sm font-medium text-slate-600 mb-2 p-2 bg-gray-100 rounded-t'>
                      Default Integrations
                    </h4>
                    <pre className='bg-slate-900 text-slate-300 p-4 rounded-b text-xs'>
                      <code>
                        {JSON.stringify(
                          buildDefaultIntegrationsObject(
                            sentrySettings.sentryDefaults
                          ),
                          null,
                          2
                        )}
                      </code>
                    </pre>
                  </div>

                  {/* User Coded Integrations */}
                  <div>
                    <h4 className='text-sm font-medium text-slate-600 mb-2 p-2 bg-blue-100 rounded-t'>
                      User coded Integrations
                    </h4>
                    <pre className='bg-slate-900 text-slate-300 p-4 rounded-b text-xs'>
                      <code
                        dangerouslySetInnerHTML={{
                          __html: asyncData.highlightedUserCodedIntegrations,
                        }}
                      />
                    </pre>
                  </div>

                  {/* Current Integrations */}
                  <div>
                    <h4 className='text-sm font-medium text-slate-600 mb-2 p-2 bg-gray-100 rounded-t'>
                      Current Integrations
                    </h4>
                    <pre className='bg-slate-900 text-slate-300 p-4 rounded-b text-xs'>
                      <code
                        dangerouslySetInnerHTML={{
                          __html: asyncData.highlightedCurrentIntegrations,
                        }}
                      />
                    </pre>
                  </div>
                </div>
              </div>

              {/* Raw Configuration (Collapsible) */}
              <details className='border border-slate-200 rounded-lg'>
                <summary className='p-4 cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors font-medium text-slate-700'>
                  Raw Sentry Options
                </summary>
                <div className='p-4 border-t border-slate-200'>
                  <pre className='bg-slate-900 text-green-400 p-4 rounded-lg text-sm'>
                    <code>
                      {JSON.stringify(
                        sentrySettings.rawOptions,
                        (key, value) => {
                          // Handle circular references and complex objects
                          if (value && typeof value === 'object') {
                            // Skip circular references and complex internal objects
                            if (value === value.constructor?.prototype)
                              return '[Circular]';
                            if (
                              key.startsWith('_') &&
                              typeof value === 'object'
                            )
                              return '[Internal Object]';
                            if (
                              value.constructor &&
                              value.constructor.name &&
                              [
                                'ReplayContainer',
                                'HTMLElement',
                                'Window',
                                'Document',
                              ].includes(value.constructor.name)
                            ) {
                              return `[${value.constructor.name}]`;
                            }
                          }
                          return value;
                        },
                        2
                      )}
                    </code>
                  </pre>
                </div>
              </details>
            </>
          )}
        </div>
      ) : (
        <div className='flex items-center justify-center p-8'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
          <span className='ml-2 text-slate-600'>
            Loading Sentry settings...
          </span>
        </div>
      )}
    </div>
  );
};
