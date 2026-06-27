// V50 RC Dashboard 指挥分组容器：把首屏顾问模块收纳成可折叠的产品化分区。

import { useMemo, useState, type ReactNode } from 'react';
import { Tag } from './ui';
import type { DashboardCommandGroup, DashboardGroupTone } from '../gameplay/dashboardCommandGroups';

function tagTone(tone: DashboardGroupTone): 'danger' | 'warn' | 'good' | 'info' | 'gold' {
  return tone === 'danger' ? 'danger' : tone === 'warn' ? 'warn' : 'good';
}

function border(tone: DashboardGroupTone): string {
  return tone === 'danger' ? 'var(--war)' : tone === 'warn' ? 'var(--warn)' : 'var(--good)';
}

export default function DashboardCommandGroupStack({ groups, renderItem }: { groups: DashboardCommandGroup[]; renderItem: (id: string) => ReactNode }) {
  const initial = useMemo(() => Object.fromEntries(groups.map((g) => [g.id, g.defaultOpen])), [groups]);
  const [open, setOpen] = useState<Record<string, boolean>>(initial);

  return <div className="ia-command-stack">
    {groups.map((g) => {
      const expanded = open[g.id] ?? g.defaultOpen;
      return <section key={g.id} className="ia-dash-section" style={{ borderColor: border(g.tone) }}>
        <header style={{ marginBottom: expanded ? 8 : 0 }}>
          <button onClick={() => setOpen((x) => ({ ...x, [g.id]: !expanded }))} style={{ flex: 1, textAlign: 'left', background: 'transparent', color: 'inherit', border: 0, padding: 0, cursor: 'pointer' }}>
            <small>{expanded ? '▼' : '▶'} Command Group</small>
            <h3>{g.title}</h3>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.45 }}>{g.subtitle}</div>
          </button>
          <Tag text={g.tone === 'danger' ? '紧急' : g.tone === 'warn' ? '注意' : '良好'} tone={tagTone(g.tone)} />
        </header>
        {expanded && <div className="ia-command-stack-items">
          {g.itemIds.map((id) => <div key={id}>{renderItem(id)}</div>)}
        </div>}
      </section>;
    })}
  </div>;
}
