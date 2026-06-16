// Stub Supabase client — real auth is handled by CF Worker (Auth0)
// This keeps the build from crashing; all auth operations are no-ops.

const noop = () => {};
const noopPromise = () => Promise.resolve({ data: null, error: null });

const fakeAuth = {
  getSession: () => Promise.resolve({ data: { session: null }, error: null }),
  signInWithPassword: () => Promise.resolve({ error: new Error('Use Auth0 login') }),
  signUp: () => Promise.resolve({ error: new Error('Use Auth0 login') }),
  signOut: () => Promise.resolve({ error: null }),
  onAuthStateChange: (_event: unknown, _session: unknown) => ({
    data: { subscription: { unsubscribe: noop } },
  }),
};

const fakeQueryBuilder = {
  select: () => fakeQueryBuilder,
  eq: () => fakeQueryBuilder,
  maybeSingle: noopPromise,
  single: noopPromise,
  then: (resolve: (v: { data: null; error: null }) => void) =>
    Promise.resolve({ data: null, error: null }).then(resolve),
};

export const supabase = {
  auth: fakeAuth,
  from: (_table: string) => fakeQueryBuilder,
  storage: { from: (_bucket: string) => ({ upload: noopPromise, getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
};
