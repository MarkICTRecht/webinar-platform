'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Webinar {
  id: number; title: string; description: string; status: string; date: string; created_at: string;
}

function formatDate(dateStr: string) {
  if (!dateStr) return null;
  try {
    return new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateStr));
  } catch { return null; }
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string; border: string }> = {
    aankomend: { label: 'Aankomend', bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
    live:      { label: '● Live nu', bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
    afgelopen: { label: 'Afgelopen', bg: '#F3F4F6', color: '#6B7280', border: '#D1D5DB' },
  };
  const s = map[status] ?? map.aankomend;
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border"
      style={{ background: s.bg, color: s.color, borderColor: s.border }}>
      {s.label}
    </span>
  );
}

export default function HomePage() {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/webinars').then(r => r.json()).then(data => {
      setWebinars(data);
      setLoading(false);
    });
  }, []);

  const upcoming = webinars.filter(w => w.status === 'aankomend' || w.status === 'live');
  const past = webinars.filter(w => w.status === 'afgelopen');

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF8' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #2d2d4a 55%, #753C5F 100%)' }} className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 opacity-15 rounded-full -translate-y-24 translate-x-24 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #DDA455, transparent)' }} />
        <div className="max-w-5xl mx-auto px-6 py-12 relative z-10">
          <div className="mb-8">
            <Image src="/logo.png" alt="ICTrecht" width={160} height={60} style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} priority />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Webinar Community</h1>
          <p className="text-base max-w-xl" style={{ color: '#EFD2AC' }}>
            Bekijk onze webinars, stel vragen en download de materialen. Per sessie vind je alle links, de peiling en de discussie.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">

        {loading && (
          <div className="flex justify-center py-20">
            <div className="flex gap-2 items-center" style={{ color: '#DDA455' }}>
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="10" />
              </svg>
              <span className="text-sm font-medium">Laden…</span>
            </div>
          </div>
        )}

        {/* ── Upcoming / Live ───────────────────────────────────────────── */}
        {upcoming.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 rounded-full" style={{ background: '#DDA455' }} />
              <h2 className="text-xl font-bold" style={{ color: '#1A1A2E' }}>Aankomende sessies</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {upcoming.map(w => <WebinarCard key={w.id} webinar={w} featured />)}
            </div>
          </section>
        )}

        {/* ── Past ─────────────────────────────────────────────────────── */}
        {past.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 rounded-full" style={{ background: '#753C5F' }} />
              <h2 className="text-xl font-bold" style={{ color: '#1A1A2E' }}>Eerdere sessies</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {past.map(w => <WebinarCard key={w.id} webinar={w} />)}
            </div>
          </section>
        )}

        {!loading && webinars.length === 0 && (
          <div className="text-center py-20">
            <p className="text-sm" style={{ color: '#aaa' }}>Nog geen webinars aangemaakt.</p>
            <Link href="/admin" className="mt-4 inline-block text-sm font-semibold hover:underline" style={{ color: '#DDA455' }}>
              Ga naar beheer →
            </Link>
          </div>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="mt-8 border-t py-8" style={{ borderColor: '#E8E0D8', background: '#fff' }}>
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Image src="/logo.png" alt="ICTrecht" width={110} height={42} style={{ objectFit: 'contain' }} />
          <p className="text-xs" style={{ color: '#bbb' }}>© {new Date().getFullYear()} ICTrecht Academy · Webinar Community</p>
          <Link href="/admin" className="text-xs font-medium hover:underline" style={{ color: '#DDA455' }}>Beheer →</Link>
        </div>
      </footer>
    </div>
  );
}

function WebinarCard({ webinar, featured = false }: { webinar: Webinar; featured?: boolean }) {
  const dateStr = formatDate(webinar.date);
  return (
    <Link href={`/webinar/${webinar.id}`}
      className="group block rounded-2xl border overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5"
      style={{ background: '#fff', borderColor: featured ? '#DDA455' : '#E8E0D8' }}>
      {featured && (
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #DDA455, #753C5F)' }} />
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <StatusBadge status={webinar.status} />
          {dateStr && <span className="text-xs flex-shrink-0" style={{ color: '#aaa' }}>{dateStr}</span>}
        </div>
        <h3 className="font-bold text-base leading-snug mb-2 group-hover:text-amber-700 transition-colors" style={{ color: '#1A1A2E' }}>
          {webinar.title}
        </h3>
        <p className="text-sm leading-relaxed line-clamp-2" style={{ color: '#6B6B7B' }}>{webinar.description}</p>
        <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#DDA455' }}>
          {webinar.status === 'afgelopen' ? 'Bekijk sessie' : 'Aanmelden'}
          <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
