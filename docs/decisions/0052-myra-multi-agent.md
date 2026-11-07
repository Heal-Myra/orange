# 0052 · Happy Orange is a team of AI agents, with Myra as the coordinator

Date: 7 Nov 2026 · Founder: "It should be a multi-agent AI where Myra is the agent coordinator and there are specialised
agents for food, exercise, sleep, meditation, spiritual knowledge etc. Always keep this in mind while building."

**The direction.** Myra is the one voice the person talks to. Behind her sit specialist agents, each owning one area,
its data, its rules and its suggestions:

| Agent | Owns | Today in the code |
|---|---|---|
| Myra (coordinator) | Talks to the person, decides which specialist to ask, merges their answers into ONE next step, explains why | `myra`, `guidance`, `what_is_this` in heal-ai; `nextStep.ts`, MyraPick |
| Food | Meals, IFCT, fasting, plans, grocery | `meal_photo`, `meal_text`, `meal_plan`; `fasting.ts`, Food V3 |
| Movement | Steps, workouts, exercise library, AI coach (0033) | movement scoring; exercise data |
| Sleep | Sleep, bedtime, wind-down, Yoga Nidra | sleep scoring; yoga-nidra |
| Mind and meditation | Breathing, meditation, Dhamma path, focus, phone activity | `medAims.ts`, `dhamma.ts`, pranayama, `screen_time` |
| Soul and wisdom | Gratitude, Daily Wisdom, Tao, kindness | `explain_wisdom`, `explain_verse`, journal |
| Connectors | Outside data (Apple Health, NeoSapien, Calendar…) turned into each agent's inputs | `neosapien` function, HealthSync |

**Rules for building from now on**
1. Every new feature belongs to one specialist; its logic, prompts and data stay in that specialist's place.
2. Specialists suggest; only Myra speaks to the person, one line at a time, and nothing is added without a yes.
3. Each specialist states what it needs, what it knows and how sure it is; Myra weighs them by time of day, goals and
   points still open (as nextStep does now) and explains the choice.
4. Specialists can grow into separate server agents (own prompt, tools, memory) without changing the app.
5. Orange Book rules apply to every agent: understanding over tracking, no medical claims, privacy first.

Next step when the founder says go: split heal-ai's single prompt into per-agent prompts with a Myra router, and add
a weekly plan + report that each agent contributes to (the "weight below 70 kg" example).
