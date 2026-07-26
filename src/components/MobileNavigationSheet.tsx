import { useI18n } from '../i18n';
import { NAVIGATION_GROUPS, type NavigationTab } from '../gameplay/navigationTabs';

interface MobileNavigationSheetProps {
  activeTab: NavigationTab;
  onSelect: (tab: NavigationTab) => void;
  onClose: () => void;
}

export default function MobileNavigationSheet({ activeTab, onSelect, onClose }: MobileNavigationSheetProps) {
  const { t } = useI18n();
  return (
    <div className="ia-modal-backdrop ia-mobile-nav-backdrop" onClick={onClose}>
      <section id="mobile-page-navigation" className="ia-mobile-nav-sheet ia-fade-in" role="dialog" aria-modal="true" aria-labelledby="mobile-page-navigation-title" onClick={(event) => event.stopPropagation()}>
        <header>
          <div>
            <span className="ia-up">{t('快速导航')}</span>
            <h2 id="mobile-page-navigation-title">{t('前往页面')}</h2>
            <p>{t('所有治理页面都在这里；常用页面仍可从上方快捷栏横向切换。')}</p>
          </div>
          <button className="ia-icon-btn" type="button" aria-label={t('关闭页面导航')} onClick={onClose}>×</button>
        </header>
        <div className="ia-mobile-nav-groups">
          {NAVIGATION_GROUPS.map((group) => (
            <section key={group.group}>
              <h3 className="ia-up">{t(group.group)}</h3>
              <div>
                {group.tabs.map((tab) => (
                  <button key={tab.id} type="button" className={activeTab === tab.id ? 'is-active' : ''} onClick={() => onSelect(tab.id)}>
                    <span className="ia-tab-icon" aria-hidden="true">{tab.icon}</span>
                    <strong>{t(tab.label)}</strong>
                    {activeTab === tab.id && <em>{t('当前')}</em>}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
