// Forgiveness practice (founder, 15 Nov 2026 idea 6; built 16 Nov): 5 minutes, once a week, Myra's voice, eyes closed.
// Nothing is written down. Finishing adds 5 to Soul that day (docs/scoring.md).

import { GuidedSteps, type Step } from '../components/GuidedSteps';
import { useHeal } from '../lib/store';
import { tr } from '../lib/i18n';

const STEPS: Step[] = [
  { big: '1', title: 'Breathe and settle', say: 'Close your eyes. Breathe slowly. Let the shoulders drop.', secs: 60 },
  { big: '2', title: 'Bring one hurt to mind', say: 'Bring to mind one hurt. Small is fine. Just notice how it feels.', secs: 60 },
  { big: '3', title: 'See their side, then yours', say: 'See it from their side. What were they carrying? Now see your own side, kindly.', secs: 60 },
  { big: '4', title: '"I let this go, for my peace"', say: 'Say quietly: I let this go, for my peace. Say it again.', secs: 60 },
  { big: '5', title: 'Wish them, and you, well', say: 'Wish them well. Wish yourself well. Then open your eyes.', secs: 60 },
];

export default function Forgive() {
  const { update } = useHeal();
  return <GuidedSteps steps={STEPS} heading={tr('Letting go 🕊')} bg="#F7F1E8" doneLine={tr('Lighter now. +5 Soul today.')}
    onDone={() => update(d => { d.soul = { ...(d.soul ?? {}), forgave: true }; })} />;
}
