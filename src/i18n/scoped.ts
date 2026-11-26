import { getLocale, interpolate, translate, type Locale } from '.';

export interface TranslationPattern {
  pattern: RegExp;
  replacement: string | ((substring: string, ...args: string[]) => string);
}
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

function resolveScoped(
  source: string,
  localeCatalog: Readonly<Record<string, string>> | ScopedLocaleCatalog | undefined,
): string | undefined {
  if (!localeCatalog) return undefined;
  const { exact, patterns } = localeCatalog as ScopedLocaleCatalog;
  const entries = typeof exact === 'object' ? exact : localeCatalog;
  if (Object.prototype.hasOwnProperty.call(entries, source)) {
    const value = (entries as Readonly<Record<string, unknown>>)[source];
    if (typeof value === 'string') return value;
  }
  if (!Array.isArray(patterns)) return undefined;
  for (const rule of patterns) {
    rule.pattern.lastIndex = 0;
    if (rule.pattern.test(source)) {
      rule.pattern.lastIndex = 0;
      return source.replace(rule.pattern, rule.replacement);
    }
  }
  return undefined;
}

const orderedFragments = new WeakMap<Readonly<Record<string, string>>, [string, string][]>();

function composeFragments(source: string, fragments: Readonly<Record<string, string>>) {
  let ordered = orderedFragments.get(fragments);
  if (!ordered) {
    ordered = Object.entries(fragments).sort(([a], [b]) => b.length - a.length);
    orderedFragments.set(fragments, ordered);
  }
  let translated = source;
  for (const [from, to] of ordered) {
    if (translated.includes(from)) translated = translated.split(from).join(to);
  }
  return translated;
}

export function translateScoped(source: string, catalog: ScopedCatalog, values: Record<string, string | number> = {}, locale: Locale = getLocale()): string {
  if (locale === 'zh-CN') return interpolate(source, values);
  // Exact screen copy and complete dynamic patterns are authoritative. Global
  // patterns come next because they understand whole runtime sentences (and
  // proper names). Fragment composition is intentionally last: using it first
  // produced hybrids such as "战争机会：可攻 Sidon" in the English UI.
  const dictionary = catalog[locale];
  const scoped = resolveScoped(source, dictionary);
  if (scoped !== undefined) return interpolate(scoped, values);
  const global = translate(source, values, locale);
  if (global !== interpolate(source, values)) return global;
  const fragments = (dictionary as ScopedLocaleCatalog | undefined)?.fragments;
  return fragments && typeof fragments === 'object' ? interpolate(composeFragments(source, fragments), values) : global;
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
