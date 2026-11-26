import { randomUUID } from 'node:crypto';
import { build } from 'esbuild';

export const rows = new Map();
export const files = new Map();
const transactions = new Map();

// The real function handler and its transaction policy run against this in-memory SDK.
export class Client {
  setEndpoint() {
    return this;
  }
  setProject() {
    return this;
  }
  setKey() {
    return this;
  }
}

export class TablesDB {
  async getRow({ rowId }) {
    if (!rows.has(rowId)) throw Object.assign(new Error('Missing row'), { code: 404 });
    return rows.get(rowId);
  }
  async createTransaction() {
    const id = randomUUID();
    transactions.set(id, null);
    return { $id: id };
  }
  async upsertRow({ transactionId, rowId, data }) {
    const row = { $id: rowId, ...data };
    transactions.set(transactionId, row);
    return row;
  }
  async updateTransaction({ transactionId, commit }) {
    if (!transactions.has(transactionId)) throw new Error('Unknown transaction');
    const row = transactions.get(transactionId);
    if (commit && row) rows.set(row.$id, row);
    transactions.delete(transactionId);
  }
}

export class Storage {
  async createFile({ fileId, file }) {
    files.set(fileId, file.toString('utf8'));
    return { $id: fileId };
  }
  async deleteFile({ fileId }) {
    files.delete(fileId);
  }
}

export const ID = { unique: randomUUID };
export const Role = { user: (id) => 'user:' + id };
export const Permission = { read: (role) => 'read(' + role + ')' };
export const InputFile = { fromBuffer: (bytes) => bytes };

export async function loadCloudGateway() {
  const bundle = await build({
    entryPoints: ['functions/cloud-save-gateway/src/main.js'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    write: false,
    plugins: [
      {
        name: 'in-memory-appwrite',
        setup(builder) {
          builder.onResolve({ filter: /^node-appwrite(?:\/file)?$/ }, () => ({
            path: import.meta.url,
            external: true,
          }));
        },
      },
    ],
  });
  const source = Buffer.from(bundle.outputFiles[0].contents).toString('base64');
  return (await import('data:text/javascript;base64,' + source)).default;
}
