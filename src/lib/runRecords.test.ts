import { describe, expect, it } from 'vitest';
import { clock, runRecords } from './runRecords';

describe('running bests (11 Nov 2026)', () => {
  const runs = [
    { at: '2026-10-01', km: 5.0, secs: 1800 },
    { at: '2026-10-20', km: 7.0, secs: 2800 }, // 5 km in 33:20
    { at: '2026-11-11', km: 5.02, secs: 1650 }, // today: 5 km in 27:23
  ];
  it('finds today\'s fastest 5 km, beating the earlier best, and marks it new', () => {
    const r = runRecords(runs, '2026-11-11').find(x => x.key === 'run5')!;
    expect(r.end).toBe('2026-11-11');
    expect(r.isNew).toBe(true);
    expect(clock(r.beat!)).toBe('30:00');
  });
  it('needs a run to beat and enough distance', () => {
    expect(runRecords([runs[0]], '2026-11-11')).toHaveLength(0);
    expect(runRecords(runs, '2026-11-11').some(x => x.key === 'run10')).toBe(false);
    expect(runRecords(runs, '2026-11-11').find(x => x.key === 'runLong')?.value).toBe(7);
  });
});
