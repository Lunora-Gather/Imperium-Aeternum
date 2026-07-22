export interface AppwriteConfig {
  endpoint: string;
  projectId: string;
  databaseId: string;
  saveTableId: string;
  saveBucketId: string;
}

export const APPWRITE_CONFIG: AppwriteConfig = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1',
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || 'imperium-aeternum',
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || 'imperium_game',
  saveTableId: import.meta.env.VITE_APPWRITE_SAVE_TABLE_ID || 'cloud_saves',
  saveBucketId: import.meta.env.VITE_APPWRITE_SAVE_BUCKET_ID || 'cloud_saves',
};

export const isAppwriteConfigured = Object.values(APPWRITE_CONFIG).every((value) => value.trim().length > 0);
