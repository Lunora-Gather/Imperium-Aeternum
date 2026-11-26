import { Client, Storage, TablesDB } from 'node-appwrite';
export { ID, Permission, Query, Role } from 'node-appwrite';
export { InputFile } from 'node-appwrite/file';

export function services(req) {
  const client = new Client().setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT).setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID).setKey(req.headers['x-appwrite-key']);
  return { db: new TablesDB(client), storage: new Storage(client) };
}
