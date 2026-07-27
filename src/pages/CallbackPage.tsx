import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

export default function CallbackPage() {
  const { isLoading } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) navigate('/connect', { replace: true });
  }, [isLoading, navigate]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0a] font-mono text-xs text-[#00ff41]">
      ◆ SIPA SHELL · Signing in...
    </div>
  );
}
