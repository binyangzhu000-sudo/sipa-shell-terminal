import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { Toaster } from '@/components/ui/sonner';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';
import { usePresence } from '@/hooks/usePresence';
import { CommunityProvider } from '@/community/context/CommunityContext';
import { CommunityNotificationsProvider } from '@/community/notifications';
import { routes } from './routes';

const App: React.FC = () => {
  // Ecosystem-wide "online" presence (community.sipa-os.org) — reuses this
  // app's existing Auth0 session, no-ops while unauthenticated. Mounted here
  // (not in AppLayout) so it survives route changes instead of
  // resubscribing on every page nav.
  usePresence();

  return (
    <Router>
      <IntersectObserver />
      {/* Cross-app unread-message badge — mounted at root (not just on
          /community) so a DM sent from another SIPA OS app surfaces here
          no matter which page the user is currently on. */}
      <CommunityProvider appSlug="shell">
        <CommunityNotificationsProvider>
          <div className="flex flex-col min-h-screen bg-background">
            <main className="flex-grow">
              <Routes>
                {routes.map((route, index) => (
                  <Route
                    key={index}
                    path={route.path}
                    element={route.element}
                  />
                ))}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </CommunityNotificationsProvider>
      </CommunityProvider>
      <PWAInstallBanner />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'hsl(0 0% 7%)',
            border: '1px solid hsl(133 30% 15%)',
            color: 'hsl(133 100% 85%)',
          },
        }}
      />
    </Router>
  );
};

export default App;
