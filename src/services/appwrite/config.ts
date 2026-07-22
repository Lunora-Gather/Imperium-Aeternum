export interface AppwriteConfig {
  endpoint: string;
  projectId: string;
  databaseId: string;
  saveTableId: string;
  saveBucketId: string;
  worldTableId: string;
  worldMembershipTableId: string;
  nationControlTableId: string;
  worldCommandTableId: string;
  worldSnapshotBucketId: string;
  worldGatewayFunctionId: string;
  profileTableId: string;
  friendshipTableId: string;
  worldMessageTableId: string;
  socialGatewayFunctionId: string;
}

export const APPWRITE_CONFIG: AppwriteConfig = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1',
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || 'imperium-aeternum',
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || 'imperium_game',
  saveTableId: import.meta.env.VITE_APPWRITE_SAVE_TABLE_ID || 'cloud_saves',
  saveBucketId: import.meta.env.VITE_APPWRITE_SAVE_BUCKET_ID || 'cloud_saves',
  worldTableId: import.meta.env.VITE_APPWRITE_WORLD_TABLE_ID || 'shared_worlds',
  worldMembershipTableId: import.meta.env.VITE_APPWRITE_WORLD_MEMBERSHIP_TABLE_ID || 'world_memberships',
  nationControlTableId: import.meta.env.VITE_APPWRITE_NATION_CONTROL_TABLE_ID || 'nation_controls',
  worldCommandTableId: import.meta.env.VITE_APPWRITE_WORLD_COMMAND_TABLE_ID || 'world_commands',
  worldSnapshotBucketId: import.meta.env.VITE_APPWRITE_WORLD_SNAPSHOT_BUCKET_ID || 'world_snapshots',
  worldGatewayFunctionId: import.meta.env.VITE_APPWRITE_WORLD_GATEWAY_FUNCTION_ID || 'shared-world-gateway',
  profileTableId: import.meta.env.VITE_APPWRITE_PROFILE_TABLE_ID || 'game_profiles',
  friendshipTableId: import.meta.env.VITE_APPWRITE_FRIENDSHIP_TABLE_ID || 'friendships',
  worldMessageTableId: import.meta.env.VITE_APPWRITE_WORLD_MESSAGE_TABLE_ID || 'world_messages',
  socialGatewayFunctionId: import.meta.env.VITE_APPWRITE_SOCIAL_GATEWAY_FUNCTION_ID || 'social-gateway',
};

export const isAppwriteConfigured = Object.values(APPWRITE_CONFIG).every((value) => value.trim().length > 0);
