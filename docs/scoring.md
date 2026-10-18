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
Follows the Orange Book's definition of Mind: meditation, attention, learning, reflection.
| Part | Points | How |
| --- | --- | --- |
| Meditation | 20 | minutes ÷ daily target |
| Attention | 10 | a focused, phone-free single-tasking block |
| Learning | 10 | learned something: a book, course, skill or wisdom text |
| Content quality | 35 | social-media minutes weighted by category (learning, spiritual 100 % … outrage, gossip 0 %) |
| Content quantity | 25 | full within the daily limit, falling to 0 at three times the limit |

A day with no social media earns the full 60 content points.

**Tao practice:** each weekday has a Tao Te Ching practice (`src/lib/tao.ts`). Mind days (Mon observation, Tue breathing, Thu listening, Fri emptiness, Sun "Who knows?") add 10 points to Mind when done; Mind is capped at 100.

## Soul / inner life (100)
| Practice | Points |
| --- | --- |
| Satya — truthfulness (Orange Book) | 20 |
| Nyaya — fairness (Orange Book) | 15 |
| Kartavya — duty | 15 |
| Seva — service | 15 |
| Ahimsa — non-harm | 10 |
| Daana — giving | 10 |
| Santosha — contentment | 10 |
| Kritajnata — gratitude | 5 |

Reflected actions add or subtract up to 10 points (2.5 per step of alignment, −2 to +2 each).
Soul days of the Tao week (Wed antidote, Sat letting go) add 10 points when done. Soul stays between 0 and 100.

## Bands
240+ Flourishing · 180+ Balanced · 120+ Finding your footing · below 120 Needs care.
