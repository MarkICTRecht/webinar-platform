import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'webinar.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS webinars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'aankomend' CHECK(status IN ('aankomend','live','afgelopen')),
      cta_link TEXT DEFAULT '',
      recording_link TEXT DEFAULT '',
      date TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      webinar_id INTEGER NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS polls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      webinar_id INTEGER NOT NULL UNIQUE REFERENCES webinars(id) ON DELETE CASCADE,
      question TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS poll_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS poll_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      option_id INTEGER NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
      voter_token TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      webinar_id INTEGER NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
      parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      hidden INTEGER DEFAULT 0,
      pinned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Seed demo webinars if empty
  const count = (db.prepare('SELECT COUNT(*) as c FROM webinars').get() as { c: number }).c;
  if (count === 0) {
    const insertWebinar = db.prepare(`
      INSERT INTO webinars (title, description, status, cta_link, recording_link, date)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const w1 = insertWebinar.run(
      'AVG & AI: wat mag en wat niet?',
      'In deze sessie bespreken we de juridische kaders rondom kunstmatige intelligentie en privacy. Wat zijn de verplichtingen onder de AVG bij gebruik van AI-tools? We behandelen praktijkcases en geven concrete handvatten voor jouw organisatie.',
      'aankomend', 'https://ictrecht.nl', '', '2026-04-10T14:00:00'
    );

    const w2 = insertWebinar.run(
      'NIS2: cybersecurity verplichtingen voor jouw organisatie',
      'De NIS2-richtlijn is in werking getreden. Wat betekent dit concreet voor jouw organisatie? We bespreken de meldplicht, beveiligingsmaatregelen en aansprakelijkheid van bestuurders.',
      'afgelopen', 'https://ictrecht.nl', 'https://ictrecht.nl/opname-nis2', '2026-02-20T14:00:00'
    );

    const w3 = insertWebinar.run(
      'Contracteren met AI-leveranciers: valkuilen en tips',
      'AI-contracten zijn een juridisch mijnenveld. We behandelen de belangrijkste clausules, intellectueel eigendom, aansprakelijkheid en wat je beslist moet regelen voordat je tekent.',
      'afgelopen', 'https://ictrecht.nl', 'https://ictrecht.nl/opname-ai-contracten', '2025-11-15T14:00:00'
    );

    const ids = [Number(w1.lastInsertRowid), Number(w2.lastInsertRowid), Number(w3.lastInsertRowid)];

    // Resources
    const insRes = db.prepare('INSERT INTO resources (webinar_id, title, url, description, sort_order) VALUES (?, ?, ?, ?, ?)');
    insRes.run(ids[0], 'Handleiding AI & AVG', 'https://ictrecht.nl', 'Praktische gids over de verplichtingen bij AI-gebruik binnen de AVG', 0);
    insRes.run(ids[0], 'EU AI Act samenvatting', 'https://ictrecht.nl', 'Overzicht van de belangrijkste verplichtingen uit de nieuwe AI-verordening', 1);
    insRes.run(ids[0], 'Modelcontract AI-leverancier', 'https://ictrecht.nl', 'Downloadbaar modelcontract voor inschakeling van AI-dienstverleners', 2);
    insRes.run(ids[1], 'NIS2 checklist voor organisaties', 'https://ictrecht.nl', 'Stap-voor-stap overzicht van verplichtingen onder NIS2', 0);
    insRes.run(ids[1], 'Meldplicht beveiligingsincidenten', 'https://ictrecht.nl', 'Wanneer en hoe moet je een incident melden?', 1);
    insRes.run(ids[2], 'Top 10 AI-contractclausules', 'https://ictrecht.nl', 'De clausules die je absoluut moet opnemen in elk AI-contract', 0);

    // Polls
    const insPoll = db.prepare('INSERT INTO polls (webinar_id, question, active) VALUES (?, ?, ?)');
    const p1 = insPoll.run(ids[0], 'Welk onderwerp wil je behandeld zien in de volgende sessie?', 1);
    const p2 = insPoll.run(ids[1], 'Hoe ver is jouw organisatie met NIS2-compliance?', 1);

    const insOpt = db.prepare('INSERT INTO poll_options (poll_id, text, sort_order) VALUES (?, ?, ?)');
    (['AI-wetgeving (EU AI Act)', 'Contracten in de digitale economie', 'Cybersecurity verplichtingen (NIS2)', 'Datalekken & meldplicht'] as const)
      .forEach((t, i) => insOpt.run(Number(p1.lastInsertRowid), t, i));
    (['Nog niet gestart', 'In oriëntatiefase', 'Bezig met implementatie', 'Grotendeels compliant'] as const)
      .forEach((t, i) => insOpt.run(Number(p2.lastInsertRowid), t, i));

    // Comments for webinar 2
    const insCom = db.prepare('INSERT INTO comments (webinar_id, name, content, likes, pinned) VALUES (?, ?, ?, ?, ?)');
    const c1 = insCom.run(ids[1], 'Marloes de Vries', 'Erg informatieve sessie! De uitleg over de meldplicht was bijzonder helder.', 4, 1);
    insCom.run(ids[1], 'Tom Bakker', 'Vraag: geldt de meldplicht ook voor kleine bedrijven met minder dan 50 medewerkers?', 2, 0);
    db.prepare('INSERT INTO comments (webinar_id, parent_id, name, content, likes) VALUES (?, ?, ?, ?, ?)').run(
      ids[1], Number(c1.lastInsertRowid), 'ICTrecht Academy',
      'Goede vraag Tom! NIS2 geldt primair voor middelgrote en grote organisaties. We sturen je de exacte drempelwaarden toe.', 1
    );
  }
}
