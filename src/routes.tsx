import type { ReactNode } from 'react';
import LandingPage from './pages/LandingPage';
import CallbackPage from './pages/CallbackPage';
import ShellPage from './pages/ShellPage';
import { OperatorGate } from './components/OperatorGate';
import AiPage from './pages/AiPage';
import ConnectPage from './pages/ConnectPage';
import FindDevicePage from './pages/FindDevicePage';
import SettingsPage from './pages/SettingsPage';
import SupportPage from './pages/SupportPage';
import SubscriptionPage from './pages/SubscriptionPage';
import FaqPage from './pages/FaqPage';
import TermsPage from './pages/TermsPage';
import PolicyPage from './pages/PolicyPage';
import MissionPage from './pages/MissionPage';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  public?: boolean;
}

export const routes: RouteConfig[] = [
  {
    name: 'Home',
    path: '/',
    element: <LandingPage />,
    public: true,
    visible: true,
  },
  {
    name: 'Callback',
    path: '/callback',
    element: <CallbackPage />,
    public: true,
    visible: false,
  },
  {
    name: 'Terminal',
    path: '/shell',
    element: <OperatorGate><ShellPage /></OperatorGate>,
    public: true,
    visible: false,
  },
  {
    name: 'AI Assistant',
    path: '/ai',
    element: <AiPage />,
    public: true,
    visible: true,
  },
  {
    name: 'Connect',
    path: '/connect',
    element: <ConnectPage />,
    public: true,
    visible: true,
  },
  {
    name: 'Find Devices',
    path: '/find-device',
    element: <FindDevicePage />,
    public: true,
    visible: false,
  },
  {
    name: 'Settings',
    path: '/settings',
    element: <SettingsPage />,
    public: true,
    visible: true,
  },
  {
    name: 'Support',
    path: '/support',
    element: <SupportPage />,
    public: true,
    visible: true,
  },
  {
    name: 'Subscription',
    path: '/subscription',
    element: <SubscriptionPage />,
    public: true,
    visible: true,
  },
  {
    name: 'FAQ',
    path: '/faq',
    element: <FaqPage />,
    public: true,
    visible: true,
  },
  {
    name: 'Terms',
    path: '/terms',
    element: <TermsPage />,
    public: true,
    visible: false,
  },
  {
    name: 'Privacy Policy',
    path: '/policy',
    element: <PolicyPage />,
    public: true,
    visible: false,
  },
  {
    name: 'Mission',
    path: '/mission',
    element: <MissionPage />,
    public: true,
    visible: false,
  },
];
