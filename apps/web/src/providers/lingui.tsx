import type { ReactNode } from "react";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { createContext, useContext, useEffect, useRef, useState } from "react";

import type { Locale } from "~/locales";
import { defaultLocale, locales } from "~/locales";
import { messages as deMessages } from "~/locales/de/messages";
import { messages as enMessages } from "~/locales/en/messages";
import { messages as esMessages } from "~/locales/es/messages";
import { messages as frMessages } from "~/locales/fr/messages";
import { messages as itMessages } from "~/locales/it/messages";
import { messages as nlMessages } from "~/locales/nl/messages";

const messages = {
  en: enMessages,
  fr: frMessages,
  de: deMessages,
  es: esMessages,
  it: itMessages,
  nl: nlMessages,
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
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [isHydrated, setIsHydrated] = useState(false);
  const isInitialised = useRef(false);

  if (!isInitialised.current) {
    i18n.load(defaultLocale, messages[defaultLocale]);
    i18n.activate(defaultLocale);
    isInitialised.current = true;
  }

  useEffect(() => {
    const savedLocale = localStorage.getItem("locale") as Locale;

    if (savedLocale && locales.includes(savedLocale)) {
      setLocale(savedLocale);
    } else {
      setLocale(initialLocale);
    }
    setIsHydrated(true);
  }, [initialLocale]);

  useEffect(() => {
    if (isHydrated) {
      i18n.load(locale, messages[locale]);
      i18n.activate(locale);
      localStorage.setItem("locale", locale);
    }
  }, [locale, isHydrated]);

  return (
    <LinguiContext.Provider
      value={{ locale, setLocale, availableLocales: [...locales] }}
    >
      <I18nProvider i18n={i18n} key={locale}>
        {children}
      </I18nProvider>
    </LinguiContext.Provider>
  );
}
