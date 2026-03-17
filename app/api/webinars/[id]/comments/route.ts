import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface Comment {
  id: number; webinar_id: number; parent_id: number | null;
  name: string; content: string; likes: number; hidden: number; pinned: number; created_at: string;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();

  const top = db.prepare('SELECT * FROM comments WHERE webinar_id=? AND parent_id IS NULL AND hidden=0 ORDER BY pinned DESC, created_at DESC').all(Number(id)) as Comment[];
  const replies = db.prepare('SELECT * FROM comments WHERE webinar_id=? AND parent_id IS NOT NULL AND hidden=0 ORDER BY created_at ASC').all(Number(id)) as Comment[];

  const replyMap: Record<number, Comment[]> = {};
  replies.forEach(r => {
    if (!replyMap[r.parent_id!]) replyMap[r.parent_id!] = [];
    replyMap[r.parent_id!].push(r);
  });

  return NextResponse.json(top.map(c => ({ ...c, replies: replyMap[c.id] ?? [] })));
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const { name, content, parent_id } = await request.json();
  if (!name?.trim() || !content?.trim()) return NextResponse.json({ error: 'Naam en reactie verplicht' }, { status: 400 });
  const result = db.prepare('INSERT INTO comments (webinar_id, name, content, parent_id) VALUES (?,?,?,?)').run(Number(id), name.trim(), content.trim(), parent_id ?? null);
  return NextResponse.json({ id: result.lastInsertRowid });
}
