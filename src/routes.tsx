import type { ReactNode } from 'react';
import LandingPage from './pages/LandingPage';
import ShellPage from './pages/ShellPage';
import AiPage from './pages/AiPage';
import ConnectPage from './pages/ConnectPage';
import FindDevicePage from './pages/FindDevicePage';
import SettingsPage from './pages/SettingsPage';
import DocsPage from './pages/DocsPage';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  public?: boolean;
}

export const routes: RouteConfig[] = [
  {
    name: '首页',
    path: '/',
    element: <LandingPage />,
    public: true,
    visible: true,
  },
  {
    name: '终端',
    path: '/shell',
    element: <ShellPage />,
    public: true,
    visible: true,
  },
  {
    name: 'AI 助手',
    path: '/ai',
    element: <AiPage />,
    public: true,
    visible: true,
  },
  {
    name: 'SSH 连接',
    path: '/connect',
    element: <ConnectPage />,
    public: true,
    visible: true,
  },
  {
    name: '查找设备',
    path: '/find-device',
    element: <FindDevicePage />,
    public: true,
    visible: true,
  },
  {
    name: '设置',
    path: '/settings',
    element: <SettingsPage />,
    public: true,
    visible: true,
  },
  {
    name: '文档',
    path: '/docs',
    element: <DocsPage />,
    public: true,
    visible: true,
  },
];
