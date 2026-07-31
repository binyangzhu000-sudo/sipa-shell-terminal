// GitHubButton — 3 variants: signin | install | star
// signin: Auth0 loginWithRedirect with connection=github
// install: GitHub Marketplace sipa-neuropower
// star: Soul-In-PsyAbstract org

import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import GitHubInvertocat from './GitHubInvertocat';

const GITHUB_MARKETPLACE_URL = 'https://github.com/marketplace/sipa-neuropower';
const GITHUB_ORG_URL = 'https://github.com/Soul-In-PsyAbstract';

const BASE =
  'inline-flex items-center gap-2 rounded-md font-semibold ' +
  'transition-all duration-200 focus:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-white focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed select-none';

const STYLES = {
  signin: {
    btn: 'px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 hover:border-zinc-500 active:scale-[0.98]',
    icon: 18,
    label: 'Continue with GitHub',
  },
  install: {
    btn: 'px-4 py-2 text-sm bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-600 hover:border-zinc-400 active:scale-[0.98]',
    icon: 18,
    label: 'Install on GitHub',
  },
  star: {
    btn: 'px-3 py-1.5 text-xs bg-zinc-800 hover:bg-yellow-500/10 text-zinc-300 hover:text-yellow-400 border border-zinc-700 hover:border-yellow-500/40 active:scale-[0.98]',
    icon: 15,
    label: '★  Star on GitHub',
  },
} as const;

type Variant = keyof typeof STYLES;

interface GitHubButtonProps {
  variant: Variant;
  className?: string;
  returnTo?: string;
  label?: string;
}

const GitHubButton: React.FC<GitHubButtonProps> = ({ variant, className = '', returnTo, label }) => {
  const { loginWithRedirect, isLoading } = useAuth0();
  const cfg = STYLES[variant];
  const text = label ?? cfg.label;

  if (variant === 'signin') {
    return (
      <button
        type="button"
        disabled={isLoading}
        onClick={() => loginWithRedirect({
          authorizationParams: { connection: 'github' },
          appState: returnTo ? { returnTo } : undefined,
        })}
        className={`${BASE} ${cfg.btn} ${className}`}
        aria-label="Sign in with GitHub"
      >
        <GitHubInvertocat size={cfg.icon} aria-hidden="true" />
        <span>{isLoading ? 'Redirecting...' : text}</span>
      </button>
    );
  }

  const href = variant === 'install' ? GITHUB_MARKETPLACE_URL : GITHUB_ORG_URL;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${BASE} ${cfg.btn} ${className}`}
      aria-label={variant === 'install' ? 'Install SIPA NeuroPower on GitHub Marketplace' : 'Star on GitHub'}
    >
      <GitHubInvertocat size={cfg.icon} aria-hidden="true" />
      <span>{text}</span>
    </a>
  );
};

export default GitHubButton;
