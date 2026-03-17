'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Webinar { id: number; title: string; status: string; date: string; created_at: string; }

function formatDate(d: string) {
  if (!d) return null;
  try { return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d)); }
  catch { return null; }
}

const STATUS_LABELS: Record<string, string> = { aankomend: 'Aankomend', live: 'Live', afgelopen: 'Afgelopen' };
const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  aankomend: { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
  live:      { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
  afgelopen: { bg: '#F3F4F6', color: '#6B7280', border: '#D1D5DB' },
};

export default function AdminPage() {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch('/api/webinars').then(r => r.json()).then(setWebinars);
  }, []);

  async function createWebinar() {
    setCreating(true);
    const res = await fetch('/api/webinars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Nieuw webinar', status: 'aankomend' }),
    });
    const { id } = await res.json();
    window.location.href = `/admin/webinar/${id}`;
  }

  async function deleteWebinar(id: number) {
    if (!confirm('Webinar en alle bijbehorende data verwijderen?')) return;
    await fetch(`/api/webinars/${id}`, { method: 'DELETE' });
    setWebinars(prev => prev.filter(w => w.id !== id));
  }

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF8' }}>
      {/* Topbar */}
      <div style={{ background: '#1A1A2E', borderBottom: '3px solid #DDA455' }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image src="/logo.png" alt="ICTrecht" width={110} height={42} style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            <div className="h-6 w-px" style={{ background: '#333' }} />
            <span className="text-sm font-semibold" style={{ color: '#DDA455' }}>Beheerpaneel</span>
          </div>
          <a href="/" target="_blank" className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors hover:bg-white/10"
            style={{ borderColor: '#444', color: '#ccc' }}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" /><path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" /></svg>
            Bekijk site
          </a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold" style={{ color: '#1A1A2E' }}>Webinars</h1>
          <button onClick={createWebinar} disabled={creating}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50"
            style={{ background: '#DDA455', color: '#1A1A2E' }}>
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" /></svg>
            {creating ? 'Aanmaken…' : 'Nieuw webinar'}
          </button>
        </div>

        {webinars.length === 0 && (
          <div className="text-center py-20 rounded-2xl border" style={{ background: '#fff', borderColor: '#E8E0D8' }}>
            <p className="text-sm mb-4" style={{ color: '#aaa' }}>Nog geen webinars.</p>
            <button onClick={createWebinar} className="text-sm font-semibold hover:underline" style={{ color: '#DDA455' }}>
              Maak je eerste webinar aan →
            </button>
          </div>
        )}

        <div className="space-y-3">
          {webinars.map(w => {
            const sc = STATUS_COLORS[w.status] ?? STATUS_COLORS.aankomend;
            return (
              <div key={w.id} className="flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-sm"
                style={{ background: '#fff', borderColor: '#E8E0D8' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                      style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}>
                      {STATUS_LABELS[w.status]}
                    </span>
                    {w.date && <span className="text-xs" style={{ color: '#aaa' }}>{formatDate(w.date)}</span>}
                  </div>
                  <p className="font-semibold" style={{ color: '#1A1A2E' }}>{w.title}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href={`/webinar/${w.id}`} target="_blank"
                    className="w-8 h-8 rounded-lg flex items-center justify-center border transition-colors hover:bg-gray-50"
                    style={{ borderColor: '#E8E0D8', color: '#888' }} title="Bekijk pagina">
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  </Link>
                  <Link href={`/admin/webinar/${w.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold border transition-colors hover:bg-amber-50"
                    style={{ borderColor: '#DDA455', color: '#C4883A' }}>
                    Bewerken
                    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>
                  </Link>
                  <button onClick={() => deleteWebinar(w.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border transition-colors hover:bg-red-50 hover:border-red-300"
                    style={{ borderColor: '#E8E0D8', color: '#ccc' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#ccc')}>
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" /></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
