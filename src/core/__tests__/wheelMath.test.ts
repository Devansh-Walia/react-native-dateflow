import {
  applyOverscroll,
  indexForOffset,
  itemDistance,
  mod,
  nearestLoopOffset,
  offsetForIndex,
  shouldLoop,
  snapTargetOffset,
} from '../wheelMath';

const H = 44;

describe('mod (review focus: wrap)', () => {
  it('is always non-negative', () => {
    expect(mod(-1, 12)).toBe(11);
    expect(mod(13, 12)).toBe(1);
    expect(mod(-24, 12)).toBe(0);
  });
});

describe('shouldLoop', () => {
  it('only loops when there are enough rows to fill the viewport plus a buffer', () => {
    expect(shouldLoop(2, 5)).toBe(false);
    expect(shouldLoop(6, 5)).toBe(false);
    expect(shouldLoop(7, 5)).toBe(true);
    expect(shouldLoop(60, 5)).toBe(true);
  });
});

describe('index ↔ offset', () => {
  it('round-trips', () => {
    expect(offsetForIndex(5, H)).toBe(-220);
    expect(indexForOffset(-220 - 10, H, 60, true)).toBe(5);
  });
  it('wraps in loop mode and clamps otherwise', () => {
    expect(indexForOffset(H, H, 60, true)).toBe(59);
    expect(indexForOffset(H, H, 2, false)).toBe(0);
    expect(indexForOffset(-10 * H, H, 2, false)).toBe(1);
  });
});

describe('snapTargetOffset', () => {
  it('projects velocity then snaps to a row', () => {
    expect(snapTargetOffset(-100, 0, H, 60, true)).toBe(-88);
    expect(snapTargetOffset(-100, -1000, H, 60, true)).toBe(-220); // -100 + -120 = -220
  });
  it('clamps to the ends when not looping', () => {
    expect(snapTargetOffset(50, 2000, H, 12, false)).toBe(-0);
    expect(snapTargetOffset(-2000, -2000, H, 12, false)).toBe(-11 * H);
  });
});

describe('nearestLoopOffset (review focus: shortest path)', () => {
  it('59 → 0 moves forward one row', () => {
    expect(nearestLoopOffset(-59 * H, 0, H, 60)).toBe(-60 * H);
  });
  it('0 → 59 moves back one row', () => {
    expect(nearestLoopOffset(0, 59, H, 60)).toBe(H);
  });
  it('keeps the current lap', () => {
    expect(nearestLoopOffset(-125 * H, 7, H, 60)).toBe(-127 * H); // 125 ≡ 5, +2
  });
});

describe('itemDistance', () => {
  it('is the signed row distance from the centre', () => {
    expect(itemDistance(3, offsetForIndex(3, H), H, 12, false)).toBe(0);
    expect(itemDistance(5, offsetForIndex(3, H), H, 12, false)).toBe(2);
  });
  it('wraps around in loop mode', () => {
    expect(itemDistance(0, offsetForIndex(59, H), H, 60, true)).toBe(1);
    expect(itemDistance(59, offsetForIndex(0, H), H, 60, true)).toBe(-1);
  });
});

describe('applyOverscroll', () => {
  const min = -11 * H;
  it('resists past both ends', () => {
    expect(applyOverscroll(20, min)).toBeCloseTo(6);
    expect(applyOverscroll(min - 20, min)).toBeCloseTo(min - 6);
  });
  it('passes through inside the range', () => {
    expect(applyOverscroll(-100, min)).toBe(-100);
  });
});
