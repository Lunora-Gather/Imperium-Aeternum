import { useI18n } from '../i18n';

interface Props {
  onReview: () => void;
  onClose: () => void;
}

export default function NoviceJourneyCompletion({ onReview, onClose }: Props) {
  const { t } = useI18n();
  return <aside className="ia-novice-coach ia-novice-complete ia-fade-in" role="status" aria-label={t('首局实战引导完成')}>
    <small>FIRST CAMPAIGN · 100%</small>
    <div className="ia-novice-complete-mark" aria-hidden="true">✓</div>
    <strong>{t('你已经掌握核心治理循环')}</strong>
    <p>{t('先读总览，做出决策，保存分支，谨慎推进，再用年报修正下一年计划。接下来可以自由探索外交、科技和战争。')}</p>
    <div className="ia-novice-next">{t('下一步建议：回到总览，选择一条胜利路线，并只解决当前最重要的一件事。')}</div>
    <div className="ia-novice-actions">
      <button className="ia-btn ia-btn--ghost" onClick={onClose}>{t('继续自由治理')}</button>
      <button className="ia-btn ia-btn--primary" onClick={onReview}>{t('回总览制定计划')}</button>
    </div>
  </aside>;
}
