import { NextResponse } from 'next/server';
import { queryOne, execute, query } from '@/lib/db';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; cid: string }> }) {
  const { cid } = await params;
  const body = await request.json();

  if (body.action === 'like') {
    await execute('UPDATE comments SET likes=likes+1 WHERE id=?', [Number(cid)]);
    const row = await queryOne<{ likes: number }>('SELECT likes FROM comments WHERE id=?', [Number(cid)]);
    return NextResponse.json({ likes: row?.likes ?? 0 });
  }
  if (body.action === 'hide') {
    await execute('UPDATE comments SET hidden=? WHERE id=?', [body.hidden ? 1 : 0, Number(cid)]);
    return NextResponse.json({ ok: true });
  }
  if (body.action === 'pin') {
    await execute('UPDATE comments SET pinned=? WHERE id=?', [body.pinned ? 1 : 0, Number(cid)]);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Onbekende actie' }, { status: 400 });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; cid: string }> }) {
  const { cid } = await params;
  await execute('DELETE FROM comments WHERE id=?', [Number(cid)]);
  return NextResponse.json({ ok: true });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; cid: string }> }) {
  const { id } = await params;
  const comments = await query(
    'SELECT c.*, p.name as parent_name FROM comments c LEFT JOIN comments p ON c.parent_id=p.id WHERE c.webinar_id=? ORDER BY c.pinned DESC, c.created_at DESC',
    [Number(id)]
  );
  return NextResponse.json(comments);
}
