import { useState, type ReactNode } from 'react';

const OP_TOKEN = 'd2aeb7f4c851170f65f39bdcaa4d4a73';
const OP_USER = 'sipa';
// SHA-256 of the operator password — password itself is never in the bundle
const OP_PASS_HASH = '5c227343811e39bcc74ecf4f018419438074c7bff9be059f43a27743e744bfe1';
const STORAGE_KEY = 'sipa_op_auth';

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function setOperatorToken() {
  localStorage.setItem(STORAGE_KEY, OP_TOKEN);
}

export function getOperatorToken(): string {
  return localStorage.getItem(STORAGE_KEY) || '';
}

export function clearOperatorToken() {
  localStorage.removeItem(STORAGE_KEY);
}

export function OperatorGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(() => localStorage.getItem(STORAGE_KEY) === OP_TOKEN);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  if (authed) return <>{children}</>;

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const hash = await sha256(pass);
    if (user === OP_USER && hash === OP_PASS_HASH) {
      setOperatorToken();
      setAuthed(true);
    } else {
      setErr('Invalid credentials');
      setPass('');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0a]">
      <form onSubmit={login} className="w-full max-w-xs border border-[#1a1a1a] bg-[#111] p-8 font-mono">
        <p className="mb-6 text-xs text-[#00ff41]">◆ SIPA SHELL · OPERATOR AUTH</p>
        <div className="mb-3">
          <label className="mb-1 block text-xs text-gray-500">LOGIN</label>
          <input
            value={user}
            onChange={e => setUser(e.target.value)}
            autoFocus
            autoComplete="username"
            className="w-full border border-[#222] bg-[#0a0a0a] px-3 py-2 text-sm text-[#e8e8e8] outline-none focus:border-[#00ff41]"
          />
        </div>
        <div className="mb-4">
          <label className="mb-1 block text-xs text-gray-500">PASSWORD</label>
          <input
            type="password"
            value={pass}
            onChange={e => setPass(e.target.value)}
            autoComplete="current-password"
            className="w-full border border-[#222] bg-[#0a0a0a] px-3 py-2 text-sm text-[#e8e8e8] outline-none focus:border-[#00ff41]"
          />
        </div>
        {err && <p className="mb-3 text-xs text-red-400">{err}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#00ff41] py-2 text-xs font-bold text-black hover:bg-[#00cc33] disabled:opacity-50"
        >
          {loading ? '...' : 'ENTER →'}
        </button>
      </form>
    </div>
  );
}
