// LogToast v2 — 操作即时反馈浮窗（右下角，队列最多 3 条，逐条淡出）
// P1: 改队列——多操作不再丢消息；失败类（含「不足」「失败」）红色 + 停留更久
import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

interface ToastItem { id: number; text: string; tone: 'ok' | 'fail'; }

export default function LogToast() {
  const log = useGameStore((s) => s.log);
  const [queue, setQueue] = useState<ToastItem[]>([]);
  const [seenIdx, setSeenIdx] = useState(0);

  // log 增长时把新条目入队（按 index 去重）
  useEffect(() => {
    if (log.length <= seenIdx) return;
    const newItems: ToastItem[] = [];
    for (let i = seenIdx; i < log.length; i++) {
      const txt = log[i];
      const fail = /不足|失败|告竭|崩溃|破产|危急|倾覆|无效|不可|无法/.test(txt);
      newItems.push({ id: i, text: txt, tone: fail ? 'fail' : 'ok' });
    }
    setSeenIdx(log.length);
    setQueue((q) => [...q, ...newItems].slice(-3));  // 最多 3 条
  }, [log, seenIdx]);

  // 每条按 tone 设定停留时长后逐条移除（失败 4s，正常 2.5s）
  useEffect(() => {
    if (queue.length === 0) return;
    const first = queue[0];
    const ttl = first.tone === 'fail' ? 4000 : 2500;
    const t = setTimeout(() => setQueue((q) => q.filter((x) => x.id !== first.id)), ttl);
    return () => clearTimeout(t);
  }, [queue]);

  if (queue.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 1000,
      display: 'flex', flexDirection: 'column', gap: 6, pointerEvents: 'none',
    }}>
      {queue.map((item) => {
        const isFail = item.tone === 'fail';
        return (
          <div key={item.id} className="ia-card" style={{
            padding: '10px 16px', fontSize: 12, maxWidth: 340,
            background: 'rgba(20,17,13,0.92)', backdropFilter: 'blur(6px)',
            border: `1px solid ${isFail ? 'var(--war)' : 'var(--border-gold)'}`,
            borderRadius: 'var(--radius)',
            color: isFail ? 'var(--war)' : 'var(--text-soft)',
            boxShadow: isFail ? '0 4px 16px rgba(162,61,40,0.3)' : '0 4px 16px rgba(0,0,0,0.4)',
            animation: 'ia-slide-in 0.3s ease',
          }}>
            <span style={{ color: isFail ? 'var(--war)' : 'var(--gold)', marginRight: 8, fontSize: 10 }}>{isFail ? '⚠' : '◈'}</span>
            {item.text}
          </div>
        );
      })}
    </div>
  );
}
