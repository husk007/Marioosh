# AGENTS.md — art production agent (Marioosh & Darioosh: Klątwa Katoblepasa)

You are an image-production agent for a 2D HD platformer. Your job each run: **produce the missing game image(s) assigned to you** (up to 10 if no LANE is given; exactly ONE if the task prompt gives a LANE number), exactly as specified in a *window file*, and deliver them under exact file names. You do **not** write game code.

Repository: `husk007/Marioosh` (public). Raw base URL: `https://raw.githubusercontent.com/husk007/Marioosh/main/`

## Files you may read
- `art-tasks/ROADMAP.md` — auto-generated progress + the line `FIRST_TODO_WINDOW: W###`.
- `art-tasks/windows/W###.md` — 10 numbered items each: target file name, aspect, background rule, references (URLs), full PROMPT. Window numbering is stable. A window that no longer exists (HTTP 404) is fully DONE.
- `public/art/gen/**` — already finished images (these are the *references* for new items). Never modify them.

## 1. Choose the window
- **MODE A (you can commit to the repo):** take the window named by `FIRST_TODO_WINDOW` in ROADMAP.md.
- **MODE B (you can NOT commit; images are returned in chat):** window = `W0 + FLOOR(hours elapsed since START)` (both given in the task prompt; use the real current time). If that window file does not exist (404) it is DONE → move to the next number until you find an existing window file. If you run past the last existing window, fall back to `FIRST_TODO_WINDOW` in ROADMAP.md.
- **LANE (parallel tasks):** if the task prompt gives `LANE: N`, then in the chosen window take only the N-th item marked `(TODO)` (count TODO items in listed order, ignoring DONE and SKIP) and produce just that ONE image. If the window has fewer than N TODO items, reply `NOTHING TO DO` (no image). Several tasks with different LANE numbers run in parallel on the same window; never touch other lanes' items.
- Items marked `(SKIP)` are out of scope — ignore them like DONE.
- Generate ONLY items marked `(TODO)`. Never redo `(DONE)` items. Never invent items or change prompts.

## 2. Produce each TODO item (in listed order, one image per item)
1. If the item lists **References**: open every reference URL so the image is visible to you and use them *as visual reference in the listed order* (Image 1, Image 2, …). The reference decides the design, colours, proportions, costume, tools and line style of the subject; the PROMPT decides only what changes (pose / state / variant / scene). For `style` references copy palette, materials and line language only — never the composition.
2. If the item says **References: none** → work from the PROMPT only.
3. If a reference URL cannot be opened or seen: try once more; if still impossible, generate from the PROMPT alone and add the suffix `~noref` to the file name (`ENEMIES-001__walk~noref.png`). Never silently skip a reference.
4. Use the prompt text **verbatim** (including the AVOID list). Do not add text, labels, borders, watermarks, UI, captions, contact sheets or several variants in one image.
5. Image settings: use the item's **Aspect** (square / landscape 3:2 / portrait 2:3). **Background — TRANSPARENT items:** ask the image generator explicitly for a PNG with a TRUE alpha channel ("transparent background"). NEVER paint a checkerboard / grey-white grid to imitate transparency, and never add a floor, ground shadow, glow halo or backdrop. Only if real transparency is impossible, use one flat pure white `#FFFFFF` fill (the pipeline removes it automatically). **OPAQUE items:** fill the whole frame.
6. Isolated sprites: full figure visible, ≥5 % empty margin on all sides, side view facing right unless the PROMPT says otherwise, feet on one consistent baseline, same relative scale as the reference.
7. Quick quality gate before delivering — regenerate once if it fails: right subject and pose · matches the reference (face, outfit colours, horns, helmet, tools) · no pixel-art look · no text · nothing cropped · background rule satisfied.

## 3. Deliver
File name for every image = the item's **Save as** value, exactly (`ASSET-ID__state.png`, e.g. `CHARACTERS-001__walk.png`).
- **MODE A:** commit the PNG files into `art-inbox/` on branch `main` (if direct pushes are blocked: branch `art-chatgpt` + a pull request into `main`). Touch nothing else. A GitHub Action will cut out backgrounds, convert to WebP, update the manifest and ROADMAP automatically.
- **MODE B:** post the images in chat. Directly above each image write `FILE: art-inbox/<exact name>`. 

## 4. Finish with a short report
```
WINDOW: W###   MODE: A|B
DONE: <list of file names produced>
SKIPPED: <ids + reason>        (e.g. already DONE, run time ran out)
NOREF: <file names produced without references>
PROBLEMS: <anything the maintainer must know>
```
If you cannot finish all items in this run, deliver what is finished and list the rest under SKIPPED — never deliver half-done or placeholder images.

## Art direction (summary — the item PROMPT is authoritative)
Smooth, clean, hand-illustrated 2D HD game art: soft cel shading, subtle painted texture, crisp silhouettes, vivid balanced colours, light from upper left. **No pixel art, no photorealism, no 3D render.** Child-friendly magical sci-fi. Heroes: Marioosh — stocky older electrician, orange overalls, cobalt helmet, wrench. Darioosh — slim younger electrician, blue overalls, yellow helmet, measuring tool. No copyrighted/branded characters.
