# 0023 · "How do you feel today?"

Date: 24 Oct 2026 · Decided by: founder ("I have a cold today; once I have input that, all suggestions should come in light of what's good for a cold")

## Decision
- Today asks once a day: Great · Good · Okay · Low · Unwell; if not great, a few taps for what bothers (cold, cough, fever,
  headache, body ache, tired, upset stomach, period pain, stressed, slept badly) and an optional note. Then it folds into one
  line ("Unwell · Cold"); tap to change. If yesterday had symptoms: one tap "Still the same as yesterday".
- Myra is told how the person feels with everyday care hints for each symptom (src/lib/feeling.ts) and must fit EVERY
  suggestion to it (Clear your mind, food plan, breathing, sleep); her suggestion refreshes as soon as the answer changes.
- Guided breathing on such days uses calming practices only (no Bhastrika or Kapalbhati).
- Not a diagnosis. Fever shows when to see a doctor; Myra says so when relevant.

## In your own words (same day, founder)
A text box comes first ("I have a cold since last night"); the mood and symptom taps are optional shortcuts. Symptoms are also
read from the words (English and Hindi, src/lib/feeling.ts), and Myra reads the words themselves.
