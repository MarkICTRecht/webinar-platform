import { NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const poll = await queryOne<{ id: number; question: string; active: number }>('SELECT * FROM polls WHERE webinar_id=?', [Number(id)]);
  if (!poll) return NextResponse.json(null);

  const options = await query<{ id: number; text: string }>('SELECT * FROM poll_options WHERE poll_id=? ORDER BY sort_order ASC', [poll.id]);
  const voteCounts = await query<{ option_id: number; count: number }>(
    'SELECT option_id, COUNT(*) as count FROM poll_votes WHERE option_id IN (SELECT id FROM poll_options WHERE poll_id=?) GROUP BY option_id',
    [poll.id]
  );
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
  const { question, active, options } = await request.json();

  const existing = await queryOne<{ id: number }>('SELECT id FROM polls WHERE webinar_id=?', [Number(id)]);
  let pollId: number;
  if (existing) {
    await execute('UPDATE polls SET question=?, active=? WHERE webinar_id=?', [question, active ? 1 : 0, Number(id)]);
    pollId = existing.id;
  } else {
    const r = await execute('INSERT INTO polls (webinar_id, question, active) VALUES (?,?,?)', [Number(id), question, active ? 1 : 0]);
    pollId = r.lastInsertRowid;
  }

  if (options !== undefined) {
    await execute('DELETE FROM poll_options WHERE poll_id=?', [pollId]);
    for (let i = 0; i < (options as string[]).length; i++) {
      await execute('INSERT INTO poll_options (poll_id, text, sort_order) VALUES (?,?,?)', [pollId, (options as string[])[i], i]);
    }
  }

  return NextResponse.json({ ok: true });
}
