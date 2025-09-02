import { zaraz } from 'zaraz-ts';
import { useState, useEffect, useCallback } from 'react';

interface ConsentState {
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

interface Checkboxes {
  [key: string]: boolean;
}

export const useZarazConsentShortcuts = () => {
  const [currentConsentCheckboxes, setCurrentConsentCheboxes] =
    useState<Checkboxes>({});
  const [currentConsent, setCurrentConsent] = useState<ConsentState>({
    functional: false,
    analytics: false,
    marketing: false,
    preferences: false,
  });
  const [isConsentApiReady, setIsConsentApiReady] = useState<boolean>(false);

  const monitorConsentChanges = useCallback(() => {
    try {
      const newConsent = {
        functional: zaraz.consent.get('YYY') ?? false,
        analytics: zaraz.consent.get('USeX') ?? false,
        marketing: zaraz.consent.get('dqVA') ?? false,
        preferences: zaraz.consent.get('NNN') ?? false,
      };
      setCurrentConsent(newConsent);
      const windowZaraz = (window as any).zaraz;
      setCurrentConsentCheboxes(
        windowZaraz?.consent?.getAllCheckboxes?.() ?? {}
      );
    } catch (error) {
      // Failed to read consent from Zaraz
    }
  }, []);

  const showConsentDialog = useCallback(() => {
    const zaraz = (window as any).zaraz;
    if (zaraz?.showConsentModal) {
      zaraz.showConsentModal();
    } else if (zaraz?.consent?.modal?.show) {
      zaraz.consent.modal.show();
    } else if (zaraz?.consent?.show) {
      zaraz.consent.show();
    } else {
      // Zaraz consent dialog not available
    }
  }, []);

  // Listen for consent changes
  useEffect(() => {
    const handleConsentChange = () => {
      monitorConsentChanges();
    };

    document.addEventListener(
      'zarazConsentChoicesUpdated',
      handleConsentChange
    );
    return () =>
      document.removeEventListener(
        'zarazConsentChoicesUpdated',
        handleConsentChange
      );
  }, [monitorConsentChanges]);

  // Monitor Zaraz API readiness
  useEffect(() => {
    const checkZarazReady = () => {
      const windowZaraz = (window as any).zaraz;
      const ready = windowZaraz?.consent?.APIReady === true;
      if (isConsentApiReady !== ready) {
        setIsConsentApiReady(ready);
        monitorConsentChanges();
      }
    };

    const interval = setInterval(checkZarazReady, 100);
    checkZarazReady(); // Check immediately

    return () => clearInterval(interval);
  }, [isConsentApiReady, monitorConsentChanges]);

  return {
    currentConsent,
    currentConsentCheckboxes,
    isConsentApiReady,
    showConsentDialog,
  };
};
