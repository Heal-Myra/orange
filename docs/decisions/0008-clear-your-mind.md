# 0008 "Clear your mind": one to-do list, Myra picks today's focus

Date: 20 October 2026. Decided by: the founder (idea) with Claude.

## Decision
- One to-do list in three groups: **Family**, **Work**, **Better me**. Its home is a card on the **Mind** tab ("Clear your mind"), because its purpose is to lower mental load.
- Each morning one or two tasks become today's **Focus**, shown as a block inside **Myra recommends** on Today. Default pick: overdue and due-today first, then the oldest undated task; when the AI runs, Myra may pick differently (fewer and lighter on a low-energy day).
- Every other task that was due, or had no date, gets a new date automatically, at most two a day, so the list never sits as one heavy pile. Ticking a task removes it from the Focus and the list.
- A task moved three times gets a gentle question: make it smaller, or let it go? No penalties; no points yet.
- The Library tab moved into Profile, leaving four tabs (Today, Body, Mind, Soul), to keep the app clean.

## Why
Unfinished tasks keep intruding on the mind until there is a plan for them (Masicampo & Baumeister, 2011); writing tomorrow's tasks down before bed helped people fall asleep faster (Scullin et al., 2018). Showing only one or two a day keeps the person in control instead of facing the whole pile.

## Data
Table `tasks` (migration 0005), own rows only (RLS). Saved on the device first; synced when signed in. Task titles are sent to the AI only to pick today's focus. Deleting my data deletes the tasks.

## Next
Add tasks by speaking to Myra ("Remind me to pay school fees on Friday"); a 30-second evening check-in.
