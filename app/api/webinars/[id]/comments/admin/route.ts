import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const comments = await query(
    'SELECT c.*, p.name as parent_name FROM comments c LEFT JOIN comments p ON c.parent_id=p.id WHERE c.webinar_id=? ORDER BY c.pinned DESC, c.created_at DESC',
    [Number(id)]
  );
  return NextResponse.json(comments);
}
