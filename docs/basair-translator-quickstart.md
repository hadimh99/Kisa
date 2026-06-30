# Basa'ir Translation — Quick Start

A simple way for the team to translate *Basa'ir al-Darajat* in parallel using Claude.
No technical skills needed. Two roles: the **Owner** (Hadi) sets things up once; each
**Translator** repeats a short loop.

---

## Part A — Owner setup (one time, ~10 minutes)

1. **Create a shared Project in Claude.** Go to [claude.ai](https://claude.ai) →
   **Projects** → **New project** → name it **"Basa'ir Translation"**.
2. **Paste the instructions.** Open the project's **Instructions / custom instructions**
   box and paste in the entire contents of **`basair-translator-kit.md`**. Save.
3. **Share the project** with each translator (your Team plan lets you add members to the
   project), *or* just send each translator the `basair-translator-kit.md` file if they'll
   use their own Claude (they paste it at the start of each chat — see Part B note).
4. **Hand out chapters.** You have a folder **`Basair-Chapters/`** with one PDF per
   chapter (e.g. `Part01-Ch05_THE-PEOPLE-ARE-CATEGORISED...pdf`) and an
   **`ASSIGNMENT-INDEX.csv`** listing every chapter. Assign chapters to people (e.g. "Sara
   = Part 1, Ch 5–9") and send each person their chapter PDF files.
   - ⛔ **Avoid double-work:** don't give the same chapter to two people. Track who has
     what in the index sheet.
   - ✅ Already done — **Part 1, Chapters 1–4** are finished. Start handing out from **Ch 5**.

---

## Part B — Translator loop (repeat for each chapter)

1. Open the **"Basa'ir Translation"** project in [claude.ai](https://claude.ai) and start
   a **new chat** inside it.
2. **Upload your chapter PDF** (drag it into the message box, or click the 📎 paperclip).
3. Send this message:

   > **Translate this whole chapter following the project instructions. Output only the
   > structured blocks.**

4. Claude will produce one block per narration. **Read it over** — does each saying make
   sense? If something looks off, reply: *"Re-check Hadith 4, the Arabic on the image."*
5. **Copy the entire output** (from the `====` header to the last hadith block) and **send
   it to Hadi** (paste into the shared doc / email / message — however your team shares).
6. Tell Hadi **which chapter** it was (e.g. "Part 1, Chapter 5"). Done — next chapter.

> **If your team isn't using the shared project:** start a normal chat, paste the contents
> of `basair-translator-kit.md` as your first message, then do steps 2–6.

**Tips**
- One chapter per chat keeps Claude focused. Start a fresh chat for the next chapter.
- If Claude writes paragraphs of explanation instead of the blocks, say: *"Just the
  blocks, nothing else."*
- If the Arabic looks like nonsense in Claude's reply, remind it: *"Read the Arabic from
  the page image, not the copied text."*

---

## Part C — What Hadi does with it

Paste the translator's block to Claude Code in the Kisa repo. Claude validates it against
the house style, fills in the technical fields (IDs, chapter, search text), appends it to
`concept-ui/public/basair_complete.json`, and commits. (Details in
`docs/kisa_architecture.md` → Basa'ir section → "Ingesting team translations".)
