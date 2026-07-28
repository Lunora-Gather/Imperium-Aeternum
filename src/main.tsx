// Imperium Aeternum — 应用入口
// 运行时兜底：生产页若模块加载/渲染异常，不再只显示黑屏。

import { createRoot } from 'react-dom/client';
import ErrorBoundary from './components/ErrorBoundary';
import { isRecoverableLazyImportError } from './utils/lazyRecovery';
import './styles/base.css';
import './styles/layout.css';
import './styles/restraint.css';
import './styles/quiet.css';
import './styles/dashboard.css';
import './styles/palette.css';
import { BUILD_MARK } from './buildInfo';

let fatalShown = false;
function showFatalError(error: unknown) {
  const root = document.getElementById('root');
  const message = error instanceof Error ? error.message : String(error ?? '未知错误');
  const stack = error instanceof Error ? error.stack : '';
  if (!root) return;
  if (fatalShown) return;
  fatalShown = true;
  const updateRequired = isRecoverableLazyImportError(error);
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;color:#f2e8d2;background:#14110d;font-family:-apple-system,BlinkMacSystemFont,'Microsoft YaHei',sans-serif;">
      <div style="max-width:760px;width:100%;border:1px solid #b8924a;border-radius:10px;background:#252017;padding:22px;box-shadow:0 8px 32px rgba(0,0,0,.45);">
        <div style="font-size:12px;letter-spacing:.12em;color:#c9a44e;margin-bottom:8px;text-transform:uppercase;">Imperium Aeternum</div>
        <h1 style="font-size:22px;margin:0 0 12px;color:#c9a44e;">${updateRequired ? '游戏已更新，需要刷新' : '页面初始化失败'}</h1>
        <p style="font-size:14px;line-height:1.7;margin:0 0 12px;color:#d4c5a0;">${updateRequired ? '当前标签页仍在使用旧版资源。刷新后会载入最新版本，本地存档不会被清除。' : '游戏未能完成初始化。本地存档仍然保留，可以刷新页面重试。'}</p>
        <pre style="white-space:pre-wrap;word-break:break-word;background:#181410;border:1px solid #3d3324;border-radius:6px;padding:12px;color:#f2e8d2;font-size:12px;line-height:1.5;max-height:280px;overflow:auto;">${escapeHtml(message)}${stack ? '\n\n' + escapeHtml(stack) : ''}</pre>
        <button id="ia-fatal-reload" type="button" style="margin-top:14px;border:1px solid #b8924a;border-radius:6px;background:#8a6628;color:#fff4d6;padding:9px 18px;cursor:pointer;font:inherit;">刷新并恢复</button>
        <div style="margin-top:12px;font-size:12px;color:#9a8a6a;">${BUILD_MARK}</div>
      </div>
    </div>
  `;
  document.getElementById('ia-fatal-reload')?.addEventListener('click', () => window.location.reload());
}

function escapeHtml(s: string) {
  return s.replace(/[&<>'"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch] ?? ch));
}

document.body.insertAdjacentHTML('beforeend', `<div style="position:fixed;right:8px;bottom:6px;z-index:9999;font-size:10px;color:#5a4e36;pointer-events:none;">${BUILD_MARK}</div>`);

import('./App')
  .then(({ default: App }) => {
    const rootEl = document.getElementById('root');
    if (!rootEl) throw new Error('找不到 #root 挂载点');
    createRoot(rootEl).render(
      <ErrorBoundary onReset={() => { window.location.reload(); }} onReload={() => window.location.reload()}>
        <App />
      </ErrorBoundary>
    );
  })
  .catch(showFatalError);
