import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';

export async function GET() {
  const webinars = await query('SELECT * FROM webinars ORDER BY date DESC');
  return NextResponse.json(webinars);
}

export async function POST(request: Request) {
  const { title, description, status, cta_link, recording_link, date } = await request.json();
  const result = await execute(
    'INSERT INTO webinars (title, description, status, cta_link, recording_link, date) VALUES (?,?,?,?,?,?)',
    [title || 'Nieuw webinar', description || '', status || 'aankomend', cta_link || '', recording_link || '', date || '']
  );
  await execute('INSERT INTO polls (webinar_id, question, active) VALUES (?,?,?)', [result.lastInsertRowid, '', 0]);
  return NextResponse.json({ id: result.lastInsertRowid });
}
