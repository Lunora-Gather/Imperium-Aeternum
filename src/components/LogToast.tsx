// LogToast v3 — 轻量操作反馈（不再用厚重黑色浮窗）
import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

interface ToastItem { id: number; text: string; tone: 'ok' | 'fail'; }

export default function LogToast() {
  const log = useGameStore((s) => s.log);
  const [queue, setQueue] = useState<ToastItem[]>([]);
  const [seenIdx, setSeenIdx] = useState(0);

  useEffect(() => {
    if (log.length <= seenIdx) return;
    const newItems: ToastItem[] = [];
    for (let i = seenIdx; i < log.length; i++) {
      const txt = log[i];
      const fail = /不足|失败|告竭|崩溃|破产|危急|倾覆|无效|不可|无法/.test(txt);
      newItems.push({ id: i, text: txt, tone: fail ? 'fail' : 'ok' });
    }
    setSeenIdx(log.length);
    setQueue((q) => [...q, ...newItems].slice(-2));
  }, [log, seenIdx]);

  useEffect(() => {
    if (queue.length === 0) return;
    const first = queue[0];
    const ttl = first.tone === 'fail' ? 3600 : 2000;
    const t = setTimeout(() => setQueue((q) => q.filter((x) => x.id !== first.id)), ttl);
    return () => clearTimeout(t);
  }, [queue]);

  if (queue.length === 0) return null;

  return (
    <div className="ia-toast-stack">
      {queue.map((item) => {
        const isFail = item.tone === 'fail';
        return (
          <div key={item.id} className={`ia-toast ${isFail ? 'is-fail' : 'is-ok'}`}>
            <span>{isFail ? '!' : '·'}</span>
            <p>{item.text}</p>
          </div>
        );
      })}
    </div>
  );
}
