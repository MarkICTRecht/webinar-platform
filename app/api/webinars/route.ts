import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const webinars = db.prepare('SELECT * FROM webinars ORDER BY date DESC').all();
  return NextResponse.json(webinars);
}

export async function POST(request: Request) {
  const db = getDb();
  const { title, description, status, cta_link, recording_link, date } = await request.json();
  const result = db.prepare(`
    INSERT INTO webinars (title, description, status, cta_link, recording_link, date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(title || 'Nieuw webinar', description || '', status || 'aankomend', cta_link || '', recording_link || '', date || '');

  // Create an empty poll for this webinar
  db.prepare('INSERT INTO polls (webinar_id, question, active) VALUES (?, ?, ?)').run(
    result.lastInsertRowid, '', 0
  );

  return NextResponse.json({ id: result.lastInsertRowid });
}
