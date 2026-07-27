import { createContext, useContext, type ReactNode } from 'react';
import { useCommunityNotifications } from './useCommunityNotifications';

type NotificationsValue = {
  unread: number;
  clear: () => void;
};

const NotificationsContext = createContext<NotificationsValue>({
  unread: 0,
  clear: () => {},
});

/** Consumed by AppLayout's nav badge (desktop sidebar + mobile drawer). */
export function useUnreadCommunityCount() {
  return useContext(NotificationsContext);
}

/**
 * Mounts useCommunityNotifications() exactly ONCE, near the app root, and
 * fans the resulting unread count out via context. Must be rendered inside
 * <CommunityProvider>. Avoids every consumer (AppLayout, CommunityPage, ...)
 * opening its own duplicate postgres_changes subscription on `messages`.
 */
export function CommunityNotificationsProvider({ children }: { children: ReactNode }) {
  const { unread, clear } = useCommunityNotifications();
  return (
    <NotificationsContext.Provider value={{ unread, clear }}>
      {children}
    </NotificationsContext.Provider>
  );
}
