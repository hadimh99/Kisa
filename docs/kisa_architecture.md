# Project Al-Kisa: Master Architecture & Context

## 1. Core Mission
Al-Kisa is a highly sophisticated semantic search engine and theological workspace built specifically for authentic Twelver Shia literature. It bridges the gap between ancient texts and modern data science, leveraging AI vector embeddings and NLP to map the underlying meaning of foundational texts (like *al-Kafi*, *Bihar al-Anwar*, and *Basa'ir al-Darajat*). 
* **Theological Framework:** Built strictly on Twelver Shia theology. Core Shia texts are prioritized over Sunni books unless explicitly instructed otherwise.
* **Mechanism:** A React frontend connects to a Node.js backend. It uses a hybrid architecture: querying a local SQLite database for raw text, keywords, and theological ontology anchors, while querying a cloud Pinecone database for 384-dimensional semantic hadith matching.

## 2. The Tech Stack
* **Frontend:** React (Modularized architecture with `App.jsx` acting as the router/wrapper for isolated components like `QuranReader.jsx`, `KisaAcademy.jsx`, `TranscriptLibrary.jsx`, `CourseLibrary.jsx`, `HadithLibrary.jsx`, `StudyVault.jsx`, `HadithCard.jsx`, `DuaLibrary.jsx`, `SpiritualHub.jsx`, `TheKisaExperience.jsx`, `Home.jsx`, `MasteryRing.jsx`, `RevisionModule.jsx`, `ContextualBridge.jsx`, and `ChapterTitleHeading.jsx`), Framer Motion (animations), Tailwind CSS v4 (via `@tailwindcss/postcss`), Lucide React (iconography).
* **Local Data:** `transcripts.json` (translated scholarly commentary — AI-translated Arabic lecture transcripts stored in a strict segmented JSON schema; see §4, Semantic Commentary Layer), `revision_data.json` (NotebookLM LMS data), `thaqalayn_complete.json` (14,500+ hadiths, hosted in `public/` for async streaming), `basair_complete.json` (*Basa'ir al-Darajat* narrations, hosted in `public/`), `quran.json` (Quranic text, mirrored in both `src/` and `public/`), `verse_map.json` (Tafsir connections), `quranBenefits.js` (Twelver Fadhaa'il database), `duas.json` (supplication library with Arabic, transliteration, and English passages), `daily_hadiths.json` (curated daily hadith pool), and `curated_exploration.json` (pre-built semantic search shortcuts for the home screen).
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
5. `kisa_hadiths` (Supabase Postgres): The live, master repository for all narrations, supporting real-time administrative overrides. (Columns: `id`, `book`, `volume`, `category`, `chapter`, `hadith_number`, `author`, `englishText`, `arabicText`, `majlisiGrading`, `manual_body`, `manual_chain`).
6. `hadiths` (SQLite — `concept_atlas.db`): The standalone Concept Atlas embedding store. (Columns: `hadith_id`, `arabic_text`, `english_text`, `embedding` *(binary BLOB, float32 NumPy arrays)*).

## 4. Current Features & Capabilities (Implemented)

**Search & Navigation Engine:**
* **Dual Search Engine:** 
  * *Concept Mode:* Uses Hugging Face to embed queries, searching Pinecone for semantic matches, grouping results via K-Means clustering, and labeling them via the Gemini API.
  * *Keyword Mode:* Highly optimized SQLite index search pulling exact matches/partial variations for English and normalized Arabic.
* **Apple-Inspired Global Omni-Search:** A dedicated, full-screen "Theater Curtain" search overlay deployed from the global header, completely replacing redundant inline search bars and providing a distraction-free query environment.
* **Al-Kisa Brain Ontology Intercept (High-Gravity Blending):** Intercepts user queries before they reach the generic AI. Scans for Twelver synonyms, grabs the pre-computed 384-dimensional Twelver vector from SQLite, and applies an 85% "High Gravity" blend. This mathematically crushes linguistic collisions (e.g., Fiqh vs. Aqa'id).
* **Vector Hopping ("Find Similar"):** Pivots the search engine around the vector signature of any individual narration, featuring a persistent "Anchored Source" UI.
* **Curated Exploration Widgets:** Pre-built semantic search shortcuts (`curated_exploration.json`) displayed on the home screen, routing users directly into deep concept searches (e.g., "The Intellect & Ignorance", "The Divine Covenant", "The Promised Era").
* **LRU Search Cache:** Server-side in-memory cache (`Map`, 200-entry limit) for instant repeat query responses.

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

**The Spiritual Hub (Liturgical Engine):**
* **The Hub (`SpiritualHub.jsx`):** A unified, tabbed container wrapping the Quran Reader, the Dua Library, and a placeholder Ziyarat module. Features iOS-tier spring-animated tab switching with Framer Motion `layoutId` transitions.
* **The Dua Library (`DuaLibrary.jsx`):** A full-featured supplication reader powered by `duas.json`. Features a premium card-based dashboard, an editorial passage-by-passage reading canvas with centered Arabic, transliteration, and English, cinematic GPU-accelerated scroll progress bars, a scroll-direction-aware sticky header HUD, per-passage clipboard copying with full reference formatting, Vault bookmarking for individual passages, an expandable "Significance" panel for historical context, universal pre-Dua invocations (Bismillah & Salawat), and deep-link routing from `App.jsx` via `externalTarget` prop. Wrapped in a React Error Boundary for crash protection.
* **Ziyarat (Under Construction):** Placeholder module in `SpiritualHub.jsx` with a premium "Geography of Light" under-construction card.

**The Kisa Experience (`TheKisaExperience.jsx`):**
* **Interactive Onboarding Widget:** A 5-phase morphological UI demo using 3D CSS card flips with `preserve-3d` and hardware-accelerated `backface-visibility`. Progressively reveals the platform's capabilities (Semantic Engine → Unbroken Chain → Theological Fortress) before expanding into a cinematic full-screen "Know Your Imam" call-to-action. Features `useReducedMotion` accessibility fallback, Framer Motion `LayoutGroup` shared element transitions, and direct routing to the Transcript Library.

**The Home Screen (`Home.jsx`):**
* **Apple-Standard Bento Grid:** A responsive, column-spanning grid layout featuring Core Collections cards, the "Living Library" onboarding section, and the Curated Exploration widgets.
* **"Ghost Writer" Entrance Choreography:** A zero-stutter typewriter-style animation cycling through example search queries in the global search bar.

**Kisa Academy (The Educational Hub):**
* **The Hub (`KisaAcademy.jsx`):** A centralized, Apple-style Bento Grid routing users between the text-based archive and video-based courses.
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
* **Dynamic API Routing (Frontend Security Rule):** Frontend components (`TranscriptLibrary.jsx`, `ContextualBridge.jsx`, `App.jsx`, etc.) **must never use hardcoded URLs, IP addresses, or port numbers** (e.g., `http://hostname:8000`) for API calls. All fetch calls strictly resolve their base URL via `import.meta.env.VITE_API_URL || ''`. Falling back to an empty string produces a relative path (e.g., `/api/ontology`), which automatically inherits the current page's protocol and origin (`https://`). This eliminates Mixed Content blocks (HTTPS page → HTTP fetch) and ensures seamless operation behind any reverse proxy without code changes.
* **Strict CORS Policy (Backend Security Rule):** The Node.js backend (`server.js`) **strictly forbids wildcard (`origin: '*'`) CORS configurations**. The `cors` middleware uses an explicit whitelist function that validates the `Origin` header against an approved array: production domains (`https://www.al-kisa.org`, `https://al-kisa.org`) and local development servers (`http://localhost:5173`, `http://localhost:3000`). Requests with no `Origin` header (server-to-server, `curl`, mobile apps) are permitted. All unrecognized origins are rejected and logged to the console with a `[CORS] Blocked request from origin:` warning.
* **Native Tab Memory:** Active tab persisted to `localStorage` so the app reopens exactly where the user left off.
* **3-Tier Theme Engine:** Light, Sepia (`#FDFBF7`), and Dark (`#000000`) modes with eye-strain-optimized background and text color calculations.
* **Animated Menu Physics:** Custom SVG hamburger-to-X morphing icon using Framer Motion line animations.
* **App Update Changelog:** In-app versioned changelog (`APP_UPDATES` array) tracking platform evolution from v3.5.2 through v5.1.0.
* **Supabase Auth Flow:** Full email/password authentication with sign-up, sign-in, session persistence, and sign-out confirmation modal.

## 5. Future Roadmap & Long-Term Goals

* **World-Class LMS Integration (Current Focus):** Evolving Kisa Academy based on evidence-based pedagogy:
  * ~~**The Contextual Bridge (Ontology Hover-Tooltips):**~~ ✅ **SHIPPED** — See §4, Kisa Academy.
  * **Algorithmic Pathways (Mastery Learning):** Restricting access to advanced modules until prerequisite `RevisionModule` quizzes are passed.
  * **The "On-Ramp" (Priming):** "Need-to-Know" pre-flight vocabulary briefings rendered at the top of dense transcripts.
  * **Practical Application:** Guided journaling prompts at the end of modules that auto-sync to "The Scholar's Margin" in the Study Vault.
* **The Ziyarat Library (Phase 2):** Completing the "Geography of Light" module inside the Spiritual Hub with a full Ziyarat text library matching the Dua Library's editorial quality.
* **The Momentum Engine (Habit V2):** Transforming the User Hub into a "Scholar's Dashboard" that tracks "Nur" (Consistency) and debounced video-resume states via Supabase.
* ~~**Semantic Commentary Vectorization:**~~ ✅ **SHIPPED** — See §4, Semantic Commentary Layer. (Future: Pinecone indexing of commentary vectors for cross-corpus semantic search.)
* **Multi-Volume Database Expansion:** Seamlessly integrate *Basa'ir al-Darajat* (approx. 1,800-2,000 narrations). Static JSON (`basair_complete.json`) already staged in `public/`.
* **The Audiobook Engine (Neural TTS):** Integrating Microsoft's `edge-tts` to generate free, ultra-realistic audio files for the 50+ hour Transcript Library.
* **Theological Highlighting & Word-by-Word Roots:** Adding permanent visual luminescence to foundational Twelver verses and implementing a root-word analysis tooltip for Quranic Arabic.

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
│   │   ├── App.jsx                         (MASTER router/wrapper — 1,853 lines. Auth, themes, search, Vault, navigation)
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
│   │   │   ├── SpiritualHub.jsx            (Tabbed container: Quran + Dua + Ziyarat with spring tabs)
│   │   │   ├── StudyVault.jsx              (Tri-pane study workspace: folders, multi-tag, margin notes)
│   │   │   ├── TheKisaExperience.jsx       (5-phase 3D card onboarding widget with LayoutGroup transitions)
│   │   │   ├── TranscriptLibrary.jsx       (Scholarly reading environment: Charcoal+Gold, export, 60fps scroll, Contextual Bridge)
│   │   │   └── TranscriptVideoPlayer.jsx   (Embedded video player for lecture courses)
│   │   ├── curated_exploration.json        (Pre-built semantic search shortcuts for home screen)
│   │   ├── daily_hadiths.json              (Curated daily hadith rotation pool)
│   │   ├── duas.json                       (Dua library: Arabic, transliteration, English, significance)
│   │   ├── index.css                       (Global CSS with Tailwind v4 directives)
│   │   ├── main.jsx                        (React entry point)
│   │   ├── quran.json                      (Quranic text database — src copy for import)
│   │   ├── quranBenefits.js                (Fadhaa'il database + spiritual prescriptions)
│   │   ├── revision_data.json              (NotebookLM-generated flashcards and MCQ quizzes)
│   │   ├── supabaseClient.js               (Supabase client initialization)
│   │   ├── transcripts.json                (Translated scholarly commentary series)
│   │   └── verse_map.json                  (Quran verse → hadith Tafsir connections)
│   └── vite.config.js                      (Vite configuration with React plugin)
├── db_backups/                         (Database Safety Net)
│   └── thaqalayn_pre_bulk_insert.db        (Pre-migration SQLite backup)
├── docs/                               (Project Documentation — tracked in git)
│   ├── kisa_architecture.md                (THIS FILE — Master Architecture Document)
│   ├── FormatTranscripts.md                (AI SOP: quote extraction & citation formatting for transcript JSON)
│   ├── YoutubeTranscription.md             (AI SOP: Arabic lecture transcription & segmented translation workflow)
│   └── SOP_Ontology_Update.md              (3-phase SOP: NotebookLM extraction → AI SQL generation → DB injection)
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
| App (Router) | `App.jsx` | 130 KB | Master state, routing, auth, search, Vault orchestration |
| Quran Reader | `QuranReader.jsx` | 63 KB | Full Quran with auto-resume, Tafsir, Virtues |
| Transcript Library | `TranscriptLibrary.jsx` | 90 KB | Scholarly reading, export, native scrolling, Contextual Bridge integration, env-safe API routing |
| Hadith Library | `HadithLibrary.jsx` | 82 KB | Browsable hadith archive with hybrid engine |
| Study Vault | `StudyVault.jsx` | 64 KB | Tri-pane workspace, folders, margin notes |
| Home | `Home.jsx` | 30 KB | Bento Grid dashboard, exploration widgets |
| Dua Library | `DuaLibrary.jsx` | 22 KB | Supplication reader with Error Boundary |
| Revision Module | `RevisionModule.jsx` | 23 KB | Flashcards, quizzes, confidence scoring |
| Hadith Card | `HadithCard.jsx` | 17 KB | Individual narration display/actions |
| Kisa Experience | `TheKisaExperience.jsx` | 16 KB | 3D onboarding widget |
| Kisa Academy | `KisaAcademy.jsx` | 9 KB | Educational hub routing |
| Spiritual Hub | `SpiritualHub.jsx` | 7 KB | Tabbed Quran/Dua/Ziyarat container |
| Contextual Bridge | `ContextualBridge.jsx` | 6 KB | Ontology tooltips: hover/tap, edge-aware, animated |
| Course Library | `CourseLibrary.jsx` | 4 KB | Video course catalog |
| Mastery Ring | `MasteryRing.jsx` | 3 KB | SVG progress visualization |
| Video Player | `TranscriptVideoPlayer.jsx` | 2 KB | Embedded lecture player |
| Chapter Heading | `ChapterTitleHeading.jsx` | 1 KB | Reusable heading component |
| Server (Node.js) | `server.js` | 23 KB | Express API: Dual search, Ontology, K-Means, Gemini, /api/ontology, strict CORS whitelist |
| Server (Python) | `server.py` | 7 KB | FastAPI: Local vector search, clustering, RAM protection |
