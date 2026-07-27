import { useEffect, useState } from 'react';
import { useCommunity } from './context/CommunityContext';
import { Message } from './lib/types';

/**
 * Mount this ONCE near the root of each host app (alongside the presence
 * hook), independent of whether the /community route is currently open.
 * Gives a live "someone messaged you" signal no matter which SIPA OS app
 * the recipient is sitting in — this is the cross-domain notification
 * piece that a plain presence channel does NOT provide.
 *
 * Returns the running unread count; call `clear()` when the user opens
 * their DM/community view to reset it (does not mark server-side read
 * state — that's a v2 concern, this is just a live "you have mail" signal).
 */
export function useCommunityNotifications() {
  const { supabase, profile } = useCommunity();
  const [unread, setUnread] = useState(0);
  const [latest, setLatest] = useState<Message | null>(null);

  useEffect(() => {
    if (!supabase || !profile?.user_id) return;

    const myId = profile.user_id;
    let myConversationIds = new Set<string>();

    let cancelled = false;

    (async () => {
      const { data: convos } = await supabase
        .from('conversations')
        .select('id, participants')
        .contains('participants', [myId]);
      if (cancelled) return;
      if (convos) {
        myConversationIds = new Set(convos.map((c: { id: string }) => c.id));
      }
    })();

    const channel = supabase
      .channel(`notify-${myId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_id === myId) return;
          if (!myConversationIds.has(msg.conversation_id)) return;
          setUnread((n) => n + 1);
          setLatest(msg);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversations' },
        (payload) => {
          const c = payload.new as { id: string; participants: string[] };
          if (c.participants?.includes(myId)) {
            myConversationIds.add(c.id);
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase, profile?.user_id]);

  return {
    unread,
    latest,
    clear: () => setUnread(0),
  };
}
