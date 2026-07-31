import { useEffect } from 'react';
import AppLayout from '@/components/layouts/AppLayout';
import { useUnreadCommunityCount } from '@/community/notifications';

const COMMUNITY_URL = 'https://community.sipa-os.org';

/**
 * Was the in-app embedded community feature (CommunityPanel) — rendered
 * with a broken, washed-out/translucent sidebar. Decision made to abandon
 * the native embed entirely. This route now just redirects (covers old
 * bookmarks/links to /community); the sidebar nav link in AppLayout now
 * points straight at the external app.
 */
export default function CommunityPage() {
  const { clear } = useUnreadCommunityCount();

  useEffect(() => {
    clear();
    window.location.replace(COMMUNITY_URL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppLayout title="Community">
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <p className="text-xs font-mono-terminal text-muted-foreground">
          Taking you to the SIPA Community app…
        </p>
        <a href={COMMUNITY_URL} className="text-xs font-mono-terminal text-primary underline">
          Click here if you're not redirected automatically
        </a>
      </div>
    </AppLayout>
  );
}
