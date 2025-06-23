import { useLocalisation } from "~/hooks/useLocalisation";
import { localeNames } from "~/locales";

export function LanguageSelector() {
  const { locale, setLocale, availableLocales } = useLocalisation();

  console.log(locale, availableLocales);

  return (
    <div className="flex items-center space-x-2">
      <select
        id="language-select"
        value={locale}
        onChange={(e) => setLocale(e.target.value as any)}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      >
        {availableLocales.map((loc) => (
          <option key={loc} value={loc}>
            {localeNames[loc]}
          </option>
        ))}
      </select>
    </div>
  );
}
