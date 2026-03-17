import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const resources = db.prepare('SELECT * FROM resources WHERE webinar_id=? ORDER BY sort_order ASC, id ASC').all(Number(id));
  return NextResponse.json(resources);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const { title, url, description } = await request.json();
  const maxOrder = (db.prepare('SELECT MAX(sort_order) as m FROM resources WHERE webinar_id=?').get(Number(id)) as { m: number | null }).m ?? -1;
  const result = db.prepare('INSERT INTO resources (webinar_id, title, url, description, sort_order) VALUES (?,?,?,?,?)').run(Number(id), title, url, description ?? '', maxOrder + 1);
  return NextResponse.json({ id: result.lastInsertRowid });
}

export async function PUT(request: Request) {
  const db = getDb();
  const { id, title, url, description, sort_order } = await request.json();
  db.prepare('UPDATE resources SET title=?, url=?, description=?, sort_order=? WHERE id=?').run(title, url, description ?? '', sort_order ?? 0, id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const db = getDb();
  const { id } = await request.json();
  db.prepare('DELETE FROM resources WHERE id=?').run(id);
  return NextResponse.json({ ok: true });
}
