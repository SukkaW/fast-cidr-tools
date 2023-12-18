import { bigint2ip } from './ip_int';
import { fast_popcnt32, fast_popcnt64 } from './util';

export function single_range_to_single_cidr(input: [start: bigint, end: bigint, version: 4 | 6]): string {
  const v = input[2];

  const ip = bigint2ip(input[0], v);
  const s = input[1] - input[0];

  const prefix = v === 4
    ? 32 - fast_popcnt32(s)
    : 128 - fast_popcnt64(s);

  return `${ip}/${prefix}`;
}
