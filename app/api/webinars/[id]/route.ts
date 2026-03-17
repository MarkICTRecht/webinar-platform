import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const webinar = db.prepare('SELECT * FROM webinars WHERE id = ?').get(Number(id));
  if (!webinar) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
  return NextResponse.json(webinar);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const { title, description, status, cta_link, recording_link, date } = await request.json();
  db.prepare(`
    UPDATE webinars SET title=?, description=?, status=?, cta_link=?, recording_link=?, date=?
    WHERE id=?
  `).run(title, description, status, cta_link ?? '', recording_link ?? '', date ?? '', Number(id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM webinars WHERE id = ?').run(Number(id));
  return NextResponse.json({ ok: true });
}
