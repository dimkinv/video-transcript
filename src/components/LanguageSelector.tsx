import { useMemo, useState } from "react";
import type { Language } from "../types/languages";

interface LanguageSelectorProps {
  label: string;
  languages: Language[];
  selected: string | null;
  onChange: (value: string | null) => void;
  includeNoneOption?: boolean;
  noneLabel?: string;
}

export function LanguageSelector({
  label,
  languages,
  selected,
  onChange,
  includeNoneOption = false,
  noneLabel = "None",
}: LanguageSelectorProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const sorted = [...languages].sort((a, b) => a.name.localeCompare(b.name));
    if (!normalizedQuery) {
      return sorted;
    }

    return sorted.filter((language) => {
      const key = `${language.name} ${language.code}`.toLowerCase();
      return key.includes(normalizedQuery);
    });
  }, [languages, query]);

  return (
    <div className="language-selector">
      <label>{label}</label>
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
        placeholder="Search language..."
      />
      <select
        value={selected ?? ""}
        onChange={(event) => {
          const next = event.currentTarget.value;
          onChange(next || null);
        }}
      >
        {includeNoneOption && <option value="">{noneLabel}</option>}
        {filtered.map((language) => (
          <option key={language.code} value={language.code}>
            {language.name}
          </option>
        ))}
      </select>
    </div>
  );
}
