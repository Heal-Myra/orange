# How the well-being score works

Well-being = **Body + Mind + Soul**, each out of 100, so the total is out of 300.
It is a working model to help a person understand themselves, not a medical measure (The Orange Book, Chapter 2).
The code is in `src/lib/scoring.ts`; tests are in `src/lib/scoring.test.ts`.

## Points per part (founder, 24 Oct 2026)
No bonuses: each tab's 100 is shared out between its parts.

## Body (100)
| Part | Points | How |
| --- | --- | --- |
| Food | 40 | calories 16 (full at or under the target, 0 at 140 % of it) + protein 12 (share of calories: 0 at 10 %, full at 25 %+) + fibre 8 (full at 14 g per 1,000 kcal) + fat 4 (full at 30 % of calories or less, 0 at 45 %). Eating under the target, or a declared fast, is not penalised. |
| Sleep | 30 | 20 for 7–9 hours (less outside that range) + 10 × quality ÷ 5 |
| Movement | 30 | 15 × steps ÷ target + 15 × active minutes ÷ target (each capped) |

## Mind (100)
| Part | Points | How |
| --- | --- | --- |
| Focus to-dos | 40 | 20 for each of Myra's focus to-dos finished today, up to two |
| Breathing & meditation | 30 | minutes (guided, on my own, or mindful minutes from Apple Health, the larger) ÷ daily target. The card moved here from Soul on 24 Oct 2026. |
| Phone activity | 30 | content quality 18 (minutes weighted by category: learning, spiritual 100 % … outrage, gossip 0 %) + within the daily limit 12 (falling to 0 at three times the limit) |

Learning was removed from Mind on 24 Oct 2026.

## Soul (100)
| Part | Points | How |
| --- | --- | --- |
| Gratitude | 30 | 7.5 for each thing written, up to four |
| Love | 30 | whom I will love today, chosen (12) + how I will love myself today, chosen (12) + one of them done (6) |
| Daily Wisdom | 20 | read the day's passage, open its meaning, tick "studied" |
| Tao practice | 20 | the day's Tao Te Ching practice done (the card moved here from Mind on 24 Oct 2026) |

Founder's split, 25 Oct 2026 (before: 40 + 30 + 30 + 30 = 130, held at 100).

## Bands
240+ Flourishing · 180+ Balanced · 120+ Finding your footing · below 120 Needs care.

## Trends: Week, Month, Quarter, Year (22 Oct 2026)

Every tab has a D · W · M · Q · Y switch (src/lib/trends.ts). Calendar periods (weeks start Monday). Shown as a line graph (23 Oct 2026; was bars). Week and Month: one point per day; Quarter: per week; Year: per month. A point is the average of the days with data (days without data are left out, never counted as zero); "days" measures (learning, Daily Wisdom) count the days instead. The change is against the previous period of the same kind; under 2% shows as steady. Green or red only where a direction is clearly better (weight follows the person's goal).

## Fasting days (22 Oct 2026)

If the person switches on "I'm fasting today" on the Food card and the day's food stays at or under 60 kcal (water, black tea, black coffee), Food scores the full 40. If more food is logged, the day is scored as a normal day.

