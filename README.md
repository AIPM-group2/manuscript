# Manuscript

AI-assisted formatting compliance checker for academic manuscripts, initially scoped to the *Springer Pediatric Radiology* Instructions for Authors.

Manuscript lets a researcher upload a Word (`.docx`) manuscript and receive a structured compliance report against a journal's formatting rules — covering styles, headings, spacing, figures, captions, tables, and references. The tool is strictly formatting-only: it never edits or evaluates scientific content, and processing runs entirely client-side.

Live deployment: https://aipm-group2.github.io/manuscript/

---

## How it works

1. **Parse** — the uploaded `.docx` is parsed into a structured document representation (a Unified Document Object, or UDO).
2. **Validate** — rules are checked in two layers:
   - **Programmatic** — deterministic checks (styles, spacing, structure) requiring no external calls.
   - **Semantic** — AI-assisted checks for guideline rules that require judgment (e.g. caption phrasing, section ordering), evaluated via a user-supplied LLM API key.
3. **Fix** — low-risk, deterministic corrections (heading styles, spacing normalization, caption formatting) can be previewed and applied individually or in batch, with the original `.docx` structure preserved.
4. **Export** — a corrected `.docx` is generated for download; scientific content is never modified.

Journal rules for the initial scope (Pediatric Radiology) are defined per document type — research papers, case reports, reviews, methodologies, and comments — under `src/pediatric_journal_rules/`.

---

## Tech stack

- **Framework**: [SvelteKit](https://kit.svelte.dev/) 2 (Svelte 5), built with Vite and deployed as a static site (`@sveltejs/adapter-static`) to GitHub Pages
- **Styling**: Tailwind CSS 4
- **Authentication**: Firebase Authentication (email/password and Google sign-in)
- **AI inference**: [OpenRouter SDK](https://openrouter.ai/) for semantic rule validation; the Gemini SDK (`@google/generative-ai`) is present as an alternative provider path in `src/smarts.ts`
- **Document processing**: `mammoth` (.docx → HTML preview), `docx` / `docxtemplater` / `pizzip` (structured editing and export), `jszip` / `xml2js` (raw OOXML manipulation), `diff-match-patch` (change previews)
- **Testing**: Vitest

No backend server is used. Document parsing, rule evaluation, and export all run in the browser. LLM calls for semantic validation are made directly from the client using an API key the user provides and controls; nothing is persisted server-side (zero data retention).

---

## Getting started

### Prerequisites

- Node.js 18+
- npm
- An [OpenRouter](https://openrouter.ai/keys) API key (used for semantic rule validation; entered in-app, not via `.env`)
- A Firebase project if you intend to run your own authentication backend (see [Configuration](#configuration))

### Install and run

```bash
git clone https://github.com/AIPM-group2/manuscript.git
cd manuscript
npm install
npm run dev
```

The app is served at `http://localhost:5173`.

### Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Produce a static production build in `build/` |
| `npm run preview` | Serve the production build locally |
| `npm run deploy` | Publish `build/` to the `gh-pages` branch |

---

## Configuration

### LLM API key

Semantic validation is powered by OpenRouter. There is no server-side key: each user enters their own OpenRouter API key in the dashboard after signing in, and it is used only for the duration of the session. Switching providers (e.g. to Gemini) means swapping the implementation in `src/validators/semantic.ts` / `src/smarts.ts`, which already contains a commented-out Gemini code path.

### Firebase

Authentication is handled by Firebase (`src/lib/firebase.ts`). The current config points at a project used for development; to run against your own Firebase project, replace the `firebaseConfig` object with your project's credentials and enable Email/Password and Google providers in the Firebase console.

### Journal rules

Rules for a given journal and document type live under `src/pediatric_journal_rules/` and `src/config/journals/`. Adding a new journal means creating a new journal config (see `src/config/journals/pediatric-radiology.ts` for reference) and registering it via `registerJournal` in `src/analyzer.ts`.

---

## Project structure

```
manuscript/
├── src/
│   ├── analyzer.ts                  # Orchestrates parse → validate → report
│   ├── docx-parser.ts               # .docx → UDO (Unified Document Object)
│   ├── smarts.ts                    # LLM provider wiring (OpenRouter / Gemini)
│   ├── general_rules.ts             # Cross-journal baseline rules
│   ├── paper-type.ts                # Document-type detection
│   ├── config/journals/             # Per-journal rule configuration
│   ├── pediatric_journal_rules/     # Pediatric Radiology rules by document type
│   ├── validators/
│   │   ├── programmatic.ts          # Deterministic, non-AI checks
│   │   ├── deterministic.ts
│   │   ├── semantic.ts              # AI-assisted checks (OpenRouter)
│   │   └── semantic-rules.ts
│   ├── services/
│   │   ├── autofix.ts               # Applies low-risk automated corrections
│   │   ├── docx-smart-editor.ts     # Safe, structure-preserving .docx editing
│   │   └── docx-writer.ts           # .docx export
│   ├── types/                       # Shared types (rules, UDO)
│   ├── test/                        # Accuracy tests and guideline mapping
│   ├── lib/
│   │   ├── components/              # UI components (fix panels, viewer, cards)
│   │   ├── stores/                  # Svelte stores (auth, document history)
│   │   └── firebase.ts              # Firebase initialization
│   ├── routes/                      # SvelteKit pages (/, /login, /signup, /dashboard, /docs, /pricing)
│   └── styles/                      # Global and design-system CSS
├── static/                          # Static assets
├── svelte.config.js                 # Static-adapter + GitHub Pages base path config
└── package.json
```

---

## Product context

This project originated as an MVP for CS-500 (AI Product Management, EPFL). The underlying problem: clinician-researchers spend significant, largely unbilled time manually formatting manuscripts to meet journal-specific guidelines, often in the absence of any provided Word template. Manuscript targets this by scoping tightly to one journal and one document format, restricting itself to formatting-only operations (no edits to scientific content), and surfacing every check in an auditable compliance report.

Current scope: Springer Pediatric Radiology, `.docx` manuscripts, 53 encoded formatting rules. The roadmap extends this to a broader journal-template library and expanded automated-fix coverage; see the accompanying project report for details on validation approach, pilot plans, and business model.

---

### Contact

massimo.berardi@alumni.epfl.ch
