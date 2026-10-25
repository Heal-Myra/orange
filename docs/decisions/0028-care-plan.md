# 0028 · Care plan: once a problem is known, everything helps solve it

Date: 25 Oct 2026 · Decided by: founder ("the moment we have diagnosed a problem, all elements which can help solving the issue
for that consumer shall get activated: food, exercise, meditation and other activities")

- When "How do you feel today?" mentions a problem (cold, cough, fever, headache, body ache, tiredness, upset stomach, period
  pain, stress, poor sleep), a Care plan card appears on Today: eat and drink, a breathing session made for it, movement,
  rest, what to avoid, when to see a doctor (src/lib/care.ts, tested). Several problems merge; fever means rest, no exercise.
- The same plan switches the rest of the app: Myra's mix becomes "Care breathing" (e.g. a cold: Anulom Vilom, Ujjayi,
  Bhramari; fever: Yoga Nidra), the Food card shows what suits it, the Movement card says how much to move, Myra's
  suggestions and tomorrow's food plan follow it (decision 0023).
- Everyday, traditional self-care; never a diagnosis or a medicine.
