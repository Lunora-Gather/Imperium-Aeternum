// Imperium Aeternum — 音效系统 E4
// Web Audio API 合成，无音频文件，可静音。
// 音效类型：bell 钟声（回合结算）/ drum 战鼓（宣战）/ scroll 竹简（事件）/ hammer 锤（建设）/ alarm 警报（危机）
import { useEffect, useRef, useState } from 'react';

export type SfxId = 'bell' | 'drum' | 'scroll' | 'hammer' | 'alarm' | 'victory' | 'defeat';

let ctx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try { ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(); }
    catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => { /* ignore */ });
  return ctx;
}

// 单音合成：oscillator + gain envelope
function tone(freq: number, start: number, dur: number, type: OscillatorType, gainPeak: number, c: AudioContext) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + start);
  g.gain.setValueAtTime(0, c.currentTime + start);
  g.gain.linearRampToValueAtTime(gainPeak, c.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + dur);
  osc.connect(g); g.connect(c.destination);
  osc.start(c.currentTime + start);
  osc.stop(c.currentTime + start + dur + 0.05);
}

// 各音效合成参数
const SFX: Record<SfxId, (c: AudioContext) => void> = {
  bell: (c) => { tone(880, 0, 1.2, 'sine', 0.3, c); tone(660, 0.02, 1.0, 'sine', 0.2, c); tone(440, 0.04, 0.8, 'sine', 0.15, c); },
  drum: (c) => { tone(80, 0, 0.4, 'sine', 0.5, c); tone(60, 0.05, 0.3, 'sine', 0.3, c); },
  scroll: (c) => { tone(1200, 0, 0.08, 'triangle', 0.15, c); tone(900, 0.06, 0.06, 'triangle', 0.1, c); },
  hammer: (c) => { tone(200, 0, 0.05, 'square', 0.2, c); tone(150, 0.03, 0.04, 'square', 0.15, c); },
  alarm: (c) => { for (let i = 0; i < 3; i++) { tone(440, i * 0.15, 0.1, 'sawtooth', 0.2, c); tone(330, i * 0.15 + 0.08, 0.1, 'sawtooth', 0.15, c); } },
  victory: (c) => { tone(523, 0, 0.3, 'sine', 0.25, c); tone(659, 0.15, 0.3, 'sine', 0.25, c); tone(784, 0.3, 0.5, 'sine', 0.3, c); },
  defeat: (c) => { tone(440, 0, 0.4, 'sine', 0.25, c); tone(330, 0.2, 0.4, 'sine', 0.2, c); tone(220, 0.4, 0.6, 'sine', 0.25, c); },
};

export function playSfx(id: SfxId): void {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  try { SFX[id](c); } catch { /* ignore audio errors */ }
}

export function setMuted(m: boolean): void { muted = m; }
export function isMuted(): boolean { return muted; }

// React hook：静音状态 + toggle
export function useSfxMute(): { muted: boolean; toggle: () => void } {
  const [m, setM] = useState(muted);
  const ref = useRef(muted);
  ref.current = m;
  useEffect(() => () => { muted = ref.current; }, []);
  return {
    muted: m,
    toggle: () => setM((x) => { const nx = !x; muted = nx; return nx; }),
  };
}
