import { useI18n, type Locale } from '../i18n';

const OPTIONS: { id: Locale; short: string; label: string }[] = [
  { id: 'zh-CN', short: '简', label: '简体中文' },
  { id: 'zh-TW', short: '繁', label: '繁體中文' },
  { id: 'en', short: 'EN', label: 'English' },
];

export function LocaleSwitch({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();
  return <div role="group" aria-label={t('语言')} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: compact ? 2 : 3, border: '1px solid var(--border)', borderRadius: 999, background: 'var(--panel)' }}>
    {OPTIONS.map((option) => <button key={option.id} type="button" onClick={() => setLocale(option.id)} title={option.label} aria-pressed={locale === option.id} style={{ minWidth: compact ? 30 : undefined, minHeight: compact ? 28 : 30, padding: compact ? '3px 6px' : '4px 9px', border: 0, borderRadius: 999, cursor: 'pointer', font: 'inherit', fontSize: 12, color: locale === option.id ? 'var(--bg)' : 'var(--text-dim)', background: locale === option.id ? 'var(--gold)' : 'transparent', boxShadow: locale === option.id ? '0 2px 8px color-mix(in srgb,var(--gold) 28%,transparent)' : 'none' }}>
      <span>{compact ? option.short : option.label}</span>
    </button>)}
  </div>;
}
