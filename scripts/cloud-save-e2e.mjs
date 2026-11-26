import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { webkit } from 'playwright-core';
import { preview } from 'vite';
import { decodeLocalSave } from '../src/store/localSaveCodec.ts';
import { files, rows, loadCloudGateway } from './lib/cloud-save-fixture.mjs';

const uploads = [];
const errors = [];
const gateway = await loadCloudGateway();
const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const assetBase = html.match(/<script\b[^>]*\bsrc="([^"]*)assets\/[^"]+\.js"/)?.[1];
assert(assetBase !== undefined, 'Build the release candidate before running the cloud-save checks');
const server = await preview({ base: assetBase || '/', preview: { host: '127.0.0.1', port: 0 } });
const url = new URL(server.config.base, 'http://127.0.0.1:' + server.httpServer.address().port)
  .href;
let browser;
const user = {
  $id: 'ruler',
  name: '双机测试',
  email: 'ruler@test.invalid',
  emailVerification: true,
  prefs: {},
};
const otherUser = { ...user, $id: 'successor', email: 'successor@test.invalid', name: '继任者' };
let privateDownloads = 0;

async function until(check) {
  for (let i = 0; i < 300; i++) {
    if (check()) return;
    await delay(50);
  }
  throw new Error('Timed out waiting for fixture state');
}
async function device(label) {
  const context = await browser.newContext({ locale: 'zh-CN' });
  let sessionUser = null;
  let sessionNumber = 0;
  const sessionId = () => 'session-' + label + '-' + sessionNumber;
  const delayedReplies = new Map();
  const chatAttempts = [];
  let offline = false;
  await context.routeWebSocket(/appwrite/, (s) => s.close());
  await context.route('**/*', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (offline) return route.abort('internetdisconnected');
    if (new URL(request.url()).origin === new URL(url).origin) return route.continue();
    const headers = {
      'access-control-allow-origin': new URL(url).origin,
      'access-control-allow-credentials': 'true',
      'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS,PATCH',
      'access-control-allow-headers': request.headers()['access-control-request-headers'] || '*',
      'access-control-expose-headers': 'X-Fallback-Cookies',
    };
    const cookieKey = 'a_session_imperium-aeternum';
    const authenticated =
      sessionUser &&
      JSON.parse(request.headers()['x-fallback-cookies'] || '{}')[cookieKey] === sessionId();
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    let body = {};
    let status = 200;
    let operation;
    if (path.endsWith('/account/tokens/email')) {
      assert.equal(request.postDataJSON().email, user.email);
      body = { userId: user.$id };
    } else if (
      path.endsWith('/account/sessions/email') ||
      path.endsWith('/account/sessions/token')
    ) {
      const input = request.postDataJSON();
      if (path.endsWith('/token')) {
        assert.equal(input.userId, user.$id);
        assert.equal(input.secret, '123456');
      } else {
        assert([user.email, otherUser.email].includes(input.email));
        assert.equal(input.password, 'test-only-password');
      }
      sessionUser = input.email === otherUser.email ? otherUser : user;
      sessionNumber++;
      headers['X-Fallback-Cookies'] = JSON.stringify({
        [cookieKey]: sessionId(),
      });
      body = { $id: sessionId(), userId: sessionUser.$id };
    } else if (path.endsWith('/account/sessions/current') && request.method() === 'GET') {
      body = { $id: sessionId(), userId: sessionUser?.$id, current: true };
    } else if (path.includes('/account/sessions/') && request.method() === 'DELETE') {
      assert(authenticated && path.endsWith('/' + sessionId()));
      sessionUser = null;
      headers['X-Fallback-Cookies'] = '{}';
    } else if (path.endsWith('/account')) {
      operation = 'account';
      body = authenticated ? sessionUser : { message: 'guest' };
      status = authenticated ? 200 : 401;
    } else if (path.includes('/cloud-save-gateway/executions')) {
      operation = 'upload';
      assert(authenticated);
      const command = JSON.parse(request.postDataJSON().body);
      const answer = await gateway({
        req: { method: 'POST', headers: { 'x-appwrite-user-id': sessionUser.$id }, bodyJson: command },
        res: { json: (result, code = 200) => ({ result, code }) },
        error: () => {},
      });
      uploads.push({ device: label, slot: command.slot, force: !!command.force, status: answer.code });
      body = {
        status: 'completed',
        responseStatusCode: answer.code,
        responseBody: JSON.stringify(answer.result),
      };
    } else if (path.includes('/tables/cloud_saves/rows')) {
      let visible = authenticated ? [...rows.values()].filter(row => row.userId === sessionUser.$id) : [];
      for (const [key, value] of new URL(request.url()).searchParams) {
        if (!key.startsWith('queries[')) continue;
        const query = JSON.parse(value);
        if (query.method === 'equal' && query.attribute === 'slot') visible = visible.filter(row => query.values.includes(row.slot));
        if (query.method === 'orderAsc' && query.attribute === 'slot') visible.sort((a, b) => a.slot - b.slot);
      }
      body = { total: visible.length, rows: visible };
    } else if (path.includes('/storage/buckets/cloud_saves/files/')) {
      const fileId = path.split('/').at(-2);
      if (!authenticated) {
        status = 401;
        body = { message: 'missing SDK credentials' };
      } else if (![...rows.values()].some(row => row.fileId === fileId && row.userId === sessionUser.$id)) {
        status = 404;
        body = { message: 'file unavailable' };
      } else {
        privateDownloads++;
        body = files.get(fileId);
        assert(body);
      }
    } else if (label === 'chat' && path.includes('/tables/friendships/rows') && authenticated && sessionUser.$id === user.$id) {
      body = { total: 1, rows: [{ $id: 'ally', status: 'accepted', requesterId: 'friend', addresseeId: user.$id,
        requesterName: '盟友', addresseeName: user.name, createdAt: '2026-01-01T00:00:00Z' }] };
    } else if (label === 'chat' && path.includes('/social-gateway/executions') && JSON.parse(request.postDataJSON().body).action.startsWith('send_direct_')) {
      const command = JSON.parse(request.postDataJSON().body);
      assert(authenticated && command.expectedUserId === sessionUser.$id);
      operation = 'send';
      chatAttempts.push(command);
      const fail = command.body === '断线草稿' && chatAttempts.filter(c => c.body === command.body).length === 1;
      const message = { $id: 'sent' + chatAttempts.length, senderId: sessionUser.$id, senderName: sessionUser.name, recipientId: 'friend',
        conversationKey: 'friends', body: command.body, kind: 'text', createdAt: new Date().toISOString() };
      body = { responseBody: JSON.stringify(fail ? { ok: false, message: '网络暂不可用' } : { ok: true, message }), responseStatusCode: fail ? 503 : 200 };
    } else if (path.includes('/tables/friendships/rows') && authenticated && label === 'notices' && sessionUser.$id === user.$id) {
      body = { total: 1, rows: [{ $id: 'invite', status: 'pending', requesterId: 'friend', addresseeId: user.$id,
        requesterName: '盟友', addresseeName: user.name, createdAt: '2026-01-01T00:00:00Z' }] };
    } else if (path.includes('/social-gateway/executions') && JSON.parse(request.postDataJSON().body).action === 'ensure_profile') {
      assert(authenticated);
      const profile = { $id: sessionUser.$id, userId: sessionUser.$id, displayName: sessionUser.name, friendCode: 'RULER1', createdAt: '2026-01-01T00:00:00Z', lastSeenAt: '2026-01-01T00:00:00Z' };
      body = { responseBody: JSON.stringify({ ok: true, profile }), responseStatusCode: 200 };
    } else if (path.includes('/executions'))
      body = {
        responseBody: JSON.stringify({ ok: true, messages: [], profiles: [], rows: [] }),
        responseStatusCode: 200,
      };
    else body = { total: 0, rows: [] };
    const held = delayedReplies.get(operation);
    if (held) {
      delayedReplies.delete(operation);
      held.started = true;
      await held.release.promise;
    }
    await route.fulfill({
      status,
      headers,
      contentType: 'application/json',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', (e) => errors.push(e.message));
  return {
    page,
    context,
    chatAttempts,
    holdNextReply(operation) {
      const held = { started: false, release: Promise.withResolvers() };
      delayedReplies.set(operation, held);
      return held;
    },
    setOffline: async (v) => {
      offline = v;
      await context.setOffline(v);
      await page.evaluate((v) => window.dispatchEvent(new Event(v ? 'offline' : 'online')), v);
    },
  };
}
async function login({ page }, otp, identity = user) {
  await page.goto(url);
  await page.getByRole('button', { name: '账号与云存档', exact: true }).click();
  const emailField = page.locator('input[type=email]');
  await emailField.waitFor();
  const emailFocused = await emailField.evaluate(async (field) => {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return document.activeElement === field;
  });
  assert(emailFocused, 'The login dialog must preserve focus on its email field');
  if (otp) await page.getByRole('button', { name: '邮箱验证码', exact: true }).click();
  await emailField.fill(identity.email);
  if (otp) {
    await page.getByRole('button', { name: '发送登录验证码' }).click();
    await page.locator('input[autocomplete=one-time-code]').fill('123456');
    await page.getByRole('button', { name: '验证并登录' }).click();
  } else {
    await page.locator('input[type=password]').fill('test-only-password');
    await page.getByRole('button', { name: '安全登录' }).click();
  }
  await page.getByText(identity.email, { exact: true }).waitFor();
  await page.getByRole('button', { name: '关闭账号窗口' }).click();
}

async function checkOfflineGuestDialogs(device) {
  const { page } = device;
  const privateModules = [];
  const track = request => {
    if (/\/assets\/(socialStore|socialNotifications|SocialDirectory|CloudSaveSlots)-/.test(new URL(request.url()).pathname)) privateModules.push(request.url());
  };
  page.on('request', track);
  await page.goto(url);
  const social = page.getByRole('button', { name: '社交与好友', exact: true });
  await social.waitFor();
  await device.setOffline(true);
  for (const [title, locale, library] of [
    ['繁體中文', 'zh-TW', '查看全部劇本'], ['English', 'en', 'View all campaigns'], ['简体中文', 'zh-CN', '查看全部剧本'],
  ]) {
    await page.getByTitle(title, { exact: true }).click();
    await page.getByRole('button', { name: library, exact: true }).waitFor();
    assert.equal(await page.locator('html').getAttribute('lang'), locale);
  }
  for (const [button, message] of [
    [social, '登录后可以发现玩家、添加好友并发送私信。'],
    [page.getByRole('button', { name: /共享活版图/ }), '需要先登录账号'],
  ]) {
    await button.focus();
    await page.keyboard.press('Enter');
    await page.getByRole('dialog').getByText(message, { exact: true }).waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'detached' });
    assert(await button.evaluate(el => document.activeElement === el), 'Closing the dialog must restore keyboard focus');
  }
  await device.setOffline(false);
  page.off('request', track);
  assert.deepEqual(privateModules, [], 'A guest opened a local dialog but downloaded signed-in features');
}

async function checkPrivateChat() {
  const session = await device('chat');
  const { page, context, chatAttempts } = session;
  let held;
  try {
    await login(session, false);
    await page.getByRole('button', { name: '社交与好友', exact: true }).click();
    await page.getByRole('button', { name: '对话', exact: true }).click();
    const field = page.getByRole('textbox', { name: '给 盟友 的消息' });
    await field.fill('商议');
    const composing = await field.evaluate(el => el.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter', bubbles: true, cancelable: true, isComposing: true,
    })));
    assert(composing, 'Confirming an IME candidate was consumed as a chat submission');
    assert.equal(await field.inputValue(), '商议');
    assert.equal(chatAttempts.length, 0);

    held = session.holdNextReply('send');
    await field.press('Enter');
    await until(() => held.started);
    await field.fill('下条消息');
    await field.press('Enter');
    assert.equal(chatAttempts.length, 1);
    held.release.resolve();
    await page.getByRole('button', { name: '发送', exact: true }).click({ trial: true });
    assert.equal(await field.inputValue(), '下条消息', 'A late send receipt erased the next draft');

    held = session.holdNextReply('send');
    await field.fill('断线草稿');
    await field.press('Enter');
    await until(() => held.started);
    await field.fill('继续编辑');
    held.release.resolve();
    await page.getByRole('button', { name: '重试发送' }).click();
    await page.getByRole('button', { name: '重试发送' }).waitFor({ state: 'detached' });
    assert.deepEqual(chatAttempts.map(c => c.body), ['商议', '断线草稿', '断线草稿']);
    assert.equal(await field.inputValue(), '继续编辑');

    await page.evaluate(() => {
      const read = FileReader.prototype.readAsDataURL;
      FileReader.prototype.readAsDataURL = function(file) {
        window.finishChatFile = () => new Promise(resolve => {
          this.addEventListener('loadend', () => requestAnimationFrame(() => requestAnimationFrame(resolve)), { once: true });
          read.call(this, file);
        });
      };
    });
    await page.locator('.ia-direct-chat input[type=file]').setInputFiles({
      name: '地图.png', mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a25sAAAAASUVORK5CYII=', 'base64'),
    });
    await page.getByRole('button', { name: '发送图片', exact: true }).click();
    await page.waitForFunction(() => typeof window.finishChatFile === 'function');
    const peer = await context.newPage();
    await peer.goto(url);
    await peer.getByRole('button', { name: '账号与云存档', exact: true }).click();
    await peer.getByRole('button', { name: '退出登录', exact: true }).click();
    await peer.getByRole('button', { name: '安全登录', exact: true }).waitFor();
    await login({ page: peer }, false, otherUser);
    await page.getByText('☁ ' + otherUser.name, { exact: true }).waitFor();
    await field.waitFor({ state: 'detached' });
    await page.evaluate(() => window.finishChatFile());
    assert.equal(chatAttempts.length, 3, 'A pending image was sent after changing accounts');
    console.log('Private chat kept IME input and new drafts, retried a failed message and cancelled an image across an account change.');
  } finally {
    held?.release.resolve();
    await context.close();
  }
}

async function checkNotificationRecovery(moduleName) {
  const session = await device('notices');
  const { context, page } = session;
  const chunk = '**/assets/' + moduleName + '-*.js';
  let interrupted = false;
  try {
    await context.route(chunk, route => { interrupted = true; return route.abort('internetdisconnected'); });
    await login(session, false);
    await until(() => interrupted);
    const open = page.getByRole('button', { name: '社交与好友', exact: true });
    await open.focus();
    const trigger = await open.elementHandle();
    await context.unroute(chunk);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await page.getByRole('button', { name: '社交，有 1 条新动态', exact: true }).waitFor();
    assert(await trigger.evaluate(el => el.isConnected && document.activeElement === el), 'Notification recovery replaced the focused social button');
    await page.getByRole('button', { name: '账号与云存档', exact: true }).click();
    await page.getByRole('button', { name: '退出登录', exact: true }).click();
    await page.getByRole('button', { name: '安全登录', exact: true }).waitFor();
    await page.getByRole('button', { name: '关闭账号窗口' }).click();
    await open.waitFor();
    assert.equal(await page.locator('.ia-social-entry em').count(), 0);
    console.log('Notification recovery preserved focus and cleared on logout after losing ' + moduleName + '.');
  } finally {
    await context.close();
  }
}

async function checkSocialReconnect(device) {
  const { page } = device;
  const open = page.getByRole('button', { name: '社交与好友', exact: true });
  await device.setOffline(true);
  await open.focus();
  await page.keyboard.press('Enter');
  const directory = page.getByRole('dialog', { name: '帝国通讯录' });
  await directory.getByText('此页面将在联网后打开。', { exact: true }).waitFor();
  const dialogBeforeReconnect = await directory.elementHandle();
  await device.setOffline(false);
  await directory.getByRole('button', { name: '我的名片', exact: true }).click();
  assert(await dialogBeforeReconnect.evaluate(el => el.isConnected), 'Loading the directory must keep the open dialog mounted');
  const previewCard = directory.getByRole('button', { name: '预览公开名片', exact: true });
  await previewCard.focus();
  await page.keyboard.press('Enter');
  const card = page.getByRole('dialog', { name: user.name + ' 的玩家名片' });
  await card.getByText('这是你的公开名片', { exact: true }).waitFor();
  for (const key of ['Tab', 'Shift+Tab']) {
    await page.evaluate(() => document.activeElement.blur());
    await page.keyboard.press(key);
    assert(await card.evaluate(el => el.contains(document.activeElement)), 'Tab must stay in the profile card when focus resets');
  }
  await page.keyboard.press('Escape');
  await card.waitFor({ state: 'detached' });
  assert(await previewCard.evaluate(el => document.activeElement === el), 'Closing the card must return focus to its preview button');
  await page.keyboard.press('Escape');
  await directory.waitFor({ state: 'detached' });
  assert(await open.evaluate(el => document.activeElement === el), 'Escape must return to the social button after reconnect');
}
async function startCampaignAndOpenSaves(page, world = false) {
  if (world) {
    await page.getByRole('button', { name: '查看全部剧本' }).click();
    await page.locator('#scenario-library button').filter({ hasText: '万邦纪元' }).click();
    await page.locator('.ia-nation-grid button').first().click();
    await page.getByRole('button', { name: /开启纪元/ }).click();
  } else {
    await page.getByRole('button', { name: /开始推荐剧本/ }).first().click();
  }
  const tutorial = page.getByRole('button', { name: '不再提示' });
  await page.getByText('国政总览', { exact: true }).first().waitFor();
  if (await tutorial.isVisible()) await tutorial.click();
  await page.locator('[data-navigation-tab=save]').first().click();
  await page.getByText('刷新体检', { exact: true }).waitFor();
}
const card = (page, cloud, slot = 1) =>
  page
    .locator('div.ia-card')
    .filter({ has: page.getByText('槽位 ' + slot, { exact: true }) })
    .filter({ has: page.getByRole('button', { name: cloud ? '上传' : /^(存档到此|存档|确认覆盖)$/ }) })
    .last();
async function save(page) {
  const slot = card(page, false);
  await slot.getByRole('button', { name: /^(存档到此|存档)$/ }).click();
  const confirm = slot.getByRole('button', { name: '确认覆盖', exact: true });
  if (await confirm.isVisible()) await confirm.click();
}
async function changeTax(page, button) {
  await page.locator('[data-navigation-tab=economy]').first().click();
  await page.getByRole('button', { name: button, exact: true }).click();
  await page.locator('[data-navigation-tab=save]').first().click();
}
const readStored = (page) => page.evaluate(() => localStorage.getItem('imperium-aeternum-save-1'));
const readLocal = async (page) => decodeLocalSave(await readStored(page));
const row = () => [...rows.values()].find((v) => v.slot === 1);

async function restoreFromTitle() {
  const session = await device('fresh');
  const { page } = session;
  try {
    await page.setViewportSize({ width: 375, height: 740 });
    await login(session, false);
    await page.getByRole('button', { name: '账号与云存档', exact: true }).click();
    const slot = card(page, true);
    const download = slot.getByRole('button', { name: '下载', exact: true });
    const file = '**/storage/buckets/cloud_saves/files/**/download*';
    const original = JSON.parse(files.get(row().fileId)).gameState;
    assert.equal(await slot.locator('time').getAttribute('datetime'), row().clientUpdatedAt);
    const dialog = page.getByRole('dialog', { name: '账号与云端纪元' });
    assert(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1));
    assert(await dialog.getByText(user.email, { exact: true }).evaluate(el => el.scrollWidth <= el.clientWidth + 1));
    await page.route(file, route => route.fulfill({ contentType: 'application/json', body: '{}', headers: {
      'access-control-allow-origin': new URL(url).origin, 'access-control-allow-credentials': 'true',
    } }));
    await download.click();
    await page.getByRole('status').filter({ hasText: '完整性校验失败' }).waitFor();
    assert.equal(await readStored(page), null);
    await page.unroute(file);
    await download.click();
    await page.getByText('槽位 1 已从云端恢复', { exact: true }).waitFor();
    const local = JSON.parse(await readLocal(page)).gameState;
    assert.equal(local.playerNationId, original.playerNationId);
    assert.equal(local.nations[local.playerNationId].taxRate, original.nations[original.playerNationId].taxRate);
    assert.equal(await page.evaluate(() => localStorage.getItem('imperium-aeternum-save-0')), null);
    await page.getByRole('button', { name: '关闭账号窗口' }).click();
    await page.getByTitle('English', { exact: true }).click();
    await page.getByRole('button', { name: 'Account and Cloud Saves', exact: true }).click();
    const english = page.locator('div.ia-card').filter({ has: page.getByText('Slot 1', { exact: true }) });
    await english.getByRole('button', { name: 'Download', exact: true }).waitFor();
    assert.equal(await english.locator('time').count(), 2);
    await page.keyboard.press('Escape');
    await page.getByTitle('简体中文', { exact: true }).click();
    await page.getByRole('button', { name: '账号与云存档', exact: true }).click();
    await slot.getByRole('button', { name: '继续槽位 1' }).click();
    await page.getByText('国政总览', { exact: true }).first().waitFor();
    assert(!uploads.some(entry => entry.device === 'fresh'));
    console.log('A fresh device recovered from a damaged cloud response and continued the selected slot directly from the title.');
  } finally {
    await session.context.close();
  }
}

async function checkInspectionRecovery(context, page) {
  // The save screen already loaded its copy. Only the new worker will fetch
  // the recovery module while the first checkpoint is being inspected.
  const module = '**/assets/saveRecovery-*.js*';
  const interrupt = route => route.abort('internetdisconnected');
  await page.evaluate(() => {
    const NativeWorker = window.Worker;
    window.inspectorReplies = [];
    window.restoreInspector = () => { window.Worker = NativeWorker; };
    window.Worker = class extends NativeWorker {
      constructor(...args) {
        super(...args);
        this.addEventListener('message', event => window.inspectorReplies.push(event.data === null ? 'fallback' : 'inspected'));
      }
    };
  });
  await context.route(module, interrupt);
  try {
    await save(page);
    await page.waitForFunction(() => window.inspectorReplies.includes('fallback'));
    await card(page, false).getByRole('button', { name: '读档', exact: true }).waitFor();
  } finally { await context.unroute(module, interrupt); }
  await save(page);
  await page.waitForFunction(() => window.inspectorReplies.includes('inspected'));
  await page.evaluate(() => { window.restoreInspector(); delete window.restoreInspector; delete window.inspectorReplies; });
}

// Hold storage notifications to exercise the gap between a paint and delivery
// of the event. Both tabs still share the browser's real storage.
async function checkCompetingTabs() {
  const { context, page } = await device('tabs');
  const cloudModules = [];
  context.on('request', request => {
    if (/\/assets\/CloudSaveSlots-/.test(new URL(request.url()).pathname)) cloudModules.push(request.url());
  });
  try {
    await page.addInitScript(() => window.addEventListener('storage', event => event.stopImmediatePropagation(), true));
    await page.goto(url);
    await startCampaignAndOpenSaves(page);
    await checkInspectionRecovery(context, page);
    const first = await readStored(page);
    const other = await context.newPage();
    await other.goto(url);
    await other.getByRole('button', { name: '继续槽位 1', exact: true }).first().click();
    await changeTax(other, '+2%');
    await save(other);
    const replacement = await readStored(other);
    assert.notEqual(replacement, first);
    await card(page, false).getByRole('button', { name: '删除', exact: true }).click();
    await page.getByText('槽位已变化，请在存档页核对或另存。', { exact: false }).first().waitFor();
    assert.equal(await page.getByRole('dialog').count(), 0, 'A stale delete opened a confirmation for another save');
    assert.equal(await readStored(page), replacement);

    await page.getByRole('button', { name: '清空全部存档' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: '取消', exact: true }).waitFor();
    await changeTax(other, '+5%');
    await card(other, false, 2).getByRole('button', { name: '存档到此' }).click();
    await other.waitForFunction(() => !!localStorage.getItem('imperium-aeternum-save-2'));
    await dialog.getByRole('button', { name: '确认删除' }).click();
    await dialog.waitFor({ state: 'detached' });
    assert.equal(await readStored(page), replacement, 'Bulk delete partially erased the reviewed list');
    assert(await page.evaluate(() => !!localStorage.getItem('imperium-aeternum-save-2')), 'Bulk delete removed a newly filled slot');
    const title = await context.newPage();
    await title.goto(url);
    await title.getByText('其他本地存档', { exact: true }).click();
    const alternate = title.locator('details').getByRole('button', { name: /^继续槽位 [12] ·/ }).first();
    const index = Number((await alternate.innerText()).match(/槽位 (\d+)/)[1]);
    const savedState = async slot => JSON.parse(decodeLocalSave(await title.evaluate(n => localStorage.getItem('imperium-aeternum-save-' + n), slot))).gameState;
    const chosen = await savedState(index);
    const tax = state => state.nations[state.playerNationId].taxRate;
    assert.notEqual(tax(await savedState(1)), tax(await savedState(2)));
    await alternate.click();
    await title.locator('[data-navigation-tab=save]').first().click();
    await card(title, false, 4).getByRole('button', { name: '存档到此' }).click();
    await title.waitForFunction(() => !!localStorage.getItem('imperium-aeternum-save-4'));
    assert.equal(tax(await savedState(4)), tax(chosen));
    await title.close();
    const remove = card(page, false).getByRole('button', { name: '删除', exact: true });
    await card(page, false, 2).getByRole('button', { name: '读档', exact: true }).waitFor();
    await remove.click({ trial: true });
    await remove.focus();
    await page.keyboard.press('Enter');
    await dialog.waitFor();
    assert(await dialog.getByRole('button', { name: '取消' }).evaluate(el => document.activeElement === el));
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'detached' });
    assert(await remove.evaluate(el => el === document.activeElement));
    assert.equal(await readStored(page), replacement);
    await remove.click();
    await dialog.getByRole('button', { name: '确认删除' }).click();
    await page.waitForFunction(() => localStorage.getItem('imperium-aeternum-save-1') === null);
    assert.deepEqual(cloudModules, [], 'Guest save and restore downloaded the signed-in cloud interface');
    console.log('Guests managed local slots without downloading cloud controls, and two tabs preserved competing saves.');
  } finally { await context.close(); }
}

async function restoreWhilePeerSaves({ context, page }) {
  const peer = await context.newPage();
  const resume = Promise.withResolvers();
  const downloads = '**/storage/buckets/cloud_saves/files/**/download*';
  await page.route(downloads, async route => {
    await resume.promise;
    await route.fallback();
  });
  try {
    await peer.goto(url);
    await peer.locator('.ia-featured-scenario').click();
    await peer.getByText('国政总览', { exact: true }).first().waitFor();
    const tutorial = peer.getByRole('button', { name: '不再提示' });
    if (await tutorial.isVisible()) await tutorial.click();
    await changeTax(peer, '+2%');
    await Promise.all([
      page.waitForRequest(downloads),
      card(page, true).getByRole('button', { name: '下载', exact: true }).click(),
    ]);
    await save(peer);
    const later = await readStored(peer);
    assert(later);
    resume.resolve();
    const confirm = card(page, true).getByRole('button', { name: '确认覆盖本地' });
    await confirm.waitFor();
    assert.equal(await readStored(page), later, 'Download overwrote a peer’s newer local save');
    await confirm.click();
    await page.getByText('槽位 1 已从云端恢复', { exact: true }).waitFor();
  } finally {
    resume.resolve();
    await page.unroute(downloads);
    await peer.close();
  }
}
async function checkAccountSwitchBetweenTabs() {
  const session = await device('switch');
  let held, upload;
  try {
    await login(session, false);
    const { page } = session;
    const accountButton = tab => tab.getByRole('button', { name: '账号与云存档', exact: true });
    await accountButton(page).click();
    await page.getByText(user.email, { exact: true }).waitFor();
    const peer = await session.context.newPage();
    peer.on('pageerror', e => errors.push(e.message));
    await peer.goto(url);
    await peer.getByText('☁ ' + user.name, { exact: true }).waitFor();
    await startCampaignAndOpenSaves(peer);
    upload = session.holdNextReply('upload');
    const [oldUpload] = await Promise.all([
      peer.waitForRequest(r => r.method() === 'POST' && r.url().includes('/cloud-save-gateway/executions') && JSON.parse(r.postDataJSON().body).slot === 3),
      card(peer, false, 3).getByRole('button', { name: '存档到此' }).click(),
    ]);
    await until(() => upload.started);
    // The peer's open dialog has an authenticated response from before logout in flight.
    held = session.holdNextReply('account');
    const [staleRead] = await Promise.all([
      peer.waitForRequest(r => r.method() === 'GET' && new URL(r.url()).pathname.endsWith('/account')),
      peer.getByRole('button', { name: '账号 / 云存档', exact: true }).click(),
    ]);
    await until(() => held.started);
    await page.getByRole('button', { name: '退出登录', exact: true }).click();
    await page.getByRole('button', { name: '安全登录', exact: true }).waitFor();
    await peer.getByRole('button', { name: '安全登录', exact: true }).waitFor({ timeout: 5000 });
    await login(session, false, otherUser);
    const peerAccount = peer.getByRole('dialog', { name: '账号与云端纪元' });
    await peerAccount.getByText(otherUser.email, { exact: true }).waitFor();
    held.release.resolve();
    await (await staleRead.response()).finished();
    await peer.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert(await peerAccount.getByText(otherUser.email, { exact: true }).isVisible());
    assert.equal(await peer.getByText(user.email, { exact: true }).count(), 0);
    await peer.getByRole('button', { name: '关闭账号窗口' }).click();
    await card(peer, false, 4).getByRole('button', { name: '存档到此' }).click();
    await peer.getByText('槽位 4 已上传云端', { exact: true }).waitFor();
    upload.release.resolve();
    await (await oldUpload.response()).finished();
    await card(peer, true, 4).getByRole('button', { name: '下载', exact: true }).click({ trial: true });
    await card(peer, true, 3).getByText('云端为空', { exact: true }).waitFor();
    assert(await card(peer, true, 3).getByRole('button', { name: '下载', exact: true }).isDisabled());
    assert.equal(await peer.evaluate(() => localStorage.getItem('ia-cloud-base:ruler:3')), null);
    const owners = [...rows.values()].filter(row => row.slot === 3 || row.slot === 4).map(row => [row.slot, row.userId]);
    assert.deepEqual(owners, [[3, user.$id], [4, otherUser.$id]]);
    console.log('The peer tab followed logout and account replacement, uploaded the new save and discarded late identity and save replies.');
  } finally {
    held?.release.resolve();
    upload?.release.resolve();
    await session.context.close();
  }
}
try {
  browser = await webkit.launch();
  await checkNotificationRecovery('socialNotifications');
  await checkNotificationRecovery('socialStore');
  await checkPrivateChat();
  await checkAccountSwitchBetweenTabs();
  await checkCompetingTabs();
  const a = await device('A');
  const b = await device('B');
  await checkOfflineGuestDialogs(a);
  await login(a, false);
  await checkSocialReconnect(a);
  await startCampaignAndOpenSaves(a.page, true);
  await changeTax(a.page, '+2%');
  await save(a.page);
  await until(() => row());
  await restoreFromTitle();
  await login(b, true);
  await startCampaignAndOpenSaves(b.page);
  await restoreWhilePeerSaves(b);
  await card(b.page, false).getByRole('button', { name: /^(修复并读档|读档)$/ }).click();
  const initial = row().contentHash;
  const initialProgress = files.get(row().fileId);
  assert.equal(Object.keys(JSON.parse(initialProgress).gameState.nations).length, 206);
  assert.equal(await readLocal(a.page), initialProgress);
  assert.ok((await readStored(b.page)).length < initialProgress.length / 2, 'Downloaded world did not use compact local storage');
  await a.page.locator('[data-navigation-tab=economy]').first().click();
  await a.page.getByRole('button', { name: '+5%', exact: true }).waitFor();
  await a.setOffline(true);
  await a.page.getByRole('button', { name: '+5%', exact: true }).click();
  // A screen first opened offline must leave the running campaign and local saves accessible.
  await a.page.locator('[data-navigation-tab=stats]').first().click();
  await a.page.getByText('此页面将在联网后打开。', { exact: true }).waitFor();
  await a.page.locator('[data-navigation-tab=save]').first().click();
  await save(a.page);
  const localProgress = await readLocal(a.page);
  assert(await a.page.evaluate(() => !!localStorage.getItem('ia-cloud-pending:1')));
  await changeTax(b.page, '-5%');
  await save(b.page);
  await until(() => row().contentHash !== initial);
  const remote = row().contentHash;
  await a.setOffline(false);
  const conflict = card(a.page, true).getByRole('button', { name: '确认覆盖云端' });
  await conflict.waitFor();
  await a.page.locator('[data-navigation-tab=stats]').first().click();
  await a.page.getByText('尚无回合数据，推进一步后可见趋势。', { exact: true }).waitFor();
  await a.page.locator('[data-navigation-tab=save]').first().click();
  await conflict.waitFor();
  const remoteProgress = await readLocal(b.page);
  assert.equal(files.get(row().fileId), remoteProgress);
  assert.equal(await readLocal(a.page), localProgress);
  const tax = (raw) => {
    const { gameState } = JSON.parse(raw);
    return gameState.nations[gameState.playerNationId].taxRate;
  };
  assert(Math.abs(tax(localProgress) - tax(initialProgress) - 0.05) < 1e-8);
  assert(Math.abs(tax(remoteProgress) - tax(initialProgress) + 0.05) < 1e-8);
  assert.equal(row().contentHash, remote);
  await conflict.click();
  await until(() => files.get(row().fileId) === localProgress);
  await a.setOffline(true);
  await save(a.page);
  await a.setOffline(false);
  await until(() => uploads.filter(upload => upload.device === 'A' && upload.status === 200).length >= 3);
  // Restore a queued offline slot after a fresh document and a renewed account session.
  await a.setOffline(true);
  const restartBase = row().contentHash;
  await save(a.page);
  await a.page.goto('about:blank');
  await a.setOffline(false);
  await a.page.goto(url);
  await until(() => row().contentHash !== restartBase);
  const before = uploads.length;
  await a.page.reload();
  await a.page.getByRole('button', { name: '账号与云存档', exact: true }).click();
  await a.page.getByText(user.email, { exact: true }).waitFor();
  await a.setOffline(true);
  await a.page.getByRole('button', { name: '退出登录', exact: true }).click();
  await a.page.getByRole('button', { name: '退出登录', exact: true }).waitFor({ state: 'visible' });
  await a.page.waitForFunction(() =>
    [...document.querySelectorAll('button')].some(
      (b) => b.textContent === '退出登录' && !b.disabled,
    ),
  );
  assert(await a.page.getByText(user.email, { exact: true }).isVisible());
  await a.setOffline(false);
  await a.page.getByRole('button', { name: '退出登录', exact: true }).click();
  await a.page.getByRole('button', { name: '安全登录', exact: true }).waitFor();
  assert(privateDownloads > 0);
  assert(uploads.some(upload => upload.device === 'A' && upload.status === 409 && !upload.force));
  assert.equal(uploads.length, before);
  assert.deepEqual(errors, []);
  console.log(
    'Two WebKit profiles passed offline guest dialogs, social reconnect and keyboard focus, password and OTP login, authenticated restore, offline saves, conflict resolution, retry and logout.',
    JSON.stringify(uploads),
  );
} catch (e) {
  console.error(JSON.stringify(uploads));
  for (const c of browser?.contexts() ?? [])
    for (const page of c.pages()) console.error((await page.locator('body').innerText()).slice(-1500));
  throw e;
} finally {
  await browser?.close();
  await server.close();
}
