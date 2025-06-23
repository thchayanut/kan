import { useLingui } from "@lingui/react";

import { useLinguiContext } from "~/providers/lingui";

export function useLocalisation() {
  const { i18n } = useLingui();
  const { locale, setLocale, availableLocales } = useLinguiContext();

  return {
    locale,
    setLocale,
    availableLocales,
    formatDate: i18n.date,
    formatNumber: i18n.number,
  };
}
