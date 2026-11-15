// The calm-down button (founder, 15 Nov 2026 idea 4; built 16 Nov): a 2-minute 5-4-3-2-1 grounding, Myra's voice
// guiding each step. From Mind (top of Meditation) and Myra's ＋.

import { GuidedSteps, type Step } from '../components/GuidedSteps';
import { tr } from '../lib/i18n';

const STEPS: Step[] = [
  { title: 'Breathe out slowly, twice.', say: 'Breathe out slowly. Once more, slower.', secs: 14 },
  { big: '5', title: 'Name 5 things you can see', hint: 'A light, a cup, a colour on the wall…', say: 'Look around. Name five things you can see.', secs: 22 },
  { big: '4', title: 'Name 4 things you can touch', hint: 'Your hands on your knees. The chair. Your clothes…', say: 'Now four things you can touch. Feel each one.', secs: 22 },
  { big: '3', title: 'Name 3 things you can hear', hint: 'A fan, a bird, your own breath…', say: 'Three things you can hear. Listen.', secs: 22 },
  { big: '2', title: 'Name 2 things you can smell', hint: 'Tea, soap, fresh air…', say: 'Two things you can smell.', secs: 18 },
  { big: '1', title: 'Name 1 thing you can taste', hint: 'Or one good thing about this moment.', say: 'One thing you can taste. Or one good thing about this moment.', secs: 18 },
];

export default function Calm() {
  return <GuidedSteps steps={STEPS} heading={tr('Ground yourself, 2 minutes')} doneLine={tr('You are here, and you are steady.')} />;
}
