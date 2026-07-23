export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

export interface GameProfile {
  id: string;
  userId: string;
  displayName: string;
  friendCode: string;
  createdAt: string;
  lastSeenAt: string;
}

export interface Friendship {
  id: string;
  pairKey: string;
  requesterId: string;
  addresseeId: string;
  requesterName: string;
  addresseeName: string;
  status: FriendshipStatus;
  createdAt: string;
  respondedAt: string | null;
}

export interface WorldChatMessage {
  id: string;
  worldId: string;
  userId: string;
  displayName: string;
  nationId: string | null;
  body: string;
  kind: 'text' | 'image';
  mediaFileId: string | null;
  mediaMime: string | null;
  createdAt: string;
}

export interface DirectMessage {
  id: string;
  conversationKey: string;
  senderId: string;
  recipientId: string;
  senderName: string;
  body: string;
  kind: 'text' | 'image';
  mediaFileId: string | null;
  mediaMime: string | null;
  createdAt: string;
}
