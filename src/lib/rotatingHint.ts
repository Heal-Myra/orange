// The Ask Myra box changes its hint every few seconds (founder, 1 Nov 2026): it tells people they can drop a meal photo,
// a handwritten to-do list or a Screen Time screenshot here, not only ask a question (decision 0046).

import { useEffect, useState } from 'react';
import { tr } from './i18n';

const HINTS = ['Ask Myra anything…', 'Add a photo of your meal…', 'Add your handwritten to-do list…', "Add yesterday's Screen Time…", 'Add a selfie for Face & beauty…'];

export function useRotatingHint(paused = false, everyMs = 3500) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI(x => (x + 1) % HINTS.length), everyMs);
    return () => clearInterval(t);
  }, [paused, everyMs]);
  return tr(HINTS[i]);
}
