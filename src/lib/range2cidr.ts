import { bits } from './constants';
import { bigint2ip } from './ip_int';
import { fast_popcnt, popcnt } from './util';

export function single_range_to_single_cidr(input: [start: bigint, end: bigint, version: 4 | 6]): string {
  const v = input[2];

  const ip = bigint2ip(input[0], v);

  const x = bits[v] - (
    v === 4 ? fast_popcnt(input[1] - input[0]) : popcnt(input[1] - input[0])
  );
  return `${ip}/${x}`;
}
