import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; onReset: () => void; }
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
      return (
        <div style={{ padding: 40, textAlign: 'center', color: '#c33', fontFamily: 'serif' }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>国运不济，天下崩乱</h2>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
            引擎遭遇异常：{this.state.error?.message ?? '未知错误'}
          </p>
          <p style={{ fontSize: 12, color: '#999', marginBottom: 16 }}>
            存档已保留，可重新开始或读档恢复。
          </p>
          <button
            className="ia-btn"
            onClick={() => { this.setState({ hasError: false, error: undefined }); this.props.onReset(); }}
            style={{ padding: '8px 20px' }}
          >
            重新开始
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
