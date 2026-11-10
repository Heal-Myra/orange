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

describe('Myra\'s pins', () => {
  it('keeps pins inside the picture and drops unreadable ones', async () => {
    const { spotOf } = await import('./spaces');
    expect(spotOf({ x: 0.5, y: 0.2 })).toEqual({ x: 0.5, y: 0.2 });
    expect(spotOf({ x: 1.4, y: -1 })).toEqual({ x: 0.97, y: 0.03 });
    expect(spotOf(null)).toBeNull();
    expect(spotOf({ x: 'left' })).toBeNull();
  });
  it('carries where and spot into the round', () => {
    const s = afterPhoto(undefined, { seen: 'x', changes: [{ text: 'a', why: 'b', where: 'left corner', spot: { x: 0.1, y: 0.6 } }] }, '2026-11-10');
    expect(s.round.changes[0]).toEqual({ text: 'a', why: 'b', where: 'left corner', spot: { x: 0.1, y: 0.6 } });
  });
});
