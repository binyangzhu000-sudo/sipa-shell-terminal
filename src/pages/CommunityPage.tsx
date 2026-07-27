import { useEffect } from 'react';
import AppLayout from '@/components/layouts/AppLayout';
import { CommunityProvider } from '@/community/context/CommunityContext';
import { CommunityPanel } from '@/community/CommunityPanel';
import { useUnreadCommunityCount } from '@/community/notifications';

function ClearUnreadOnOpen() {
  const { clear } = useUnreadCommunityCount();
  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export default function CommunityPage() {
  return (
    <AppLayout title="Community">
      <ClearUnreadOnOpen />
      <CommunityProvider appSlug="shell">
        <CommunityPanel />
      </CommunityProvider>
    </AppLayout>
  );
}
