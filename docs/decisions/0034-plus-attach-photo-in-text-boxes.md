# 0034 — "+" in text boxes: a photo becomes the words
Date: 30 October 2026 · Status: decided (founder)

Founder: "Can we add a provision where we can upload a picture from notebooks and it can auto populate the task list …
a simple plus sign which when clicked asks attach from file or camera. Also in all chat/text boxes we shall have the same feature."

**Decision.** A round "+" sits next to the writing boxes, like the + in Claude's chat box. Tapping it opens a small sheet:
Camera · Photos · Files (Files offers pictures saved in the Files app; Camera and Files are hidden on the web).
Myra reads the photo (AI action `read_note` in heal-ai; the photo is sent once and not kept), and:
- **Clear your mind:** every to-do on the page becomes a ready list with its group (Family, Work, Better me), date and
  repeat. The person unticks what they don't want, can tap a group to change it, then "Add n to-dos". The usual rules
  hold: at most three a day per group (extras move to the next free day and the app says so); repeating items become habits.
- **Gratitude journal:** a photo of the paper journal fills the empty panels (thankful ×3, made me laugh, I was kind to,
  best part of my day). Anything already typed is kept.
- **Every other writing box** (Daily Wisdom, How I lived it, Thought of the day, About you, usual day, goal, etc., i.e. every
  multi-line `TextField`) and the feedback box: the words in the photo are added to the box.
- **Myra chat** already had camera, photo and document; its paperclip is now the same "+".

**Not added:** the meal box (it already has Snap a photo, which reads the food itself), number boxes and search boxes.

**How:** `src/components/AttachPlus.tsx` (`useAttach`), `src/lib/photo.ts` (photos shrunk to 1600 px wide for handwriting),
`readNoteTasks`, `readNoteJournal`, `readNoteText` in `src/lib/ai.ts`. Each read counts as one AI request. No new native
module (image picker and document picker are in build 12), so it ships as a quick update.
