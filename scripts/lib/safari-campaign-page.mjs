// Runs inside the system Safari tab, independently on each ruler's origin.
export async function runCampaignChecks(ruler) {
  const frame = document.querySelector('iframe');
  const game = () => frame.contentDocument;
  const win = () => frame.contentWindow;
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const signal = async (name, data = {}) => {
    const response = await fetch('/checks/' + name, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(name + ' failed (' + response.status + ')');
    return response.json();
  };
  async function until(read, label, timeout = 16000) {
    const end = Date.now() + timeout;
    do {
      const value = await read();
      if (value) return value;
      await delay(80);
    } while (Date.now() < end);
    throw new Error(label + ' / ' + game()?.body?.innerText.slice(-650));
  }
  const button = (name, root = game()) => {
    const items = [...root.querySelectorAll('button')].filter(b => !b.disabled && b.getClientRects().length);
    return items.find(b => b.textContent.trim() === name) ?? items.find(b => b.textContent.includes(name));
  };
  async function click(name, scope = game) {
    const el = await until(() => scope() && button(name, scope()), name);
    el.click();
  }
  async function reload() {
    const loaded = new Promise(resolve => frame.addEventListener('load', resolve, { once: true }));
    win().location.reload();
    await loaded;
    await until(() => game().querySelector('#scenario-library'), 'campaign lobby after reload');
  }
  async function enter(name, claim) {
    await click('共享活版图');
    if (ruler === 'b' && claim) {
      await until(() => button('重新加载版图'), 'recoverable directory error');
      if (game().body.innerText.includes('首张共享版图正在筹备')) throw new Error('connection failure presented as an empty directory');
      win().dispatchEvent(new Event('online'));
    }
    await click('双人联测');
    const row = () => [...game().querySelectorAll('.ia-world-nation')].find(el => el.querySelector('strong')?.textContent === name);
    if (ruler === 'b' && claim) {
      await until(() => game().body.innerText.includes('加入版图时连接中断'), 'recoverable join error');
      await click('重新加载版图');
      await until(() => row()?.innerText.includes('可认领'), 'roster after retry');
      await signal('hold-nation');
      win().dispatchEvent(new Event('online'));
      await until(() => row()?.innerText.includes('已有统治者'), 'owner after reconnect');
      if (button('认领国家', row())) throw new Error('occupied country still offers a claim');
      await signal('release-nation');
      win().dispatchEvent(new Event('pageshow'));
      await until(() => row()?.innerText.includes('可认领'), 'released country after resuming');
    }
    if (ruler === 'a' && claim) {
      await click('版图频道');
      const field = await until(() => game().querySelector('textarea[aria-label="版图消息"]'), 'world chat composer');
      Object.getOwnPropertyDescriptor(win().HTMLTextAreaElement.prototype, 'value').set.call(field, '罗马的草稿');
      field.dispatchEvent(new (win().Event)('input', { bubbles: true }));
      field.dispatchEvent(new (win().KeyboardEvent)('keydown', { key: 'Enter', isComposing: true, bubbles: true }));
      await click('版图频道');
      await until(() => !field.getClientRects().length, 'collapsed world chat');
      await click('版图频道');
      await until(() => field.getClientRects().length && field.value === '罗马的草稿', 'world draft after reopening');
      await click('版图频道');
    }
    if (claim) await click('认领国家', row);
    await click('以此国进入', row);
    await until(() => game().querySelector('h1.ia-ruler-title')?.textContent === name, 'shared ruler ' + name);
  }
  const state = (slot) => JSON.parse(win().localStorage.getItem('imperium-aeternum-save-' + slot))?.gameState;
  const status = () => signal('status');
  const yearTwo = () => game()?.body?.innerText.includes('Anno · 2');
  try {
    localStorage.setItem('ia-tutorial-done', '1');
    localStorage.setItem('ia-locale', 'zh-CN');
    frame.src = '/Imperium-Aeternum/';
    await until(() => game()?.querySelector('#scenario-library'), 'initial lobby');
    if (ruler === 'a') {
      await click('查看全部剧本');
      await click('印度洋贸易');
      await click('室利佛逝');
      await click('开启纪元');
      await until(() => game().querySelector('h1.ia-ruler-title')?.textContent === '室利佛逝', 'selected ruler');
      await click('改革');
      await click('下一回合');
      await until(yearTwo, 'advance local campaign to year two');
      await until(() => {
        const option = game().querySelector('.ia-event-option');
        option?.click();
        return !option && !game().querySelector('#event-dialog-title');
      }, 'resolve local event choices');
      (await until(() => game().querySelector('[data-navigation-tab="save"]'), 'save tab')).click();
      const slot = n => () => [...game().querySelectorAll('strong')].findLast(el => el.textContent === '槽位 ' + n)?.closest('.ia-card');
      await click('存档到此', slot(1));
      const saved = await until(() => state(1), 'manual checkpoint');
      if (saved.playerNationId !== 'n_oc_srivijaya' || saved.scenarioId !== 'w8_indianocean' || saved.strategyFocus !== 'reform' || saved.turn !== 1) throw new Error('wrong checkpoint');
      await reload();
      await click('继续槽位 1');
      await until(() => game().querySelector('h1.ia-ruler-title')?.textContent === '室利佛逝', 'restored ruler');
      game().querySelector('[data-navigation-tab=save]').click();
      await click('存档到此', slot(2));
      const restored = await until(() => state(2), 'restored checkpoint');
      if (!restored || ['seed', 'scenarioId', 'playerNationId', 'turn', 'strategyFocus'].some(k => restored[k] !== saved[k])) throw new Error('restored campaign differs');
      if (restored.nations[saved.playerNationId].resources.gold !== saved.nations[saved.playerNationId].resources.gold ||
          JSON.stringify(restored.lastReport) !== JSON.stringify(saved.lastReport)) throw new Error('restored treasury or report differs');
      await signal('local');
      await reload();
      await enter('罗马', true);
      await signal('entered');
      await until(async () => (await status()).both, 'both rulers entered');
      win().dispatchEvent(new Event('online'));
      await until(async () => (await status()).synced, 'latest roster revision');
      await click('改革');
      await until(async () => (await status()).retried, 'acknowledgement lost after commit');
      await click('本年准备完毕');
      if ((await status()).expireLease) {
        await until(() => game().body.innerText.includes('准备结果尚未确认，恢复连接后会重新核对。'), 'unconfirmed vote while offline');
        win().dispatchEvent(new Event('online'));
        await until(() => button('已准备 · 检查结算'), 'authoritative vote after reconnect');
      } else {
        await until(() => game().querySelector('.ia-shared-turn-status')?.textContent.includes('已准备，等待其他统治者（1/2）'), 'first vote and two-ruler quorum');
      }
      await reload();
      await enter('罗马', false);
      await until(() => button('已准备 · 检查结算'), 'accepted readiness survived leaving and re-entering');
      await until(() => game().querySelector('.ia-shared-turn-status')?.textContent.includes('已准备，等待其他统治者'), 'restored readiness status');
      await signal('interrupt');
      win().dispatchEvent(new Event('online'));
      await until(async () => (await status()).held, 'in-flight sync');
      win().dispatchEvent(new Event('offline'));
      await until(async () => (await status()).turn === 1, 'second ruler advances world');
      if (yearTwo()) throw new Error('disconnected client already advanced');
      // The online signal arrives before the old interrupted request reports failure.
      win().dispatchEvent(new Event('online'));
      await signal('restore');
      await until(yearTwo, 'first ruler missed reconnect', 4500);
    } else {
      await until(async () => (await status()).entered, 'first ruler entered', 45000);
      await enter('维尼托联邦', true);
      await signal('entered');
      await until(async () => (await status()).held, 'first ruler disconnected');
      win().dispatchEvent(new Event('online'));
      await until(async () => (await status()).secondSynced, 'second ruler received the committed order');
      await click('本年准备完毕');
      await until(yearTwo, 'second ruler year two');
      if ((await status()).expireLease) {
        await until(() => game().body.innerText.includes('统一结算完成，进入第 2 年'), 'settlement confirmed after both readiness replies were lost');
      }
    }
    const { income, nation, turn } = await status();
    if (turn !== 1) throw new Error('unexpected world turn ' + turn);
    if (ruler === 'a') await until(async () => (await status()).peerChoicesDone, 'peer choices committed');
    await reload();
    await enter(nation, false);
    let count = 0;
    for (let pending = (await status()).pending; pending.length; pending = (await status()).pending) {
      if (++count > 12) throw new Error('event chain did not end');
      const choice = pending[0];
      await until(() => game().querySelector('#event-dialog-title')?.textContent === choice.title, 'restored pending choice ' + choice.title);
      game().querySelector('.ia-event-option').click();
      await until(async () => !(await status()).pending.some(p => p.id === choice.id), 'server did not settle ' + choice.title);
    }
    await until(() => !game().querySelector('#event-dialog-title'), 'choice dialog stayed open');
    await signal('choices-done', { count });
    await until(() => button('本年准备完毕'), 'new year must require its own readiness');
    if (button('已准备 · 检查结算')) throw new Error('previous year vote carried forward');
    const openReport = () => game().querySelector('[data-navigation-tab=report]').click();
    openReport();
    const reportVisible = () => game().querySelector('h1.ia-ruler-title')?.textContent === nation &&
      [...game().querySelectorAll('strong')].some(el => el.textContent === '收入 +' + income);
    await until(reportVisible, 'personal year-end report');
    await reload();
    await enter(nation, false);
    openReport();
    await until(() => yearTwo() && reportVisible(), 'same turn, nation and report after re-entry');
    if (game().querySelector('#event-dialog-title') || (await status()).pending.length) throw new Error('resolved choice returned after reload');
    game().querySelector('[data-navigation-tab=chronicle]').click();
    await click('分类');
    await until(() => [...game().querySelectorAll('strong')].some(el => el.textContent === nation + ' 立国'), 'own founding in chronicle after reconnect');
    const other = ruler === 'a' ? '维尼托联邦' : '罗马';
    if ([...game().querySelectorAll('strong')].some(el => el.textContent === other + ' 立国')) throw new Error('foreign founding in national chronicle');
    if (ruler === 'a') {
      game().querySelector('[data-navigation-tab=dashboard]').click();
      await signal('delay-order');
      await click('安民');
      await until(async () => (await status()).orderHeld, 'pending order before exit');
      if (win().dispatchEvent(new (win().Event)('beforeunload', { cancelable: true }))) throw new Error('pending order allowed an unguarded refresh');
      await click('退出共享治理');
      await click('退出并返回大厅');
      await until(() => game().querySelector('[role=dialog] button:disabled')?.textContent.includes('正在等待'), 'exit did not wait for the pending order');
      await signal('reject-order');
      await until(() => game().querySelector('[role=dialog] [role=alert]')?.textContent.includes('未获确认'), 'rejected order dismissed the exit dialog');
      await click('继续治理');
      await until(() => !game().querySelector('#campaign-exit-title') && yearTwo(), 'could not return to the same world after rejection');
      await click('退出共享治理');
      await click('退出并返回大厅');
      await until(() => game().querySelector('#scenario-library'), 'deliberate exit after review did not finish');
      await enter(nation, false);
      await click('本年准备完毕');
      await until(() => button('已准备 · 检查结算'), 'second-year readiness');
      await until(async () => (await status()).peerLeft, 'the other ruler no longer has active control');
      win().dispatchEvent(new Event('online'));
      await until(() => game().body.innerText.includes('Anno · 3'), 'settlement after the last unready ruler left');
      await signal('survivor-advanced');
    } else {
      await until(async () => (await status()).secondYearVote, 'remaining ruler ready for year two');
      game().querySelector('[data-navigation-tab=dashboard]').click();
      await click('退出共享治理');
      await click('退出并返回大厅');
      await click('共享活版图');
      await click('双人联测');
      const row = () => [...game().querySelectorAll('.ia-world-nation')].find(el => el.querySelector('strong')?.textContent === nation);
      if ((await status()).expireLease) {
        await until(() => button('释放控制', row()), 'current ruler in the roster before expiry');
        await signal('expire-lease');
        win().dispatchEvent(new Event('online'));
      } else {
        await click('释放控制', row);
      }
      await until(() => row()?.innerText.includes('可认领'), 'released nation is available');
      await until(async () => (await status()).survivorAdvanced, 'survivor entered year three');
      await click('认领国家', row);
      await click('以此国进入', row);
      await until(() => game().querySelector('h1.ia-ruler-title')?.textContent === nation, 'ruler returned before final battle');
      await signal('settle-final-battle');
      win().dispatchEvent(new Event('online'));
      const archive = () => game().body.innerText.includes('国家已覆亡') && game().body.innerText.includes('第 3 年 · 年度报告');
      await until(archive, 'fallen ruler receives the closing report');
      if (button('本年准备完毕') || game().body.innerText.includes('下一年优先级')) throw new Error('archive offers governance');
      await click('史册');
      await click('分类');
      await until(() => game().body.innerText.includes(nation + ' 立国'), 'fallen ruler’s own chronicle');
      await reload();
      await click('共享活版图');
      await click('双人联测');
      await click('查看记录', row);
      await until(archive, 'closing report after re-entry');
      await click('退出共享治理');
      await click('退出并返回大厅');
      await click('共享活版图');
      await click('双人联测');
      const { nextNation } = await status();
      const nextRow = () => [...game().querySelectorAll('.ia-world-nation')].find(el => el.querySelector('strong')?.textContent === nextNation);
      await click('认领国家', nextRow);
      await click('以此国进入', nextRow);
      await until(() => game().querySelector('h1.ia-ruler-title')?.textContent === nextNation && game().querySelector('[data-navigation-tab=dashboard]'), 'new seat after defeat');
    }
    await signal('pass', { agent: navigator.userAgent, nation, income });
    document.querySelector('output').textContent = nation + ' · 验证通过';
  } catch (error) {
    document.querySelector('output').textContent = error.message;
    await signal('fail', { message: error.message, visibility: game()?.visibilityState });
  } finally {
    frame.remove();
  }
}
