import { Component, type ReactNode } from 'react';
import { isRecoverableLazyImportError } from '../utils/lazyRecovery';

interface Props { children: ReactNode; onReset: () => void; onReload?: () => void; }
interface State { hasError: boolean; error?: Error; }

// B6: 全局错误边界——引擎异常时不白屏，显示"国运不济"+重新开始
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('Imperium Aeternum 崩溃', error, info);
  }

  render() {
    if (this.state.hasError) {
      const updateRequired = isRecoverableLazyImportError(this.state.error);
      return (
        <section role="alert" className="ia-panel" style={{ padding: 28, maxWidth: 760, margin: '32px auto', textAlign: 'center' }}>
          <div className="ia-up" style={{ color: 'var(--gold)', marginBottom: 8 }}>Imperium Recovery</div>
          <h2 className="ia-display" style={{ fontSize: 22, margin: '0 0 12px', color: updateRequired ? 'var(--gold)' : 'var(--danger)' }}>
            {updateRequired ? '游戏已更新，需要刷新' : '国运不济，运行遇到异常'}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-mute)', lineHeight: 1.7, marginBottom: 12 }}>
            {updateRequired
              ? '当前页面仍在使用旧版资源。刷新后会载入最新版本，本地存档不会被清除。'
              : '游戏状态和本地存档仍会保留。可以先返回总览；若问题持续，请刷新页面恢复。'}
          </p>
          <details style={{ fontSize: 11, color: 'var(--text-dim)', margin: '0 auto 16px', textAlign: 'left', maxWidth: 700, wordBreak: 'break-all' }}>
            <summary style={{ cursor: 'pointer', marginBottom: 8 }}>查看详情</summary>
            <pre style={{ fontSize: 10, color: 'var(--text-dim)', whiteSpace: 'pre-wrap' }}>{this.state.error?.stack ?? this.state.error?.message}</pre>
          </details>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            {!updateRequired && <button className="ia-btn ia-btn--ghost" onClick={() => { this.setState({ hasError: false, error: undefined }); this.props.onReset(); }}>返回总览</button>}
            <button className="ia-btn ia-btn--primary" onClick={() => (this.props.onReload ?? (() => window.location.reload()))()}>刷新并恢复</button>
          </div>
        </section>
      );
    }
    return this.props.children;
  }
}
