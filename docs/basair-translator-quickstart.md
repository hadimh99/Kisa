# Basa'ir Translation — Quick Start

A simple way for the team to translate *Basa'ir al-Darajat* in parallel using Claude.
No technical skills needed.

Two roles:
- **Owner (Hadi)** — assigns chapters, sends files, collects results.
- **Translator** — sets up Claude once, then translates assigned chapters one at a time.

**Each translator works in their OWN private Claude project — nobody sees anyone else's
work.** Coordination (who does which chapter) happens in one shared **Assignment Tracker**
sheet that the Owner controls. That sheet is the single source of truth.

---

## Part A — Owner: one-time setup (~10 min)

1. **Make the Assignment Tracker.** Open `ASSIGNMENT-TRACKER.csv` (in the
   `Basair-Chapters` folder) in **Google Sheets** (or Excel) and put it somewhere the team
   can see it (e.g. share-link, view-only for them, edit for you). Columns:
   `Part | Chapter | Title | File | Pages | AssignedTo | Status`.
   Part 1 Chapters 1–4 are pre-marked **DONE**.
2. **Assign chapters.** In the `AssignedTo` column, write each person's name next to the
   chapters they'll do (e.g. give Sara Part 1 Ch 5–10, give Ali Ch 11–16). **Start from
   Part 1, Chapter 5.** Never put two names on the same row.
3. **Send each translator:**
   - The file **`basair-translator-kit.md`** (the instructions — they paste it once).
   - **Parts B & C below** (copy them into a message, so they know the steps).
   - **Their chapter PDF files** — see **Part D** for how to hand these out.

---

## Part B — Translator: one-time setup (~3 min, do this once)

1. Go to **[claude.ai](https://claude.ai)** and sign in.
2. In the left sidebar click **Projects** → **Create project**. Name it
   **"Basa'ir Translation"**. (This is *your own* private project.)
3. Open the project and find the **"Set project instructions"** (or "Instructions") box.
4. Open the **`basair-translator-kit.md`** file Hadi sent you, **select all of it, copy,
   and paste it** into that instructions box. **Save.**
5. Done — you never need to do this again. Claude in this project now knows exactly how to
   translate.

---

## Part C — Translator: translate a chapter (repeat for each assigned chapter)

1. Open your **"Basa'ir Translation"** project and click **New chat**.
2. **Upload the chapter PDF** Hadi gave you — drag it into the message box, or click the
   **📎 paperclip**.
3. Type this and send:

   > **Translate this whole chapter following the project instructions. Output only the
   > structured blocks, nothing else.**

4. Claude produces one block per narration. **Read it over.** If a saying looks wrong or
   garbled, reply: *"Re-check Hadith 4 — read the Arabic from the page image."*
5. **Copy Claude's entire output** (from the `====` header line down to the last block).
6. **Send it to Hadi** (paste into your shared doc / message / email) and say **which
   chapter** it was, e.g. *"Part 1, Chapter 5."*
7. In the Tracker, that row's **Status** → mark **Done** (or tell Hadi to).

**Tips**
- **One chapter per chat.** Start a fresh chat for the next chapter.
- If Claude writes paragraphs of explanation instead of blocks: *"Just the blocks,
  nothing else."*
- If the Arabic looks like nonsense: *"Read the Arabic from the page image, not the copied
  text."*
- Don't edit Claude's output yourself — send it as-is. Hadi checks and fixes anything.

---

## Part D — Owner: how to hand out the chapter files

The `Basair-Chapters` folder has subfolders **`Part-01`, `Part-02`, …**, each holding one
PDF per chapter, named like **`Part01-Ch05_THE-PEOPLE-ARE-CATEGORISED...pdf`**.

Pick whichever is easiest for your team:
- **Google Drive (recommended):** make one folder per translator, drop their assigned
  chapter PDFs in, share the link with them. Easy to add more later.
- **Email / WhatsApp / Slack:** just attach each person's chapter PDFs to a message.

Each translator only ever receives the chapters assigned to them in the Tracker, so there's
nothing to get confused about — they translate exactly the files you sent.

> **Why these are images, not the original PDF:** the book's Arabic text was scanned with a
> broken font, so I converted each chapter to clean page-images. Claude reads them
> perfectly. Don't send the giant original PDF — send the small per-chapter files.

---

## Part E — What the Owner does with the results

Paste each translator's block to Claude Code in the Kisa repo. Claude validates it against
the house style, fills in the technical fields, appends it to
`concept-ui/public/basair_complete.json`, and commits. Mark the chapter **Done** in the
Tracker. (Procedure: `docs/kisa_architecture.md` → Basa'ir section → "Ingesting team
translations".)
