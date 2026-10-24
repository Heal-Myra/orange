# How the well-being score works

Well-being = **Body + Mind + Soul**, each out of 100, so the total is out of 300.
It is a working model to help a person understand themselves, not a medical measure (The Orange Book, Chapter 2).
The code is in `src/lib/scoring.ts`; tests are in `src/lib/scoring.test.ts`.

## Body (100)
| Part | Points | How |
| --- | --- | --- |
| Movement | 40 | 20 × steps ÷ target + 20 × active minutes ÷ target (each capped) |
| Sleep | 30 | 20 for 7–9 hours (less outside that range) + 10 × quality ÷ 5 |
| Food | 30 | Founder's rule, 22 Oct 2026: calories 12 (full at or under the target, 0 at 140 % of it) + protein 9 (share of calories: 0 at 10 %, full at 25 %+) + fibre 6 (full at 14 g per 1,000 kcal) + fat 3 (full at 30 % of calories or less, 0 at 45 %). Eating less than the target, or fasting, is not penalised; a mix leaning to protein and fibre beats one heavy in carbs and fat. |

## Mind (100)
A clear mind and what the mind is fed. Meditation moved to Soul on 20 Oct 2026; on 21 Oct 2026 the founder removed the
Attention and Learning ticks and gave their 30 points to the to-do list ("Clear your mind").
| Part | Points | How |
| --- | --- | --- |
| Focus tasks done | 30 | 15 for each of Myra's 1–2 focus tasks ticked off today (older days with Attention/Learning keep those points, within 30) |
| Content quality | 40 | social-media minutes weighted by category (learning, spiritual 100 % … outrage, gossip 0 %) |
| Content quantity | 30 | full within the daily limit, falling to 0 at three times the limit |

A day with no social media earns the full 70 content points.

**Learning:** writing what you learned today (about five words, with an optional link) in Phone activity adds 15 points to Mind (founder, 21 Oct 2026); Mind is capped at 100.

**Tao practice:** each weekday has a Tao Te Ching practice (`src/lib/tao.ts`), all on the Mind tab since 20 Oct 2026. Doing it adds 10 points to Mind; Mind is capped at 100.

## Soul / inner life (100)
Rebalanced 20 Oct 2026: the founder took the eight-practices check and the Tao card off Soul. The eight practices are kept in the Library for the future, when the app can understand them from a person's day without a checklist.
| Part | Points | How |
| --- | --- | --- |
| Breathing & meditation | 30 | minutes in the app's timer, or mindful minutes from Apple Health (the larger), ÷ daily target |
| Daily Wisdom studied | 30 | Read the day's passage (from the person's chosen tradition), open its meaning, tick "studied" |
| Gratitude | 40 | 10 for each thing written, up to four |

21 Oct 2026: the founder removed the Thought of the day card and set gratitude 40, meditation 30, Daily Wisdom 30.

Reflected actions (older entries) add or subtract up to 10 points. Soul stays between 0 and 100.

## Bands
240+ Flourishing · 180+ Balanced · 120+ Finding your footing · below 120 Needs care.

## Trends: Week, Month, Quarter, Year (22 Oct 2026)

Every tab has a D · W · M · Q · Y switch (src/lib/trends.ts). Calendar periods (weeks start Monday). Shown as a line graph (23 Oct 2026; was bars). Week and Month: one point per day; Quarter: per week; Year: per month. A point is the average of the days with data (days without data are left out, never counted as zero); "days" measures (learning, Daily Wisdom) count the days instead. The change is against the previous period of the same kind; under 2% shows as steady. Green or red only where a direction is clearly better (weight follows the person's goal).

## Learning (22 Oct 2026)

Learning adds 15 to Mind when today's note has at least 3 characters. The note is up to 10 words; Myra can write it from a pasted or shared link.

## Fasting days (22 Oct 2026)

If the person switches on "I'm fasting today" on the Food card and the day's food stays at or under 60 kcal (water, black tea, black coffee), Nutrition scores the full 30. If more food is logged, the day is scored as a normal day.

## Love (24 Oct 2026)

Soul gets a Love bonus of up to +15 (still capped at 100): whom I love today and how (+5), what I will do to make myself happy
today (+5), the friend I am meeting this week (+5, carried to every day of that week). Planning a party is optional and earns
no points.
