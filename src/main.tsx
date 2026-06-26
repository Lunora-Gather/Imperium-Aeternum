// Imperium Aeternum — 应用入口
// 运行时兜底：生产页若模块加载/渲染异常，不再只显示黑屏。

import { createRoot } from 'react-dom/client';
import './index.css';
import './layout.css';
import './restraint.css';
import './quiet.css';
import './dashboard.css';
import './palette.css';
import { installLogicGuard } from './gameplay/logicGuard';
import { installAmbitionSystem } from './gameplay/ambitions';
import { installStrategyFocus } from './gameplay/strategyFocus';
import { installStateHygiene } from './gameplay/stateHygiene';

const BUILD_MARK = '超级优化 v10 · grand-strategy-advisor';

installLogicGuard();
installAmbitionSystem();
installStrategyFocus();
installStateHygiene();

function showFatalError(error: unknown) {
  const root = document.getElementById('root');
  const message = error instanceof Error ? error.message : String(error ?? '未知错误');
  const stack = error instanceof Error ? error.stack : '';
  if (!root) return;
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;color:#f2e8d2;background:#14110d;font-family:-apple-system,BlinkMacSystemFont,'Microsoft YaHei',sans-serif;">
      <div style="max-width:760px;width:100%;border:1px solid #b8924a;border-radius:10px;background:#252017;padding:22px;box-shadow:0 8px 32px rgba(0,0,0,.45);">
        <div style="font-size:12px;letter-spacing:.12em;color:#c9a44e;margin-bottom:8px;text-transform:uppercase;">Imperium Aeternum</div>
        <h1 style="font-size:22px;margin:0 0 12px;color:#c9a44e;">页面运行时崩溃，不是 Pages 未同步</h1>
        <p style="font-size:14px;line-height:1.7;margin:0 0 12px;color:#d4c5a0;">代码和样式已经加载，但应用初始化失败。下面是精确报错，可直接截图继续修。</p>
        <pre style="white-space:pre-wrap;word-break:break-word;background:#181410;border:1px solid #3d3324;border-radius:6px;padding:12px;color:#f2e8d2;font-size:12px;line-height:1.5;max-height:280px;overflow:auto;">${escapeHtml(message)}${stack ? '\n\n' + escapeHtml(stack) : ''}</pre>
        <div style="margin-top:12px;font-size:12px;color:#9a8a6a;">${BUILD_MARK}</div>
      </div>
    </div>
  `;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>'"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch] ?? ch));
}

window.addEventListener('error', (event) => showFatalError(event.error ?? event.message));
window.addEventListener('unhandledrejection', (event) => showFatalError(event.reason));

document.body.insertAdjacentHTML('beforeend', `<div style="position:fixed;right:8px;bottom:6px;z-index:9999;font-size:10px;color:#5a4e36;pointer-events:none;">${BUILD_MARK}</div>`);

import('./App')
  .then(({ default: App }) => {
    const rootEl = document.getElementById('root');
    if (!rootEl) throw new Error('找不到 #root 挂载点');
    createRoot(rootEl).render(<App />);
  })
  .catch(showFatalError);
