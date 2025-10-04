import { bigint2ip } from './ip_int';
import { fast_popcnt32, fast_popcnt128 } from './util';

const bit = {
  4: 32,
  6: 128
};

const popcntFn = {
  4: fast_popcnt32,
  6: fast_popcnt128
};

export function single_range_to_single_cidr(input: [start: bigint, end: bigint, version: 4 | 6]): string {
  const v = input[2];

  const ip = bigint2ip(input[0], v);
  const s = input[1] - input[0];

  const prefix = bit[v] - popcntFn[v](s);

  return `${ip}/${prefix}`;
}
