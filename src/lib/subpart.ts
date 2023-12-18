import type { IpMeta } from '../parse';
import { clz64 } from './util';

export function subparts($start: bigint, $end: bigint, version: 4 | 6): IpMeta[] {
  // special case for when part is length 1
  if (($end - $start) === 1n) {
    if ($end % 2n === 0n) {
      return [[$start, $start, version], [$end, $end, version]];
    }
    return [[$start, $end, version]];
  }

  const size: bigint = $end + 1n - $start; /* diff($end, $start); */

  let power = 0n;
  let biggest: bigint = size === 0n
    ? 0n
    : (
      power = BigInt(64 - clz64(size) - 1),
      2n ** (power === -1n ? 128n : power)
    );

  let start: bigint, end: bigint;
  if ($start % biggest === 0n) {
    // start is matching on the size-defined boundary - ex: 0-12, use 0-8
    start = $start;
    end = start + biggest - 1n;
  } else {
    start = ($end / biggest) * biggest;

    // start is not matching on the size-defined boundary - 4-16, use 8-16
    if ((start + biggest - 1n) > $end) {
      // bigint when divide will floor to nearest integer
      start = (($end / biggest) - 1n) * biggest;

      while (start < $start) {
        biggest /= 2n;
        start = (($end / biggest) - 1n) * biggest;
      }

      end = start + biggest - 1n;
    } else {
      start = ($end / biggest) * biggest;
      end = start + biggest - 1n;
    }
  }

  let parts: IpMeta[] = [[start, end, version]];

  // additional subnets on left side
  if (start !== $start) {
    parts = parts.concat(subparts($start, start - 1n, version));
  }

  // additional subnets on right side
  if (end !== $end) {
    parts = parts.concat(subparts(end + 1n, $end, version));
  }

  return parts;
}
