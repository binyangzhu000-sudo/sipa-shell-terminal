// Shared SIPA ecosystem Supabase project — used ONLY for cross-app presence
// tracking (channel 'sipa-ecosystem-presence') + the user_profiles upsert.
// This is intentionally separate from src/db/supabase.ts (an unrelated stub
// kept for a different legacy flow) and does not touch this app's own
// terminal/session state or tables.
//
// Auth0 issues the JWT; Supabase (Third-Party Auth) verifies it against the
// Auth0 issuer. RLS reads auth.jwt()->>'sub', not Supabase's own auth.uid().

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://xkwuqvpjnbtwdjhvjbki.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhrd3VxdnBqbmJ0d2RqaHZqYmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNTQ5ODYsImV4cCI6MjA5MTkzMDk4Nn0.rQgyk-ozekAknTNF7xpxj2YhUFHyNfLhZmzgzFstGw0';

export const PRESENCE_CHANNEL = 'sipa-ecosystem-presence';
export const APP_SLUG = 'shell' as const;

export type PresenceState = {
  id: string;
  name: string;
  app: string;
};

export function makePresenceSupabaseClient(accessToken?: string | null): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : {},
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  });
}

// Same shared SIPA ecosystem Supabase project/client shape as above — reused
// by src/community/ (friends, DMs, channels, feed) so the app doesn't carry
// two separate Supabase client factories pointed at the same project.
export const makeSupabaseClient = makePresenceSupabaseClient;

export async function ensurePresenceProfile(
  supabase: SupabaseClient,
  userId: string,
  displayName: string
): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .upsert(
      { user_id: userId, display_name: displayName, app_slug: APP_SLUG },
      { onConflict: 'user_id' }
    );
  if (error) {
    // Non-fatal — presence tracking still works without a profile row.
    console.error('ensurePresenceProfile failed', error);
  }
}
