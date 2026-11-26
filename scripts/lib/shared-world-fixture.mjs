import { declareWar } from '../../src/engine/military.ts';

// Arrange a final battle through the normal settlement path.
export function besiegeLastProvince(state) {
  const defender = state.nations.n02;
  const front = state.provinces[state.nations.n01.capital], target = state.provinces[defender.capital];
  front.adjacent = [...new Set([...front.adjacent, target.id])];
  target.adjacent = [...new Set([...target.adjacent, front.id])];
  for (const province of Object.values(state.provinces)) {
    if (province.ownerId === defender.id && province !== target) province.ownerId = 'barbarian';
  }
  target.garrison = 0;
  defender.army = [];
  if (!declareWar(state, 'n01', defender.id, target.id)) throw new Error('Could not start the final battle');
}

const error = (code) => Object.assign(new Error(String(code)), { code });
export const worldId = 'test-world';
export function sharedWorldFixture(gateway, initialState) {
  const rows = new Map(), transactions = new Map(), files = new Map();
  const write = (id, data) => rows.set(id, { ...data, $id: id, stamp: (rows.get(id)?.stamp ?? 0) + 1 });
  const world = () => rows.get(worldId);
  let nextTx = 0;
  const db = {
    async createTransaction() {
      const id = String(++nextTx);
      transactions.set(id, { rows: new Map(rows), writes: new Map() });
      return { $id: id };
    },
    async updateTransaction({ transactionId, commit }) {
      const tx = transactions.get(transactionId);
      if (!tx) throw error(404);
      transactions.delete(transactionId);
      if (!commit) return;
      for (const id of tx.writes.keys()) if (rows.get(id) !== tx.rows.get(id)) throw error(409);
      for (const [id, row] of tx.writes) write(id, row);
    },
    async getRow({ rowId, transactionId }) {
      const tx = transactions.get(transactionId);
      const row = tx ? tx.writes.get(rowId) ?? tx.rows.get(rowId) : rows.get(rowId);
      if (!row) throw error(404);
      return { ...row };
    },
    async listRows({ tableId, queries, transactionId }) {
      const tx = transactions.get(transactionId);
      let result = [...(tx ? new Map([...tx.rows, ...tx.writes]) : rows).values()].filter((r) => r.table === tableId);
      const parsed = queries.map((v) => JSON.parse(v));
      for (const q of parsed) {
        if (q.method === 'equal') result = result.filter((r) => q.values.includes(r[q.attribute]));
        if (q.method === 'isNotNull') result = result.filter(r => r[q.attribute] != null);
        if (q.method === 'orderAsc') result.sort((a, b) => String(a[q.attribute]).localeCompare(String(b[q.attribute])) || a.$id.localeCompare(b.$id));
      }
      const total = result.length;
      const cursor = parsed.find(q => q.method === 'cursorAfter');
      if (cursor) {
        const index = result.findIndex(r => r.$id === cursor.values[0]);
        if (index < 0) throw error(404);
        result = result.slice(index + 1);
      }
      const limit = parsed.find(q => q.method === 'limit')?.values[0] ?? 25;
      return { rows: result.slice(0, limit).map((r) => ({ ...r })), total };
    },
    async createRow(params) {
      const { rowId, tableId, transactionId, data } = params;
      const tx = transactions.get(transactionId);
      if ((tx?.rows ?? rows).has(rowId)) throw error(409);
      const row = { ...data, table: tableId, $id: rowId };
      if (tx) tx.writes.set(rowId, row); else write(rowId, row);
      return row;
    },
    async updateRow(params) {
      const row = { ...await this.getRow(params), ...params.data };
      const tx = transactions.get(params.transactionId);
      if (tx) tx.writes.set(row.$id, row); else write(row.$id, row);
      return row;
    },
  };
  const storage = {
    async createFile({ fileId, file }) { files.set(fileId, Buffer.from(file)); },
    async getFileDownload({ fileId }) { if (!files.has(fileId)) throw error(404); return files.get(fileId); },
    async deleteFile({ fileId }) { files.delete(fileId); },
  };
  const initialFileId = crypto.randomUUID();
  write(worldId, { table: 'shared_worlds', turn: 0, revision: 0, status: 'active', phase: 'planning',
    maxNationsPerUser: 1, snapshotFileId: initialFileId, pauseWhenEmpty: true,
    planningDeadlineAt: new Date(Date.now() + 3600000).toISOString(), planningWindowSeconds: 3600 });
  files.set(initialFileId, Buffer.from(JSON.stringify(initialState)));
  for (const id of ['n01', 'n02']) write(id, { table: 'nation_controls', worldId, nationId: id,
    status: 'available', controllerUserId: null, version: 1 });
  async function request(user, action, nationId, extra) {
    return gateway({ req: { method: 'POST', headers: { 'x-appwrite-user-id': user },
      bodyJson: { worldId, action, nationId, ...extra } }, res: { json: (v) => v }, error: () => {} });
  }
  const ready = (user, id) => request(user, 'set_ready', id, { baseRevision: world().revision });
  const schedule = () => gateway({ req: { headers: { 'x-appwrite-trigger': 'schedule' } },
    res: { json: (v) => v }, error: () => {} });
  return { db, rows, world, files, initialFileId, storage, request, ready, schedule, write };
}

// The browser test bundles the production gateway with this module in place of its SDK.
export { ID, Permission, Query, Role } from 'appwrite';
export const InputFile = { fromBuffer: (data) => data };
let browserWorld;
export const services = () => browserWorld;

export async function createBrowserWorld(initialState) {
  const { build } = await import('esbuild');
  const { outputFiles } = await build({
    entryPoints: ['functions/shared-world-gateway/src/main.js'],
    platform: 'node', format: 'esm', bundle: true, write: false,
    plugins: [{ name: 'test-world-storage', setup(builder) {
      builder.onResolve({ filter: /^\.\/sdk\.js$/ }, () => ({ path: import.meta.url, external: true }));
    } }],
  });
  const { default: gateway } = await import('data:text/javascript;base64,' + Buffer.from(outputFiles[0].contents).toString('base64'));
  browserWorld = sharedWorldFixture(gateway, initialState);
  return browserWorld;
}
