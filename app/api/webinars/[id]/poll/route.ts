import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const poll = db.prepare('SELECT * FROM polls WHERE webinar_id=?').get(Number(id)) as { id: number; question: string; active: number } | undefined;
  if (!poll) return NextResponse.json(null);

  const options = db.prepare('SELECT * FROM poll_options WHERE poll_id=? ORDER BY sort_order ASC').all(poll.id) as { id: number; text: string }[];
  const voteCounts = db.prepare('SELECT option_id, COUNT(*) as count FROM poll_votes WHERE option_id IN (SELECT id FROM poll_options WHERE poll_id=?) GROUP BY option_id').all(poll.id) as { option_id: number; count: number }[];
  const countMap: Record<number, number> = {};
  voteCounts.forEach(v => { countMap[v.option_id] = v.count; });
  const totalVotes = voteCounts.reduce((s, v) => s + v.count, 0);

  return NextResponse.json({
    ...poll,
    options: options.map(o => ({ ...o, votes: countMap[o.id] ?? 0 })),
    totalVotes,
  });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const { question, active, options } = await request.json();

  // Upsert poll
  const existing = db.prepare('SELECT id FROM polls WHERE webinar_id=?').get(Number(id)) as { id: number } | undefined;
  let pollId: number;
  if (existing) {
    db.prepare('UPDATE polls SET question=?, active=? WHERE webinar_id=?').run(question, active ? 1 : 0, Number(id));
    pollId = existing.id;
  } else {
    const r = db.prepare('INSERT INTO polls (webinar_id, question, active) VALUES (?,?,?)').run(Number(id), question, active ? 1 : 0);
    pollId = Number(r.lastInsertRowid);
  }

  if (options !== undefined) {
    db.prepare('DELETE FROM poll_options WHERE poll_id=?').run(pollId);
    const insert = db.prepare('INSERT INTO poll_options (poll_id, text, sort_order) VALUES (?,?,?)');
    (options as string[]).forEach((text, i) => insert.run(pollId, text, i));
  }

  return NextResponse.json({ ok: true });
}
