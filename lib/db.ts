import { createClient, Client, InArgs, Row } from '@libsql/client';

let _client: Client | null = null;
let _initPromise: Promise<void> | null = null;

function getClient(): Client {
  if (!_client) {
    _client = createClient({
      url: process.env.TURSO_DATABASE_URL ?? 'file:./data/webinar.db',
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return _client;
}

function rowsToObjects<T>(rows: Row[], columns: string[]): T[] {
  return rows.map(row => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj as T;
  });
}

export async function query<T = Record<string, unknown>>(sql: string, args: InArgs = []): Promise<T[]> {
  await ensureInit();
  const result = await getClient().execute({ sql, args });
  return rowsToObjects<T>(result.rows, result.columns);
}

export async function queryOne<T = Record<string, unknown>>(sql: string, args: InArgs = []): Promise<T | null> {
  await ensureInit();
  const result = await getClient().execute({ sql, args });
  if (result.rows.length === 0) return null;
  return rowsToObjects<T>(result.rows, result.columns)[0];
}

export async function execute(sql: string, args: InArgs = []): Promise<{ lastInsertRowid: number; changes: number }> {
  await ensureInit();
  const result = await getClient().execute({ sql, args });
  return {
    lastInsertRowid: Number(result.lastInsertRowid ?? 0),
    changes: result.rowsAffected,
  };
}

export function ensureInit(): Promise<void> {
  if (!_initPromise) {
    _initPromise = initSchema();
  }
  return _initPromise;
}

async function initSchema(): Promise<void> {
  const client = getClient();

  await client.batch([
    { sql: `CREATE TABLE IF NOT EXISTS webinars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'aankomend',
      cta_link TEXT DEFAULT '',
      recording_link TEXT DEFAULT '',
      date TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      webinar_id INTEGER NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0
    )`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS polls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      webinar_id INTEGER NOT NULL UNIQUE REFERENCES webinars(id) ON DELETE CASCADE,
      question TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 0
    )`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS poll_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    )`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS poll_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      option_id INTEGER NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
      voter_token TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      webinar_id INTEGER NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
      parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      hidden INTEGER DEFAULT 0,
      pinned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`, args: [] },
  ], 'write');

  // Seed demo data if empty
  const countResult = await client.execute('SELECT COUNT(*) as c FROM webinars');
  const count = Number(countResult.rows[0][0]);
  if (count > 0) return;

  const w1 = await client.execute({
    sql: `INSERT INTO webinars (title, description, status, cta_link, recording_link, date) VALUES (?,?,?,?,?,?)`,
    args: ['AVG & AI: wat mag en wat niet?', 'In deze sessie bespreken we de juridische kaders rondom kunstmatige intelligentie en privacy. Wat zijn de verplichtingen onder de AVG bij gebruik van AI-tools? We behandelen praktijkcases en geven concrete handvatten voor jouw organisatie.', 'aankomend', 'https://ictrecht.nl', '', '2026-04-10T14:00:00'],
  });
  const w2 = await client.execute({
    sql: `INSERT INTO webinars (title, description, status, cta_link, recording_link, date) VALUES (?,?,?,?,?,?)`,
    args: ['NIS2: cybersecurity verplichtingen voor jouw organisatie', 'De NIS2-richtlijn is in werking getreden. Wat betekent dit concreet voor jouw organisatie? We bespreken de meldplicht, beveiligingsmaatregelen en aansprakelijkheid van bestuurders.', 'afgelopen', 'https://ictrecht.nl', 'https://ictrecht.nl/opname-nis2', '2026-02-20T14:00:00'],
  });
  const w3 = await client.execute({
    sql: `INSERT INTO webinars (title, description, status, cta_link, recording_link, date) VALUES (?,?,?,?,?,?)`,
    args: ['Contracteren met AI-leveranciers: valkuilen en tips', 'AI-contracten zijn een juridisch mijnenveld. We behandelen de belangrijkste clausules, intellectueel eigendom, aansprakelijkheid en wat je beslist moet regelen voordat je tekent.', 'afgelopen', 'https://ictrecht.nl', 'https://ictrecht.nl/opname-ai-contracten', '2025-11-15T14:00:00'],
  });

  const ids = [Number(w1.lastInsertRowid), Number(w2.lastInsertRowid), Number(w3.lastInsertRowid)];

  await client.batch([
    { sql: 'INSERT INTO resources (webinar_id, title, url, description, sort_order) VALUES (?,?,?,?,?)', args: [ids[0], 'Handleiding AI & AVG', 'https://ictrecht.nl', 'Praktische gids over de verplichtingen bij AI-gebruik binnen de AVG', 0] },
    { sql: 'INSERT INTO resources (webinar_id, title, url, description, sort_order) VALUES (?,?,?,?,?)', args: [ids[0], 'EU AI Act samenvatting', 'https://ictrecht.nl', 'Overzicht van de belangrijkste verplichtingen uit de nieuwe AI-verordening', 1] },
    { sql: 'INSERT INTO resources (webinar_id, title, url, description, sort_order) VALUES (?,?,?,?,?)', args: [ids[0], 'Modelcontract AI-leverancier', 'https://ictrecht.nl', 'Downloadbaar modelcontract voor inschakeling van AI-dienstverleners', 2] },
    { sql: 'INSERT INTO resources (webinar_id, title, url, description, sort_order) VALUES (?,?,?,?,?)', args: [ids[1], 'NIS2 checklist voor organisaties', 'https://ictrecht.nl', 'Stap-voor-stap overzicht van verplichtingen onder NIS2', 0] },
    { sql: 'INSERT INTO resources (webinar_id, title, url, description, sort_order) VALUES (?,?,?,?,?)', args: [ids[1], 'Meldplicht beveiligingsincidenten', 'https://ictrecht.nl', 'Wanneer en hoe moet je een incident melden?', 1] },
    { sql: 'INSERT INTO resources (webinar_id, title, url, description, sort_order) VALUES (?,?,?,?,?)', args: [ids[2], 'Top 10 AI-contractclausules', 'https://ictrecht.nl', 'De clausules die je absoluut moet opnemen in elk AI-contract', 0] },
  ], 'write');

  const p1 = await client.execute({ sql: 'INSERT INTO polls (webinar_id, question, active) VALUES (?,?,?)', args: [ids[0], 'Welk onderwerp wil je behandeld zien in de volgende sessie?', 1] });
  const p2 = await client.execute({ sql: 'INSERT INTO polls (webinar_id, question, active) VALUES (?,?,?)', args: [ids[1], 'Hoe ver is jouw organisatie met NIS2-compliance?', 1] });

  const p1id = Number(p1.lastInsertRowid);
  const p2id = Number(p2.lastInsertRowid);

  await client.batch([
    { sql: 'INSERT INTO poll_options (poll_id, text, sort_order) VALUES (?,?,?)', args: [p1id, 'AI-wetgeving (EU AI Act)', 0] },
    { sql: 'INSERT INTO poll_options (poll_id, text, sort_order) VALUES (?,?,?)', args: [p1id, 'Contracten in de digitale economie', 1] },
    { sql: 'INSERT INTO poll_options (poll_id, text, sort_order) VALUES (?,?,?)', args: [p1id, 'Cybersecurity verplichtingen (NIS2)', 2] },
    { sql: 'INSERT INTO poll_options (poll_id, text, sort_order) VALUES (?,?,?)', args: [p1id, 'Datalekken & meldplicht', 3] },
    { sql: 'INSERT INTO poll_options (poll_id, text, sort_order) VALUES (?,?,?)', args: [p2id, 'Nog niet gestart', 0] },
    { sql: 'INSERT INTO poll_options (poll_id, text, sort_order) VALUES (?,?,?)', args: [p2id, 'In oriëntatiefase', 1] },
    { sql: 'INSERT INTO poll_options (poll_id, text, sort_order) VALUES (?,?,?)', args: [p2id, 'Bezig met implementatie', 2] },
    { sql: 'INSERT INTO poll_options (poll_id, text, sort_order) VALUES (?,?,?)', args: [p2id, 'Grotendeels compliant', 3] },
  ], 'write');

  const c1 = await client.execute({ sql: 'INSERT INTO comments (webinar_id, name, content, likes, pinned) VALUES (?,?,?,?,?)', args: [ids[1], 'Marloes de Vries', 'Erg informatieve sessie! De uitleg over de meldplicht was bijzonder helder.', 4, 1] });
  await client.batch([
    { sql: 'INSERT INTO comments (webinar_id, name, content, likes, pinned) VALUES (?,?,?,?,?)', args: [ids[1], 'Tom Bakker', 'Vraag: geldt de meldplicht ook voor kleine bedrijven met minder dan 50 medewerkers?', 2, 0] },
    { sql: 'INSERT INTO comments (webinar_id, parent_id, name, content, likes) VALUES (?,?,?,?,?)', args: [ids[1], Number(c1.lastInsertRowid), 'ICTrecht Academy', 'Goede vraag Tom! NIS2 geldt primair voor middelgrote en grote organisaties. We sturen je de exacte drempelwaarden toe.', 1] },
  ], 'write');
}
