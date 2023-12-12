import { bits } from './constants';
import { bigint2ip } from './ip_int';
import { fast_popcnt32, fast_popcnt64 } from './util';

export function single_range_to_single_cidr(input: [start: bigint, end: bigint, version: 4 | 6]): string {
  const v = input[2];

  const ip = bigint2ip(input[0], v);
  const s = input[1] - input[0];

  const prefix = bits[v] - (v === 4 ? fast_popcnt32(s) : fast_popcnt64(s));

  return `${ip}/${prefix}`;
}
