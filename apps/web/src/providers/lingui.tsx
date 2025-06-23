import type { ReactNode } from "react";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { createContext, useContext, useEffect, useState } from "react";

import type { Locale } from "~/locales";
import { defaultLocale, locales } from "~/locales";
// Import compiled messages
import { messages as enMessages } from "~/locales/en/messages";
import { messages as frMessages } from "~/locales/fr/messages";

const messages = {
  en: enMessages,
  fr: frMessages,
};

interface LinguiContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  availableLocales: Locale[];
}

const LinguiContext = createContext<LinguiContextType | undefined>(undefined);

export function useLinguiContext() {
  const context = useContext(LinguiContext);
  if (!context) {
    throw new Error("useLinguiContext must be used within a LinguiProvider");
  }
  return context;
}

interface LinguiProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
}

export function LinguiProviderWrapper({
  children,
  initialLocale = defaultLocale,
}: LinguiProviderProps) {
  const getInitialLocale = (): Locale => {
    if (typeof window !== "undefined") {
      const savedLocale = localStorage.getItem("locale") as Locale;
      if (savedLocale && locales.includes(savedLocale)) {
        return savedLocale;
      }
    }
    return initialLocale;
  };

  const [locale, setLocale] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    const initialLocale = getInitialLocale();
    i18n.load(initialLocale, messages[initialLocale]);
    i18n.activate(initialLocale);
  }, [getInitialLocale]);

  // Save locale to localStorage and activate it when it changes
  useEffect(() => {
    localStorage.setItem("locale", locale);

    i18n.load(locale, messages[locale]);
    i18n.activate(locale);
  }, [locale]);

  return (
    <LinguiContext.Provider
      value={{ locale, setLocale, availableLocales: locales }}
    >
      <I18nProvider i18n={i18n}>{children}</I18nProvider>
    </LinguiContext.Provider>
  );
}
