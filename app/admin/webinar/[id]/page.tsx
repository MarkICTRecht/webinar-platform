'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Webinar { id: number; title: string; description: string; status: string; cta_link: string; recording_link: string; date: string; }
interface Resource { id: number; title: string; url: string; description: string; sort_order: number; }
interface Poll { id: number; question: string; active: number; options: { id: number; text: string; votes: number }[]; totalVotes: number; }
interface AdminComment { id: number; parent_id: number | null; name: string; content: string; likes: number; hidden: number; pinned: number; created_at: string; parent_name?: string; }

// ─── Shared UI ────────────────────────────────────────────────────────────────
function FieldInput({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold mb-1.5" style={{ color: '#4A4A5A' }}>{label}</span>
      <input {...props} className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
        style={{ borderColor: '#E8E0D8', color: '#1A1A2E', background: '#FAFAF8' }}
        onFocus={e => { e.target.style.borderColor = '#DDA455'; e.target.style.background = '#fff'; }}
        onBlur={e => { e.target.style.borderColor = '#E8E0D8'; e.target.style.background = '#FAFAF8'; }} />
    </label>
  );
}
function FieldTextarea({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold mb-1.5" style={{ color: '#4A4A5A' }}>{label}</span>
      <textarea {...props} rows={props.rows ?? 3} className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none resize-none transition-colors"
        style={{ borderColor: '#E8E0D8', color: '#1A1A2E', background: '#FAFAF8' }}
        onFocus={e => { e.target.style.borderColor = '#DDA455'; e.target.style.background = '#fff'; }}
        onBlur={e => { e.target.style.borderColor = '#E8E0D8'; e.target.style.background = '#FAFAF8'; }} />
    </label>
  );
}
function SaveBtn({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={saving}
      className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50 flex items-center gap-2"
      style={{ background: '#DDA455', color: '#1A1A2E' }}>
      {saving ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="10" /></svg>Opslaan…</> : <>✓ Opslaan</>}
    </button>
  );
}
function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#E8E0D8' }}>{children}</div>;
}
function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="px-4 py-2.5 text-sm font-semibold rounded-lg transition-all"
      style={{ background: active ? '#DDA455' : 'transparent', color: active ? '#1A1A2E' : '#666' }}>
      {children}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminWebinarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const webinarId = Number(id);

  const [tab, setTab] = useState<'info' | 'resources' | 'poll' | 'discussie'>('info');
  const [webinar, setWebinar] = useState<Webinar | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newRes, setNewRes] = useState({ title: '', url: '', description: '' });
  const [addingRes, setAddingRes] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollActive, setPollActive] = useState(false);

  const load = useCallback(async () => {
    const [w, r, p, c] = await Promise.all([
      fetch(`/api/webinars/${webinarId}`).then(r => r.json()),
      fetch(`/api/webinars/${webinarId}/resources`).then(r => r.json()),
      fetch(`/api/webinars/${webinarId}/poll`).then(r => r.json()),
      fetch(`/api/webinars/${webinarId}/comments/admin`).then(r => r.json()),
    ]);
    setWebinar(w); setResources(r); setComments(c);
    if (p) { setPoll(p); setPollQuestion(p.question); setPollOptions(p.options.map((o: { text: string }) => o.text).length ? p.options.map((o: { text: string }) => o.text) : ['', '']); setPollActive(p.active === 1); }
  }, [webinarId]);

  useEffect(() => { load(); }, [load]);

  function showSaved() { setSaved(true); setTimeout(() => setSaved(false), 2500); }

  async function saveWebinar() {
    if (!webinar) return;
    setSaving(true);
    await fetch(`/api/webinars/${webinarId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(webinar) });
    setSaving(false); showSaved();
  }

  async function savePoll() {
    setSaving(true);
    await fetch(`/api/webinars/${webinarId}/poll`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: pollQuestion, active: pollActive, options: pollOptions.filter(o => o.trim()) }) });
    setPoll(await fetch(`/api/webinars/${webinarId}/poll`).then(r => r.json()));
    setSaving(false); showSaved();
  }

  async function addResource() {
    if (!newRes.title.trim() || !newRes.url.trim()) return;
    setAddingRes(true);
    await fetch(`/api/webinars/${webinarId}/resources`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRes) });
    setNewRes({ title: '', url: '', description: '' });
    setResources(await fetch(`/api/webinars/${webinarId}/resources`).then(r => r.json()));
    setAddingRes(false);
  }

  async function deleteResource(resId: number) {
    await fetch(`/api/webinars/${webinarId}/resources`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: resId }) });
    setResources(prev => prev.filter(r => r.id !== resId));
  }

  async function moveResource(resId: number, dir: -1 | 1) {
    const idx = resources.findIndex(r => r.id === resId);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= resources.length) return;
    const reordered = [...resources];
    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
    const updated = reordered.map((r, i) => ({ ...r, sort_order: i }));
    setResources(updated);
    await Promise.all(updated.map(r => fetch(`/api/webinars/${webinarId}/resources`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(r) })));
  }

  async function commentAction(cId: number, action: string, payload?: object) {
    await fetch(`/api/webinars/${webinarId}/comments/${cId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...payload }) });
    setComments(await fetch(`/api/webinars/${webinarId}/comments/admin`).then(r => r.json()));
  }

  async function deleteComment(cId: number) {
    if (!confirm('Reactie permanent verwijderen?')) return;
    await fetch(`/api/webinars/${webinarId}/comments/${cId}`, { method: 'DELETE' });
    setComments(prev => prev.filter(c => c.id !== cId));
  }

  if (!webinar) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FCF6EF' }}>
      <div className="flex gap-2 items-center" style={{ color: '#DDA455' }}>
        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="10" /></svg>
        <span className="text-sm">Laden…</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF8' }}>
      {/* Topbar */}
      <div style={{ background: '#1A1A2E', borderBottom: '3px solid #DDA455' }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/admin">
              <Image src="/logo.png" alt="ICTrecht" width={100} height={38} style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            </Link>
            <div className="h-5 w-px flex-shrink-0" style={{ background: '#333' }} />
            <Link href="/admin" className="text-xs hover:underline flex-shrink-0" style={{ color: '#888' }}>Webinars</Link>
            <span style={{ color: '#444' }}>/</span>
            <span className="text-xs truncate" style={{ color: '#DDA455' }}>{webinar.title}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href={`/webinar/${webinarId}`} target="_blank"
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors hover:bg-white/10"
              style={{ borderColor: '#444', color: '#ccc' }}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              Bekijk pagina
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-8 w-fit" style={{ background: '#F0EDE8' }}>
          <TabBtn active={tab === 'info'} onClick={() => setTab('info')}>Info</TabBtn>
          <TabBtn active={tab === 'resources'} onClick={() => setTab('resources')}>
            Resources {resources.length > 0 && <span className="ml-1 text-xs opacity-70">({resources.length})</span>}
          </TabBtn>
          <TabBtn active={tab === 'poll'} onClick={() => setTab('poll')}>Peiling</TabBtn>
          <TabBtn active={tab === 'discussie'} onClick={() => setTab('discussie')}>
            Discussie {comments.length > 0 && <span className="ml-1 text-xs opacity-70">({comments.length})</span>}
          </TabBtn>
        </div>

        {/* ── Info Tab ─────────────────────────────────────────────────── */}
        {tab === 'info' && (
          <Card>
            <h2 className="font-bold text-lg mb-5" style={{ color: '#1A1A2E' }}>Webinar informatie</h2>
            <div className="space-y-4">
              <FieldInput label="Titel" value={webinar.title} onChange={e => setWebinar(p => p ? { ...p, title: e.target.value } : p)} />
              <FieldTextarea label="Beschrijving" value={webinar.description} rows={4}
                onChange={e => setWebinar(p => p ? { ...p, description: e.target.value } : p)} />
              <div>
                <span className="block text-xs font-semibold mb-1.5" style={{ color: '#4A4A5A' }}>Status</span>
                <div className="flex gap-2">
                  {(['aankomend', 'live', 'afgelopen'] as const).map(s => (
                    <button key={s} onClick={() => setWebinar(p => p ? { ...p, status: s } : p)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold border transition-all capitalize"
                      style={{ background: webinar.status === s ? '#DDA455' : '#F8F8F7', borderColor: webinar.status === s ? '#DDA455' : '#E8E0D8', color: webinar.status === s ? '#1A1A2E' : '#666' }}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <FieldInput label="Datum en tijd" type="datetime-local" value={webinar.date?.slice(0, 16) ?? ''}
                onChange={e => setWebinar(p => p ? { ...p, date: e.target.value } : p)} />
              <FieldInput label="CTA link (aanmelden / live)" value={webinar.cta_link ?? ''}
                onChange={e => setWebinar(p => p ? { ...p, cta_link: e.target.value } : p)} />
              <FieldInput label="Opname link (optioneel)" value={webinar.recording_link ?? ''}
                onChange={e => setWebinar(p => p ? { ...p, recording_link: e.target.value } : p)} />
            </div>
            <div className="flex items-center gap-4 mt-6 pt-4 border-t" style={{ borderColor: '#F0ECE8' }}>
              <SaveBtn saving={saving} onClick={saveWebinar} />
              {saved && <span className="text-sm font-medium" style={{ color: '#217A7D' }}>✓ Opgeslagen</span>}
            </div>
          </Card>
        )}

        {/* ── Resources Tab ─────────────────────────────────────────────── */}
        {tab === 'resources' && (
          <div className="space-y-6">
            <Card>
              <h2 className="font-bold text-lg mb-5" style={{ color: '#1A1A2E' }}>Resource toevoegen</h2>
              <div className="space-y-3">
                <FieldInput label="Titel" value={newRes.title} onChange={e => setNewRes(p => ({ ...p, title: e.target.value }))} />
                <FieldInput label="URL" type="url" value={newRes.url} onChange={e => setNewRes(p => ({ ...p, url: e.target.value }))} />
                <FieldInput label="Toelichting" value={newRes.description} onChange={e => setNewRes(p => ({ ...p, description: e.target.value }))} />
              </div>
              <button onClick={addResource} disabled={addingRes || !newRes.title.trim() || !newRes.url.trim()}
                className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105 disabled:opacity-40"
                style={{ background: '#DDA455', color: '#1A1A2E' }}>
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" /></svg>
                {addingRes ? 'Toevoegen…' : 'Resource toevoegen'}
              </button>
            </Card>

            {resources.length > 0 && (
              <Card>
                <h2 className="font-bold text-lg mb-5" style={{ color: '#1A1A2E' }}>Huidige resources ({resources.length})</h2>
                <div className="space-y-3">
                  {resources.map((res, idx) => (
                    <div key={res.id} className="flex items-center gap-3 p-4 rounded-xl border" style={{ background: '#FAFAF8', borderColor: '#E8E0D8' }}>
                      <div className="flex flex-col gap-1">
                        <button onClick={() => moveResource(res.id, -1)} disabled={idx === 0} className="w-6 h-6 rounded flex items-center justify-center disabled:opacity-20 hover:bg-amber-50" style={{ border: '1px solid #E8E0D8' }}>
                          <svg className="w-3 h-3" style={{ color: '#888' }} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z" /></svg>
                        </button>
                        <button onClick={() => moveResource(res.id, 1)} disabled={idx === resources.length - 1} className="w-6 h-6 rounded flex items-center justify-center disabled:opacity-20 hover:bg-amber-50" style={{ border: '1px solid #E8E0D8' }}>
                          <svg className="w-3 h-3" style={{ color: '#888' }} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" /></svg>
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm" style={{ color: '#1A1A2E' }}>{res.title}</p>
                        <p className="text-xs truncate" style={{ color: '#DDA455' }}>{res.url}</p>
                        {res.description && <p className="text-xs mt-0.5" style={{ color: '#888' }}>{res.description}</p>}
                      </div>
                      <button onClick={() => deleteResource(res.id)} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors hover:bg-red-50" style={{ color: '#ccc' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')} onMouseLeave={e => (e.currentTarget.style.color = '#ccc')}>
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ── Poll Tab ──────────────────────────────────────────────────── */}
        {tab === 'poll' && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-lg" style={{ color: '#1A1A2E' }}>Peiling</h2>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <span className="text-sm" style={{ color: '#666' }}>Actief</span>
                  <div onClick={() => setPollActive(p => !p)} className="relative w-11 h-6 rounded-full cursor-pointer transition-colors"
                    style={{ background: pollActive ? '#DDA455' : '#E0D8D0' }}>
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                      style={{ transform: pollActive ? 'translateX(20px)' : 'translateX(0)' }} />
                  </div>
                </label>
              </div>
              <div className="space-y-4">
                <FieldTextarea label="Vraag" value={pollQuestion} rows={2} onChange={e => setPollQuestion(e.target.value)} />
                <div>
                  <span className="block text-xs font-semibold mb-2" style={{ color: '#4A4A5A' }}>Antwoordopties</span>
                  <div className="space-y-2">
                    {pollOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-5 text-center text-xs font-bold flex-shrink-0" style={{ color: '#DDA455' }}>{i + 1}</span>
                        <input value={opt} onChange={e => { const u = [...pollOptions]; u[i] = e.target.value; setPollOptions(u); }}
                          className="flex-1 border rounded-xl px-4 py-2 text-sm outline-none transition-colors"
                          style={{ borderColor: '#E8E0D8', color: '#1A1A2E', background: '#FAFAF8' }}
                          onFocus={e => { e.target.style.borderColor = '#DDA455'; e.target.style.background = '#fff'; }}
                          onBlur={e => { e.target.style.borderColor = '#E8E0D8'; e.target.style.background = '#FAFAF8'; }} />
                        {pollOptions.length > 2 && (
                          <button onClick={() => setPollOptions(prev => prev.filter((_, j) => j !== i))}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors flex-shrink-0"
                            style={{ color: '#ccc' }} onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')} onMouseLeave={e => (e.currentTarget.style.color = '#ccc')}>
                            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {pollOptions.length < 6 && (
                    <button onClick={() => setPollOptions(prev => [...prev, ''])}
                      className="mt-2 text-sm flex items-center gap-1.5 hover:opacity-80" style={{ color: '#DDA455' }}>
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" /></svg>
                      Optie toevoegen
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 mt-6 pt-4 border-t" style={{ borderColor: '#F0ECE8' }}>
                <SaveBtn saving={saving} onClick={savePoll} />
                {saved && <span className="text-sm font-medium" style={{ color: '#217A7D' }}>✓ Opgeslagen</span>}
              </div>
            </Card>

            {poll && poll.totalVotes > 0 && (
              <Card>
                <h3 className="font-bold mb-4" style={{ color: '#1A1A2E' }}>Resultaten <span className="text-sm font-normal" style={{ color: '#999' }}>({poll.totalVotes} stemmen)</span></h3>
                <div className="space-y-3">
                  {poll.options.map(opt => {
                    const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                    return (
                      <div key={opt.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span style={{ color: '#1A1A2E' }}>{opt.text}</span>
                          <span className="font-bold" style={{ color: '#DDA455' }}>{pct}% ({opt.votes})</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F0ECE8' }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: '#DDA455' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ── Discussie Tab ─────────────────────────────────────────────── */}
        {tab === 'discussie' && (
          <div className="space-y-4">
            <h2 className="font-bold text-lg" style={{ color: '#1A1A2E' }}>Alle reacties ({comments.length})</h2>
            {comments.length === 0 && (
              <Card><p className="text-sm text-center py-6" style={{ color: '#bbb' }}>Nog geen reacties.</p></Card>
            )}
            {comments.map(c => (
              <div key={c.id} className="rounded-2xl border overflow-hidden"
                style={{ background: c.hidden ? '#FFF5F5' : '#fff', borderColor: c.hidden ? '#fca5a5' : c.pinned ? '#DDA455' : '#E8E0D8', opacity: c.hidden ? 0.8 : 1 }}>
                <div className="px-4 py-2 flex items-center gap-2 text-xs border-b" style={{ borderColor: '#F0ECE8', background: '#FAFAF8' }}>
                  {c.parent_id && <span style={{ color: '#999' }}>↳ antwoord op <strong>{c.parent_name}</strong></span>}
                  {c.pinned === 1 && <span className="font-semibold" style={{ color: '#DDA455' }}>📌 Vastgepind</span>}
                  {c.hidden === 1 && <span className="font-semibold" style={{ color: '#ef4444' }}>Verborgen</span>}
                  <span className="ml-auto" style={{ color: '#bbb' }}>{new Date(c.created_at).toLocaleString('nl-NL')}</span>
                  <span className="flex items-center gap-1" style={{ color: '#DDA455' }}>❤ {c.likes}</span>
                </div>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #DDA455, #753C5F)' }}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm mb-1" style={{ color: '#1A1A2E' }}>{c.name}</p>
                      <p className="text-sm leading-relaxed" style={{ color: '#3A3A4A' }}>{c.content}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: '#F0ECE8' }}>
                    {!c.parent_id && (
                      <button onClick={() => commentAction(c.id, 'pin', { pinned: c.pinned === 0 })}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all"
                        style={{ borderColor: c.pinned ? '#DDA455' : '#E8E0D8', background: c.pinned ? '#FCF6EF' : '#FAFAF8', color: c.pinned ? '#C4883A' : '#888' }}>
                        📌 {c.pinned ? 'Losmaken' : 'Vastpinnen'}
                      </button>
                    )}
                    <button onClick={() => commentAction(c.id, 'hide', { hidden: c.hidden === 0 })}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all"
                      style={{ borderColor: c.hidden ? '#fca5a5' : '#E8E0D8', background: c.hidden ? '#FFF5F5' : '#FAFAF8', color: c.hidden ? '#ef4444' : '#888' }}>
                      {c.hidden ? '👁 Zichtbaar' : '🙈 Verbergen'}
                    </button>
                    <button onClick={() => deleteComment(c.id)}
                      className="ml-auto text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                      style={{ borderColor: '#E8E0D8', color: '#999' }}>
                      Verwijderen
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
