# ICTRecht Webinar Community Platform

Ter ondersteuning van het ICTRecht live webinar 'Slimmer werken met AI' maken we gezamenlijk een platform.

Een intern platform voor de ICTRecht Academy webinar community. Deelnemers kunnen per sessie de materialen downloaden, een peiling invullen en vragen stellen via de discussie.

## Functionaliteiten

- **Homepage** — overzicht van alle webinars (aankomend, live, afgelopen)
- **Webinar pagina** — per sessie: resources, peiling en threaded discussie
- **Admin panel** — webinars aanmaken/bewerken, resources beheren, peiling instellen, reacties modereren

## Tech stack

- [Next.js](https://nextjs.org/) 16 (App Router, TypeScript)
- [Tailwind CSS](https://tailwindcss.com/) v4
- [SQLite](https://www.sqlite.org/) via `better-sqlite3` (lokale database)

## Lokaal draaien

```bash
npm install
npm run dev
```


