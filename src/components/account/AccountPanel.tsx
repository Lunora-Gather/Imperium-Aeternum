import { useEffect, useState } from 'react';
import { useAccountStore } from '../../store/accountStore';
import { Btn, Tag } from '../ui';

type Mode = 'login' | 'register' | 'otp';

export function AccountButton({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const { initialize, status, user } = useAccountStore();
  useEffect(() => { void initialize(); }, [initialize]);

  return <>
    <button className={compact ? 'ia-icon-btn' : 'ia-btn ia-btn--ghost'} onClick={() => setOpen(true)} title="账号与云存档" aria-label="账号与云存档">
      {compact ? (user ? '☁' : '♙') : (user ? `☁ ${user.name || user.email}` : status === 'loading' ? '连接账号…' : '账号 / 云存档')}
    </button>
    {open && <AccountModal onClose={() => setOpen(false)} />}
  </>;
}

function AccountModal({ onClose }: { onClose: () => void }) {
  const store = useAccountStore();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const busy = store.status === 'loading';

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  const submit = async () => {
    if (mode === 'login') await store.login(email, password);
    else if (mode === 'register') await store.register(email, password, name);
    else if (!store.pendingOtpUserId) await store.requestOtp(email);
    else await store.verifyOtp(otp);
  };

  return <div className="ia-modal-backdrop" onClick={onClose}>
    <section className="ia-help-card ia-account-modal ia-fade-in" role="dialog" aria-modal="true" aria-labelledby="ia-account-title" onClick={(event) => event.stopPropagation()} style={{ width: 'min(460px, calc(100vw - 24px))' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div className="ia-up" style={{ color: 'var(--gold)', fontSize: 11 }}>Imperium Account</div>
          <h2 id="ia-account-title" className="ia-display" style={{ margin: '4px 0' }}>账号与云端纪元</h2>
          <p style={{ color: 'var(--text-mute)', fontSize: 11, margin: 0 }}>游客模式始终可玩；登录只用于跨设备私有云存档。</p>
        </div>
        <Btn label="关闭" variant="ghost" onClick={onClose} />
      </div>

      {!store.configured && <div className="ia-card" style={{ marginTop: 12, borderColor: 'var(--warn)' }}>Appwrite 尚未配置，当前仅提供本地存档。</div>}

      {store.user ? <div style={{ marginTop: 14 }}>
        <div className="ia-card" style={{ padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <div><strong>{store.user.name || '未设置昵称'}</strong><div className="dim" style={{ fontSize: 11 }}>{store.user.email}</div></div>
            <Tag text="已登录" tone="good" />
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            <Btn label="刷新云存档" variant="ghost" onClick={() => void store.refreshCloudSaves()} />
            <Btn label="退出登录" warn onClick={() => void store.logout()} />
          </div>
        </div>
        <p className="dim" style={{ fontSize: 11, lineHeight: 1.6 }}>云端保存使用用户专属行与文件权限。上传、下载和冲突选择请在游戏“存档”页操作。</p>
      </div> : <form style={{ marginTop: 14 }} onSubmit={(event) => { event.preventDefault(); void submit(); }}>
        <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
          <Btn label="密码登录" variant={mode === 'login' ? 'primary' : 'ghost'} onClick={() => setMode('login')} />
          <Btn label="邮箱验证码" variant={mode === 'otp' ? 'primary' : 'ghost'} onClick={() => setMode('otp')} />
          <Btn label="注册账号" variant={mode === 'register' ? 'primary' : 'ghost'} onClick={() => setMode('register')} />
        </div>
        {mode === 'register' && <label style={{ display: 'block', fontSize: 11, marginBottom: 8 }}>显示名称<input className="ia-input" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" style={{ width: '100%', marginTop: 4 }} /></label>}
        <label style={{ display: 'block', fontSize: 11, marginBottom: 8 }}>邮箱<input className="ia-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" autoFocus disabled={mode === 'otp' && !!store.pendingOtpUserId} style={{ width: '100%', marginTop: 4 }} /></label>
        {mode !== 'otp' && <label style={{ display: 'block', fontSize: 11, marginBottom: 8 }}>密码<input className="ia-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} style={{ width: '100%', marginTop: 4 }} /></label>}
        {mode === 'otp' && store.pendingOtpUserId && <label style={{ display: 'block', fontSize: 11, marginBottom: 8 }}>6 位验证码<input className="ia-input" inputMode="numeric" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} autoComplete="one-time-code" style={{ width: '100%', marginTop: 4, letterSpacing: '0.25em' }} /></label>}
        <Btn
          label={busy ? '请稍候…' : mode === 'login' ? '登录' : mode === 'register' ? '创建账号并登录' : store.pendingOtpUserId ? '验证并登录' : '发送验证码'}
          variant="primary"
          type="submit"
          disabled={busy || !email.trim() || (mode !== 'otp' && password.length < 8) || (mode === 'otp' && !!store.pendingOtpUserId && otp.length !== 6)}
          onClick={() => undefined}
        />
      </form>}

      {store.message && <div style={{ marginTop: 10, padding: 8, borderRadius: 6, background: 'var(--bg-inset)', color: store.conflictSlot !== null ? 'var(--warn)' : 'var(--text-dim)', fontSize: 11 }}>{store.message}</div>}
    </section>
  </div>;
}
