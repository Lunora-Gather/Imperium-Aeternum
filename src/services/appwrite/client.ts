import { Account, Client, Functions, Realtime, Storage, TablesDB } from 'appwrite';
import { APPWRITE_CONFIG, isAppwriteConfigured } from './config';

const client = isAppwriteConfigured
  ? new Client().setEndpoint(APPWRITE_CONFIG.endpoint).setProject(APPWRITE_CONFIG.projectId)
  : null;
const realtime = client ? new Realtime(client) : null;

export function getAppwriteServices() {
  if (!client) throw new Error('Appwrite 尚未配置');
  return {
    client,
    account: new Account(client),
    storage: new Storage(client),
    tablesDB: new TablesDB(client),
    functions: new Functions(client),
    realtime: realtime!,
  };
}
