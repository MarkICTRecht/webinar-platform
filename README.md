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

---

## Bijdragen aan dit project

Dit is een community-project dat tijdens het webinar 'Slimmer werken met AI' gezamenlijk wordt gebouwd. Iedereen mag bijdragen — ook zonder programmeerervaring. Hieronder lees je hoe je dat doet met behulp van AI-tools.

### Hoe werkt bijdragen?

Je maakt een kopie van dit project op je eigen computer, voert daar je wijziging door, en dient die in via een **Pull Request** op GitHub. De beheerder beoordeelt je wijziging en voegt die toe aan het project.

De AI-tools verderop in deze handleiding helpen je bij elke stap.

---

### Aanbevolen aanpak: Antigravity + Claude Code

Je kunt kiezen welke tool je gebruikt op basis van je voorkeur:

| Situatie | Aanbevolen tool |
|---|---|
| Weinig technische ervaring | **Antigravity** |
| Liever visueel werken in een editor | **Antigravity** |
| Comfortabel met de terminal | **Claude Code** |
| Snel een kleine fix doorvoeren | **Claude Code** |

Voor de meeste deelnemers van het webinar raden we **Antigravity** aan.

---

### Methode 1 — Bijdragen via Google Antigravity (aanbevolen voor beginners)

**Wat is Antigravity?**
Antigravity is een gratis AI-programmeertool van Google. Het ziet eruit als een gewone code-editor, maar heeft een slimme assistent ingebouwd die zelfstandig taken uitvoert. Je beschrijft in gewone taal wat je wilt bereiken, en de AI schrijft de code, test het, en laat je het resultaat zien.

#### Stap 1 — Antigravity installeren

Ga naar [antigravity.google/download](https://antigravity.google/download) en download de versie voor jouw besturingssysteem (Windows, Mac of Linux). Installeer het zoals elk ander programma.

#### Stap 2 — Inloggen

Open Antigravity en log in met een Google-account (een gratis Gmail-account volstaat). Kies bij de werkmodus voor **"Agent-assisted development"** — dit is de aanbevolen instelling waarbij je de controle houdt.

#### Stap 3 — De repository openen

Je hebt een lokale kopie van dit project nodig:

```bash
git clone https://github.com/MarkICTRecht/webinar-platform.git
```

Of download de ZIP via de groene **"Code"**-knop op GitHub. Open daarna de map in Antigravity via **File → Open Folder**.

#### Stap 4 — De AI een opdracht geven

Klik op het **Agent Manager**-tabblad en typ in gewone taal wat je wilt:

> *"Voeg een knop toe waarmee deelnemers zich kunnen uitschrijven voor een webinar"*

> *"Verbeter de foutmelding op de registratiepagina"*

> *"Maak de homepagina ook goed leesbaar op mobiel"*

Kies **Plan mode** voor grotere wijzigingen (de AI legt eerst zijn plan voor) of **Fast mode** voor kleine aanpassingen. Klik op **Run**.

#### Stap 5 — Het resultaat beoordelen en accepteren

Gewijzigde bestanden worden groen of geel gemarkeerd. Bekijk de wijzigingen en klik op **"Accept All"** als alles er goed uitziet. Wil je iets anders? Typ je feedback en de AI past het aan.

#### Stap 6 — Je wijziging indienen

Maak een nieuwe branch aan en dien een Pull Request in. Weet je niet hoe? Vraag het de Agent Manager:

> *"Hoe maak ik een nieuwe branch aan en dien ik een Pull Request in voor dit project?"*

---

### Methode 2 — Bijdragen via Claude Code (voor terminalgebruikers)

**Wat is Claude Code?**
Claude Code is een AI-assistent van Anthropic die je vanuit de terminal direct met de codebase laat werken. Je stelt vragen en geeft opdrachten in gewone taal, Claude analyseert de code en voert wijzigingen door.

#### Stap 1 — Claude Code installeren

Je hebt Node.js 18 of hoger nodig. Controleer dit met:

```bash
node --version
```

Installeer Claude Code vervolgens:

```bash
npm install -g @anthropic-ai/claude-code
```

#### Stap 2 — Navigeer naar de projectmap en start Claude Code

```bash
cd webinar-platform
claude
```

#### Stap 3 — Geef een opdracht

Je bent nu in een interactieve sessie. Voorbeelden:

```
Wat doet dit project precies?
```
```
Voeg een functie toe waarmee admins webinars kunnen archiveren
```
```
Zijn er mogelijke problemen in de authenticatiecode?
```

Claude vraagt je bevestiging voordat het bestanden wijzigt.

#### Stap 4 — Je wijziging indienen

```bash
git checkout -b feature/jouw-wijziging
git add .
git commit -m "Beschrijving van de wijziging"
git push origin feature/jouw-wijziging
```

Maak vervolgens een Pull Request aan op GitHub.

---

### De krachtigste workflow: Antigravity én Claude Code samen

Voor grotere bijdragen werkt deze gecombineerde aanpak het beste:

1. **Plannen in Antigravity** — Gebruik de Planning Mode om een gedetailleerd implementatieplan op te stellen. Geef feedback en verfijn het.
2. **Plan exporteren** — Vraag Antigravity: *"Sla het plan op als `plan.md` in de projectmap."*
3. **Uitvoeren met Claude Code** — Start Claude Code en zeg: *"Voer het implementatieplan uit zoals beschreven in `plan.md`."*
4. **Reviewen in Antigravity** — Controleer het resultaat visueel en laat eventuele fouten oplossen.

---

### Tips voor een goede bijdrage

- **Beschrijf het probleem, niet de oplossing.** Zeg: *"Gebruikers zien geen foutmelding als een webinar vol is"* in plaats van *"voeg een `if`-statement toe op regel 42"*.
- **Kleine, gerichte wijzigingen.** Eén Pull Request per verbetering is overzichtelijker dan alles tegelijk.
- **Vraag om uitleg.** Begrijp je de code niet? Vraag: *"Leg uit wat je hier gedaan hebt en waarom."*
- **Test lokaal.** Draai `npm run dev` en controleer je wijziging in de browser voordat je een Pull Request indient.

---

### Veelgestelde vragen

**Moet ik kunnen programmeren om bij te dragen?**
Nee. Met Antigravity beschrijf je in gewone taal wat je wilt. Wel is het verstandig om te begrijpen wat er veranderd is voordat je het indient.

**Kost Antigravity geld?**
Nee, Antigravity is gratis tijdens de preview-periode. Je hebt alleen een gratis Google-account nodig.

**Kost Claude Code geld?**
Claude Code vereist een Anthropic-account. Er is een gratis laag beschikbaar; voor intensief gebruik heb je een betaald abonnement nodig. Zie [claude.ai/pricing](https://claude.ai/pricing).

**Wat als de AI een fout maakt?**
Dat kan. Controleer altijd wat de AI heeft gedaan voordat je het accepteert. Je kunt ook vragen om uitleg of correctie.

---

### Handige links

- [Antigravity downloaden](https://antigravity.google/download)
- [Getting Started met Antigravity (officiële codelab)](https://codelabs.developers.google.com/getting-started-google-antigravity)
- [Claude Code documentatie](https://docs.claude.ai/en/docs/claude-code/overview)
- [Hoe maak ik een Pull Request?](https://docs.github.com/nl/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request)
