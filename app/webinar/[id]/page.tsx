'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Webinar { id: number; title: string; description: string; status: string; cta_link: string; recording_link: string; date: string; }
interface Resource { id: number; title: string; url: string; description: string; }
interface PollOption { id: number; text: string; votes: number; }
interface Poll { id: number; question: string; active: number; options: PollOption[]; totalVotes: number; }
interface Comment { id: number; parent_id: number | null; name: string; content: string; likes: number; pinned: number; created_at: string; replies: Comment[]; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getVoterToken(): string {
  if (typeof window === 'undefined') return '';
  let t = localStorage.getItem('vt');
  if (!t) { t = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('vt', t); }
  return t;
}
function getVotedOption(webinarId: number): number | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(`voted_${webinarId}`);
  return v ? parseInt(v) : null;
}
function getLikedComments(webinarId: number): Set<number> {
  if (typeof window === 'undefined') return new Set();
  const v = localStorage.getItem(`liked_${webinarId}`);
  return v ? new Set(JSON.parse(v)) : new Set();
}
function formatDate(d: string) {
  if (!d) return '';
  try { return new Intl.DateTimeFormat('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d)); }
  catch { return d; }
}
function timeAgo(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (diff < 60) return 'zojuist';
  if (diff < 3600) return `${Math.floor(diff / 60)} min geleden`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} uur geleden`;
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' }).format(new Date(d));
}

function StatusBadge({ status }: { status: string }) {
  const m: Record<string, [string, string]> = {
    aankomend: ['Aankomend', 'bg-amber-100 text-amber-800 border border-amber-300'],
    live: ['● Live nu', 'bg-red-100 text-red-700 border border-red-300 animate-pulse'],
    afgelopen: ['Afgelopen', 'bg-gray-100 text-gray-600 border border-gray-300'],
  };
  const [label, cls] = m[status] ?? m.aankomend;
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${cls}`}>{label}</span>;
}

function SectionHeader({ color, title }: { color: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-1 h-6 rounded-full" style={{ background: color }} />
      <h2 className="text-xl font-bold" style={{ color: '#1A1A2E' }}>{title}</h2>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WebinarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const webinarId = Number(id);

  const [webinar, setWebinar] = useState<Webinar | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [votedOption, setVotedOption] = useState<number | null>(null);
  const [likedComments, setLikedComments] = useState<Set<number>>(new Set());
  const [commentSort, setCommentSort] = useState<'nieuwste' | 'meest-geliked'>('nieuwste');
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null);
  const [newComment, setNewComment] = useState({ name: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    const wRes = await fetch(`/api/webinars/${webinarId}`);
    if (!wRes.ok) { setNotFound(true); return; }
    const [w, r, p, c] = await Promise.all([
      wRes.json(),
      fetch(`/api/webinars/${webinarId}/resources`).then(r => r.json()),
      fetch(`/api/webinars/${webinarId}/poll`).then(r => r.json()),
      fetch(`/api/webinars/${webinarId}/comments`).then(r => r.json()),
    ]);
    setWebinar(w); setResources(r); setPoll(p); setComments(c);
    setVotedOption(getVotedOption(webinarId));
    setLikedComments(getLikedComments(webinarId));
  }, [webinarId]);

  useEffect(() => { load(); }, [load]);

  async function handleVote(optionId: number) {
    if (votedOption !== null || voteLoading) return;
    setVoteLoading(true);
    const res = await fetch(`/api/webinars/${webinarId}/poll/vote`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ option_id: optionId, voter_token: getVoterToken() }),
    });
    if (res.ok) {
      localStorage.setItem(`voted_${webinarId}`, String(optionId));
      setVotedOption(optionId);
      setPoll(await fetch(`/api/webinars/${webinarId}/poll`).then(r => r.json()));
    }
    setVoteLoading(false);
  }

  async function handleLike(commentId: number) {
    if (likedComments.has(commentId)) return;
    await fetch(`/api/webinars/${webinarId}/comments/${commentId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'like' }),
    });
    const nl = new Set(likedComments); nl.add(commentId);
    setLikedComments(nl);
    localStorage.setItem(`liked_${webinarId}`, JSON.stringify([...nl]));
    setComments(prev => prev.map(c => ({
      ...c,
      likes: c.id === commentId ? c.likes + 1 : c.likes,
      replies: c.replies?.map(r => r.id === commentId ? { ...r, likes: r.likes + 1 } : r),
    })));
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.name.trim() || !newComment.content.trim()) return;
    setSubmitting(true);
    await fetch(`/api/webinars/${webinarId}/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newComment.name, content: newComment.content, parent_id: replyTo?.id ?? null }),
    });
    setNewComment({ name: '', content: '' }); setReplyTo(null);
    setSubmitSuccess(true); setTimeout(() => setSubmitSuccess(false), 3000);
    setComments(await fetch(`/api/webinars/${webinarId}/comments`).then(r => r.json()));
    setSubmitting(false);
  }

  const sorted = [...comments].sort((a, b) => {
    if (a.pinned !== b.pinned) return b.pinned - a.pinned;
    if (commentSort === 'meest-geliked') return b.likes - a.likes;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAFAF8' }}>
      <div className="text-center">
        <p className="text-lg font-semibold mb-2" style={{ color: '#1A1A2E' }}>Webinar niet gevonden</p>
        <Link href="/" className="text-sm hover:underline" style={{ color: '#DDA455' }}>← Terug naar overzicht</Link>
      </div>
    </div>
  );

  if (!webinar) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FCF6EF' }}>
      <div className="flex gap-2 items-center" style={{ color: '#DDA455' }}>
        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="10" />
        </svg>
        <span className="text-sm font-medium">Laden…</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF8' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #2d2d4a 55%, #753C5F 100%)' }} className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 opacity-15 rounded-full -translate-y-24 translate-x-24 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #DDA455, transparent)' }} />
        <div className="max-w-4xl mx-auto px-6 py-10 relative z-10">
          {/* Nav */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/">
              <Image src="/logo.png" alt="ICTrecht" width={140} height={52} style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} priority />
            </Link>
            <Link href="/" className="text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors hover:bg-white/10"
              style={{ borderColor: '#ffffff30', color: '#EFD2AC' }}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" />
              </svg>
              Alle webinars
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-5">
            <StatusBadge status={webinar.status} />
            {webinar.date && <span className="text-sm capitalize" style={{ color: '#EFD2AC' }}>{formatDate(webinar.date)}</span>}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4 text-white">{webinar.title}</h1>
          <p className="text-base leading-relaxed max-w-2xl mb-8" style={{ color: '#EFD2AC' }}>{webinar.description}</p>

          {webinar.status === 'aankomend' && webinar.cta_link && (
            <a href={webinar.cta_link} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-sm transition-all hover:scale-105 hover:shadow-lg"
              style={{ background: '#DDA455', color: '#1A1A2E' }}>
              Aanmelden
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" /></svg>
            </a>
          )}
          {webinar.status === 'live' && webinar.cta_link && (
            <a href={webinar.cta_link} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-sm"
              style={{ background: '#e74c3c', color: '#fff' }}>● Doe mee – Live nu</a>
          )}
          {webinar.status === 'afgelopen' && webinar.recording_link && (
            <a href={webinar.recording_link} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-sm transition-all hover:scale-105 hover:shadow-lg"
              style={{ background: '#DDA455', color: '#1A1A2E' }}>
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
              Bekijk opname
            </a>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">

        {/* ── Resources ─────────────────────────────────────────────────── */}
        {resources.length > 0 && (
          <section>
            <SectionHeader color="#DDA455" title="Uit de uitzending" />
            <div className="space-y-3">
              {resources.map(res => (
                <a key={res.id} href={res.url} target="_blank" rel="noopener noreferrer"
                  className="group flex items-start gap-4 p-4 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5"
                  style={{ background: '#fff', borderColor: '#E8E0D8' }}>
                  <div className="mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#FCF6EF' }}>
                    <svg className="w-4 h-4" style={{ color: '#DDA455' }} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.379 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0-6a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm flex items-center gap-2" style={{ color: '#1A1A2E' }}>
                      {res.title}
                      <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#DDA455' }} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" />
                      </svg>
                    </div>
                    {res.description && <p className="text-sm mt-0.5" style={{ color: '#6B6B7B' }}>{res.description}</p>}
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ── Poll ──────────────────────────────────────────────────────── */}
        {poll && poll.active === 1 && (
          <section>
            <SectionHeader color="#753C5F" title="Peiling" />
            <div className="p-6 rounded-2xl border" style={{ background: '#fff', borderColor: '#E8E0D8' }}>
              <p className="font-semibold mb-5" style={{ color: '#1A1A2E' }}>{poll.question}</p>
              <div className="space-y-3">
                {poll.options.map(opt => {
                  const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                  const isVoted = votedOption === opt.id;
                  return (
                    <div key={opt.id}>
                      {votedOption !== null ? (
                        <div className="relative overflow-hidden rounded-xl border"
                          style={{ borderColor: isVoted ? '#DDA455' : '#E8E0D8', background: isVoted ? '#FCF6EF' : '#F8F8F7' }}>
                          <div className="absolute inset-y-0 left-0 rounded-xl transition-all duration-700"
                            style={{ width: `${pct}%`, background: isVoted ? '#EFD2AC' : '#EDEDEB' }} />
                          <div className="relative flex items-center justify-between px-4 py-3">
                            <span className="text-sm font-medium flex items-center gap-2" style={{ color: '#1A1A2E' }}>
                              {isVoted && <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#DDA455' }} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" /></svg>}
                              {opt.text}
                            </span>
                            <span className="text-sm font-bold ml-4 flex-shrink-0" style={{ color: isVoted ? '#C4883A' : '#999' }}>{pct}%</span>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => handleVote(opt.id)} disabled={voteLoading}
                          className="w-full text-left px-4 py-3 rounded-xl border font-medium text-sm transition-all hover:border-amber-400 hover:bg-amber-50 disabled:opacity-50 cursor-pointer"
                          style={{ background: '#F8F8F7', borderColor: '#E8E0D8', color: '#1A1A2E' }}>
                          {opt.text}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-xs text-center" style={{ color: '#bbb' }}>
                {votedOption !== null ? `${poll.totalVotes} stem${poll.totalVotes !== 1 ? 'men' : ''} uitgebracht` : 'Klik op een optie om te stemmen'}
              </p>
            </div>
          </section>
        )}

        {/* ── Discussie ─────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full" style={{ background: '#217A7D' }} />
              <h2 className="text-xl font-bold" style={{ color: '#1A1A2E' }}>
                Discussie{comments.length > 0 && <span className="ml-2 text-sm font-normal" style={{ color: '#999' }}>({comments.length})</span>}
              </h2>
            </div>
            <select value={commentSort} onChange={e => setCommentSort(e.target.value as 'nieuwste' | 'meest-geliked')}
              className="text-sm border rounded-lg px-3 py-1.5 outline-none cursor-pointer"
              style={{ borderColor: '#E8E0D8', color: '#4A4A5A', background: '#fff' }}>
              <option value="nieuwste">Nieuwste eerst</option>
              <option value="meest-geliked">Meest geliked</option>
            </select>
          </div>

          {/* Form */}
          <form onSubmit={handleComment} className="mb-8 p-5 rounded-2xl border" style={{ background: '#fff', borderColor: '#E8E0D8' }}>
            {replyTo && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg text-sm" style={{ background: '#FCF6EF', color: '#C4883A' }}>
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.793 2.232a.75.75 0 01-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 010 10.75H10.75a.75.75 0 010-1.5h2.875a3.875 3.875 0 000-7.75H3.622l4.146 3.957a.75.75 0 01-1.036 1.085l-5.5-5.25a.75.75 0 010-1.085l5.5-5.25a.75.75 0 011.06.025z" /></svg>
                Antwoord op <strong className="ml-1">{replyTo.name}</strong>
                <button type="button" onClick={() => setReplyTo(null)} className="ml-auto opacity-60 hover:opacity-100">✕</button>
              </div>
            )}
            <input value={newComment.name} onChange={e => setNewComment(p => ({ ...p, name: e.target.value }))}
              placeholder="Jouw naam" required
              className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none mb-3 transition-colors"
              style={{ borderColor: '#E8E0D8', color: '#1A1A2E', background: '#FAFAF8' }}
              onFocus={e => { e.target.style.borderColor = '#DDA455'; e.target.style.background = '#fff'; }}
              onBlur={e => { e.target.style.borderColor = '#E8E0D8'; e.target.style.background = '#FAFAF8'; }} />
            <textarea value={newComment.content} onChange={e => setNewComment(p => ({ ...p, content: e.target.value }))}
              placeholder={replyTo ? `Schrijf een antwoord op ${replyTo.name}…` : 'Deel je gedachten, vragen of feedback…'}
              required rows={3}
              className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none resize-none mb-3 transition-colors"
              style={{ borderColor: '#E8E0D8', color: '#1A1A2E', background: '#FAFAF8' }}
              onFocus={e => { e.target.style.borderColor = '#DDA455'; e.target.style.background = '#fff'; }}
              onBlur={e => { e.target.style.borderColor = '#E8E0D8'; e.target.style.background = '#FAFAF8'; }} />
            <div className="flex items-center justify-between">
              <div>{submitSuccess && <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: '#217A7D' }}>✓ Reactie geplaatst!</span>}</div>
              <button type="submit" disabled={submitting}
                className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50"
                style={{ background: '#DDA455', color: '#1A1A2E' }}>
                {submitting ? 'Plaatsen…' : replyTo ? 'Antwoord plaatsen' : 'Reactie plaatsen'}
              </button>
            </div>
          </form>

          {/* Comments */}
          <div className="space-y-4">
            {sorted.length === 0 && <p className="text-center py-12 text-sm" style={{ color: '#aaa' }}>Nog geen reacties. Wees de eerste!</p>}
            {sorted.map(c => (
              <CommentCard key={c.id} comment={c} likedComments={likedComments} onLike={handleLike} onReply={setReplyTo} />
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="mt-16 border-t py-8" style={{ borderColor: '#E8E0D8', background: '#fff' }}>
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/"><Image src="/logo.png" alt="ICTrecht" width={110} height={42} style={{ objectFit: 'contain' }} /></Link>
          <p className="text-xs" style={{ color: '#bbb' }}>© {new Date().getFullYear()} ICTrecht Academy · Webinar Community</p>
          <Link href="/admin" className="text-xs font-medium hover:underline" style={{ color: '#DDA455' }}>Beheer →</Link>
        </div>
      </footer>
    </div>
  );
}

// ─── Comment Card ─────────────────────────────────────────────────────────────
function CommentCard({ comment, likedComments, onLike, onReply }: {
  comment: Comment; likedComments: Set<number>;
  onLike: (id: number) => void; onReply: (r: { id: number; name: string }) => void;
}) {
  const isLiked = likedComments.has(comment.id);
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: '#fff', borderColor: comment.pinned ? '#DDA455' : '#E8E0D8' }}>
      {comment.pinned === 1 && (
        <div className="px-4 py-1.5 flex items-center gap-1.5 text-xs font-semibold" style={{ background: '#FCF6EF', color: '#C4883A' }}>
          📌 Vastgepind
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm text-white"
            style={{ background: 'linear-gradient(135deg, #DDA455, #753C5F)' }}>
            {comment.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm" style={{ color: '#1A1A2E' }}>{comment.name}</span>
              <span className="text-xs" style={{ color: '#bbb' }}>{timeAgo(comment.created_at)}</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#3A3A4A' }}>{comment.content}</p>
            <div className="flex items-center gap-4 mt-3">
              <button onClick={() => onLike(comment.id)}
                className={`flex items-center gap-1.5 text-xs transition-all ${isLiked ? 'font-semibold' : 'hover:opacity-70'}`}
                style={{ color: isLiked ? '#DDA455' : '#bbb' }}>
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={isLiked ? 0 : 1.5}>
                  <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-2.184C4.045 12.376 2 10.018 2 7c0-2.76 2.24-5 5-5a5 5 0 013.95 1.946A5 5 0 0116 2c2.76 0 5 2.24 5 5 0 3.018-2.045 5.376-3.885 7.036a22.045 22.045 0 01-2.582 2.184 20.759 20.759 0 01-1.162.682l-.019.01-.005.003h-.002a.739.739 0 01-.69 0l-.002-.001z" />
                </svg>
                {comment.likes > 0 ? comment.likes : ''}
              </button>
              <button onClick={() => onReply({ id: comment.id, name: comment.name })}
                className="text-xs hover:underline" style={{ color: '#bbb' }}>Antwoorden</button>
            </div>
          </div>
        </div>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="border-t px-4 pb-4 pt-3 space-y-3" style={{ borderColor: '#F0ECE8', background: '#FAFAF8' }}>
          {comment.replies.map(r => (
            <div key={r.id} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #217A7D, #DDA455)' }}>
                {r.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-xs" style={{ color: '#1A1A2E' }}>{r.name}</span>
                  <span className="text-xs" style={{ color: '#ccc' }}>{timeAgo(r.created_at)}</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#4A4A5A' }}>{r.content}</p>
                <button onClick={() => onLike(r.id)}
                  className={`flex items-center gap-1.5 text-xs mt-2 ${likedComments.has(r.id) ? 'font-semibold' : ''}`}
                  style={{ color: likedComments.has(r.id) ? '#DDA455' : '#ccc' }}>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill={likedComments.has(r.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5}>
                    <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-2.184C4.045 12.376 2 10.018 2 7c0-2.76 2.24-5 5-5a5 5 0 013.95 1.946A5 5 0 0116 2c2.76 0 5 2.24 5 5 0 3.018-2.045 5.376-3.885 7.036a22.045 22.045 0 01-2.582 2.184 20.759 20.759 0 01-1.162.682l-.019.01-.005.003h-.002a.739.739 0 01-.69 0l-.002-.001z" />
                  </svg>
                  {r.likes > 0 ? r.likes : ''}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
