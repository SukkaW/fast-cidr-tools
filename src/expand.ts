import { bigint2ip } from './lib/ip_int';
import { mergeToTuples } from './merge';

export function expand(cidrs: string[]) {
  const ips: string[] = [];

  const merged = mergeToTuples(cidrs);

  for (const net of merged) {
    const start = net[0];
    const end = net[1];
    const version = net[2];
    for (let i = start; i <= end; i++) {
      ips.push(bigint2ip(i, version));
    }
  }

  return ips;
}
