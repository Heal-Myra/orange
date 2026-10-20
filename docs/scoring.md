# How the well-being score works

Well-being = **Body + Mind + Soul**, each out of 100, so the total is out of 300.
It is a working model to help a person understand themselves, not a medical measure (The Orange Book, Chapter 2).
The code is in `src/lib/scoring.ts`; tests are in `src/lib/scoring.test.ts`.

## Body (100)
| Part | Points | How |
| --- | --- | --- |
| Movement | 40 | 20 × steps ÷ target + 20 × active minutes ÷ target (each capped) |
| Sleep | 30 | 20 for 7–9 hours (less outside that range) + 10 × quality ÷ 5 |
| Food | 30 | 12 for calories near target, 12 for protein met, 3 for fat at 20–35 % of energy, 3 for carbs at 40–62 % |

## Mind (100)
A clear mind and what the mind is fed. Meditation moved to Soul on 20 Oct 2026; on 21 Oct 2026 the founder removed the
Attention and Learning ticks and gave their 30 points to the to-do list ("Clear your mind").
| Part | Points | How |
| --- | --- | --- |
| Focus tasks done | 30 | 15 for each of Myra's 1–2 focus tasks ticked off today (older days with Attention/Learning keep those points, within 30) |
| Content quality | 40 | social-media minutes weighted by category (learning, spiritual 100 % … outrage, gossip 0 %) |
| Content quantity | 30 | full within the daily limit, falling to 0 at three times the limit |

A day with no social media earns the full 70 content points.

**Tao practice:** each weekday has a Tao Te Ching practice (`src/lib/tao.ts`), all on the Mind tab since 20 Oct 2026. Doing it adds 10 points to Mind; Mind is capped at 100.

## Soul / inner life (100)
Rebalanced 20 Oct 2026: the founder took the eight-practices check and the Tao card off Soul. The eight practices are kept in the Library for the future, when the app can understand them from a person's day without a checklist.
| Part | Points | How |
| --- | --- | --- |
| Breathing & meditation | 35 | minutes in the app's timer, or mindful minutes from Apple Health (the larger), ÷ daily target |
| Daily Wisdom studied | 35 | Read the day's passage (from the person's chosen tradition), open its meaning, tick "studied" |
| Gratitude | 30 | 10 for each thing written, up to three |

21 Oct 2026: the founder removed the Thought of the day card; its 15 points moved to meditation (+5) and Daily Wisdom (+10).

Reflected actions (older entries) add or subtract up to 10 points. Soul stays between 0 and 100.

## Bands
240+ Flourishing · 180+ Balanced · 120+ Finding your footing · below 120 Needs care.
