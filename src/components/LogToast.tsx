// LogToast v4 — 用单调序列识别新消息，日志滚动或文案重复后仍持续反馈
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { useGameStore } from '../store/gameStore';

interface ToastItem { id: number; text: string; tone: 'ok' | 'fail'; }

export function collectNewLogEntries(log: string[], sequence: number, previousSequence: number): string[] {
  const count = Math.max(0, sequence - previousSequence);
  if (count === 0 || log.length === 0) return [];
  return log.slice(-Math.min(count, log.length));
}

export default function LogToast() {
  const { t } = useI18n();
  const log = useGameStore((s) => s.log);
  const logSequence = useGameStore((s) => s.logSeq);
  const [queue, setQueue] = useState<ToastItem[]>([]);
  const previousSequence = useRef(Math.max(0, logSequence - (log.length > 0 ? 1 : 0)));

  useEffect(() => {
    const previous = previousSequence.current;
    previousSequence.current = logSequence;
    const entries = collectNewLogEntries(log, logSequence, previous);
    if (entries.length === 0) return;
    const firstSequence = logSequence - entries.length + 1;
    const newItems = entries.map((txt, index): ToastItem => {
      const fail = /不足|失败|告竭|崩溃|破产|危急|倾覆|无效|不可|无法/.test(txt);
      return { id: firstSequence + index, text: txt, tone: fail ? 'fail' : 'ok' };
    });
    setQueue((q) => [...q, ...newItems].slice(-2));
  }, [log, logSequence]);

  useEffect(() => {
    if (queue.length === 0) return;
    const first = queue[0];
    const ttl = first.tone === 'fail' ? 3600 : 2000;
    const t = setTimeout(() => setQueue((q) => q.filter((x) => x.id !== first.id)), ttl);
    return () => clearTimeout(t);
  }, [queue]);

  if (queue.length === 0) return null;

  return (
    <div className="ia-toast-stack" role="status" aria-live="polite" aria-relevant="additions text">
      {queue.map((item) => {
        const isFail = item.tone === 'fail';
        return (
          <div key={item.id} className={`ia-toast ${isFail ? 'is-fail' : 'is-ok'}`}>
            <span>{isFail ? '!' : '·'}</span>
            <p>{t(item.text)}</p>
          </div>
        );
      })}
    </div>
  );
}
