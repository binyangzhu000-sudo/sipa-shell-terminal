import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
// Reuses this app's existing shared-Supabase client factory (added earlier
// for ecosystem presence) instead of duplicating a second one — same
// project, same 'sipa-ecosystem-presence' channel.
import { makeSupabaseClient, PRESENCE_CHANNEL, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabasePresence';
import { ensureProfile } from '../lib/profiles';
import { PresenceState, SipaApp, UserProfile } from '../lib/types';

/**
 * Embeddable community context — does NOT create its own Auth0Provider.
 * Must be rendered inside a tree that already has one (every SIPA OS app
 * already wraps itself in Auth0Provider; this just reads that session).
 */
type CommunityContextValue = {
  loading: boolean;
  isAuthenticated: boolean;
  profile: UserProfile | null;
  supabase: SupabaseClient | null;
  online: Record<string, PresenceState>;
  login: () => void;
};

const CommunityContext = createContext<CommunityContextValue | null>(null);

export function useCommunity() {
  const ctx = useContext(CommunityContext);
  if (!ctx) throw new Error('useCommunity must be used within CommunityProvider');
  return ctx;
}

export function CommunityProvider({
  appSlug,
  children,
}: {
  appSlug: SipaApp;
  children: ReactNode;
}) {
  const {
    isAuthenticated,
    isLoading: auth0Loading,
    user,
    getAccessTokenSilently,
    loginWithRedirect,
  } = useAuth0();

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState<Record<string, PresenceState>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (auth0Loading) return;

    if (!isAuthenticated || !user?.sub) {
      setReady(true);
      return;
    }

    let cancelled = false;

    (async () => {
      const token = await getAccessTokenSilently();
      if (cancelled) return;
      tokenRef.current = token;

      const client = makeSupabaseClient(token);
      setSupabase(client);

      const displayName =
        (user.name as string) || (user.email as string) || user.sub!.slice(0, 12);
      const p = await ensureProfile(client, user.sub!, displayName, appSlug);
      if (cancelled) return;
      setProfile(p);

      const channel = client.channel(PRESENCE_CHANNEL, {
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
            await channel.track({ id: user.sub, name: displayName, app: appSlug });
          }
        });

      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth0Loading, isAuthenticated, user?.sub, appSlug]);

  useEffect(() => {
    return () => {
      channelRef.current?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function markLastSeen() {
      const userId = profile?.user_id;
      const token = tokenRef.current;
      if (!userId || !token) return;
      const url = `${SUPABASE_URL}/rest/v1/user_profiles?user_id=eq.${encodeURIComponent(userId)}`;
      fetch(url, {
        method: 'PATCH',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ last_seen: new Date().toISOString() }),
      }).catch(() => {});
    }
    window.addEventListener('pagehide', markLastSeen);
    return () => window.removeEventListener('pagehide', markLastSeen);
  }, [profile?.user_id]);

  const value: CommunityContextValue = {
    loading: auth0Loading || !ready,
    isAuthenticated,
    profile,
    supabase,
    online,
    login: () => loginWithRedirect(),
  };

  return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>;
}
