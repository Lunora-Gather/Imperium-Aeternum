import { useAccountStore } from '../../store/accountStore';
import type * as SocialStoreModule from '../../store/socialStore';

export interface SocialNotifications {
  userId: string;
  unread: number;
  senderName?: string;
}

export function watchSocialNotifications(
  userId: string,
  notify: (value: SocialNotifications) => void,
  { latestUnreadDirectMessage, totalSocialUnread, useSocialStore, socialInboxSubscriptions }: typeof SocialStoreModule,
) {
  const store = useSocialStore.getState();
  let previous: SocialNotifications | undefined;
  function publish(state: typeof store) {
    const unread = totalSocialUnread(state, userId);
    const senderName = unread ? latestUnreadDirectMessage(state.directMessages, state.unreadDirect, userId)?.senderName : undefined;
    if (previous?.unread === unread && previous.senderName === senderName) return;
    previous = { userId, unread, senderName };
    notify(previous);
  }
  const unsubscribe = useSocialStore.subscribe(publish);
  publish(store);

  let stopped = false;
  const subscriptions = socialInboxSubscriptions(userId);
  const connections = new Map<typeof subscriptions[number], Promise<() => Promise<void>>>();
  function refresh() {
    if (useAccountStore.getState().user?.$id !== userId) return;
    void store.initialize();
    for (const subscribe of subscriptions) {
      if (connections.has(subscribe)) continue;
      const request = subscribe();
      connections.set(subscribe, request);
      void request.catch(() => { connections.delete(subscribe); });
    }
  }
  refresh();
  window.addEventListener('online', refresh);
  return () => {
    if (stopped) return;
    stopped = true;
    unsubscribe();
    window.removeEventListener('online', refresh);
    for (const request of connections.values()) void request.then(close => close()).catch(() => undefined);
  };
}
