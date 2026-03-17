import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// PATCH: like / hide / pin
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; cid: string }> }) {
  const { cid } = await params;
  const db = getDb();
  const body = await request.json();

  if (body.action === 'like') {
    db.prepare('UPDATE comments SET likes=likes+1 WHERE id=?').run(Number(cid));
    const row = db.prepare('SELECT likes FROM comments WHERE id=?').get(Number(cid)) as { likes: number };
    return NextResponse.json({ likes: row.likes });
  }
  if (body.action === 'hide') {
    db.prepare('UPDATE comments SET hidden=? WHERE id=?').run(body.hidden ? 1 : 0, Number(cid));
    return NextResponse.json({ ok: true });
  }
  if (body.action === 'pin') {
    db.prepare('UPDATE comments SET pinned=? WHERE id=?').run(body.pinned ? 1 : 0, Number(cid));
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Onbekende actie' }, { status: 400 });
}

// DELETE: verwijder reactie
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; cid: string }> }) {
  const { cid } = await params;
  const db = getDb();
  db.prepare('DELETE FROM comments WHERE id=?').run(Number(cid));
  return NextResponse.json({ ok: true });
}

// GET all comments for admin (including hidden)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; cid: string }> }) {
  const { id } = await params;
  const db = getDb();
  const comments = db.prepare(`
    SELECT c.*, p.name as parent_name FROM comments c
    LEFT JOIN comments p ON c.parent_id=p.id
    WHERE c.webinar_id=? ORDER BY c.pinned DESC, c.created_at DESC
  `).all(Number(id));
  return NextResponse.json(comments);
}
