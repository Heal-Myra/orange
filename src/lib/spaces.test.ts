import { describe, expect, it } from 'vitest';
import { afterDue, afterPhoto, nextPhotos, nextSpace, statusOf } from './spaces';

const read = { seen: 'Biscuits are closer than fruit.', changes: [{ text: 'a', why: 'x' }, { text: 'b', why: 'y' }, { text: 'c', why: 'z' }, { text: 'd', why: 'w' }] };

describe('Spaces', () => {
  it('a first photo keeps three changes', () => {
    const s = afterPhoto(undefined, read, '2026-11-10');
    expect(s.round.changes).toHaveLength(3);
    expect(s.last).toBeUndefined();
    expect(statusOf(s, '2026-11-10')).toEqual({ key: '{n} of {m} done', vars: { n: 0, m: 3 } });
  });

  it('the after photo is due after seven days', () => {
    const s = afterPhoto(undefined, read, '2026-11-10');
    expect(afterDue(s, '2026-11-16')).toBe(false);
    expect(afterDue(s, '2026-11-17')).toBe(true);
    expect(nextSpace({ kitchen: s }, '2026-11-17')).toEqual({ id: 'kitchen', due: true });
    expect(nextSpace({ kitchen: s }, '2026-11-12')).toEqual({ id: 'bedroom', due: false });
  });

  it('counts changes Myra saw and ones the person ticked, once each', () => {
    const s = afterPhoto(undefined, read, '2026-11-10');
    s.round.changes[1].done = '2026-11-11';
    const after = afterPhoto(s, { ...read, kept: [0, 1, 9] }, '2026-11-17');
    expect(after.last).toEqual({ at: '2026-11-10', seen: read.seen, kept: 2, of: 3 });
    expect(after.round.at).toBe('2026-11-17');
  });

  it('the last after photo becomes the next before', () => {
    let p = nextPhotos({}, 'one', '2026-11-10');
    expect(p).toEqual({ before: { uri: 'one', at: '2026-11-10' } });
    p = nextPhotos(p, 'two', '2026-11-17');
    expect(p.before?.uri).toBe('one');
    p = nextPhotos(p, 'three', '2026-11-24');
    expect([p.before?.uri, p.after?.uri]).toEqual(['two', 'three']);
  });
});
