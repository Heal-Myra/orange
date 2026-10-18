// A week of practices inspired by the Tao Te Ching, written by the founder (18 Oct 2026).
// This is Happy Orange's own practice guide, not a translation of the Tao Te Ching.
// Each day's practice belongs to Mind or Soul by its nature; doing it adds TAO_POINTS to that pillar (see docs/scoring.md).

export const TAO_POINTS = 10;

export interface TaoDay {
  weekday: number; // 0 = Sunday … 6 = Saturday (JavaScript getDay)
  day: string;
  title: string;
  pillar: 'mind' | 'soul';
  practice: string[];
  notePrompt: string; // what to write in today's note
}

// Listed Monday first, the way the week is practised.
export const TAO_WEEK: TaoDay[] = [
  {
    weekday: 1, day: 'Monday', title: 'Observation day', pillar: 'mind',
    practice: [
      'Every time you notice tension, anxiety or the feeling of chasing something, ask yourself: what am I trying to grab? Write it down.',
      'At the end of the day, look at the list and search for a pattern. There is usually one main obsession that repeats itself in different disguises. Give it a name.',
    ],
    notePrompt: 'What were you trying to grab? And at night: what is the name of the pattern?',
  },
  {
    weekday: 2, day: 'Tuesday', title: 'Breathing', pillar: 'mind',
    practice: [
      'Exhale completely, as if releasing air you have been holding for months.',
      'Notice how easily the air comes back in once you have emptied out completely.',
    ],
    notePrompt: 'When did you remember to empty out? What did you notice?',
  },
  {
    weekday: 3, day: 'Wednesday', title: 'The antidote', pillar: 'soul',
    practice: [
      'Practise the antidote to your obsession (from Monday) in its simplest form.',
      'If it is money: give something without anyone finding out, such as time, attention or a small bit of help.',
      'If it is love: spend some time enjoying your own company without seeking anyone\'s approval.',
      'If it is recognition: do something well and tell no one.',
      'If it is certainty: leave one question unanswered the whole day.',
    ],
    notePrompt: 'What antidote did you practise, and how did it feel?',
  },
  {
    weekday: 4, day: 'Thursday', title: 'Listen', pillar: 'mind',
    practice: [
      'Whenever someone is speaking and you feel the urge to interrupt, correct them or tell your own story to look good: hold back and keep listening.',
      'Note it down. You will notice two things: how hard it is for you to listen, and how much you learn when you stop filling the silence.',
    ],
    notePrompt: 'When did you hold back? What did you learn by listening?',
  },
  {
    weekday: 5, day: 'Friday', title: 'Create emptiness', pillar: 'mind',
    practice: [
      'Leave deliberate emptiness in your schedule: an hour or two with no task, no phone and no purpose.',
      'If restlessness appears, do not fight it. Let the mud settle. Watch what arises when you are not running away from your shadow.',
    ],
    notePrompt: 'What arose in the emptiness?',
  },
  {
    weekday: 6, day: 'Saturday', title: 'Let go of a dry leaf', pillar: 'soul',
    practice: [
      'Choose something specific you have been carrying for far too long: a grudge, a guilt, or an expectation that no longer makes sense.',
      'Write it on a piece of paper, read it aloud, then tear it up and throw it away. The physical gesture helps the mind understand that something has ended.',
    ],
    notePrompt: 'What did you let go of? (You can keep this private and just tick the box.)',
  },
  {
    weekday: 0, day: 'Sunday', title: 'Live normally: "Who knows?"', pillar: 'mind',
    practice: [
      'Live normally, with a single question in your pocket.',
      'Every time something unsettles you, good or bad, ask the question the old farmer with the horse at the border asked: "Who knows?"',
      'Not to play it down, but to leave the story open and not announce the verdict.',
    ],
    notePrompt: 'When did you ask "Who knows?" today?',
  },
];

export const taoForDate = (iso: string): TaoDay => {
  const [y, m, d] = iso.split('-').map(Number);
  const wd = new Date(y, m - 1, d).getDay();
  return TAO_WEEK.find(t => t.weekday === wd) as TaoDay;
};

/** The Monday of the week (Monday–Sunday) that contains this date. */
export const mondayOf = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const back = (date.getDay() + 6) % 7;
  const mon = new Date(y, m - 1, d - back);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${mon.getFullYear()}-${pad(mon.getMonth() + 1)}-${pad(mon.getDate())}`;
};

export const WEEK_REVIEW = {
  intro: 'At the end of the week, look again at the list from Monday. Do not expect miracles. Look for small cracks, such as:',
  cracks: [
    'You did not react the way you always do.',
    'You fell asleep sooner.',
    'A conversation where you felt lighter.',
  ],
};

export const TAO_CORE = {
  summary: 'Returning is the movement of the Tao; gentleness is its action.',
  returning: 'Returning is the archer pulling back, the tide returning, the breath being emptied, the tree that lets go of its leaves in autumn.',
  gentleness: 'Gentleness is water flowing around the stone until it carves a canyon, the muddy glass that clears when you stop stirring it, the knife that slides through the gap and never loses its edge.',
  reflection: [
    'Life does not move forward in a straight line; it moves forward by returning. Everything that goes out comes back. Everything that expands comes back in. Everything that rises descends, to rise again.',
    'The force that moves the universe is not a clenched fist but an open hand. Your mind does not find peace when you chase it, because peace is not in front of you waiting to be caught. It is behind you, in the place you return to when you finally stop running: the tree the man in the parable never sat beneath.',
  ],
  stuckIntro: 'Next time you are trying to open a door with all your force and it will not open: stop, breathe, let the air out all the way, and think:',
  stuck: [
    'Is it one of the doors that opens towards you?',
    'Maybe all you need is to take one step back.',
    'For the first time in a long while, leave the glass on the table and watch the water clear on its own.',
  ],
};

/** One paragraph for the AI guide. */
export const TAO_FOR_AI =
  'Weekly Tao practices (Happy Orange): Mon observation (notice what you are trying to grab; name the repeating obsession); ' +
  'Tue breathing (exhale completely, notice the air return); Wed antidote to the obsession (give secretly, enjoy own company, do well and tell no one, leave a question unanswered); ' +
  'Thu listen without interrupting; Fri create an hour or two of emptiness, let the mud settle; Sat let go of a dry leaf (write, read aloud, tear up a grudge, guilt or stale expectation); ' +
  'Sun live normally asking "Who knows?". Core: returning is the movement of the Tao, gentleness is its action; peace is found by stopping, not chasing.';
