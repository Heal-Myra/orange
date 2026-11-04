# How the well-being score works

Well-being = the **average of Body, Mind and Soul**, each out of 100, so the total is out of 100 (founder, 1 Nov 2026; before that the sum, out of 300). Each pillar and card keeps its own scale.
It is a working model to help a person understand themselves, not a medical measure (The Orange Book, Chapter 2).
The code is in `src/lib/scoring.ts`; tests are in `src/lib/scoring.test.ts`.

## Points per part (founder, 24 Oct 2026)
No bonuses: each tab's 100 is shared out between its parts.

## Body (100)
| Part | Points | How |
| --- | --- | --- |
| Food | 40 | calories 16 (full at or under the target, 0 at 140 % of it) + protein 12 (share of calories: 0 at 10 %, full at 25 %+) + fibre 8 (full at 14 g per 1,000 kcal) + fat 4 (full at 30 % of calories or less, 0 at 45 %). Eating under the target, or a declared fast, is not penalised. |
| Food, fasting by choice (from 1 Nov 2026) | 40 | Fasting 16 (hours from last night's last meal to today's first meal ÷ the person's target, at most 1) + 0.6 × the meal score above (24). See docs/decisions/0044. |
| Food (from 3 Nov 2026) | 40 | Fasting 8 + Early dinner 8 (3 h before sleep) + Meals 24 (0.6 × the meal score) − up to 4 for carb or fat calories above the aim, graded. See docs/decisions/0047. |
| Sleep | 30 | 20 for 7–9 hours (less outside that range) + 10 × quality ÷ 5 |
| Movement | 30 | 15 × steps ÷ target + 15 × active minutes ÷ target (each capped) |

## Mind (100)
| Part | Points | How |
| --- | --- | --- |
| Focus to-dos | 40 | From 4 Nov 2026: Family, Work and Better me, 13⅓ each: 20 % for writing down two to-dos for today, 80 % for finishing them. (1–3 Nov: 20 for each to-do finished, two max; before: Myra's two picks.) |
| Breathing & meditation | 30 | minutes (guided, on my own, or mindful minutes from Apple Health, the larger) ÷ daily target. The card moved here from Soul on 24 Oct 2026. |
| Phone activity | 30 | 30 × content quality (minutes weighted by category: learning, spiritual 100 % … outrage, gossip 0 %), minus 1 point for every 10 social and video minutes over the daily limit; never below 0. Learning and AI tools never count toward the limit. (Founder, 1 Nov 2026: quality matters most; until then quality 18 + within the limit 12.) |

Learning was removed from Mind on 24 Oct 2026.

Phone activity is added each morning for **yesterday** (a full day is only known then) and its 30 points count in **today's** Mind score (founder, 27 Oct 2026; `phoneFrom` on the day, from 27 Oct 2026 on).

## Soul (100)
| Part | Points | How |
| --- | --- | --- |
| Gratitude journal: gratitude | 30 | From 5 Nov 2026: I'm thankful for 12 (4 each, up to three, 20 % of the card); made me laugh 18 (30 %) |
| Gratitude journal: love | 30 | From 5 Nov 2026: I was kind to 18 (30 %); best part of my day 12 (20 %). Days 27 Oct – 4 Nov: thanks 5 each, laugh 7.5, best 7.5, kind 30 |
| Daily Wisdom | 20 | "What it means to me today", a line written, 5 (the tick box was removed 31 Oct 2026; older ticks still count) + "How I lived it today", at least three words, 15 |
| Tao practice | 20 | "What it means to me today", a line written, 5 (the tick box was removed 31 Oct 2026; older ticks still count) + "How I lived it today", at least three words, 15 |

Learning earns 25 %, living it during the day earns 75 % (founder, 26 Oct 2026).

Founder's split, 25 Oct 2026; Gratitude journal from 27 Oct 2026 (days before keep four gratitudes 7.5 each and the old Love card: whom 12, myself 12, done 6).

## Bands
80+ Flourishing · 60+ Balanced · 40+ Finding your footing · below 40 Needs care (out of 100).

## Trends: Week, Month, Quarter, Year (22 Oct 2026)

Every tab has a D · W · M · Q · Y switch (src/lib/trends.ts). Calendar periods (weeks start Monday). Shown as a line graph (23 Oct 2026; was bars). Week and Month: one point per day; Quarter: per week; Year: per month. A point is the average of the days with data (days without data are left out, never counted as zero); "days" measures (learning, Daily Wisdom) count the days instead. The change is against the previous period of the same kind; under 2% shows as steady. Green or red only where a direction is clearly better (weight follows the person's goal).

## Fasting days (22 Oct 2026)

If the person switches on "I'm fasting today" on the Food card and the day's food stays at or under 60 kcal (water, black tea, black coffee), Food scores the full 40. If more food is logged, the day is scored as a normal day.

