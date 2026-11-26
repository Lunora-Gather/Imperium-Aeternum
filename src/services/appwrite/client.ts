import { Account, Client, Functions, Realtime, TablesDB } from 'appwrite';
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
    tablesDB: new TablesDB(client),
    functions: new Functions(client),
    realtime: realtime!,
  };
}

export function storageFileUrl(bucket: string, file: string, method: 'download' | 'view') {
  const { config } = getAppwriteServices().client;
  const url = new URL(`${config.endpoint}/storage/buckets/${encodeURIComponent(bucket)}/files/${encodeURIComponent(file)}/${method}`);
  url.searchParams.set('project', config.project);
  if (config.impersonateuserid) url.searchParams.set('impersonateuserid', config.impersonateuserid);
  return url;
}
