import { NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const webinar = await queryOne('SELECT * FROM webinars WHERE id=?', [Number(id)]);
  if (!webinar) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
  return NextResponse.json(webinar);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { title, description, status, cta_link, recording_link, date } = await request.json();
  await execute(
    'UPDATE webinars SET title=?, description=?, status=?, cta_link=?, recording_link=?, date=? WHERE id=?',
    [title, description, status, cta_link ?? '', recording_link ?? '', date ?? '', Number(id)]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await execute('DELETE FROM webinars WHERE id=?', [Number(id)]);
  return NextResponse.json({ ok: true });
}
