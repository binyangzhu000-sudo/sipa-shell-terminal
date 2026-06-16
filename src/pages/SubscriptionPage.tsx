import React from 'react';
import { Check, Lock, Zap, Building2, CreditCard } from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLang } from '@/contexts/LangContext';

// ⚠️ ПЛАТЁЖНЫЕ ССЫЛКИ — НЕ УДАЛЯТЬ
const NOWPAYMENTS_URL = 'https://nowpayments.io/payment/?iid=4954740232';
const PAYPAL_URL = 'https://paypal.me/SoulInPsyAbstract';

interface PlanFeature { text: string; available: boolean; }

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: PlanFeature[];
  payments: { label: string; url: string; primary?: boolean }[];
  highlighted?: boolean;
  icon: React.FC<{ size?: number; className?: string }>;
}


export default function SubscriptionPage() {
  const { t } = useLang();

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Everything you need to get started with SIPA Shell.',
      icon: Zap,
      features: [
        { text: '1 saved device', available: true },
        { text: 'Basic SSH terminal', available: true },
        { text: '50 AI queries / month', available: true },
        { text: 'WebSocket proxy access', available: true },
        { text: 'localStorage device storage', available: true },
        { text: 'Multiple devices', available: false },
        { text: 'Priority support', available: false },
        { text: 'API access', available: false },
      ],
      payments: [{ label: t('sub.free_cta'), url: '/shell', primary: true }],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$9',
      period: 'per month',
      description: 'For power users and solo professionals who live in the terminal.',
      icon: CreditCard,
      highlighted: true,
      features: [
        { text: 'Unlimited saved devices', available: true },
        { text: 'Full SSH terminal', available: true },
        { text: 'Unlimited AI queries', available: true },
        { text: 'AI context injection', available: true },
        { text: 'Priority email support', available: true },
        { text: 'Early access to new features', available: true },
        { text: 'Team features', available: false },
        { text: 'SLA guarantee', available: false },
      ],
      payments: [
        { label: t('sub.pro_cta'), url: NOWPAYMENTS_URL, primary: true },
        { label: 'PayPal $9', url: `${PAYPAL_URL}/9` },
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$29',
      period: 'per month',
      description: 'For teams that need collaboration, API access, and uptime guarantees.',
      icon: Building2,
      features: [
        { text: 'Unlimited saved devices', available: true },
        { text: 'Full SSH terminal', available: true },
        { text: 'Unlimited AI queries', available: true },
        { text: 'Team device management', available: true },
        { text: 'REST API access', available: true },
        { text: 'SLA: 99.9% uptime', available: true },
        { text: 'Dedicated support channel', available: true },
        { text: 'Custom integrations', available: true },
      ],
      payments: [
        { label: t('sub.pro_cta'), url: NOWPAYMENTS_URL, primary: true },
        { label: 'PayPal $29', url: `${PAYPAL_URL}/29` },
        { label: t('sub.ent_cta'), url: 'mailto:sipa-core@sipa-os.org?subject=Enterprise%20Plan%20SIPA%20Shell' },
      ],
    },
  ];

  return (
    <AppLayout title={t('sub.title')}>
      <div className="p-4 md:p-6 max-w-5xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-mono-terminal text-xl font-bold text-primary text-glow-green">
            // {t('sub.title')}
          </h1>
          <p className="font-mono-terminal text-sm text-muted-foreground">
            {t('sub.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map(plan => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={cn(
                  'glass-panel border p-6 flex flex-col gap-4 relative',
                  plan.highlighted ? 'border-primary/50 bg-primary/5' : 'border-border'
                )}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="font-mono-terminal text-xs px-3 py-0.5 bg-primary text-primary-foreground glow-green-sm">
                      {t('sub.popular')}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className={cn('w-9 h-9 flex items-center justify-center border',
                    plan.highlighted ? 'border-primary/40 bg-primary/10' : 'border-border bg-card/50')}>
                    <Icon size={16} className={plan.highlighted ? 'text-primary' : 'text-muted-foreground'} />
                  </div>
                  <div>
                    <p className="font-mono-terminal text-sm font-bold text-foreground">{plan.name}</p>
                    <p className="font-mono-terminal text-xs text-muted-foreground">{plan.description}</p>
                  </div>
                </div>

                <div>
                  <span className={cn('font-mono-terminal text-3xl font-bold',
                    plan.highlighted ? 'text-primary text-glow-green' : 'text-foreground')}>
                    {plan.price}
                  </span>
                  <span className="font-mono-terminal text-xs text-muted-foreground ml-1">{plan.period}</span>
                </div>

                <ul className="space-y-2 flex-1">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2">
                      {feat.available
                        ? <Check size={13} className="text-primary shrink-0" />
                        : <Lock size={13} className="text-muted-foreground/40 shrink-0" />}
                      <span className={cn('font-mono-terminal text-xs',
                        feat.available ? 'text-foreground' : 'text-muted-foreground/50')}>
                        {feat.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col gap-2">
                  {plan.payments.map((p, i) => {
                    const isInternal = p.url.startsWith('/');
                    const cls = cn(
                      'w-full h-9 font-mono-terminal text-sm text-center flex items-center justify-center rounded border transition-colors',
                      p.primary
                        ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90 glow-green-sm'
                        : 'bg-transparent text-muted-foreground border-border hover:border-primary hover:text-primary'
                    );
                    return isInternal ? (
                      <Link key={i} to={p.url} className={cls}>{p.label}</Link>
                    ) : (
                      <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" className={cls}>
                        {p.label}
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <p className="font-mono-terminal text-xs text-muted-foreground text-center">
          {t('sub.footer')}{' '}
          <a href="mailto:sipa-core@sipa-os.org" className="text-primary hover:underline">
            sipa-core@sipa-os.org
          </a>
        </p>
      </div>
    </AppLayout>
  );
}
