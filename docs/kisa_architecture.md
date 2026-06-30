# Project Al-Kisa: Master Architecture & Context

---
## 0. CURRENT STATE — last updated 2026-06-30 (read this first)

This section captures the most recent working session so a fresh session has full context. Where it conflicts with older sections below, **this wins**.

### Positioning
Al-Kisa is a **Twelver Shia learning platform** with **two equal pillars** — (1) structured learning / **The Academy** (courses, scholarly transcript library, revision) and (2) **concept (semantic) search of hadith**. Do not treat either as secondary. Differentiator surfaced on the homepage: **Zahraʾism / "the Zahraʾi approach"** — teaching the religion in the words of the Ahl al-Bayt themselves (their own definitions), framed *additively* (go to the source), not against scholars. All content is **reviewed by Shia experts** (surfaced as a trust signal).

### Design system (NEW — "Manuscript / Sacred")
A premium redesign replacing the old gold-on-gray look. **Currently applied to: homepage, global header, footer, and global canvas background.** Content pages (Quran, Hadith, Academy, Duas, Glossary, search results) still use the **legacy palette** (gold `#c6a87c`, gray `#F5F5F7`/black) internally — a full palette pass is pending.
- **Fonts:** `Fraunces` (display serif) + `Inter` (sans), loaded via the `@import` in `src/index.css`. Arabic still uses Scheherazade/Amiri.
- **Light ("Manuscript") tokens:** bg `#f5efe4`, surface `#fbf8f1`, ink `#231d15`, muted `#6d6151`, gold `#9c7327`, gold-fill (buttons) `#c9a14e` on `#201a10`.
- **Dark ("Sacred") tokens:** bg `#0f1012`, surface `#17181c`, ink `#efe9dd`, gold `#cda767`.
- Homepage scopes these as CSS vars under `.hx-home` / `:where(.dark) .hx-home` (inline `<style>` in `Home.jsx`). Theme switches via the `.dark` class on `<html>` (light/dark/sepia state in `App.jsx`; sepia falls back to light-ish).
- Global canvas warmth set in `App.jsx` `getAppBgClass()` + the body-bg `useEffect` (light `#f5efe4`, dark `#0f1012`).

### Homepage (`src/components/Home.jsx`) — fully redesigned
Sections top→bottom: asymmetric **hero** (headline + 2 CTAs + trust strip) with the **Featured Masterclass "The Third Testimony"** card (routes to transcript slug `the-third-testimony-ep1` — **VERIFY this slug exists**), **Daily Hadith** band (copy/shuffle/focus-modal logic preserved), **liturgical recitation** chip, the **Zahraʾi "Why Al-Kisa" manifesto** (dark band), **"Where to begin"** = two raised pillars (The Academy / Concept Search) + three compact rows (Quran, Duʿaʾ & Ziyarat, Glossary), **closing CTA**. Reveal-on-scroll via framer `whileInView`. Content width: `.hx-wrap` max-width **1600px** with fluid padding `clamp(20px,4vw,80px)` (near-full-width desktop; readable via per-element ch/em caps); header inner container matched to 1600px.

### The Panjetan motif (`src/components/KisaMotif.jsx`)
Recolourable (`currentColor`) SVG of the Panjetan (5 names + Allah). **⚠️ PLACEHOLDER — traced via potrace from a watermarked product photo (`public/kisamotif.jpg`, untracked). Must be replaced with a licensed/commissioned vector before any real launch.** Assets: `public/kisa-motif.svg`, `public/kisa-motif.png`.

### App.jsx decomposition (refactor)
`App.jsx` went from ~2,146 → ~1,450 lines. Search domain extracted behind **`src/contexts/SearchContext.jsx`** (`useSearchContext()`); state still lives in `AppContent`, exposed via a `searchContextValue` object built before `return`. Extracted components: `SearchOverlay`, `SearchResults`, `ClusterModal`, `AnchorModal`, `QuranPopup`, `AuthModal`, `SignOutModal`, `MobileNav`, `UpdatesModal`, `InfoModal`, `Icons` (KisaLogo, AnimatedMenuIcon), `RouteHelpers` (DeepLinkCatcher, ScrollToTop); plus `src/constants.js`, `src/utils.js`. **Gotcha:** when a popup reads a `showX` flag from context, ensure BOTH `showX` and `setShowX` are in `searchContextValue` (a missing `showX` ships silently — build & smoke can't catch popups they don't open).

### Header & footer (redesigned)
Header (in `App.jsx`): "Al-**Kisa**" Fraunces wordmark, warm bar, **sleek search FIELD** (icon-only on mobile; opens the existing search overlay), visible gold **"Sign in"** button when logged out (account icon → user hub when logged in). Footer (`Footer.jsx`): warm paper bg + Fraunces wordmark; columns Explore / Resources + legal bar.

### Testing & gates (NEW)
- **Playwright smoke suite:** `concept-ui/tests/smoke.spec.js` (8 tests) — run `npm run test:e2e` (config boots vite, mobile viewport). Covers: header controls, header Sign-in→auth modal, nav→Updates/Help modals, search overlay (mode toggle placeholder, quick-link nav, glossary nav), and a mocked search rendering clusters + opening the cluster modal.
- **`npm run build`** (vite) is the structural gate. ESLint is noisy (~500 preexisting prop-types/entity errors) — not a useful gate.
- These two (build + smoke) are the ONLY automated safety net — there are no unit tests. Verify visually via Playwright screenshots against the dev server.
- Tooling installed locally this session: `@playwright/test` + chromium; `potrace` (brew) + `Pillow` (venv) for motif tracing.

### Backend
`concept-api/server.js` (Express, port 8000): concept search = ontology anchor scan → HF embedding (`all-MiniLM-L6-v2`) → Pinecone query → K-Means → Gemini cluster labels; keyword search = SQLite scan. Ontology regexes are **precompiled once at load** (`item.regex`). Verified working (concept query → 150 results ~12s). Needs env in `concept-api/.env`: `HF_TOKEN`, `PINECONE_API_KEY/HOST/INDEX_NAME`, `GEMINI_API_KEY`.

### ⚠️ Dev gotchas
- **`VITE_API_URL` stale-IP trap:** local `concept-ui/.env` had a hard-coded LAN IP (`192.168.0.162`) that went stale (machine was `.202`) → every search spins forever. **Use `http://localhost:8000` for desktop dev.** Vite only reads `.env` at server start — **restart `npm run dev` after editing `.env`.** (`.env` is gitignored; production leaves `VITE_API_URL` unset → relative `/api` via reverse proxy.)
- **Dev servers:** `concept-ui` = vite on **5173**; `concept-api` = `node server.js` on **8000** (run from `concept-api/` so it loads its `.env`). Both pinned to those ports. `.claude/launch.json` lists them.

### Basa'ir al-Darajat translation + honorific rendering (NEW — this session, 2026-06-30)
Translating *Basa'ir al-Darajat* (al-Ṣaffār) into the Hadith Library so it reads exactly like al-Kāfi. Scaling the full book (~899 pages / ~1,800 narrations) chapter-by-chapter.

> **▶ RESUME HERE (next action):** Part 1 **Ch 1–3 = 25 narrations done & committed to `main`** (repo is now `github.com/hadimh99/Kisa`). **All leads follow the scholar's closest-to-the-Imam rule** (see conventions below); **1-1-5 is a non-Imam report** (`nonImamReport` flag + UI footnote). **Next is Ch 4** (PDF p.27+) — **wait for the user's explicit go-ahead**. To continue: re-read this subsection (the conventions + pipeline below), then render PDF pages with PyMuPDF (`venv/bin/python`, `fitz.Matrix(4.5,4.5)` zoomed band crops read cleanly), read the Arabic/English visually, translate, and append using the same `manual_chain`/`manual_body` format (apply ALL the translation conventions below — lead rule, honorifics, kunya table, plain English, mithl cross-ref, non-Imam footnote). Verify in the app (`/hadith/basair-al-darajat/vol-1/part-1/<slug>`; slug = `slugifyHadithParam(chapter)` from `HadithLibrary.jsx`). **Dev gotcha:** the Claude preview proxy can't reach vite (vite ignores the assigned PORT and binds 5173/5174) — drive **`http://localhost:5173`** directly for visual checks.

- **Source & extraction gotcha:** the PDF is `~/Documents/BasaairAlDarajaat-Full.pdf` — the **hubeali.com bilingual edition** (899 pp, Arabic + an existing clunky English). **The embedded Arabic text layer is CORRUPTED** (broken font encoding: `رسول الله` extracts as `رحللح الله`, `محمد` → `مح مد ح`). **Never copy the Arabic from the text layer.** The pipeline: **render each page to an image with PyMuPDF** (`fitz`, installed in `venv`; e.g. `doc[i].get_pixmap(matrix=fitz.Matrix(3,3)).save(...)`) → **read the Arabic + hubeali English visually from the image** → **re-translate fresh from the Arabic** (hubeali used only to cross-check isnad name spellings — chosen approach, "Option C") → emit schema records → user's **scholar reviews** (ship behind the `ai_translation_flag` provenance pattern). Done **chapter-by-chapter**.
- **Data file:** `concept-ui/public/basair_complete.json`. Old staged content (Part 1 Ch 1+2, partly malformed) was backed up to `basair_complete.BACKUP-20260630.json` and the file reset. Schema **matches al-Kāfi** (`thaqalayn_complete.json`): `id` (`basair-{part}-{ch}-{n}`), `bookId`, `book` ("Basa'ir al-Darajat"), `volume` ("Part 1"), `category`, `chapter`, `chapterInCategoryId`, `author`, `translator` ("Al-Kisa Digital Engine"), `englishText`, `arabicText`, `thaqalaynSanad`, `thaqalaynMatn`. Build script lives in the session scratchpad (not committed).
- **Loaded into the app:** `App.jsx` `fetchHybridData` now also `fetch('/basair_complete.json')` and concats it into `staticData` (it was previously staged but **never fetched**). It surfaces as its own book in `HadithLibrary` next to al-Kāfi.
- **House style for honorifics (translation conventions):**
  - **Imams → `{{AS}}` token** → renders the **ʿalayhi al-salām calligraphy** (`public/alayhi-salam.svg`, recoloured to `currentColor` via CSS mask). **Do NOT write `(a.s.)`** or variants next to Imam names.
  - **Prophet → `{{SAW}}` token** → renders the **compact ﷺ glyph** (U+FDFA, Scheherazade New/Amiri). Vary the title across hadiths: "Rasulullah" / "The Messenger of Allah" (not "Rasool-Allah (s.a.w.a.)"). *(A custom wa-ālihi phrase form was tried then reverted to the glyph per the user; the glyph is current. A compact calligraphic SVG of "ṣallā Allāhu ʿalayhi wa-ālihi wa-sallam" — like the alayhi-salam asset — is the way to get both compact AND the Aal if wanted later.)*
  - **No honorific for Allah** (plain "Allah").
  - **Kunya → Imam clarifiers, Chapters 1–5 ONLY** (then retired, once readers have learned): e.g. "Abu Abdullah (al-Sadiq)", "Ameer al-Mu'mineen (Imam Ali)". **Only attach an Imam honorific/clarifier to an actual Imam** — watch genealogies (e.g. "Ahmad b. Umar b. Ali b. Abi Talib" is a *narrator descended from* Imam Ali, not an Imam himself).
  - **Imam kunya / title reference (added 2026-06-30 — use to identify WHICH Imam a name refers to):** isnads name the Imams by patronymic, kunya, or title. Map them with the table below. **Several kunyas are shared** and are disambiguated only by an ordinal (*al-Awwal / al-Thani / al-Thalith*) or by context — see the warnings.

    | # | Imam (clarifier to use) | Names / kunyas seen in isnads |
    |---|---|---|
    | 1 | Imam Ali | ʿAli b. Abi Talib · Amir al-Muʾminin · **Abu al-Hasan** |
    | 2 | Imam al-Hasan | al-Hasan b. Ali · Abu Muhammad · al-Mujtaba |
    | 3 | Imam al-Husayn | al-Husayn b. Ali · Sayyid al-Shuhadaʾ · Abu Abdillah |
    | 4 | Imam al-Sajjad | ʿAli b. al-Husayn · Zayn al-ʿAbidin · Sayyid al-ʿAbidin · al-Sajjad |
    | 5 | Imam al-Baqir | Muhammad b. Ali · **Abu Jaʿfar** · al-Baqir · *(called al-Sadiq only when paired with his son — "al-Sadiqayn")* |
    | 6 | Imam al-Sadiq | Jaʿfar b. Muhammad · al-Sadiq · Abu Abdillah |
    | 7 | Imam al-Kadhim | Musa b. Jaʿfar · **Abu al-Hasan (al-Awwal / al-Madi)** · Abu Ibrahim · al-ʿAbd al-Salih · al-ʿAlim |
    | 8 | Imam al-Rida | ʿAli b. Musa · al-Rida · **Abu al-Hasan al-Thani** · al-Faqih |
    | 9 | Imam al-Jawad | Muhammad b. Ali (al-Thani) · **Abu Jaʿfar al-Thani** · al-Jawad · al-Taqi |
    | 10 | Imam al-Hadi | ʿAli b. Muhammad · al-Hadi · **Abu al-Hasan al-Thalith** · al-Naqi · **al-ʿAskari** |
    | 11 | Imam al-ʿAskari | al-Hasan b. Ali (al-Thani) · Abu Muhammad · **al-ʿAskari** |
    | 12 | Imam al-Mahdi | al-Hujjat b. al-Hasan · al-Mahdi · al-Qaʾim · al-Hujjah |

    **Ambiguity warnings:** (a) **"Abu al-Hasan"** alone = Imam Ali, al-Kadhim (*al-Awwal*), al-Rida (*al-Thani*), or al-Hadi (*al-Thalith*) — the ordinal decides. (b) **"Muhammad b. Ali" / "Abu Jaʿfar"** → al-Baqir by default; *al-Thani* → al-Jawad. (c) **"al-Hasan b. Ali"** → Imam al-Hasan by default; *al-Thani* / *Abu Muhammad* / *al-ʿAskari* → al-ʿAskari. (d) **"al-ʿAskari"** is shared by al-Hadi (10th) and al-ʿAskari (11th). (e) **"al-Sadiq"** can mean al-Baqir under the dual "al-Sadiqayn". **For Basa'ir Part 1 (overwhelmingly al-Baqir & al-Sadiq): default Abu Jaʿfar → al-Baqir, Abu Abdillah → al-Sadiq** unless context says otherwise.
  - **Plain, impactful English (set 2026-06-30):** translate into words a modern reader understands instantly while staying accurate and weighty. **Avoid archaic/literalist hadith-ese** — e.g. NOT "the like of it", "verily", "thereof". Render the meaning naturally (e.g. mithl → "the same report"). Accuracy and impact first; never sacrifice either for fanciness.
  - **Cross-reference (mithl / "similar") narrations:** when a narration only gives an isnad and says *mithl dhālik* ("the same"/"similar"), do **not** write "the like of it". State plainly **which hadith it matches, in brackets** — e.g. *"Ibrahim B. Hashim narrates the same report (Hadith 3) from Abu Ja'far (al-Baqir) {{AS}}."* `thaqalaynMatn` gets a short note like *"(The same report as Hadith 3.)"* (no quoted matn block / no `\n\n`).
  - **Matn on its own line:** put `\n\n` right before the quote so the attribution and the quoted matn render as separate paragraphs.
  - **Narrator-led attribution format (set 2026-06-30; lead rule revised by scholar 2026-06-30):** the displayed body must **lead with the narrator _closest to the Imam_** — the **last link before the Imam**, i.e. the person the Imam was actually conversing with — rendered **`B.` not `Bin`**, then flow to the speaker. (This is the scholar's rule; it **replaces** the earlier "lead with al-Ṣaffār's first link" and "famous-narrator-precedence" versions. The goal: the reader can see which narrator heard which report from which Imam.) Connectors: Imam→Prophet = *"…narrates that Abu Ja'far (al-Baqir) {{AS}}, narrates that Rasulullah {{SAW}} said:"*; Imam via his father (an Imam) = *"…narrates that Abu Abdullah (al-Sadiq) {{AS}}, from his father, Abu Ja'far (al-Baqir) {{AS}}, who said: Rasulullah {{SAW}} said:"* (**name the father Imam**, don't leave "his father" vague); Imam speaking directly = *"…is reported to have said:"*; **Imam relaying another Imam** (e.g. al-Sadiq via Amir al-Mu'minin) = slim it to *"…from Ameer al-Mu'mineen (Imam Ali) {{AS}}, who said:"* — **do not stack two "narrates that"** (the only kept double is Imam→Prophet, e.g. H8). **Which narrator leads (closest-to-the-Imam rule):** (1) if the last link before the Imam is a **named** narrator → lead with that name (e.g. `…→ Jabir → al-Sadiq` ⇒ *"Jabir narrates that Abu Abdullah (al-Sadiq) {{AS}}…"*). (2) If the last link is **relational or unnamed** — "from his father / brother / grandfather", "a man from our companions", "one of his companions" — **start one narrator earlier (the nearest named link) and keep the connector**, so it's never a bare "his father". E.g. 1-1-1 ⇒ *"al-Hasan B. Zayd…, from his father, from Abu Abdullah (al-Sadiq) {{AS}}, who narrates that Rasulullah {{SAW}} said:"*; 1-2-10 ⇒ *"Ali B. Asbat, from one of his companions, from Abu Abdullah (al-Sadiq) {{AS}}, from Ameer al-Mu'mineen (Imam Ali) {{AS}}, who said:"*. **"Famous narrators" no longer get precedence** — they usually coincide with the closest link anyway (Jabir, Abu Basir, Muhammad B. Muslim), and where a famous name sits mid-chain (e.g. Ibn Abi Umayr in 1-2-3) the *named direct hearer* leads instead (Abdul Rahman B. al-Hajjaj). The connectors above still apply once the lead name is chosen.
  - **Reports NOT from an Imam (rare):** a chain may end at a transmitter with no Imam quoted (e.g. 1-1-5, "Ahmad B. Umar B. Ali B. Abi Talib is reported to have said:" — a descendant of Imam Ali, **not** an Imam). Render it as that narrator's own statement (**no `{{AS}}`, no Imam attribution**) and set **`"nonImamReport": true`** on the record. The reader (`HadithLibrary.jsx`) shows a small muted footnote ("† This narration is reported on the authority of a transmitter rather than one of the Imams…") so readers aren't confused. *(Footnote lives only in `HadithLibrary` for now — same shared-module TODO as the honorifics.)* The **full isnad** still goes in `manual_chain` (the collapsible "View Chain of Narrators"); `B.` is used there too. **Implementation:** authored via explicit **`manual_chain` + `manual_body`** fields on each record (the reader's `hadith.manual_body || parsedBody` path bypasses `splitText`), so display is exact rather than regex-parsed. `englishText` keeps a `"N. " + body` copy for the hadith-number badge + search.
  - **No `(a.z.w.j.)` for Allah** — plain "Allah".
- **Rendering implementation (`HadithLibrary.jsx`):** added module-level `renderHonorifics(text)` (`{{AS}}`→masked SVG span, `{{SAW}}`→ﷺ span) and `tokensToPlain(text)` (clipboard/Vault fallback: `(alayhi al-salaam)`, `ﷺ`). Wired into the body render, the chain render, and the in-component search preview; copy + Vault-save use `tokensToPlain`. `splitText`'s `blessingRegex` was **extended to recognise `{{AS}}`/`{{SAW}}`** (it's load-bearing for chain/body separation), and `bodyPart`'s `.trim()` was changed to **preserve a leading newline** so the matn line-break survives (al-Kāfi is unaffected — its data has no newlines). **NB:** the §4 "Calligraphy Token Swapping" feature was *documented but never actually wired into `HadithCard`*; it is now genuinely implemented — **but only in `HadithLibrary`** (see TODO below). Asset filename is `alayhi-salam.svg` (hyphen), not the `alayhis_salam.svg` §4 claims.
- **Tooling:** `PyMuPDF` installed in `venv` (PDF render). `.claude/launch.json` got `"autoPort": true` on `concept-ui` so the preview server can run alongside a manually-started dev server (Vite ignores the assigned PORT and picks 5174 when 5173 is busy — drive that URL directly). Also fixed: the basair fetch in `App.jsx` was `cache: 'force-cache'` (would freeze content for users on every translation update) → changed to `cache: 'no-cache'` so updates propagate.
- **⚠️ ARABIC NEEDS SCHOLAR PROOFING (user will do this once the book is done):** all `arabicText` was transcribed by visually reading the rendered page images (the PDF text layer is corrupted), so it needs an Arabic-proofing pass before it can be considered authoritative. Known watch-items so far: **Ch2 H3 & H7** sit across page breaks (partly reconstructed); **H7 angel count** ("a thousand" per hubeali vs possibly "seventy thousand"); isnad name **al-Mufaddal B. Salih vs "Salim"**; **Ch3 isnad names** — `al-Husayn B. Saeed` (hubeali shows "al-Saeed"; normalized to house spelling), `Muhammad B. al-Husayn B. Sagheer`, `Umar B. Qays al-Masir`, and H2's marfu' note ("raising it" = yarfaʿuhu); general diacritics. The English re-translation also gets the same scholar review. (Provenance: ship behind the `ai_translation_flag` pattern.)
- **Progress:** **Part 1 Ch 1–3 = 25 narrations done & committed** (Ch 1–2 originally `cdd399b`; Ch 3 + first lead pass `5b82a09`; then the closest-to-Imam re-lead of all 25 + 1-1-5 non-Imam + footnote + scholar conventions). Part 1 has 24 chapters; the book has ~10 parts (~1,800 narrations). **Next: Ch 4** (PDF p.27+) — **only on the user's say-so**. The local backup `concept-ui/public/basair_complete.BACKUP-20260630.json` and `kisamotif.jpg` were intentionally left untracked (not committed).

### Git workflow & open TODOs
- **Workflow:** commit straight to **`main`**; the user runs `git push` (deploys UI to Vercel; `concept-api` deploys on Render separately). As of this writing **`main` has unpushed commit(s) incl. `cdd399b` (Basa'ir Ch 1–2)** — the user intends to push this to go live before Ch 3.
- **Open TODOs:** (1) **Phase 2b** — simplify the search OVERLAY (`SearchOverlay.jsx`): drop the Platform Search/Knowledge Graph toggle, make concept the default, add smart routing; behavioural, so update smoke tests #5–8. (2) Replace the placeholder Panjetan motif with a **licensed vector**. (3) Verify the **`the-third-testimony-ep1`** transcript slug exists. (4) **Full palette pass** on content pages (still legacy gold/gray). (5) Have **Shia experts verify** the Zahraʾism manifesto wording + the Arabic glyph on the masterclass cover. (6) Backlog from the UX audit: WCAG contrast on faint text, more icon-button aria-labels, Academy → curriculum/"continue learning", Ziyarat is a stub.
- **Basa'ir in search results / shared honorific rendering (PLANNED):** Honorific rendering currently lives **only in `HadithLibrary`** (the browse reader). Search results render through **`HadithCard.jsx`**, which has its own `splitText`, reads `english_text`/`arabic_text` (snake_case), and renders the body via `renderTextWithQuranLinks` — with **no honorific/token support**, so Basa'ir's `{{AS}}`/`{{SAW}}` would leak as raw text and the matn line-break wouldn't apply. **Plan — two parts:** (a) **Rendering:** extract `renderHonorifics` / `tokensToPlain` / the `{{AS}}|{{SAW}}` `blessingRegex` additions / the leading-newline `bodyPart` fix into a **shared module** and apply them in `HadithCard` too (so search cards match the reader). (b) **Searchability (bigger, backend):** Basa'ir is static JSON and is **not in any search index** — concept search hits **Pinecone** and keyword search hits **`thaqalayn.db`** (SQLite via `concept-api`), neither of which contains Basa'ir. To actually appear in global search it must be **embedded → upserted to Pinecone** (concept) and/or **added to the keyword source**. Until (b) is done, Basa'ir only shows in the in-library browse + the library's own search box (both already token-aware).
- **App Store (iOS) track — planned, prep phase:** Decision recorded in §5 ("App Store (iOS) Distribution"). Approach = **Capacitor wrapper** (reuse the existing React build), **not** a native Swift rewrite. User opted to do the **prep work first** before any app shell. Prep items 1–3 are code/content (account deletion, privacy policy, hide Ziyarat/admin in app builds); items 4–5 are user actions (always-on Render tier, licensed motif). **No app code written yet.**

---

## 1. Core Mission
Al-Kisa is a highly sophisticated semantic search engine and theological workspace built specifically for authentic Twelver Shia literature. It bridges the gap between ancient texts and modern data science, leveraging AI vector embeddings and NLP to map the underlying meaning of foundational texts (like *al-Kafi*, *Bihar al-Anwar*, and *Basa'ir al-Darajat*). 
* **Theological Framework:** Built strictly on Twelver Shia theology. Core Shia texts are prioritized over Sunni books unless explicitly instructed otherwise.
* **Mechanism:** A React frontend connects to a Node.js backend. It uses a hybrid architecture: querying a local SQLite database for raw text, keywords, and theological ontology anchors, while querying a cloud Pinecone database for 384-dimensional semantic hadith matching.

## 2. The Tech Stack
* **Frontend:** React (Modularized architecture with `App.jsx` acting as the router/wrapper for isolated components like `QuranReader.jsx`, `KisaAcademy.jsx`, `TranscriptLibrary.jsx`, `CourseLibrary.jsx`, `HadithLibrary.jsx`, `StudyVault.jsx`, `HadithCard.jsx`, `DuaLibrary.jsx`, `TheKisaExperience.jsx`, `Home.jsx`, `MasteryRing.jsx`, `RevisionModule.jsx`, `ContextualBridge.jsx`, `ChapterTitleHeading.jsx`, `KisaCommandCenter.jsx`, `HadithManager.jsx`, `BrainOntology.jsx`, `TranscriptEditor.jsx`, `CMSDashboard.jsx`, `Glossary.jsx`, and `Footer.jsx`), Framer Motion (animations), Tailwind CSS v4 (via `@tailwindcss/postcss`), Lucide React (iconography), `@vercel/analytics` (tracking), `clsx` & `tailwind-merge` (dynamic class management), and `jspdf` & `html2pdf.js` (native PDF exports).
* **Local Data:** `transcripts.json` (translated scholarly commentary — AI-translated Arabic lecture transcripts stored in a strict segmented JSON schema; see §4, Semantic Commentary Layer), `revision_data.json` (NotebookLM LMS data), `thaqalayn_complete.json` (14,500+ hadiths, hosted in `public/` for async streaming), `basair_complete.json` (*Basa'ir al-Darajat* narrations, hosted in `public/`), `quran.json` (Quranic text, mirrored in both `src/` and `public/`), `verse_map.json` (Tafsir connections), `quranBenefits.js` (Twelver Fadhaa'il database), `duas.json` (supplication library with Arabic, transliteration, and English passages), `daily_hadiths.json` (curated daily hadith pool), `curated_exploration.json` (pre-built semantic search shortcuts for the home screen), and `alayhis_salam.svg` (HD vector honorific calligraphy).
* **Backend:** Node.js / Express (`server.js`) located in the `concept-api` folder. A secondary FastAPI / Python backend (`server.py`) exists at the project root for the standalone Concept Atlas vector search API (local SQLite + K-Means clustering).
* **BaaS & Cloud:** Supabase (Authentication & PostgreSQL for user-saved data and live master database).
* **Databases:** 
  * SQLite (`thaqalayn.db` for active text, hadiths, and the Al-Kisa Ontology Brain).
  * SQLite (`concept_atlas.db` for the standalone Concept Atlas vector search engine, storing hadith embeddings as raw binary blobs).
  * SQLite (`alkafi.db` — additional local database).
  * ChromaDB (`chroma_db/chroma.sqlite3` — vector store used for experimental embedding workflows).
  * Supabase PostgreSQL (`kisa_hadiths` for the live, editable master hadith library).
  * Supabase PostgreSQL (`vault_items` for secure cloud-synced user bookmarks and reflections).
  * Pinecone (Cloud Vector database storing the pre-computed mathematical embeddings of the hadiths).
* **AI/ML:** 
  * Hugging Face (`all-MiniLM-L6-v2` model for 384-dimensional mathematical vectors & K-Means clustering).
  * Gemini API (`gemini-2.5-flash` — Used for generative cluster labeling based on internal narrations and Arabic-to-English query translation).
  * Python (`sentence-transformers` used locally for one-off database embedding tasks; FastAPI backend for local vector search in `server.py`).
* **Build Tooling:** Vite (`vite.config.js`), PostCSS (`postcss.config.js` with `@tailwindcss/postcss`), ESLint (`eslint.config.js`).
* **Environment Configuration:** Vite exposes build-time environment variables via `import.meta.env`. The key variable `VITE_API_URL` controls the API base URL. For **local development**, it is set in `concept-ui/.env` (e.g., `VITE_API_URL=http://localhost:8000`). In **production**, `VITE_API_URL` is intentionally left **unset** so that all API calls resolve as relative paths (e.g., `/api/ontology`), allowing the reverse proxy (Nginx/Caddy) to handle routing natively without exposing internal ports or forcing insecure protocols.
* **Fonts:** Google Fonts (`Scheherazade New` loaded via `index.html`), local custom Arabic font (`me_quran.ttf` in `public/`), with a 3-tier font selector in-app (Scheherazade, Uthmani/Amiri Quran, XBZarFont).

## 3. Database Schema (The Ontology & User Engine)
The local SQLite database contains the raw hadiths alongside three active tables that form the "Al-Kisa Ontology Brain", while Supabase handles cloud user data and the master hadith table:
1. `ontology_concepts` (SQLite): The master list of core theological terms (Columns: `id`, `transliteration`, `primary_arabic`, `root_letters`, `primary_english`, `domain`, `definition`, `vector_embedding`).
2. `ontology_synonyms` (SQLite): The translation net linking English aliases and lazy-typing to core concepts. Highly tuned to capture common user search habits, automatically handling missing apostrophes, dropped 'al-' prefixes (e.g., 'Sufyani' instead of 'al-Sufyani'), and alternative transliterations (e.g., 'Ghaybatul Kubra'). (Columns: `id`, `concept_id`, `variant_text`, `language`, `weight`).
3. `ontology_relations` (SQLite): The knowledge graph linking concepts to each other (Columns: `id`, `source_concept_id`, `target_concept_id`, `relation_type`).
4. `vault_items` (Supabase Postgres): Secure cloud storage for user-saved narrations, Quranic verses, transcript passages, and Dua passages. (Columns: `id`, `user_id`, `content`, `arabic_text`, `chain`, `source`, `type` *(`hadith`, `quran`, `transcript`, `dua`)*, `folder_name` *(comma-separated for multi-tagging)*, `note`, `created_at`).
5. `kisa_hadiths` (Supabase Postgres): The live, master repository for all narrations, supporting real-time administrative overrides. (Columns: `id`, `book`, `volume`, `category`, `chapter`, `hadith_number`, `author`, `englishText`, `arabicText`, `majlisiGrading`, `manual_body`, `manual_chain`, `is_flagged` *(boolean — collaborative review flag)*, `assigned_to` *(text — admin assignment routing)*, `internal_notes` *(text — inter-admin commentary)*, `last_edited_by` *(text — audit trail via Supabase Auth email)*, `is_trashed` *(boolean — soft-delete)*, `updated_at`).
6. `hadiths` (SQLite — `concept_atlas.db`): The standalone Concept Atlas embedding store. (Columns: `hadith_id`, `arabic_text`, `english_text`, `embedding` *(binary BLOB, float32 NumPy arrays)*).
7. `ontology_concepts` (Supabase Postgres): Cloud-hosted master list of theological concepts for the Brain Ontology CMS. Mirrors the SQLite ontology schema but enables real-time collaborative editing via the Command Center. (Columns: `id`, `transliteration`, `primary_arabic`, `root_letters`, `primary_english`, `domain`, `definition`, `embedding`). Protected by RLS.
8. `ontology_synonyms` (Supabase Postgres): Cloud-hosted synonym/spelling variants linked to concepts. (Columns: `id`, `concept_id`, `variant_text`, `language`, `weight`). Protected by RLS.
9. `ontology_relations` (Supabase Postgres): Cloud-hosted directional knowledge-graph edges between concepts. (Columns: `id`, `source_concept_id`, `target_concept_id`, `relation_type`). Foreign key constraint: `ontology_relations_source_concept_id_fkey`. Protected by RLS.
10. `kisa_transcripts` (Supabase Postgres): The live content table for scholarly commentary episodes (now backs the public reader, superseding the static `transcripts.json` bundle). Key columns: `id` *(text/slug PK)*, `series_name`, `title`, `speaker`, `source_link`, `content` *(JSONB array of blocks)*, `series_priority` *(series-level ordering)*, `episode_number` *(**single source of truth** for episode ordering **and** deep-link routing — must be unique within a series)*, `primary_theme`, `tags` *(text[])*, `meta_description`, `is_hidden` *(draft toggle)*, `is_trashed` *(soft delete)*, `created_at`, `updated_at`. **Notes:** `episode_priority` is a deprecated/vestigial column (superseded by `episode_number`); `is_published` exists in the table but is not currently read by any code; `kisa_series_config` (referenced in earlier drafts/roadmap) was never created.
11. `admins` (Supabase Postgres): Security registry of administrator user IDs. (Columns: `user_id` *(uuid, FK → `auth.users`)*, `added_at`). Backs the `public.is_admin()` SECURITY DEFINER helper used by every admin-only RLS policy. RLS is enabled with **no** API-facing policies, so the table is manageable only via the SQL editor. Onboard a co-admin by inserting their `user_id`.

### Row Level Security (RLS) Enforcement Model
RLS is the authoritative access-control layer — the client-side `ADMIN_ID` comparison and the CMS login form are UI affordances only. All policies live in `docs/supabase_rls_policies.sql` (idempotent and existence-guarded; safe to re-run):
* **Public content** (`kisa_hadiths`, `kisa_transcripts`, `ontology_concepts`, plus `kisa_series_config` if/when created): anyone may `SELECT`; only admins (`is_admin()`) may `INSERT/UPDATE/DELETE`.
* **CMS-internal** (`ontology_synonyms`, `ontology_relations`, `cms_goals`, `cms_activity_logs`, `cms_messages`, `kisa_transcript_backups`): admins only, all operations.
* **Per-user** (`vault_items`): each authenticated user may only read/write rows where `user_id = auth.uid()`.
Verified empirically against production: anonymous reads of public tables succeed, anonymous reads of admin tables return empty, and anonymous writes are rejected with `42501 — new row violates row-level security policy`.

## 4. Current Features & Capabilities (Implemented)

### Phase 3 Completed: Full-Stack Headless CMS & Curriculum Engine
1. **Security Through Obscurity (Root Interception):** The Vault Door (Command Center) was successfully injected at the absolute root in `src/main.jsx`, intercepting the hidden `/kisacms99` route. Regular users on `/admin` or root naturally bypass the gate into the public UI.
2. **Supabase Cloud Integration:** The application is fully decoupled from local static JSON. The `kisa_transcripts` table is live, protected by Row Level Security (RLS) policies (Admin = Write, Public = Read). The public `TranscriptLibrary.jsx` now dynamically fetches from this cloud database.
3. **Luminous Studio (Transcript Editor):** Originally a bulk ingestion dropzone, the editor was refactored into a full-scale CMS workspace with a robust `.upsert()` pipeline enabling "Cloud Hydration" (clicking any existing episode directly injects it back into the studio). It now operates on an `activeView` router toggling between `Library`, `Editor`, and `Trash` views.
   - **Block-Based Architecture:** The interface utilizes a robust block-based editor system supporting diverse content types (H2, Summary, Quote, Paragraph, Divider) powered by auto-resizing textareas and drag-and-drop-style reordering capabilities.
   - **Smart Paste Engine:** Implemented a powerful ingestion tool that parses raw text/OCR data into structured JSON blocks by detecting specific syntax markers (e.g., `Series:`, `Title:`, `Overview:`), accelerating the digitization pipeline.
   - **The Seamless Canvas:** A unified "Fixed Viewport Split-Pane" architecture (locked 70vh scrolling canvas with a real-time Live Preview pane).
   - **Floating Contextual Toolbar:** Implemented a Notion-style contextual menu that triggers on text selection (`onMouseUp`), allowing the admin to inject Bold, Italic, Bridge Overrides (`[[ ]]`), and Mute tags (`~~ ~~`) directly into the text.
4. **Master Curriculum Control (God-Mode):** Engineered a two-tier sorting and macro-management system. 
   - **Macro (Global Series Ranking):** UI to edit `series_priority` allowing global reordering of series. Includes bulk controls to instantly Toggle Visibility (`is_hidden`) and Trash (`is_trashed`) an entire series and all its descendants via single-click batched updates.
   - **Micro (Vault Library Manager):** Granular episode-level UI to edit `episode_number`, re-sorting episodes within a series natively via adaptive Flex layouts without truncating dense theological titles. The public site orders and deep-link-routes strictly by `episode_number`, so the CMS treats it as the **single source of truth**: it auto-assigns a unique `max+1` number on new uploads (in `handleSave`) and rewrites it on manual reorder / auto-sort / publish. (Previously the CMS only wrote the now-deprecated `episode_priority` and never set `episode_number`, so every uploaded episode defaulted to `1` and collided within its series — only one episode was reachable. Fixed.)
5. **Soft Delete Architecture (Trash Bin):** Implemented a full `is_trashed` lifecycle constraint. Trashed items are instantly hidden from the public UI queries and moved to an isolated "Trash Bin" interface in the Command Center, where they can be Restored to the active Vault or permanently Incinerated (hard `DELETE`).
6. **Vercel SPA Deployment Optimization:** Deployed a root `vercel.json` utilizing wildcard `/(.*)` rewrites to `index.html`, aggressively eliminating 404 router desyncs upon direct URL visits.
7. **Security Hardening (Auth + RLS):** `.gitignore` excludes all `.env` files. The frontend now uses a **single shared Supabase client** sourced from `import.meta.env` (`src/lib/supabase.js`); the legacy `src/supabaseClient.js` simply re-exports it, eliminating the previously hardcoded URL/anon key and the duplicate auth-client instance. Authoritative database access control is enforced by **Row Level Security** (see §3, RLS Enforcement Model) — public read, admin-only writes, per-user Vault — rather than relying on client-side gating alone.
8. **The Hadith Library Manager (Foundation DB Sync):** Engineered a high-speed data table within the Command Center (`HadithManager.jsx`) to directly modify Cloud instances of foundational texts natively.
   - **Bi-Directional Schema Bridge:** The inline editor is rigidly mapped to pump manually separated structures right into `manual_chain` and `manual_body`, natively superseding the frontend's regex array-splitters generated inside `HadithCard.jsx`.
   - **Inbox Zero Auditing:** Introduces an automated vanish-on-save routing architecture via dynamically appended `.is('manual_body', null)` modifiers. This rips completed rows directly from the active admin queue during save, cementing a flawless editing workflow.
   - **Client-Side Lexicographical Override:** Because Volume and ID are stored mathematically as Strings, Supabase natively alphabetizes querying. The module downloads the raw query and runs a forced array integer coercion (`parseInt(vol)` then `parseInt(id)`) prior to mounting React state, guaranteeing the table sorts perfectly from Volume 1 to maximum.
9. **Collaborative Flagging System (Multi-Admin Workflow):** Engineered a full multi-player editing workflow into `HadithManager.jsx` to support co-admin onboarding.
   - **Review & Collaboration Panel:** Each hadith's inline editor includes an `is_flagged` toggle, an `assigned_to` dropdown ("Unassigned", "Master Admin", "Co-Admin (Pending)"), and an `internal_notes` textarea for inter-admin commentary.
   - **Dynamic Action Buttons:** When `is_flagged` is toggled ON, the standard "Save Edit" button transforms into an amber-styled "Send to Review" button with a `Send` icon, eliminating action ambiguity.
   - **Review Queue:** A dedicated review tab ignores standard Book/Volume filters and displays ALL flagged hadiths across the entire library, with a wired assignment sub-filter dropdown.
   - **Audit Trail:** Every save operation captures the authenticated user's email via `supabase.auth.getSession()` and writes it to `last_edited_by`, establishing a permanent edit history.
10. **Brain Ontology Relational Manager (`BrainOntology.jsx`):** A dedicated CMS module for managing the 3-tiered theological knowledge graph, mounted into the `KisaCommandCenter` sidebar.
    - **Direct Supabase Access:** Bypasses legacy REST API endpoints, utilizing the native Supabase JavaScript client for immediate, reliable data fetching and mutation.
    - **Relational Data Engine:** Fetches all concepts with nested synonyms and outgoing relations in a single PostgREST query: `ontology_concepts → ontology_synonyms(*), outgoing_relations:ontology_relations!ontology_relations_source_concept_id_fkey(*)`.
    - **Dual View Modes (Grid/List Toggle):** A segmented control in the header switches between a responsive card grid ("Kyoto Paper" aesthetic with domain-based color-coding for Theology/Aqa'id, Ethics/Akhlaq, Jurisprudence/Fiqh) and a high-density data table with Term, Category, English Title, Synonyms (inline pills), and Actions columns.
    - **Concept CRUD:** The "+ New Concept" button opens the drawer with empty fields and performs a Supabase `.insert()`. Existing concepts use `.update()`. The drawer dynamically labels itself ("New Concept" vs. transliteration) and the save button adapts ("Save New Concept" vs. "Save Details").
    - **Locked Sliding Drawer (Right-Side Editor):** A Framer Motion `AnimatePresence` drawer that prevents scroll-collision with the main grid. Contains 3 sub-forms: Main Details (English Title, Category, Arabic Script, Arabic Root, Definition & Context), Search Synonyms & Spellings (with Alternative Search Term input and Match Strength selector), and Theological Relations (Red String Weaver with relation type and target concept dropdowns).
    - **Empty State UI:** When no concepts exist, renders a centered fallback with a `Network` icon and a large "Initialize First Concept" button.
    - **Client-Side Name Resolution:** Outgoing relation edges resolve target concept IDs to human-readable transliterations via a client-side lookup function.

11. **Calligraphy Token Swapping Strategy (Honorific Rendering):** A highly optimized system for rendering the "Alayhis Salam" honorific across all public-facing text without bloating the database.
    - **The Core Philosophy:** To maintain database performance and searchability, no heavy image data or HTML tags are stored in the master library. Instead, the system stores clean text or lightweight tokens (e.g., `{{AS}}`).
    - **The Batch Studio Pipeline:** Messy OCR variations of `(a.s.)` are standardized into the `{{AS}}` token via massive, dry-run-protected Find & Replace operations in the CMS Batch Studio.
    - **The Regex Interceptor:** A dynamic React function (`renderWithCalligraphy`) intercepts hadith text right before DOM injection in `HadithCard.jsx` and `HadithLibrary.jsx`. It utilizes a robust regex net: `/(\(\s*a\.?\s*s\.?\s*\)|\(\s*alayhi[s]?\s+salam\s*\)|\{\{AS\}\})/gi` to catch the token and any lingering plain-text variations.
    - **The CSS Mask-Image Trick:** Upon a match, the system renders an inline `<span>` utilizing a CSS `mask-image` linked to `alayhis_salam.svg`. By applying `bg-current` alongside the mask, the HD vector calligraphy perfectly inherits the active text color from the 3-Tier Theme Engine (Dark, Light, Sepia), ensuring a premium, sharp appearance with zero visual clipping.

**Search & Navigation Engine:**
* **Dual Search Engine:** 
  * *Concept Mode:* Uses Hugging Face to embed queries, searching Pinecone for semantic matches, grouping results via K-Means clustering, and labeling them via the Gemini API.
  * *Keyword Mode:* Highly optimized SQLite index search pulling exact matches/partial variations for English and normalized Arabic.
* **Unified Spotlight Search (The "Theater Curtain"):** A dedicated, full-screen search overlay deployed from the global header.
  * **Exhaustive State Machine:** Rendering logic is strictly managed via a 3-state machine (LOADING, EMPTY, RESULTS) to prevent logical gaps (black screens) during asynchronous data handoffs.
  * **iOS Safari Stability ("Delay & Lock"):** Implemented a 150ms "Delay & Lock" sequence in `handleSearchSubmit`. This ensures the DOM state transitions only *after* the iOS keyboard has finished its dismissal animation, preventing violent viewport height recalculations.
  * **Viewport Anchoring:** Utilizes `100dvh` (Dynamic Viewport Height) for rigid container heights, ensuring the footer remains off-screen and the scroll position is anchored to `(0,0)` during the Framer Motion entrance animation.
* **Global Routing Engine (React Router v6):** A robust, state-safe URL routing architecture replacing legacy state-based (`activeTab`) navigation. Features deep, absolute URL routing for core libraries (e.g. `/hadith/:book?/:volume?/:category?/:chapter?` and `/kisa-academy/library/:series/:episode`).
  * **Single Source of Truth:** UI state derives strictly from `useParams()`. The URL acts as the master record, instantly unlocking native browser history (Back/Forward) and deep-link bookmarking without bleeding state remnants.
  * **Symmetric Slugification:** Hardened text parsing utilities (`slugifyHadithParam`) utilizing Unicode normalization (`NFD`) to instantly convert transliterated Arabic text into clean URL slugs, and seamlessly decode them back into exact database keys.
  * **Graceful Degradation:** URL parser engines utilize defensive synchronization. If a user modifies a deeply nested URL and a chapter parameter becomes invalid, the engine gracefully degrades to the deepest valid parent (e.g., the volume) instead of violently resetting to the dashboard.
  * **Regex Target Routing:** Automatically parses English spotlight search queries for series names and episode numbers (e.g., "file of ashura ep3"), dynamically constructing the absolute deep-link path and routing the user directly into the active transcript.
* **Al-Kisa Brain Ontology Intercept (High-Gravity Blending):** Scans user queries for Twelver synonyms, grabs pre-computed 384-dimensional vectors from SQLite, and applies an 85% "High Gravity" blend to crush linguistic collisions.
* **Vector Hopping ("Find Similar"):** Pivots the search engine around the vector signature of any individual narration, featuring a persistent "Anchored Source" UI.
* **Curated Exploration Widgets:** Pre-built semantic search shortcuts (`curated_exploration.json`) displayed on the home screen, routing users directly into deep concept searches.
* **LRU Search Cache:** Server-side in-memory cache (`Map`, 200-entry limit) for instant repeat query responses.
* **Theological Glossary:** An A-Z dictionary of Twelver Shia terminology (`Glossary.jsx`), accessible via the global Search menu. Users can browse core concepts, filter by category, share via clipboard, and save important terms directly to the Study Vault. Data is fetched directly from Supabase, ensuring up-to-date terminology without relying on static local files or intermediary API endpoints.

**The Scholar's Vault (Pro-Display Workspace):**
* **Decoupled Architecture:** Vault logic has been isolated into a dedicated `StudyVault.jsx` component, featuring robust internal state management for dynamic folder generation, multi-tag filtering, and deep search capabilities.
* **Tri-Pane Native Architecture:** A Craft-inspired, sophisticated layout featuring a responsive Navigator (Sidebar), Index (Grid/List views toggled via Command Pill), and a Focus Canvas.
* **Multi-Folder Semantic Routing:** Items automatically filter by source type (Quran, Hadiths, Transcripts) with support for tagging items across multiple custom folders simultaneously. Uses context-aware deletion to strip tags without erasing the global bookmark.
* **The Scholar's Margin:** An inline, auto-saving rich-text area for personal reflections, featuring regular expression auto-capitalization and explicit tactile saving functionality.
* **Full Anatomy Reading Canvas:** Preserves the original `arabic_text` and `chain` of narrators from the search engine, viewable via elegant dropdowns within the saved Vault context.
* **Universal Content Types:** Supports saving Hadiths, Quran verses, Transcript passages, and Dua passages — all routed through the same Supabase `vault_items` table with `type` discrimination.

**The Dashboard, Amaal & Quran Engine:**
* **28-Day Habit Heatmap:** Background chronometers track active reading time (seconds spent actively looking at text), rewarding consistency over linear Khatm tracking.
* **Context-Aware Amaal:** The dashboard dynamically surfaces specific Twelver practices based on the user's local day/time (e.g., Surah Al-Kahf on Fridays, Al-Waqi'ah at night), utilizing a responsive "Stacked Pill" UI on mobile to prevent text truncation.
* **The Book of Virtues (Fadhaa'il):** Integrates verbatim, authentic narrations from `quranBenefits.js`. Powers goal-oriented "Divine Prescriptions" on the dashboard and a sliding frosted-glass Virtues panel inside the reader.
* **Dynamic Daily Hadith:** A mathematical "Goldilocks Threshold" (130 characters) intelligently determines when to truncate daily hadiths on mobile, deploying a seamless "Read More / Read Less" inline toggle that preserves the UI aesthetic without sacrificing full narrative access. Features a lightning-fast "Shuffle" engine with seamless layout morphing and zero-stutter cinematic blur transitions.
* **The Tafsir Map:** A 114-Surah visual index grid utilizing logarithmic scaling to generate an amber "heat map." Visually indicates the depth of Twelver Hadith commentary available for every single Surah in the Al-Kisa database.
* **Cinematic Auto-Resume:** A high-performance physics engine that tracks exact verse positioning. Upon return, it uses Layout Stabilization mathematics to wait for the DOM to paint massive Surahs, then executes a smooth Ease-Out-Quart warp directly to the user's last read verse.
* **Reverse Tafsir:** Automatically detects verses referenced in the hadith database and spawns seamless popups of contextual narrations.

**The Liturgical Engine (Quran, Duas, Ziyarats):**
* **Top-Level Navigation:** The global navigation routes directly to independent full-screen components for Quran, Duas, and Ziyarats, ensuring immediate access to foundational liturgical texts.
* **The Dua Library (`DuaLibrary.jsx`):** A full-featured supplication reader powered by `duas.json`. Features a premium card-based dashboard, an editorial passage-by-passage reading canvas with centered Arabic, transliteration, and English, cinematic GPU-accelerated scroll progress bars, a scroll-direction-aware sticky header HUD, per-passage clipboard copying with full reference formatting, Vault bookmarking for individual passages, an expandable "Significance" panel for historical context, universal pre-Dua invocations (Bismillah & Salawat), and deep-link routing from `App.jsx` via `externalTarget` prop. Wrapped in a React Error Boundary for crash protection.
* **Ziyarat (Under Construction):** Dedicated module with a premium "Geography of Light" under-construction card.

**The Kisa Experience (`TheKisaExperience.jsx`):**
* **Interactive Onboarding Widget:** A 5-phase morphological UI demo using 3D CSS card flips with `preserve-3d` and hardware-accelerated `backface-visibility`. Progressively reveals the platform's capabilities (Semantic Engine → Unbroken Chain → Theological Fortress) before expanding into a cinematic full-screen "Know Your Imam" call-to-action. Features `useReducedMotion` accessibility fallback, Framer Motion `LayoutGroup` shared element transitions, and direct routing to the Transcript Library.

**The Home Screen (`Home.jsx`):**
* **Apple-Standard Bento Grid:** A responsive, column-spanning grid layout featuring Core Collections cards, the "Living Library" onboarding section, and the Curated Exploration widgets.
* **"Ghost Writer" Entrance Choreography:** A zero-stutter typewriter-style animation cycling through example search queries in the global search bar.

**Kisa Academy (The Educational Hub):**
* **The Hub (`KisaAcademy.jsx`):** A centralized, Apple-style Bento Grid routing users between the text-based archive and video-based courses. Features **External Target Awareness**—automatically switches to the archive view if a specific transcript is requested via the Global Routing Engine.
* **The Scholarly Library (Transcripts):** A premium reading environment utilizing a Charcoal and Gold (`#c6a87c`) theme. Features a structured 2-Pillar layout on desktop and an edge-to-edge reading canvas on mobile. Utilizes direct DOM mutation (`useRef`) to track deep-scrolling without triggering React re-renders, preserving 60fps native iOS momentum scrolling.
* **The Contextual Bridge (`ContextualBridge.jsx`):** An inline ontology tooltip system that scans transcript text for recognized theological terms from the Al-Kisa Brain. On desktop, hover triggers an elegant dark tooltip displaying the term's Arabic, English translation, domain classification, and full definition. On mobile, a tap-toggle mechanism replaces hover to prevent emulated mouse event conflicts. Features intelligent edge-detection math (`useLayoutEffect`) that dynamically shifts tooltip positioning to prevent viewport clipping, a CSS pointer arrow that counter-offsets to always point at the triggering term, and Framer Motion spring-scale entrance animations. Ontology data is fetched on mount from the new `GET /api/ontology` backend endpoint, which serves a lightweight payload (no vector embeddings) from the `ontology_concepts` SQLite table. Terms are regex-matched using a **Longest-Match-First** sort (descending by `variant.length`) to prevent partial collisions — e.g., the full phrase "Al-Ghaybat al-Kubra" is always matched as a single concept before the shorter "Al-Ghaybat" can claim a fragment.
  * **Nested Parsing Logic:** The rendering pipeline in `TranscriptLibrary.jsx` (`parseFormatting`) utilizes a regex-based splitter (`/(\*\*.*?\*\*)/g`) designed to preserve Markdown bolding (`**text**`) while recursively wrapping both plain and bolded text nodes in the `<ContextualBridge>` tooltip component. This ensures that theological ontology terms are accurately recognized and highlighted even when they appear within emphasized (`<strong>`) segments of the transcript, maintaining full tooltip coverage across all typographic contexts without breaking the Markdown formatting layer.
* **Structured Courses (Video):** A dedicated environment for original, long-form theological video lectures (Currently scaling).
* **Native Academic Export Engine:** Features a 1-click export tool generating completely local, crash-proof study documents. Supports pure Markdown (`.md`) formatting injected with smart YAML frontmatter for seamless LLM/NotebookLM ingestion, and dynamically generated, text-selectable Academic PDFs utilizing `jsPDF`.
* **Active Recall & LMS Integration:** Utilizes a custom `RevisionModule.jsx` to render interactive NotebookLM-generated JSON flashcards and multiple-choice quizzes at the end of transcripts to reinforce dense theological concepts. Features confidence-weighted scoring to generate archetypes (e.g., "The Hesitant Scholar", "The Blind Spot"). Progress visualized via `MasteryRing.jsx`.

**The Semantic Commentary Layer (Scholarly Lecture Pipeline):**
* **The Pipeline:** Full-stack ingestion pipeline for the translated English transcripts of Sheikh Abdul-Haleem al-Ghizzi's Arabic theological lectures. Raw Arabic audio is transcribed and translated using an AI-assisted workflow (documented in `docs/YoutubeTranscription.md`), then structured into segmented JSON blocks and formatted using the quote-extraction SOP (documented in `docs/FormatTranscripts.md`). The formatted transcripts are stored in `transcripts.json` and rendered inside the Scholarly Library (`TranscriptLibrary.jsx`). The Contextual Bridge (`ContextualBridge.jsx`) scans each rendered passage for recognized ontology terms, mathematically mapping modern scholarly commentary directly to foundational texts (Hadiths, Quranic verses, Duas, Ziyarats) via the Al-Kisa Ontology Brain.
* **The Schema:** All commentary transcripts conform to a strict JSON array stored in `transcripts.json`. Each episode object contains:
  ```
  {
    "lecture_id": string,       // Unique episode identifier
    "segment_id": string,       // Segment within the episode
    "series_name": string,      // Parent series (e.g., "Know Your Imam")
    "english_text": string,     // Translated text with Markdown formatting
    "primary_theme": string,    // Dominant theological theme of the segment
    "ai_translation_flag": bool, // true = AI-translated, false = human-verified
    "vector_embedding": [float]  // 384-dimensional vector (future: Pinecone indexing)
  }
  ```
* **The UI Provenance Tags:** Every AI-translated transcript prominently displays two permanent, non-dismissable UI tags: **"AI-Translated Transcript"** (indicating the source is machine-translated from Arabic audio) and **"Original Arabic Audio Available"** (linking to the original lecture source). These tags ensure full scholarly transparency and provenance tracking.
* **The Tooling (`clean_database.js`):** A standalone Node.js database sanitization script that loads the entire `thaqalayn_complete.json` (73MB+) into memory and executes a layered regex replacement dictionary across all narrations. The script operates in 3 layers:
  * *Layer 1 — Punctuation & Spacing:* Normalizes curly/smart quotes to straight quotes, removes errant spaces before punctuation, and collapses multiple spaces.
  * *Layer 2 — Islamic Honorifics:* Standardizes honorific abbreviations (e.g., inconsistent `(a. s.)` / `(A.S.)` → `(a.s.)` and `(s.a.w.)` variants).
  * *Layer 3 — Name Capitalization & References:* Fixes lowercase proper nouns (`abu` → `Abu`), standardizes transliterated names (e.g., `Ameer al-Mu'mineen`), and converts parenthesized Quranic references to bracket notation (`(5:55)` → `[5:55]`) to prevent collision with honorifics parsing.
  * The script reports total edit count and writes the cleaned database back to disk.

**The Foundation Library (Hadith Archive) & Hybrid Data Engine:**
* **The Hybrid Engine & Pure DNA Matching:** A highly optimized data pipeline that fuses static local storage with live cloud updates. Instantly loads 14,500+ hadiths from the local `thaqalayn_complete.json`, while fetching a lightweight payload from `kisa_hadiths` containing admin modifications. Uses a **Pure DNA Text Matching** algorithm to prevent ID Desync.
* **Multi-Source Support:** The `SOURCES` array actively supports filtering across `"All Twelver Sources"`, `"al-Kafi"`, `"Bihar al-Anwar"`, and `"Basa'ir al-Darajat"`.
* **Inline Admin Editor (UID-Gated):** Authorized administrators (identified by hardcoded `ADMIN_ID`) can instantly correct translation or formatting errors directly on the live website, utilizing a sticky action bar that defeats mobile keyboard layout shifts.
* **Universal Clipboard Formatting:** Features a mathematically precise copy-to-clipboard engine that defeats WhatsApp's aggressive Bidi text-rendering bugs, injecting Unicode Left-to-Right Marks (`\u200E`) to guarantee perfect right-aligned Arabic and left-aligned English across third-party apps.

**Platform Infrastructure:**
* **Cold Start (Known Limitation):** The Node backend runs on Render's free tier and spins down after ~15 minutes of inactivity, incurring a ~1-minute wake-up on the next request (compounded by the Hugging Face inference endpoint's own model-load delay). A keep-alive ping intended to prevent this (previously via cron-job.org) is **non-functional and has been removed** — see §5 Roadmap for the planned replacement. Note: this cold start is unrelated to per-query speed; the warm concept-search path was separately optimized (the `/api/explore` SQLite fetch is now a single batched `WHERE id IN (...)` query rather than ~150 sequential `db.get` calls).
* **Dynamic API Routing (Frontend Security Rule):** Frontend components (`TranscriptLibrary.jsx`, `ContextualBridge.jsx`, `App.jsx`, etc.) **must never use hardcoded URLs, IP addresses, or port numbers** (e.g., `http://hostname:8000`) for API calls. All fetch calls strictly resolve their base URL via `import.meta.env.VITE_API_URL || ''`. Falling back to an empty string produces a relative path (e.g., `/api/ontology`), which automatically inherits the current page's protocol and origin (`https://`). This eliminates Mixed Content blocks (HTTPS page → HTTP fetch) and ensures seamless operation behind any reverse proxy without code changes.
* **Strict CORS Policy (Backend Security Rule):** The Node.js backend (`server.js`) **strictly forbids wildcard (`origin: '*'`) CORS configurations**. The `cors` middleware uses an explicit whitelist function that validates the `Origin` header against an approved array: production domains (`https://www.al-kisa.org`, `https://al-kisa.org`) and local development servers (`http://localhost:5173`, `http://localhost:3000`). Requests with no `Origin` header (server-to-server, `curl`, mobile apps) are permitted. All unrecognized origins are rejected and logged to the console with a `[CORS] Blocked request from origin:` warning.
* **Native Tab Memory:** Active tab persisted to `localStorage` so the app reopens exactly where the user left off.
* **3-Tier Theme Engine:** Light, Sepia (`#FDFBF7`), and Dark (`#000000`) modes with eye-strain-optimized background and text color calculations.
* **Animated Menu Physics:** Custom SVG hamburger-to-X morphing icon using Framer Motion line animations.
* **App Update Changelog:** In-app versioned changelog (`APP_UPDATES` array) tracking platform evolution from v3.5.2 through v5.1.0.
* **Supabase Auth Flow:** Full email/password authentication with sign-up, sign-in, session persistence, and sign-out confirmation modal.

**In-App Documentation System (How-To Panels):**
* **Architecture:** A reusable collapsible documentation panel pattern deployed across 3 CMS components (`BrainOntology.jsx`, `HadithManager.jsx`, `TranscriptEditor.jsx`). Each panel uses a `showDocs` state toggle, a `BookOpen` icon trigger labeled "How to use this page" with a rotating `ChevronDown`, and a Framer Motion `AnimatePresence` wrapper with `overflow: clip` (not `overflow-hidden`, which traps scroll) for smooth height animation without scroll-locking.
* **Layout:** Full-width (`w-full`) dark panel (`bg-[#14171f]`) with a single-column intro paragraph followed by a `grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-5` for numbered sections. Sections 1 & 3 occupy the left column, Sections 2 & 4 the right, minimizing vertical height.
* **Content:** Each panel is written in plain, non-technical English for co-admin accessibility. Uses native `list-disc list-inside` bullets, inline `<strong>` emphasis, and `leading-relaxed` typography. Section 5 (where present) spans both columns (`lg:col-span-2`) as a visual footer.
* **Coverage:**
  * *Brain Ontology:* 5 sections — What are we doing, Add/Edit a Concept, The Secret Weapon (Synonyms), Grid vs. List View, How does this affect the live site (search routing + hover tooltips).
  * *Hadith Library:* 4 sections — What are we doing (14K narrations), The Editing Workflow (Standard/Review queues, filters), Tracking Our Progress (velocity/ETA), How does this affect the live site (public reading + search accuracy).
  * *Transcript Studio:* 4 sections — What are we doing (Semantic Commentary Layer), How to Import a Lecture (Luminous Studio + metadata), Build Mode vs. Live Preview (crucial bolding rule), How does this affect the live site (Knowledge Graph + AI answers).

## 5. Future Roadmap & Long-Term Goals

* **World-Class LMS Integration (Current Focus):** Evolving Kisa Academy based on evidence-based pedagogy:
  * ~~**The Contextual Bridge (Ontology Hover-Tooltips):**~~ ✅ **SHIPPED** — See §4, Kisa Academy.
  * **Algorithmic Pathways (Mastery Learning):** Restricting access to advanced modules until prerequisite `RevisionModule` quizzes are passed.
  * **The "On-Ramp" (Priming):** "Need-to-Know" pre-flight vocabulary briefings rendered at the top of dense transcripts.
  * **Practical Application:** Guided journaling prompts at the end of modules that auto-sync to "The Scholar's Margin" in the Study Vault.
* **The Ziyarat Library (Phase 2):** Completing the "Geography of Light" module inside the Spiritual Hub with a full Ziyarat text library matching the Dua Library's editorial quality.
* **The Momentum Engine (Habit V2):** Transforming the User Hub into a "Scholar's Dashboard" that tracks "Nur" (Consistency) and debounced video-resume states via Supabase.
* ~~**Semantic Commentary Vectorization:**~~ ✅ **SHIPPED** — See §4, Semantic Commentary Layer. (Future: Pinecone indexing of commentary vectors for cross-corpus semantic search.)
* **Transcript CMS & Interactive Studio (Supabase Migration):** A full-stack content management system and live editing studio replacing the static `transcripts.json` bundle with a cloud-native, admin-editable Supabase Postgres backend. This system transforms the Scholarly Commentary Layer from a deploy-time artifact into a living, real-time editorial platform while preserving the existing AI translation workflow end-to-end.

  * **Cloud Migration & Relational Architecture (Supabase Postgres):**
    * **`kisa_transcripts`:** The primary content table replacing `transcripts.json`. Each row represents one complete transcript episode. The `content` column stores the full JSON array of content blocks (paragraphs, quotes, summaries, headings, dividers) as a single JSONB payload. Key columns include: `episode_number` (integer) for manual frontend reordering of episodes within a series — decoupling display order from insertion order or alphabetical sorting; `tags` (text array) for cross-series thematic mapping, enabling future features like "All transcripts tagged *Imamate*" regardless of parent series; and `meta_description` (string) for automated OpenGraph/SEO link previews, allowing each transcript to generate rich social sharing cards with contextual theological summaries when URLs are shared externally.
    * **`kisa_series_config`:** A secondary table managing series-level metadata and administrative states. Includes `display_order` (integer) for deterministic UI sorting of entire series on the frontend, and an `is_hidden` boolean column functioning as a **Draft Mode** — hidden series are excluded from all public Supabase queries via Row Level Security (RLS) or filtered `WHERE` clauses, but remain fully visible, editable, and arrangeable by the `ADMIN_ID` in an X-Ray administrative view prior to launch. This enables the admin to stage, curate, and reorder an entire multi-episode series behind the scenes before a coordinated public release.
    * **`kisa_transcript_backups` (The Snapshot Engine):** A dedicated backup table powering version history and disaster recovery. Every time a transcript's `content` column is overwritten or updated, the system automatically inserts a snapshot of the *previous* JSON payload into this table alongside a `created_at` timestamp and the originating `transcript_id`. This enables a **1-click version rollback** from the admin UI — the admin can browse a chronological list of prior versions, preview any snapshot, and instantly restore it as the active content. Protects against accidental data loss during rapid AI re-translation cycles.

  * **The Smart Ingestion Pipeline & Safe Overwrites:**
    * **Smart JSON Dropzone (Admin Ingestion UI):** A dedicated admin-only UI panel accepting raw AI-generated JSON arrays via paste or file upload. The dropzone automatically parses and classifies content blocks — blockquotes (`type: 'quote'`), segment summaries (`type: 'summary'`), section headings (`type: 'h2'`), dividers (`type: 'divider'`), and standard paragraphs — preserving the existing AI translation workflow without manual reformatting. A live React preview renders the imported content in real-time using the production `parseFormatting` engine, allowing the admin to visually verify formatting, Contextual Bridge highlights, and block ordering before committing to the database.
    * **Safe Overwrite Protocol:** When modifying an existing transcript, the system **must** execute an SQL `UPDATE` on the `content` column targeting the row by its existing `id` primary key — never a `DELETE` + `INSERT` cycle. This is a non-negotiable architectural constraint: user Vault bookmarks (`vault_items`) reference transcripts by stable identifiers, and destroying and re-creating rows would orphan those bookmarks. The previous content is automatically archived to `kisa_transcript_backups` before the update is committed.

  * **Interactive WYSIWYG Editor Enhancements:**
    * **"Luminous Text" (Theological Highlighting):** A custom formatting button that applies a permanent, subtle `#c6a87c` glow and color-shift to profound theological axioms — visually distinguishing divinely significant passages without relying on standard bolding. Implemented as a custom Markdown token (e.g., `{{text}}`) that the `parseFormatting` engine renders as a `<span>` with the signature gold luminance styling, ensuring the highlighting persists across exports (Markdown, PDF) and is not confused with structural emphasis.

  * **The Community Triage Queue (Crowd-Sourced QA):**
    * **"Report Typo" User Action:** A new action button added to the existing user-facing text selection popup (the same popup used for "Save to Vault" highlight actions in `TranscriptLibrary.jsx`). When a user selects text and taps "Report Typo," the selected snippet, its parent transcript `id`, and a timestamp are submitted to a new `kisa_typo_reports` Supabase table. No authentication is required for submission to minimize friction, but a lightweight rate limiter prevents spam.
    * **Admin Triage Inbox:** A dedicated panel within the CMS Studio displaying all pending typo reports in a chronological queue. Each report shows the flagged snippet in context (highlighted within its parent block), the reporter's timestamp, and one-click actions: **Fix** (opens the inline editor pre-focused on the flagged block), **Dismiss** (marks the report as reviewed without action), or **Mark as Duplicate**. Accepted fixes are committed via the Safe Overwrite Protocol, instantly pushing the correction to the live master database.

* **Unified Kisa Command Center (Global CMS Architecture):** The overarching administrative platform that unifies all individual CMS tools (Transcript Editor, Foundation Library Manager, Brain Ontology Editor, Analytics, Media Vault) under a single, secure, modular application shell. The Command Center elevates Al-Kisa from a deploy-time static platform to a fully real-time, cloud-managed editorial system with enterprise-grade access controls.

  * **Global App Shell & UI Isolation:**
    * **Strict UI Isolation:** The CMS will be strictly separated from the public-facing Kisa Academy UI. All editor modules (starting with the Transcript Editor) must be removed from public view components (such as `TranscriptLibrary.jsx`) and housed exclusively inside this dedicated, full-screen SaaS-style Command Center.
    * **Protected Route:** The Command Center lives on a hidden `/admin` (or `/studio`) route within the existing React application. The route is wrapped in an authentication guard. Unauthenticated visitors are immediately redirected to the public app root (`/`) with no UI indication that the admin route exists, and the route is excluded from the sitemap. Furthermore, global UI components like `<Header />` and `<Footer />` are conditionally hidden using `useLocation()` to ensure the admin route remains an isolated, edge-to-edge workspace.
    * **SaaS-Style Layout:** The shell utilizes a responsive layout (`flex-col` for mobile, `flex-row` for desktop) with a persistent global sidebar for primary navigation across all CMS modules: **Transcripts** (Interactive Studio), **Foundation Library** (hadith management), **Brain Ontology** (concept CRUD), **Analytics** (engagement tracking), and **Media Vault** (audio/image hosting). It includes a mobile hamburger menu, overlay backdrop, and drawer mechanism for full touch device support.
    * **Modular Component Architecture:** Each CMS tool is built as an independent React component (`HadithManager.jsx`, `BrainOntology.jsx`, `TranscriptEditor.jsx`) designed to effortlessly inject into the Main Canvas via the `KisaCommandCenter.jsx` sidebar router. The sidebar dynamically passes the `supabase` client as a prop to each active module.

  * **Transcript Module Integration & Metadata Controls:**
    * **Metadata Formulation:** The Transcript Editor module inside the Command Center will feature a metadata control panel positioned natively situated above the Smart JSON Dropzone. 
    * **UI Inputs:** This panel provides critical configuration fields required before payload execution, including: **Series Selection** (dropdown), **Episode Ordering** (integer input), and a **Visibility Toggle** (Draft/Live state). This panel guarantees that raw AI data is correctly classified within the relational schema upon ingestion.

  * **Role-Based Access Control (RBAC) & Supabase Auth:**
    * **Enterprise-Grade Auth Migration:** The current model utilizing shared, hardcoded `.env` passwords (`ADMIN_ID`) is deprecated. The platform is transitioning to robust Supabase Authentication utilizing individual admin accounts accessed via secure email or Magic Links.
    * **Database Verification Strategy:** Access to the `/admin` route is strictly gated by validating the session token against a secure `users` table in Supabase, specifically checking for an `is_admin = true` boolean flag. This eliminates the vulnerability of shared credentials.
    * **API-Level Protection:** Cryptographic JWT session tokens are attached to every privileged API request. All backend endpoints validate this JWT for `UPDATE` or `DELETE` operations. Supabase Row Level Security (RLS) policies provide backup enforcement at the Postgres level.
    * **Audit Trail & Accountability:** With robust multi-admin support enabled via Supabase Auth, core database tables (e.g., `kisa_transcripts`) must include a `last_edited_by` or `created_by` column inherently linked to the authenticated user's ID. This implements a permanent, clear audit trail for all content ingestion and editorial revisions across the platform.

  * **Relational Integrity Checker (Dead-Link Prevention):**
    * **Dependency Graph Scanning:** Because Al-Kisa maps modern commentary to foundational texts via the Kisa Brain Ontology, the CMS must prevent orphaned data across the relational graph. Before any destructive operation on a core entity (deleting an ontology concept, merging two synonyms, removing a transcript episode), the system executes a dependency scan across all related tables — querying `ontology_synonyms`, `ontology_relations`, `kisa_transcripts` (scanning JSONB `content` for `[[Term]]` override references), and `vault_items` (checking for user bookmarks tied to the target entity).
    * **Admin Warning & Re-Mapping Protocol:** If dependencies are found, the deletion is blocked and the admin receives a detailed impact report: exact count of affected rows, previews of dependent content, and the specific tables involved. The admin must explicitly **re-map** all dependencies (e.g., reassign orphaned synonyms to a different concept, update transcript override tokens) before the system permits the destructive action. This eliminates silent data corruption across the platform's interconnected theological knowledge graph.

  * **The Publishing Queue (Scheduled Releases):**
    * **Timestamp-Based Publishing:** The `is_hidden` boolean in `kisa_series_config` is expanded to coexist with a nullable `go_live_at` timestamp column. When `go_live_at` is set, the series remains hidden from public queries until the server clock passes the specified timestamp, at which point the system automatically flips visibility. This enables the admin to upload bulk content (e.g., an entire 30-episode series) in a single session and schedule staggered, automated public releases over days or weeks.
    * **Episode-Level Scheduling:** Individual episodes within a series can also carry their own `go_live_at` timestamps in the `kisa_transcripts` table, enabling granular drip-release patterns (e.g., one episode per day at a fixed time). Episodes that have passed their `go_live_at` threshold are served normally; future episodes are excluded from public queries but remain fully visible and editable in the admin X-Ray view.
    * **Cron Execution:** The scheduled release engine is powered by a lightweight server-side cron job (or Supabase Edge Function on a scheduled trigger) that periodically evaluates pending `go_live_at` timestamps and flips the corresponding visibility flags. No manual admin intervention is required after the initial scheduling.

* **Multi-Volume Database Expansion:** Seamlessly integrate *Basa'ir al-Darajat* (approx. 1,800-2,000 narrations). Static JSON (`basair_complete.json`) already staged in `public/`.
* **The Audiobook Engine (Neural TTS):** Integrating Microsoft's `edge-tts` to generate free, ultra-realistic audio files for the 50+ hour Transcript Library.
* **Theological Highlighting & Word-by-Word Roots:** Adding permanent visual luminescence to foundational Twelver verses and implementing a root-word analysis tooltip for Quranic Arabic.
* **Keep-Alive / Zero Cold-Start (Planned — replaces removed cron):** Implement a reliable uptime ping (e.g., a GitHub Actions scheduled workflow or a dedicated external uptime monitor) hitting the Render backend every ~10 minutes to prevent the free-tier 15-minute spin-down and its ~1-minute cold start. The earlier cron-job.org approach was non-functional and has been removed from §4. Optionally pre-warm the Hugging Face embedding endpoint to avoid its separate model-load delay; a paid Render tier (no spin-down) is the money-not-code alternative.
* **Hadith Override Re-Keying (Data Integrity — Planned):** `kisa_hadiths.id` does **not** align with the static `thaqalayn_complete.json` (genuine "ID desync": it matches neither the JSON `id` field, which is per-volume and non-unique, nor the array index). Consequently the hybrid engine links cloud admin-edits to static narrations purely by **English text** ([`App.jsx` `fetchHybridData`](../concept-ui/src/App.jsx)). This works (all overrides currently match exactly; a normalized quotes/whitespace/case fallback was added for resilience) but remains fragile: if the static text is ever re-cleaned (`clean_database.js`) or re-exported without re-syncing the cloud, overrides silently detach. **Proper fix:** a one-time re-migration giving each `kisa_hadiths` row a durable join key derived from the *current* static library — e.g. re-derive `id` from the live array index, or store a content hash / stable composite (`book`+`volume`+`chapter`+`hadith_number`, noting `hadith_number` is often "unknown"). Touches ~14k production rows, so plan and back up before executing.

* **App Store (iOS) Distribution (Planned — prep phase, decided 2026-06-30):** Ship Al-Kisa to the Apple App Store. Full plan filed here so a fresh session has the complete rationale.

  * **Approach decision — Capacitor wrapper, NOT native Swift.** The web app is large and *actively developed* (`App.jsx` ~140 KB + ~20 sizeable components + Node backend + Supabase/Pinecone/HF/Gemini). A native SwiftUI rewrite would re-implement the entire app and force **permanent double-maintenance** (every future feature built twice); React Native would still rewrite all UI (~30% logic reuse). **Capacitor** wraps the existing Vite/React build in a native iOS shell with ~100% reuse and a bridge to native APIs. The one rejection risk — Apple **Guideline 4.2 (minimum functionality / "website in a box")** — is neutralised by adding native value (push notifications, offline caching, native share sheet), which Capacitor makes easy. Paths ranked: Capacitor (low–med effort) ≫ React Native (high) ≫ native Swift (very high, 0% reuse).
    * **Tooling caveat:** Claude can write the Capacitor/Swift glue code and run `xcodebuild` from the CLI, but **cannot perform the interactive Xcode steps** — code-signing, provisioning profiles, and the App Store Connect upload/submission are manual, hands-on-user tasks (they need the Apple ID + certificates).

  * **Cost breakdown (estimates, 2026):**
    * **Required:** Apple Developer Program **$99/year** (hard gate; no App Store without it). Mac + Xcode = $0 (user already on macOS). Domain `al-kisa.org` ~$12–40/yr (already paid). **No** Apple per-download fee for a free app.
    * **Infra (already running for the website, but an app raises the bar):** Render Node backend — currently free w/ ~1-min cold start; for an app it **must be always-on** (~$7/mo Starter) so reviewers don't hit a spinning/dead app. Supabase free → $25/mo Pro at scale. Vercel free → $20/mo if needed. Pinecone free/Starter → usage-based. HuggingFace inference free (slow) → ~$9/mo PRO. Gemini (`gemini-2.5-flash`) <$5/mo at this scale.
    * **Totals:** bare-minimum to ship ≈ **$99/yr + existing near-free infra**; "doesn't feel broken" ≈ **+$7–15/mo** (mainly the always-on backend). IAP only matters if charging for content (Apple takes 15–30%) — **no paid tier today**, so N/A.

  * **Prep checklist (do before any app shell):**
    1. **In-app account deletion (REQUIRED — Guideline 5.1.1(v)).** Currently **absent**: the "Account Settings" button in the user hub just reopens the auth modal; only Sign Out is wired (`App.jsx` `handleSignOut`, ~line 342). Apps with account creation (Supabase email/password signup exists) **must** offer in-app account *deletion*, not just sign-out. **Design:** the client can delete the user's own `vault_items` directly (RLS already permits `user_id = auth.uid()` deletes); only deleting the **auth user** needs the `service_role` key, which must never reach the browser → put that one privileged call behind a **Supabase Edge Function (recommended; always-on, isolated secret, independent of Render's cold start)** or, alternatively, a new `concept-api` Express endpoint (reuses existing infra but inherits cold-start + places the service-role key on the Render box). **Flow:** confirm modal → client deletes `vault_items` → call privileged fn to delete auth user → `signOut()` → confirmation. Keep the privileged call as one swappable function so Edge-vs-Express stays trivial to flip.
    2. **Privacy policy page + Apple "App Privacy" nutrition labels (REQUIRED).** App collects email + stores user data (Vault reflections/bookmarks). Needs a public privacy-policy URL and the App Store Connect privacy disclosures.
    3. **Hide stubs & admin in app builds (Guideline 2.1 no "coming soon"; 2.3.1 no hidden features).** Strip/hide: the **Ziyarat** under-construction page (`/ziyarats`, `App.jsx` ~line 1205) + its nav button + the "arriving soon" changelog copy in `constants.js`; and the admin surfaces — `/admin` → `KisaCommandCenter` (`App.jsx` ~line 1289) and the hidden `/kisacms99` gate (both gated only by the **client-side** `ADMIN_ID` compare, `constants.js:70`). Produce a public-only bundle for the app.
    4. **Always-on backend (user action, $).** Upgrade Render off the free tier to kill the ~1-min cold start (see Platform Infrastructure §4 + Keep-Alive roadmap item) so Apple review doesn't open the app to a dead spinner.
    5. **Replace the placeholder Panjetan motif (user action — IP).** `KisaMotif.jsx` was traced via potrace from a **watermarked product photo**; Apple requires you own rights to all assets. Commission/license a vector before submission (already a standing TODO).
    * **Already OK:** HTTPS/ATS will pass (frontend enforces relative HTTPS — see §4 Dynamic API Routing). **Sign in with Apple is NOT required** unless social/third-party login is added later (only email/password today).

  * **Prerequisites:** Apple Developer enrollment ($99/yr, ~24–48 h approval); Xcode; Capacitor CLI; app icon set + launch/splash assets; App Store Connect listing (name, description, 6.7"/6.5"/iPad screenshots, age rating, privacy labels).

  * **Status (2026-06-30):** planning only — user chose to tackle prep first. Items 1–3 are code/content Claude can do; 4–5 are user actions. **No app code written.**

## 6. File System & Component Dictionary

### ASCII Archive Tree
```text
alkafi-engine/
├── concept-api/                        (Node.js Backend Services)
│   ├── data/
│   │   └── concept_atlas_export.json       (Full hadith export for data pipeline)
│   ├── generate_ontology.js                (Ontology term generator)
│   ├── map_verses.js                       (Quran-to-hadith verse mapper)
│   ├── ontology_centroids.json             (Pre-computed 384-dim ontology vectors)
│   ├── package.json                        (Backend deps: express, pinecone, @xenova/transformers, ml-kmeans, @google/generative-ai, dotenv, cors)
│   ├── server.js                           (PRIMARY backend: Express API — Dual search, Ontology Brain, K-Means, Gemini labeling, /api/ontology endpoint)
│   └── .env                               (API keys: Pinecone, Gemini, HF_TOKEN)
├── concept-ui/                         (React Frontend — Vite)
│   ├── eslint.config.js
│   ├── index.html                          (SEO meta tags, OG tags, Scheherazade New font, viewport lock)
│   ├── package.json                        (Frontend deps: react, framer-motion, @supabase/supabase-js, jspdf, lucide-react, clsx, tailwind-merge, tailwindcss v4)
│   ├── postcss.config.js                   (PostCSS with @tailwindcss/postcss plugin)
│   ├── public/
│   │   ├── basair_complete.json            (Basa'ir al-Darajat narrations — staged for integration)
│   │   ├── favicon.svg
│   │   ├── me_quran.ttf                    (Custom Arabic Quran font)
│   │   ├── thaqalayn_complete.json         (14,500+ hadiths — async streamed for hybrid engine)
│   │   └── vite.svg
│   ├── src/
│   │   ├── App.css
│   │   ├── App.jsx                         (MASTER router/wrapper — 2,021 lines. Auth, themes, search, Vault, Global Routing Engine)
│   │   ├── assets/
│   │   │   └── react.svg
│   │   ├── components/
│   │   │   ├── ChapterTitleHeading.jsx     (Reusable chapter heading for Quran/Hadith views)
│   │   │   ├── ContextualBridge.jsx        (Ontology hover-tooltips: desktop hover + mobile tap, edge-aware positioning)
│   │   │   ├── CourseLibrary.jsx           (Video course catalog — scaling)
│   │   │   ├── DuaLibrary.jsx              (Full Dua reader: dashboard + editorial reading canvas + Error Boundary)
│   │   │   ├── HadithCard.jsx              (Individual narration display card with copy, save, find-similar)
│   │   │   ├── HadithLibrary.jsx           (Foundation Library: browsable hadith archive with hybrid engine)
│   │   │   ├── Home.jsx                    (Bento Grid home screen: collections, exploration widgets, onboarding)
│   │   │   ├── KisaAcademy.jsx             (Educational hub: Bento routing to Transcripts & Courses)
│   │   │   ├── MasteryRing.jsx             (SVG ring visualization for quiz/mastery progress)
│   │   │   ├── QuranReader.jsx             (Full Quran reader: auto-resume, Tafsir Map, Reverse Tafsir, Virtues panel)
│   │   │   ├── RevisionModule.jsx          (LMS: flashcards, MCQ quizzes, confidence scoring, archetypes)
│   │   │   ├── StudyVault.jsx              (Tri-pane study workspace: folders, multi-tag, margin notes)
│   │   │   ├── TheKisaExperience.jsx       (5-phase 3D card onboarding widget with LayoutGroup transitions)
│   │   │   ├── TranscriptLibrary.jsx       (Scholarly reading environment: Charcoal+Gold, export, 60fps scroll, Contextual Bridge)
│   │   │   ├── TranscriptEditor.jsx        (CMS Transcript Studio: tabbed Build/Preview, JSON dropzone, floating toolbar, How-To panel — 45 KB)
│   │   │   ├── KisaCommandCenter.jsx       (CMS App Shell: sidebar router for Hadith Library, Brain Ontology, Transcript Studio — 6 KB)
│   │   │   ├── HadithManager.jsx           (CMS Hadith Library: inline editor, collaborative flagging, analytics dashboard, How-To panel — 51 KB)
│   │   │   └── BrainOntology.jsx           (CMS Brain Ontology: 3-tier relational manager, Grid/List views, CRUD drawer, How-To panel — 44 KB)
│   │   ├── curated_exploration.json        (Pre-built semantic search shortcuts for home screen)
│   │   ├── daily_hadiths.json              (Curated daily hadith rotation pool)
│   │   ├── duas.json                       (Dua library: Arabic, transliteration, English, significance)
│   │   ├── index.css                       (Global CSS with Tailwind v4 directives)
│   │   ├── main.jsx                        (React entry point)
│   │   ├── quran.json                      (Quranic text database — src copy for import)
│   │   ├── quranBenefits.js                (Fadhaa'il database + spiritual prescriptions)
│   │   ├── revision_data.json              (NotebookLM-generated flashcards and MCQ quizzes)
│   │   ├── supabaseClient.js               (Legacy import path — re-exports the single env-based client from lib/supabase.js; no hardcoded credentials)
│   │   ├── lib/
│   │   │   └── supabase.js                 (Canonical Supabase client — credentials via import.meta.env)
│   │   ├── transcripts.json                (Translated scholarly commentary series)
│   │   └── verse_map.json                  (Quran verse → hadith Tafsir connections)
│   └── vite.config.js                      (Vite configuration with React plugin)
├── db_backups/                         (Database Safety Net)
│   └── thaqalayn_pre_bulk_insert.db        (Pre-migration SQLite backup)
├── docs/                               (Project Documentation — tracked in git)
│   ├── kisa_architecture.md                (THIS FILE — Master Architecture Document)
│   ├── FormatTranscripts.md                (AI SOP: quote extraction & citation formatting for transcript JSON)
│   ├── YoutubeTranscription.md             (AI SOP: Arabic lecture transcription & segmented translation workflow)
│   ├── SOP_Ontology_Update.md              (3-phase SOP: NotebookLM extraction → AI SQL generation → DB injection)
│   └── supabase_rls_policies.sql           (Idempotent RLS policy script: admins table + is_admin(), public-read/admin-write, per-user vault)
├── chroma_db/                          (ChromaDB Vector Store — experimental)
│   └── chroma.sqlite3
├── alkafi.db                           (Local SQLite database)
├── concept_atlas.db                    (Concept Atlas embedding store)
├── thaqalayn.db                        (PRIMARY SQLite: hadiths + Ontology Brain tables)
├── server.py                           (FastAPI Concept Atlas API: local vector search + K-Means + RAM protection)
├── migrate.js                          (SQLite → Supabase batch migration script: 500-row upserts)
├── migrate-json.js                     (JSON data migration utility)
├── clean_database.js                   (Standalone DB sanitizer: 3-layer regex — punctuation, honorifics, names)
├── fetch-quran.js                      (Quran data fetcher)
├── build_db.py                         (SQLite database builder)
├── build_atlas_db.py                   (Concept Atlas DB builder with embeddings)
├── embed_ontology.py                   (Ontology vector embedding generator)
├── embedder.py                         (General-purpose sentence-transformer embedder)
├── export_db.py                        (Database export utility)
├── ingest.py                           (Data ingestion pipeline)
├── scraper.py                          (Thaqalayn.net web scraper)
├── search.py                           (Local search testing utility)
├── upload_cloud.py                     (Cloud upload utility)
├── xray.py                             (Database inspection/debugging tool)
├── package.json                        (Root deps: @supabase/supabase-js, dotenv, sqlite3)
├── .env                                (Root environment variables)
└── .gitignore                          (Excludes: *.db, *.sqlite3, node_modules, venv, chroma_db, .env, migration scripts)
```

### Component Summary Matrix

| Component | File | Size | Primary Role |
|---|---|---|---|
| App (Router) | `App.jsx` | 140 KB | Master state, routing, auth, search, Vault states (folders/tags), deep-link targeting (anchorHadith/quranTarget), global history drawer, and 3-tier font selection. |
| Quran Reader | `QuranReader.jsx` | 63 KB | Full Quran with auto-resume, Tafsir, Virtues |
| Transcript Library | `TranscriptLibrary.jsx` | 90 KB | Scholarly reading, export, native scrolling, Contextual Bridge integration, env-safe API routing |
| Hadith Library | `HadithLibrary.jsx` | 82 KB | Browsable hadith archive with hybrid engine |
| Study Vault | `StudyVault.jsx` | 64 KB | Tri-pane workspace, folders, margin notes |
| Home | `Home.jsx` | 30 KB | Bento Grid dashboard, exploration widgets |
| Dua Library | `DuaLibrary.jsx` | 22 KB | Supplication reader with Error Boundary |
| Revision Module | `RevisionModule.jsx` | 23 KB | Flashcards, quizzes, confidence scoring |
| Hadith Card | `HadithCard.jsx` | 17 KB | Individual narration display/actions |
| Kisa Experience | `TheKisaExperience.jsx` | 16 KB | 3D onboarding widget |
| Kisa Academy | `KisaAcademy.jsx` | 10 KB | Educational hub routing with external target logic |
| Contextual Bridge | `ContextualBridge.jsx` | 6 KB | Ontology tooltips: hover/tap, edge-aware, animated |
| Course Library | `CourseLibrary.jsx` | 4 KB | Video course catalog |
| Mastery Ring | `MasteryRing.jsx` | 3 KB | SVG progress visualization |
| Chapter Heading | `ChapterTitleHeading.jsx` | 1 KB | Reusable heading component |
| Glossary | `Glossary.jsx` | 24 KB | Comprehensive A-Z dictionary of Twelver Shia terminology |
| CMS Dashboard | `CMSDashboard.jsx` | 18 KB | Admin overview dashboard within the Command Center |
| Footer | `Footer.jsx` | 8 KB | Global footer component handling secondary navigation |
| **Command Center** | `KisaCommandCenter.jsx` | **6 KB** | **CMS app shell: sidebar navigation, module routing, Supabase prop injection** |
| **Hadith Manager** | `HadithManager.jsx` | **51 KB** | **CMS hadith editor: inline editing, collaborative flagging, analytics dashboard, How-To panel** |
| **Brain Ontology** | `BrainOntology.jsx` | **44 KB** | **CMS ontology manager: Grid/List views, concept CRUD, synonym/relation editors, locked drawer, How-To panel** |
| **Transcript Editor** | `TranscriptEditor.jsx` | **45 KB** | **CMS transcript studio: Build/Preview tabs, JSON dropzone, floating toolbar, How-To panel** |
| Server (Node.js) | `server.js` | 23 KB | Express API: Dual search, Ontology, K-Means, Gemini, /api/ontology, strict CORS whitelist |
| Server (Python) | `server.py` | 7 KB | FastAPI: Local vector search, clustering, RAM protection |
