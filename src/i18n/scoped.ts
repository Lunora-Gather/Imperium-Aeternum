import { getLocale, translate, type Locale } from '.';

export interface TranslationPattern { pattern: RegExp; replacement: string }
export interface ScopedLocaleCatalog {
  exact?: Readonly<Record<string, string>>;
  patterns?: readonly TranslationPattern[];
  fragments?: Readonly<Record<string, string>>;
}
export interface ScopedCatalog {
  'zh-TW'?: Readonly<Record<string, string>> | ScopedLocaleCatalog;
  en?: Readonly<Record<string, string>> | ScopedLocaleCatalog;
}

export type Translator = (source: string, values?: Record<string, string | number>) => string;

function resolveScoped(source: string, localeCatalog: Readonly<Record<string, string>> | ScopedLocaleCatalog | undefined): string | undefined {
  if (!localeCatalog) return undefined;
  const structured = 'exact' in localeCatalog || 'patterns' in localeCatalog || 'fragments' in localeCatalog;
  const exact = structured ? (localeCatalog as ScopedLocaleCatalog).exact : localeCatalog as Readonly<Record<string, string>>;
  if (exact?.[source] !== undefined) return exact[source];
  if (!structured) return undefined;
  for (const rule of (localeCatalog as ScopedLocaleCatalog).patterns ?? []) {
    rule.pattern.lastIndex = 0;
    if (rule.pattern.test(source)) {
      rule.pattern.lastIndex = 0;
      return source.replace(rule.pattern, rule.replacement);
    }
  }
  const fragments = (localeCatalog as ScopedLocaleCatalog).fragments;
  if (fragments) {
    let translated = source;
    for (const [from, to] of Object.entries(fragments).sort(([a], [b]) => b.length - a.length)) translated = translated.split(from).join(to);
    if (translated !== source) return translated;
  }
  return undefined;
}

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(values[key] ?? `{{${key}}}`));
}

export function translateScoped(source: string, catalog: ScopedCatalog, values: Record<string, string | number> = {}, locale: Locale = getLocale()): string {
  if (locale === 'zh-CN') return interpolate(source, values);
  const scoped = resolveScoped(source, catalog[locale]);
  return scoped === undefined ? translate(source, values, locale) : interpolate(scoped, values);
}

/**
 * Creates a lightweight translator whose catalog stays in the caller's lazy
 * chunk. The app shell owns the locale subscription and rerenders screens when
 * it changes, so screen catalogs do not inflate the initial bundle.
 */
export function createScopedTranslator(catalog: ScopedCatalog): Translator {
  return (source, values) => translateScoped(source, catalog, values);
}

export function localizeDeep<T>(value: T, translator: Translator): T {
  if (typeof value === 'string') return translator(value) as T;
  if (Array.isArray(value)) return value.map((item) => localizeDeep(item, translator)) as T;
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, localizeDeep(item, translator)])) as T;
}
