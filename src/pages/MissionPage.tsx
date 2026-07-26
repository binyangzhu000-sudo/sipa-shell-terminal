import React from 'react';
import { Target } from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';
import { Link } from 'react-router-dom';

interface Pillar {
  tag: string;
  title: string;
  body: React.ReactNode;
}

const PILLARS: Pillar[] = [
  {
    tag: '01 — PRODUCT',
    title: 'Cognitive infrastructure for neurodivergent minds',
    body: (
      <>
        1.2 billion+ people worldwide are neurodivergent, and most tools are built for
        neurotypical cognition. SIPA OS builds systems from the inside of ADHD, BPD, and
        aphantasia — structure engines, crisis protocols, and cognitive scaffolding across a
        real product ecosystem (Focus, SIPA AI, Neuropower, Shell).
      </>
    ),
  },
  {
    tag: '02 — FOUNDATION',
    title: 'ArtSafe Initiative — at-risk girls, Eilat',
    body: (
      <>
        Eilat is not a suburb. It's a border — 340 km from Beer-Sheva, with 1,200+ girls aged
        14–21 and not a single specialized structure in the city for at-risk youth. ArtSafe is
        a therapeutic-educational-community model on three pillars (art therapy, UV art,
        psychosocial support) with a SIPA OS technology layer. Currently in the NGO
        registration stage in Israel.{' '}
        <a
          href="https://neuropower.sipa-os.org/mission"
          className="text-primary hover:underline"
        >
          Read the full ArtSafe Initiative page →
        </a>
      </>
    ),
  },
];

export default function MissionPage() {
  return (
    <AppLayout title="Mission">
      <div className="p-4 md:p-6 space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <Target size={20} className="text-primary" />
          <h1 className="font-mono-terminal text-lg font-bold text-primary text-glow-green">
            Mission
          </h1>
        </div>

        <div className="glass-panel border border-border p-4">
          <p className="font-mono-terminal text-xs text-muted-foreground">
            Last updated: July 26, 2026
          </p>
        </div>

        <div className="space-y-6">
          {PILLARS.map(p => (
            <div key={p.tag} className="glass-panel border border-primary/20 bg-primary/5 p-5 space-y-2">
              <p className="font-mono-terminal text-[10px] tracking-wider text-primary/70">
                {p.tag}
              </p>
              <h2 className="font-mono-terminal text-sm font-semibold text-primary">
                {p.title}
              </h2>
              <p className="font-mono-terminal text-xs text-muted-foreground leading-relaxed">
                {p.body}
              </p>
            </div>
          ))}
        </div>

        <div className="glass-panel border border-border p-4">
          <p className="font-mono-terminal text-xs italic text-muted-foreground">
            Chaos non cadit in ordinationem sine intellectu.
            <br />
            Chaos does not fall into order without understanding.
          </p>
        </div>

        <p className="font-mono-terminal text-xs text-muted-foreground text-center">
          See also:{' '}
          <Link to="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>
          {' '}·{' '}
          <Link to="/policy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          {' '}·{' '}
          <Link to="/support" className="text-primary hover:underline">
            Support
          </Link>
          {' '}·{' '}
          <Link to="/faq" className="text-primary hover:underline">
            FAQ
          </Link>
        </p>
      </div>
    </AppLayout>
  );
}
