import { useEffect, useRef, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  makePresenceSupabaseClient,
  ensurePresenceProfile,
  PRESENCE_CHANNEL,
  APP_SLUG,
  type PresenceState,
} from '@/lib/supabasePresence';

/**
 * Ecosystem-wide "online" presence for SIPA OS (community.sipa-os.org reads
 * this same channel). Reuses this app's existing Auth0 session — does not
 * create a new login flow. No-ops entirely while the user isn't authenticated.
 */
export function usePresence() {
  const { isAuthenticated, isLoading, user, getAccessTokenSilently } = useAuth0();
  const [online, setOnline] = useState<Record<string, PresenceState>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user?.sub) return;

    let cancelled = false;

    (async () => {
      let token: string | null = null;
      try {
        token = await getAccessTokenSilently();
      } catch {
        // Fall back to an unauthenticated client — presence tracking still
        // works for read/broadcast; RLS-gated upsert may be rejected, which
        // ensurePresenceProfile already handles as non-fatal.
      }
      if (cancelled) return;

      const supabase = makePresenceSupabaseClient(token);
      const displayName = (user.name as string) || (user.email as string) || user.sub!.slice(0, 12);

      await ensurePresenceProfile(supabase, user.sub!, displayName);
      if (cancelled) return;

      const channel = supabase.channel(PRESENCE_CHANNEL, {
        config: { presence: { key: user.sub! } },
      });
      channelRef.current = channel;

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState<PresenceState>();
          const flat: Record<string, PresenceState> = {};
          for (const key of Object.keys(state)) {
            const entries = state[key];
            if (entries?.[0]) flat[key] = entries[0];
          }
          setOnline(flat);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ id: user.sub, name: displayName, app: APP_SLUG });
          }
        });
    })();

    return () => {
      cancelled = true;
      channelRef.current?.unsubscribe();
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated, user?.sub]);

  return { online, onlineCount: Object.keys(online).length };
}
