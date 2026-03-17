import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const { option_id, voter_token } = await request.json();
  if (!option_id || !voter_token) return NextResponse.json({ error: 'Ongeldige invoer' }, { status: 400 });

  const poll = db.prepare('SELECT id FROM polls WHERE webinar_id=?').get(Number(id)) as { id: number } | undefined;
  if (!poll) return NextResponse.json({ error: 'Geen peiling' }, { status: 404 });

  const existing = db.prepare('SELECT id FROM poll_votes WHERE voter_token=? AND option_id IN (SELECT id FROM poll_options WHERE poll_id=?)').get(voter_token, poll.id);
  if (existing) return NextResponse.json({ error: 'Al gestemd' }, { status: 409 });

  db.prepare('INSERT INTO poll_votes (option_id, voter_token) VALUES (?,?)').run(option_id, voter_token);
  return NextResponse.json({ ok: true });
}
