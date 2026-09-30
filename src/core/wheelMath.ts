/**
 * Wheel physics shared by the UI thread (as worklets) and unit tests.
 * Using our own maths instead of ScrollView momentum is what makes the wheel
 * feel the same on iOS, Android and Web.
 */

/** Seconds of velocity to project when a fling is released. */
export const VELOCITY_PROJECTION_S = 0.12;
/** Fraction of drag applied beyond the ends of a non-looping wheel. */
export const OVERSCROLL_RESISTANCE = 0.3;

export function mod(n: number, m: number): number {
  'worklet';
  return ((n % m) + m) % m;
}

/** Loop only when there are enough rows that the wrap seam is never visible. */
export function shouldLoop(count: number, visibleCount: number): boolean {
  'worklet';
  return count >= visibleCount + 2;
}

export function offsetForIndex(index: number, itemHeight: number): number {
  'worklet';
  return -index * itemHeight;
}

function clampIndex(index: number, count: number): number {
  'worklet';
  return Math.min(Math.max(index, 0), count - 1);
}

export function indexForOffset(offset: number, itemHeight: number, count: number, loop: boolean): number {
  'worklet';
  const raw = Math.round(-offset / itemHeight);
  return loop ? mod(raw, count) : clampIndex(raw, count);
}

/** Resting offset after a release with `velocityY` (px/s). */
export function snapTargetOffset(
  offset: number,
  velocityY: number,
  itemHeight: number,
  count: number,
  loop: boolean,
): number {
  'worklet';
  const projected = offset + velocityY * VELOCITY_PROJECTION_S;
  const raw = Math.round(-projected / itemHeight);
  return -(loop ? raw : clampIndex(raw, count)) * itemHeight;
}

/** Offset that shows `targetIndex` via the shortest path from the current lap. */
export function nearestLoopOffset(
  currentOffset: number,
  targetIndex: number,
  itemHeight: number,
  count: number,
): number {
  'worklet';
  const currentRaw = Math.round(-currentOffset / itemHeight);
  let delta = mod(targetIndex - currentRaw, count);
  if (delta > count / 2) delta -= count;
  return -(currentRaw + delta) * itemHeight;
}

/** Signed distance (rows) of item `index` from the centre row. */
export function itemDistance(
  index: number,
  offset: number,
  itemHeight: number,
  count: number,
  loop: boolean,
): number {
  'worklet';
  const rel = index + offset / itemHeight;
  return loop ? mod(rel + count / 2, count) - count / 2 : rel;
}

/** Rubber-band resistance beyond [minOffset, 0]. */
export function applyOverscroll(offset: number, minOffset: number): number {
  'worklet';
  if (offset > 0) return offset * OVERSCROLL_RESISTANCE;
  if (offset < minOffset) return minOffset + (offset - minOffset) * OVERSCROLL_RESISTANCE;
  return offset;
}
