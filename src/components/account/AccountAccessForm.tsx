import { useEffect, useMemo, useState } from 'react';
import { checkDisplayName, checkEmail, checkPassword, normalizeOtp } from '../../account/credentials';
import { useAccountStore, type OtpPurpose } from '../../store/accountStore';
import { Btn } from '../ui';

type AccessMode = 'login' | 'register';
type LoginMethod = 'password' | 'otp';

export function AccountAccessForm() {
  const store = useAccountStore();
  const [mode, setMode] = useState<AccessMode>('login');
  const [method, setMethod] = useState<LoginMethod>('password');
  const [recovering, setRecovering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);
  const busy = store.status === 'loading';
  const emailCheck = useMemo(() => checkEmail(email), [email]);
  const passwordCheck = useMemo(() => checkPassword(password), [password]);
  const nameCheck = useMemo(() => checkDisplayName(name), [name]);
  const awaitingRegistrationCode = store.pendingOtpPurpose === 'register';

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => setResendSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const switchMode = (next: AccessMode) => {
    setMode(next);
    setRecovering(false);
    setPassword('');
    setConfirmPassword('');
    setOtp('');
    store.resetOtp();
  };

  const sendCode = async (purpose: OtpPurpose) => {
    const ok = await store.requestOtp(email, purpose);
    if (ok) setResendSeconds(60);
  };

  if (mode === 'register') {
    const detailsValid = emailCheck.valid && passwordCheck.valid && nameCheck.valid && password === confirmPassword;
    return <div className="ia-auth-access">
      <AccessTabs mode={mode} onChange={switchMode} />
      <div className="ia-auth-progress" aria-label="注册进度"><span className="is-done">1</span><i className={awaitingRegistrationCode ? 'is-done' : ''} /><span className={awaitingRegistrationCode ? 'is-current' : ''}>2</span><b>{awaitingRegistrationCode ? '验证邮箱并完成注册' : '填写账号资料'}</b></div>
      {!awaitingRegistrationCode ? <form className="ia-auth-form" onSubmit={(event) => { event.preventDefault(); void sendCode('register'); }}>
        <Field label="显示名称" hint={nameCheck.hint} valid={nameCheck.valid && !!name} invalid={!!name && !nameCheck.valid}><input className="ia-input" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={32} autoFocus /></Field>
        <Field label="邮箱" hint={emailCheck.hint} valid={emailCheck.valid} invalid={!!email && !emailCheck.valid}><input className="ia-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></Field>
        <div className="ia-auth-grid">
          <Field label="设置密码" hint={passwordCheck.hint} valid={passwordCheck.valid} invalid={!!password && !passwordCheck.valid}><input className="ia-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" /></Field>
          <Field label="确认密码" hint={confirmPassword && password !== confirmPassword ? '两次密码不一致' : '再次输入同一密码'} valid={!!confirmPassword && password === confirmPassword} invalid={!!confirmPassword && password !== confirmPassword}><input className="ia-input" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" /></Field>
        </div>
        <div className="ia-auth-trust"><span>✓</span><div><strong>注册必须验证邮箱</strong><p>密码不会在验证前生效；验证码由 Appwrite 发送，15 分钟内有效。</p></div></div>
        <Btn type="submit" label="发送验证码，继续注册" variant="primary" busy={busy} disabled={busy || !detailsValid} />
      </form> : <form className="ia-auth-form" onSubmit={(event) => { event.preventDefault(); void store.completeRegistration(otp, password, name); }}>
        <div className="ia-auth-mail-sent"><span>✉</span><div><strong>验证码已发送</strong><p>{store.pendingOtpEmail}</p></div><button type="button" onClick={() => { store.resetOtp(); setOtp(''); }}>修改资料</button></div>
        <Field label="6 位邮箱验证码" hint="请检查收件箱与垃圾邮件目录" valid={otp.length === 6} invalid={otp.length > 0 && otp.length < 6}><input className="ia-input ia-auth-otp" inputMode="numeric" value={otp} onChange={(event) => setOtp(normalizeOtp(event.target.value))} maxLength={6} autoComplete="one-time-code" autoFocus /></Field>
        <Btn type="submit" label="验证邮箱并创建账号" variant="primary" busy={busy} disabled={busy || otp.length !== 6} />
        <button className="ia-auth-resend" type="button" disabled={busy || resendSeconds > 0} onClick={() => void sendCode('register')}>{resendSeconds > 0 ? `${resendSeconds} 秒后可重新发送` : '没有收到？重新发送验证码'}</button>
      </form>}
    </div>;
  }

  if (recovering) {
    const awaitingRecoveryCode = store.pendingOtpPurpose === 'recovery';
    const recoveryValid = otp.length === 6 && passwordCheck.valid && password === confirmPassword;
    return <div className="ia-auth-access">
      <AccessTabs mode={mode} onChange={switchMode} />
      <div className="ia-auth-recovery-head"><button type="button" aria-label="返回密码登录" onClick={() => { setRecovering(false); setOtp(''); setPassword(''); setConfirmPassword(''); store.resetOtp(); }}>←</button><strong>验证码找回账号</strong><p>验证注册邮箱后设置新密码，并直接恢复登录。</p></div>
      <form className="ia-auth-form" onSubmit={(event) => { event.preventDefault(); if (!awaitingRecoveryCode) void sendCode('recovery'); else void store.recoverPassword(otp, password); }}>
        <Field label="注册邮箱" hint={awaitingRecoveryCode ? '验证码已发送到这个邮箱' : '请输入需要找回的账号邮箱'} valid={emailCheck.valid} invalid={!!email && !emailCheck.valid}><input className="ia-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" disabled={awaitingRecoveryCode} autoFocus /></Field>
        {awaitingRecoveryCode && <>
          <div className="ia-auth-mail-sent"><span>✉</span><div><strong>找回验证码已发送</strong><p>{store.pendingOtpEmail}</p></div><button type="button" onClick={() => { store.resetOtp(); setOtp(''); }}>修改邮箱</button></div>
          <Field label="6 位邮箱验证码" hint="验证码 15 分钟内有效" valid={otp.length === 6} invalid={otp.length > 0 && otp.length < 6}><input className="ia-input ia-auth-otp" inputMode="numeric" value={otp} onChange={(event) => setOtp(normalizeOtp(event.target.value))} maxLength={6} autoComplete="one-time-code" autoFocus /></Field>
          <div className="ia-auth-grid">
            <Field label="设置新密码" hint={passwordCheck.hint} valid={passwordCheck.valid} invalid={!!password && !passwordCheck.valid}><input className="ia-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" /></Field>
            <Field label="确认新密码" hint={confirmPassword && password !== confirmPassword ? '两次密码不一致' : '再次输入新密码'} valid={!!confirmPassword && password === confirmPassword} invalid={!!confirmPassword && password !== confirmPassword}><input className="ia-input" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" /></Field>
          </div>
          <div className="ia-auth-trust"><span>✓</span><div><strong>必须先验证邮箱</strong><p>验证码通过后才会替换旧密码；原有云端进度不会改变。</p></div></div>
        </>}
        <Btn type="submit" label={awaitingRecoveryCode ? '验证并设置新密码' : '发送找回验证码'} variant="primary" busy={busy} disabled={busy || !emailCheck.valid || (awaitingRecoveryCode && !recoveryValid)} />
        {awaitingRecoveryCode && <button className="ia-auth-resend" type="button" disabled={busy || resendSeconds > 0} onClick={() => void sendCode('recovery')}>{resendSeconds > 0 ? `${resendSeconds} 秒后可重新发送` : '没有收到？重新发送验证码'}</button>}
      </form>
    </div>;
  }

  const loginAwaitingCode = method === 'otp' && store.pendingOtpPurpose === 'login';
  return <div className="ia-auth-access">
    <AccessTabs mode={mode} onChange={switchMode} />
    <div className="ia-auth-methods" role="tablist" aria-label="登录方式"><button type="button" className={method === 'password' ? 'is-active' : ''} onClick={() => { setMethod('password'); store.resetOtp(); }}>密码登录</button><button type="button" className={method === 'otp' ? 'is-active' : ''} onClick={() => { setMethod('otp'); store.resetOtp(); }}>邮箱验证码</button></div>
    <form className="ia-auth-form" onSubmit={(event) => { event.preventDefault(); if (method === 'password') void store.login(email, password); else if (!loginAwaitingCode) void sendCode('login'); else void store.verifyLoginOtp(otp); }}>
      <Field label="邮箱" hint={method === 'otp' ? '无需密码，验证码 15 分钟内有效' : '使用已验证邮箱登录'} valid={emailCheck.valid} invalid={!!email && !emailCheck.valid}><input className="ia-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" disabled={loginAwaitingCode} autoFocus /></Field>
      {method === 'password' ? <><Field label="密码" hint="至少 8 位字符" valid={password.length >= 8} invalid={!!password && password.length < 8}><input className="ia-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></Field><button className="ia-auth-recovery-link" type="button" onClick={() => { setRecovering(true); setPassword(''); setConfirmPassword(''); setOtp(''); store.resetOtp(); }}>忘记密码？使用邮箱验证码找回</button></> : loginAwaitingCode ? <Field label="6 位验证码" hint={`已发送至 ${store.pendingOtpEmail ?? email}`} valid={otp.length === 6} invalid={otp.length > 0 && otp.length < 6}><input className="ia-input ia-auth-otp" inputMode="numeric" value={otp} onChange={(event) => setOtp(normalizeOtp(event.target.value))} maxLength={6} autoComplete="one-time-code" autoFocus /></Field> : null}
      <Btn type="submit" label={method === 'password' ? '安全登录' : loginAwaitingCode ? '验证并登录' : '发送登录验证码'} variant="primary" busy={busy} disabled={busy || !emailCheck.valid || (method === 'password' ? password.length < 8 : loginAwaitingCode && otp.length !== 6)} />
      {loginAwaitingCode && <button className="ia-auth-resend" type="button" disabled={busy || resendSeconds > 0} onClick={() => void sendCode('login')}>{resendSeconds > 0 ? `${resendSeconds} 秒后可重新发送` : '重新发送验证码'}</button>}
    </form>
  </div>;
}

function AccessTabs({ mode, onChange }: { mode: AccessMode; onChange: (mode: AccessMode) => void }) {
  return <div className="ia-auth-tabs" role="tablist" aria-label="账号操作"><button type="button" className={mode === 'login' ? 'is-active' : ''} onClick={() => onChange('login')}>登录账号</button><button type="button" className={mode === 'register' ? 'is-active' : ''} onClick={() => onChange('register')}>注册新账号</button></div>;
}

function Field({ label, hint, valid, invalid, children }: { label: string; hint: string; valid?: boolean; invalid?: boolean; children: React.ReactNode }) {
  return <label className={`ia-auth-field ${valid ? 'is-valid' : invalid ? 'is-invalid' : ''}`}><span>{label}{valid && <em>✓</em>}</span>{children}<small>{hint}</small></label>;
}
