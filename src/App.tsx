import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { Toaster } from '@/components/ui/sonner';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';
import { routes } from './routes';

const App: React.FC = () => {
  return (
    <Router>
      <IntersectObserver />
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
