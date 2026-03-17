import { NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resources = await query('SELECT * FROM resources WHERE webinar_id=? ORDER BY sort_order ASC, id ASC', [Number(id)]);
  return NextResponse.json(resources);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { title, url, description } = await request.json();
  const maxRow = await queryOne<{ m: number | null }>('SELECT MAX(sort_order) as m FROM resources WHERE webinar_id=?', [Number(id)]);
  const maxOrder = maxRow?.m ?? -1;
  const result = await execute(
    'INSERT INTO resources (webinar_id, title, url, description, sort_order) VALUES (?,?,?,?,?)',
    [Number(id), title, url, description ?? '', maxOrder + 1]
  );
  return NextResponse.json({ id: result.lastInsertRowid });
}

export async function PUT(request: Request) {
  const { id, title, url, description, sort_order } = await request.json();
  await execute('UPDATE resources SET title=?, url=?, description=?, sort_order=? WHERE id=?', [title, url, description ?? '', sort_order ?? 0, id]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  await execute('DELETE FROM resources WHERE id=?', [id]);
  return NextResponse.json({ ok: true });
}
