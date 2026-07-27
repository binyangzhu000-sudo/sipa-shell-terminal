import { useEffect, useState } from 'react';
import { useCommunity } from './context/CommunityContext';
import { Sidebar, View } from './components/Sidebar';
import { ChannelView } from './components/ChannelView';
import { DMView } from './components/DMView';
import { FeedView } from './components/FeedView';
import { ProfileView } from './components/ProfileView';
import { Conversation, Friendship, UserProfile } from './lib/types';
import { listFriendships, respondToRequest, sendFriendRequest } from './lib/friends';

/**
 * Embeddable community page body — mount this at a /community route inside
 * any SIPA OS app. Must be rendered inside <CommunityProvider appSlug="...">,
 * which itself must be inside the host app's existing Auth0Provider.
 *
 * This does NOT render a login screen — the host app is expected to already
 * gate this route behind its own auth (same pattern as any other protected
 * route in that app).
 */
export function CommunityPanel() {
  const { loading, isAuthenticated, supabase, profile, login } = useCommunity();
  const [channels, setChannels] = useState<Conversation[]>([]);
  const [people, setPeople] = useState<UserProfile[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [view, setView] = useState<View>({ tab: 'feed' });

  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const { data: convos } = await supabase
        .from('conversations')
        .select('*')
        .eq('type', 'channel')
        .order('created_at', { ascending: true });
      if (convos) setChannels(convos as Conversation[]);

      const { data: profiles } = await supabase.from('user_profiles').select('*');
      if (profiles) setPeople((profiles as UserProfile[]).filter((p) => p.user_id !== profile?.user_id));

      if (profile?.user_id) {
        setFriendships(await listFriendships(supabase, profile.user_id));
      }
    })();
  }, [supabase, profile?.user_id]);

  useEffect(() => {
    if (!supabase || !profile?.user_id) return;
    const channel = supabase
      .channel(`friendships-${profile.user_id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendships' },
        async () => {
          setFriendships(await listFriendships(supabase, profile.user_id));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, profile?.user_id]);

  async function handleAddFriend(p: UserProfile) {
    if (!supabase || !profile?.user_id) return;
    await sendFriendRequest(supabase, profile.user_id, p.user_id);
    setFriendships(await listFriendships(supabase, profile.user_id));
  }

  async function handleRespondRequest(friendshipId: string, accept: boolean) {
    if (!supabase || !profile?.user_id) return;
    await respondToRequest(supabase, friendshipId, accept);
    setFriendships(await listFriendships(supabase, profile.user_id));
  }

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center text-muted text-sm">Loading community…</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-center">
        <p className="text-muted text-sm">Sign in to see who else is building in SIPA OS.</p>
        <button onClick={login} className="bg-accent text-white px-6 py-2.5 text-sm hover:opacity-85">
          Sign in →
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] min-h-[500px] border border-border bg-bg text-white font-mono">
      <Sidebar
        channels={channels}
        people={people}
        friendships={friendships}
        view={view}
        onSelectFeed={() => setView({ tab: 'feed' })}
        onSelectChannel={(c) => setView({ tab: 'channel', conversationId: c.id })}
        onSelectPerson={(p) => setView({ tab: 'dm', conversationId: '', withProfile: p })}
        onSelectProfile={() => setView({ tab: 'profile' })}
        onAddFriend={handleAddFriend}
        onRespondRequest={handleRespondRequest}
      />
      {view.tab === 'feed' && <FeedView />}
      {view.tab === 'channel' &&
        (() => {
          const c = channels.find((c) => c.id === view.conversationId);
          return c ? <ChannelView conversation={c} /> : null;
        })()}
      {view.tab === 'dm' && <DMView withProfile={view.withProfile} />}
      {view.tab === 'profile' && <ProfileView />}
    </div>
  );
}
