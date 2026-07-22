// Imperium Aeternum — UI 组件 v4（青铜铭文设计语言）
import type { CSSProperties, ReactNode } from 'react';

// ── Panel：分区面板，display 字体标题，金色顶饰 ──
export function Panel({ title, children, actions, accent, icon }: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  accent?: boolean;
  icon?: string;
}) {
  return (
    <section style={{
      background: accent
        ? 'linear-gradient(180deg, var(--bg-raised) 0%, var(--bg-panel) 100%)'
        : 'var(--bg-panel)',
      borderRadius: 'var(--radius)',
      padding: 'var(--space-5)',
      marginBottom: 'var(--space-5)',
      border: `1px solid ${accent ? 'var(--border-bright)' : 'var(--border)'}`,
      boxShadow: accent ? '0 6px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(201,164,78,0.06)' : '0 2px 8px rgba(0,0,0,0.2)',
      position: 'relative',
    }}>
      {/* 标题行 —— display 字体 + 可选图标 + 金色细线分隔 */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 'var(--space-4)', gap: 'var(--space-3)',
        paddingBottom: 'var(--space-3)',
        borderBottom: '1px solid var(--border)',
      }}>
        <h3 className="ia-display" style={{
          margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text)',
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
        }}>
          {icon && <span style={{ fontSize: 16, opacity: 0.8 }}>{icon}</span>}
          {title}
        </h3>
        {actions && <div style={{ display: 'flex', gap: 'var(--space-2)' }}>{actions}</div>}
      </header>
      {children}
    </section>
  );
}

// ── Bar：进度条，青铜质感，阈值分档 ──
export function Bar({ value, max = 100, color, kind = 'neutral', height = 8 }: {
  value: number;
  max?: number;
  color?: string;
  kind?: 'high' | 'low' | 'neutral';
  height?: number;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  let c = color ?? 'var(--bar-mid)';
  if (kind === 'high') {
    if (pct >= 60) c = 'var(--bar-good)';
    else if (pct >= 30) c = 'var(--bar-warn)';
    else c = 'var(--bar-bad)';
  } else if (kind === 'low') {
    if (pct <= 30) c = 'var(--bar-good)';
    else if (pct <= 60) c = 'var(--bar-warn)';
    else c = 'var(--bar-bad)';
  }
  return (
    <div style={{
      background: 'var(--bg-inset)', borderRadius: height / 2, height, overflow: 'hidden',
      width: '100%', border: '1px solid rgba(61,51,36,0.5)',
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)',
    }}>
      <div style={{
        width: `${pct}%`, height: '100%', background: c,
        transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)', borderRadius: height / 2,
        boxShadow: `0 0 8px ${c}40`,
      }} />
    </div>
  );
}

// ── StatRow：标签 + Bar + 数值 ──
export function StatRow({ label, value, max = 100, color, kind, warn }: {
  label: string; value: number; max?: number; color?: string;
  kind?: 'high' | 'low' | 'neutral'; warn?: boolean;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '84px 1fr 54px', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
      <span style={{ color: 'var(--text-mute)', fontSize: 11.5 }}>{label}</span>
      <Bar value={value} max={max} color={color} kind={kind} />
      <span className="ia-num" style={{
        fontSize: 13, color: warn ? 'var(--warn)' : 'var(--text)', textAlign: 'right', fontWeight: 600,
      }}>{Math.round(value)}</span>
    </div>
  );
}

// ── Stat：数值卡片，核心档用 display 字体大号 ──
export function Stat({ label, value, warn, kind = 'minor', accent, icon }: {
  label: string; value: number | string; warn?: boolean;
  kind?: 'core' | 'minor'; accent?: string; icon?: string;
}) {
  const v = typeof value === 'number' ? Math.round(value) : value;
  if (kind === 'core') {
    return (
      <div className="ia-card--raised" style={{
        position: 'relative', overflow: 'hidden', padding: 'var(--space-4)',
        display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
      }}>
        {accent && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: accent, boxShadow: `0 0 12px ${accent}` }} />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-mute)' }}>
          {icon && <span style={{ fontSize: 13, opacity: 0.7 }}>{icon}</span>}
          <span className="ia-up" style={{ fontSize: 10 }}>{label}</span>
        </div>
        <div className="ia-num" style={{
          fontSize: 26, fontWeight: 700, lineHeight: 1, color: warn ? 'var(--war)' : 'var(--text)',
        }}>{v}</div>
      </div>
    );
  }
  return (
    <div style={{ padding: 'var(--space-2) 0' }}>
      <div style={{ color: 'var(--text-mute)', fontSize: 10.5, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div className="ia-num" style={{ fontSize: 16, color: warn ? 'var(--warn)' : 'var(--text)', fontWeight: 600 }}>{v}</div>
    </div>
  );
}

// ── Btn ──
export function Btn({ label, onClick, disabled, busy, warn, variant, title, icon, type = 'button' }: {
  label: string; onClick?: () => void; disabled?: boolean; busy?: boolean; warn?: boolean;
  variant?: 'primary' | 'warn' | 'good' | 'ghost'; title?: string; icon?: string;
  type?: 'button' | 'submit';
}) {
  const cls = warn ? 'ia-btn ia-btn--warn'
    : variant === 'primary' ? 'ia-btn ia-btn--primary'
    : variant === 'good' ? 'ia-btn ia-btn--good'
    : variant === 'ghost' ? 'ia-btn ia-btn--ghost'
    : 'ia-btn';
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled || busy} title={title} aria-busy={busy || undefined}>
      {busy ? <span className="ia-btn-spinner" aria-hidden="true" /> : icon && <span style={{ marginRight: 6, opacity: 0.8 }}>{icon}</span>}{label}
    </button>
  );
}

// ── Tag ──
export function Tag({ text, color, tone }: { text: string; color?: string; tone?: 'good' | 'warn' | 'danger' | 'info' | 'gold' }) {
  const bg = tone === 'good' ? 'rgba(122,154,62,0.1)'
    : tone === 'warn' ? 'rgba(201,120,40,0.12)'
    : tone === 'danger' ? 'rgba(162,61,40,0.14)'
    : tone === 'info' ? 'rgba(74,122,122,0.12)'
    : tone === 'gold' ? 'rgba(201,164,78,0.14)'
    : color ?? 'rgba(201,164,78,0.06)';
  const fg = tone === 'good' ? 'var(--good)'
    : tone === 'warn' ? 'var(--warn)'
    : tone === 'danger' ? 'var(--danger)'
    : tone === 'info' ? 'var(--stable)'
    : tone === 'gold' ? 'var(--gold)'
    : 'var(--text-mute)';
  return <span className="ia-tag" style={{ background: bg, borderColor: fg, color: fg }}>{text}</span>;
}

// ── Divider：金色细线分隔 ──
export function Divider({ label }: { label?: string }) {
  if (!label) return <div style={{ borderTop: '1px solid var(--border)', margin: 'var(--space-4) 0' }} />;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', margin: 'var(--space-4) 0', color: 'var(--text-dim)' }}>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, var(--border))' }} />
      <span className="ia-up" style={{ fontSize: 10 }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--border), transparent)' }} />
    </div>
  );
}

// ── StatusDot ──
export function StatusDot({ status }: { status: 'good' | 'warn' | 'danger' | 'neutral' }) {
  const c = status === 'good' ? 'var(--good)' : status === 'warn' ? 'var(--warn)' : status === 'danger' ? 'var(--danger)' : 'var(--text-dim)';
  return <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: c, marginRight: 7, boxShadow: `0 0 6px ${c}80` }} />;
}

// ── ResourceStrip：header 常驻速览，display 字体大号 ──
export function ResourceStrip({ items }: { items: { label: string; value: number; warn?: boolean; color?: string; icon?: string }[] }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-5)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
      {items.map((it) => (
        <div key={it.label} style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-dim)' }}>
            {it.icon && <span style={{ fontSize: 10, opacity: 0.7 }}>{it.icon}</span>}
            <span className="ia-up" style={{ fontSize: 9 }}>{it.label}</span>
          </div>
          <span className="ia-num" style={{
            fontSize: 18, fontWeight: 700,
            color: it.warn ? 'var(--war)' : (it.color ?? 'var(--text)'),
          }}>{Math.round(it.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ── helpers ──
export const flex: CSSProperties = { display: 'flex', gap: 'var(--space-2)' };
export const grid2: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' };
