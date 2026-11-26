import { useEffect, useRef, useState } from 'react';
import { registerEnglishTranslations, useI18n } from '../../i18n';
import { Btn } from '../ui';

registerEnglishTranslations({
  '重试发送': 'Retry sending', '丢弃草稿': 'Discard draft', '待发送图片预览': 'Image preview',
  '移除图片': 'Remove image', '图片说明最多 300 字': 'Image captions can contain up to 300 characters.',
});

interface Draft { body: string; file: File | null }
const empty = (): Draft => ({ body: '', file: null });
interface Props {
  label: string;
  placeholder: string;
  direct?: boolean;
  sending: boolean;
  onSend: (body: string, file: File | null) => Promise<boolean>;
}

export function ChatComposer({ label, placeholder, direct, sending, onSend }: Props) {
  const { t } = useI18n();
  const [{ draft, failed }, setState] = useState(() => ({ draft: empty(), failed: [] as Draft[] }));
  const [preview, setPreview] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const pending = useRef(false);
  const limit = draft.file ? 300 : 500;
  const update = (patch: Partial<Draft>) => setState(state => ({ ...state, draft: { ...state.draft, ...patch } }));
  useEffect(() => {
    const url = draft.file ? URL.createObjectURL(draft.file) : '';
    setPreview(url);
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [draft.file]);

  const send = async (item: Draft, retry = false) => {
    if (pending.current || sending || (!item.file && !item.body.trim()) || item.body.length > (item.file ? 300 : 500)) return;
    pending.current = true;
    if (!retry) setState(state => ({ ...state, draft: empty() }));
    try {
      if (await onSend(item.body, item.file)) {
        if (retry) setState(state => ({ ...state, failed: state.failed.filter(d => d !== item) }));
      } else if (!retry) {
        setState(state => !state.draft.file && !state.draft.body ? { ...state, draft: item }
          : { ...state, failed: [...state.failed, item] });
      }
    } finally { pending.current = false; }
  };

  return <>
    {failed.map((item, index) => <div className="ia-chat-attachment" key={index}>
      <strong>{item.file?.name ?? item.body}</strong>
      <button type="button" disabled={sending} onClick={() => void send(item, true)}>{t('重试发送')}</button>
      <button type="button" onClick={() => setState(state => ({ ...state, failed: state.failed.filter(d => d !== item) }))}>{t('丢弃草稿')}</button>
    </div>)}
    {draft.file && <div className="ia-chat-attachment">
      {preview && <img src={preview} alt={t('待发送图片预览')} />}
      <div><strong>{draft.file.name}</strong><span>{Math.max(1, Math.round(draft.file.size / 1024))} KB</span></div>
      <button type="button" aria-label={t('移除图片')} onClick={() => update({ file: null })}>×</button>
    </div>}
    <form className={'ia-world-chat-compose' + (direct ? ' ia-direct-chat-compose' : '')} onSubmit={event => { event.preventDefault(); void send(draft); }}>
      <textarea className="ia-input" aria-label={label} value={draft.body} maxLength={limit} rows={2}
        placeholder={draft.file ? t('给图片附带一句说明（可选）') : placeholder}
        onChange={event => update({ body: event.target.value })}
        onKeyDown={event => {
          if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229 || draft.file) return;
          event.preventDefault();
          void send(draft);
        }} />
      <div>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={event => {
          const file = event.target.files?.[0];
          if (file) update({ file });
          event.target.value = '';
        }} />
        <button type="button" className="ia-chat-attach-btn" onClick={() => fileInput.current?.click()}>▧ {t('图片')}</button>
        <span>{draft.body.length}/{limit}</span>
        {draft.body.length > limit && <span role="status">{t('图片说明最多 300 字')}</span>}
        <Btn type="submit" label={t(draft.file ? '发送图片' : '发送')} variant="primary" busy={sending}
          disabled={sending || draft.body.length > limit || (!draft.file && !draft.body.trim())} />
      </div>
    </form>
  </>;
}
