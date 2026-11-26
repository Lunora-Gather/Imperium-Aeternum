import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { build, preview } from 'vite';
import { EVENT_BY_ID } from '../src/data/events.ts';
import { createInitialState } from '../src/engine/init.ts';
import { besiegeLastProvince, createBrowserWorld, worldId } from './lib/shared-world-fixture.mjs';
import { runCampaignChecks } from './lib/safari-campaign-page.mjs';

if (process.platform !== 'darwin') throw new Error('System Safari requires macOS');
const base = '/Imperium-Aeternum/';
const expireLease = process.argv.includes('--expire-lease');
const names = { a: ['n01', '罗马'], b: ['n02', '维尼托联邦'] };
const initial = createInitialState();
const world = await createBrowserWorld(initial);
world.write(worldId, { ...world.world(), name: '双人联测', templateId: 'classic', nationCount: 5 });
for (const [id, name] of Object.values(names)) world.write(id, { ...world.rows.get(id), nationName: name });

world.write('n03', { ...world.rows.get('n02'), nationId: 'n03', nationName: initial.nations.n03.name });
const folder = await mkdtemp(join(tmpdir(), 'imperium-native-safari-'));
const servers = [], origins = {}, entered = new Set(), passed = new Set();
let local = false, synced = false, interrupted = false, held, restored = false;
const orderReceipts = [];
const readyReceipts = [];
const choicesDone = new Set();
let delayNextOrder = false, delayedOrder, checkedFailedExit = false;
let dropVoteCheck = false;
let directoryInterrupted = false, admissionInterrupted = false;
// Include only test phases and revisions (never full command bodies) on a failed run.
const trace = [];
const started = performance.now();
function record(user, action, detail) {
  trace.push([Math.round(performance.now() - started), user, action, detail]);
  if (trace.length > 60) trace.shift();
}
let secondSynced = false, survivorAdvanced = false;
const finished = Promise.withResolvers();
const timeout = setTimeout(() => finished.reject(new Error('Safari campaign test timed out')), 120000);
const json = (res, body) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); };
async function read(req) {
  let body = '';
  for await (const chunk of req) body += chunk;
  return JSON.parse(body || '{}');
}
function status(user) {
  const { turn, snapshotFileId } = world.world();
  const [id, nation] = names[user];
  const snapshot = JSON.parse(world.files.get(snapshotFileId));
  const report = snapshot.sharedHistories?.[id]?.at(-1);
  const pending = snapshot.pendingEvents.filter(e => e.nationId === id).map(e => ({ id: e.eventId, title: EVENT_BY_ID[e.eventId].title }));
  const income = report && Math.round(report.income.tax + report.income.trade + report.income.building);
  return { entered: entered.has('a'), both: entered.size === 2, synced, retried: orderReceipts.length === 2,
    pending, survivorAdvanced, nextNation: snapshot.nations.n03.name, secondYearVote: readyReceipts.some(([ruler, year]) => ruler === 'a' && year === 1),
    expireLease, peerLeft: !world.rows.get('n02').controllerUserId || Date.parse(world.rows.get('n02').leaseExpiresAt) <= Date.now(),
    peerChoicesDone: choicesDone.has('b'), secondSynced, held: !!held, orderHeld: !!delayedOrder, turn, nation, income };
}
async function handle(user, req, res, next) {
  const path = new URL(req.url, origins[user]).pathname;
  if (path.startsWith(base) || path === '/favicon.ico') return next();
  res.setHeader('Cache-Control', 'no-store');
  if (path === '/suite' || path === '/ruler') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    const peer = origin => '<iframe title="Safari campaign" src="' + origin + '/ruler"></iframe>';
    const body = path === '/suite' ? Object.values(origins).map(peer).join('') :
      '<output>Safari · ' + user + '</output><iframe title="Game"></iframe><script type="module">(' + runCampaignChecks.toString() + ')(' + JSON.stringify(user) + ')</script>';
    return res.end('<!doctype html><meta charset="utf-8"><title>Imperium · Safari 回归验证</title><style>html,body{margin:0;height:100%}body{display:flex}iframe{border:0;flex:1;min-width:0}body:has(output){flex-direction:column}</style>' + body);
  }
  if (path.startsWith('/checks/') && req.method === 'POST' && req.headers.origin === origins[user]) {
    const data = await read(req);
    if (path !== '/checks/status') record(user, path, data.visibility);
    switch (path.slice(8)) {
      case 'status': return json(res, status(user));
      case 'local': local = true; console.log('Safari restored the selected Srivijaya campaign from slot 1 after reload.'); break;
      case 'entered': entered.add(user); break;
      case 'expire-lease': {
        assert(expireLease && user === 'b' && status(user).secondYearVote);
        const control = world.rows.get('n02');
        assert.equal(control.controllerUserId, user);
        world.write('n02', { ...control, leaseExpiresAt: new Date(Date.now() - 1).toISOString() });
        break;
      }
      case 'hold-nation':
      case 'release-nation': {
        assert.equal(user, 'b');
        const action = path.endsWith('/hold-nation') ? 'claim_nation' : 'release_nation';
        const changed = await world.request('temporary-ruler', action, names.b[0]);
        assert(changed.ok, changed.message);
        break;
      }
      case 'choices-done': {
        assert.equal(status(user).pending.length, 0);
        assert(data.count > 0);
        const state = JSON.parse(world.files.get(world.world().snapshotFileId));
        assert.equal(state.triggeredEvents.filter(e => e.turn === 1 && e.nationId === names[user][0]).length, data.count);
        choicesDone.add(user);
        break;
      }
      case 'delay-order': assert.equal(user, 'a'); delayNextOrder = true; break;
      case 'reject-order':
        assert.equal(user, 'a');
        assert(delayedOrder, 'No outstanding order to reject');
        json(delayedOrder, { responseBody: JSON.stringify({ ok: false, message: '本轮行动未确认' }), responseStatusCode: 400, status: 'completed' });
        delayedOrder = null;
        checkedFailedExit = true;
        break;
      case 'interrupt': interrupted = true; break;
      case 'restore':
        assert(held, 'No in-flight request to interrupt');
        interrupted = false;
        restored = true;
        held.destroy();
        held = null;
        break;
      case 'survivor-advanced': assert.equal(user, 'a'); survivorAdvanced = true; break;
      case 'settle-final-battle': {
        assert.equal(user, 'b');
        assert(survivorAdvanced && world.rows.get('n02').controllerUserId === 'b');
        const row = world.world();
        assert.equal(row.turn, 2);
        const state = JSON.parse(world.files.get(row.snapshotFileId));
        besiegeLastProvince(state);
        const fileId = crypto.randomUUID();
        world.files.set(fileId, Buffer.from(JSON.stringify(state)));
        world.write(worldId, { ...row, snapshotFileId: fileId, revision: row.revision + 1, planningDeadlineAt: new Date().toISOString() });
        const tick = await world.schedule();
        assert.equal(tick.results[0]?.resolved, true);
        assert(JSON.parse(world.files.get(world.world().snapshotFileId)).nations.n02.defeated);
        break;
      }
      case 'pass':
        assert.match(data.agent, /Version\/[\d.]+.*Safari\//);
        passed.add(user);
        console.log(JSON.stringify(data));
        if (passed.size === 2) finished.resolve();
        break;
      case 'fail': finished.reject(new Error(user + ': ' + data.message)); break;
      default: res.statusCode = 404;
    }
    return json(res, {});
  }
  if (path === '/account') return json(res, { $id: user, name: user, email: user + '@test.invalid', emailVerification: true, prefs: {} });
  if (path.endsWith('/tables/shared_worlds/rows')) {
    if (user === 'b' && !directoryInterrupted) {
      directoryInterrupted = true;
      res.statusCode = 503;
      return json(res, { message: '版图目录暂不可用', code: 503 });
    }
    return json(res, { rows: [world.world()], total: 1 });
  }
  if (path.endsWith('/functions/shared-world-gateway/executions')) {
    const order = JSON.parse((await read(req)).body);
    record(user, order.action, order.baseRevision);
    if (user === 'b' && order.action === 'join_world' && !admissionInterrupted) {
      admissionInterrupted = true;
      return json(res, { responseBody: JSON.stringify({ ok: false, message: '加入版图时连接中断' }), responseStatusCode: 503, status: 'completed' });
    }
    if (user === 'a' && interrupted) {
      if (order.action === 'sync_world' && !held) { held = res; return; }
      return res.destroy();
    }
    if (user === 'a' && delayNextOrder && order.action === 'submit_command') {
      delayNextOrder = false;
      delayedOrder = res;
      return;
    }
    if (user === 'a' && dropVoteCheck && order.action === 'sync_world') {
      dropVoteCheck = false;
      return res.destroy();
    }
    const result = await world.request(user, order.action, order.nationId, order);
    if (order.action === 'submit_command' && order.payload?.action === 'set_strategy_focus') {
      assert.equal(user, 'a');
      assert(result.ok, result.message);
      orderReceipts.push([order.idempotencyKey, result.world.revision]);
      if (orderReceipts.length === 1) return res.destroy();
    }
    if (user === 'b' && order.action === 'sync_world' && result.ok && result.world.revision === orderReceipts[0]?.[1]) secondSynced = true;
    if (order.action === 'set_ready' && result.ok) {
      readyReceipts.push([user, order.turn, order.baseRevision, result.resolved?.world.turn]);
      const attempts = readyReceipts.filter(([voter, year]) => voter === user && year === order.turn).length;
      if (user === 'a' && expireLease && order.turn === 0 && attempts <= 2) {
        if (attempts === 2) dropVoteCheck = true;
        return res.destroy();
      }
      if (user === 'b' && order.turn === 0 && attempts <= (expireLease ? 2 : 1)) return res.destroy();
    }
    if (user === 'a' && entered.size === 2 && order.action === 'sync_world' && result.ok) synced = true;
    return json(res, { responseBody: JSON.stringify(result), responseStatusCode: result.ok ? 200 : 400, status: 'completed' });
  }
  if (path.endsWith('/executions')) return json(res, { responseBody: JSON.stringify({ ok: true, profiles: [], messages: [], rows: [] }), responseStatusCode: 200 });
  json(res, { rows: [], total: 0 });
}

try {
  await build({ base, logLevel: 'warn', define: { 'import.meta.env.VITE_APPWRITE_ENDPOINT': 'window.location.origin' }, build: { outDir: folder, emptyOutDir: true } });
  for (const user of Object.keys(names)) {
    const server = await preview({
      base, build: { outDir: folder }, preview: { host: '127.0.0.1', port: 0, open: false },
      plugins: [{ name: 'native-safari-fixture', configurePreviewServer(s) {
        s.middlewares.use((req, res, next) => { void handle(user, req, res, next).catch(err => { res.destroy(); finished.reject(err); }); });
      } }],
    });
    servers.push(server);
    origins[user] = 'http://127.0.0.1:' + server.httpServer.address().port;
  }
  await promisify(execFile)('/usr/bin/open', ['-b', 'com.apple.Safari', origins.a + '/suite']);
  await finished.promise;
  assert(local && restored && checkedFailedExit && world.world().turn === 3 && world.rows.get('n03').controllerUserId === 'b', 'unexpected turn or missing recovery');
  assert.deepEqual(readyReceipts.map(([user, turn,, resolved]) => [user, turn, resolved]), [
    ['a', 0, undefined], ...(expireLease ? [['a', 0, undefined]] : []), ['b', 0, 1], ['b', 0, 1], ['a', 1, undefined],
  ]);
  const peerVotes = readyReceipts.filter(([user]) => user === 'b');
  assert.deepEqual(peerVotes[0], peerVotes[1], 'readiness retry changed the target revision');
  if (expireLease) assert.deepEqual(readyReceipts[0], readyReceipts[1]);
  assert.equal(choicesDone.size, 2);
  assert.equal(orderReceipts.length, 2);
  assert.deepEqual(orderReceipts[1], orderReceipts[0], 'retried order was applied twice');
  console.log('System Safari passed campaign selection, durable saves and two-ruler reconnect.');
} catch (error) {
  console.error('Safari test timeline [ms, ruler, action, detail]:', JSON.stringify(trace));
  throw error;
} finally {
  clearTimeout(timeout);
  held?.destroy();
  delayedOrder?.destroy();
  await Promise.all(servers.map(s => s.close()));
  await rm(folder, { recursive: true, force: true });
}
