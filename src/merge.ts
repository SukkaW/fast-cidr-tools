import { parse } from './parse';
import { single_range_to_single_cidr } from './lib/range2cidr';
import { subparts } from './lib/subpart';

import type { IpMeta } from './parse';

function mapNets(nets: IpMeta[]) {
  const v4 = new Map<bigint, IpMeta>();
  const v6 = new Map<bigint, IpMeta>();

  for (let i = 0, len = nets.length; i < len; i++) {
    const net = nets[i];
    const start: bigint = net[0];
    const end: bigint = net[1];
    const v = net[2];

    const map = v === 4 ? v4 : v6;

    const _1: IpMeta = map.has(start) ? map.get(start)! : [0n, 0n, v];
    _1[0] = _1[0] ? _1[0] + 1n : 1n;
    map.set(start, _1);

    const _2: IpMeta = map.has(end) ? map.get(end)! : [0n, 0n, v];
    _2[1] = _2[1] ? _2[1] + 1n : 1n;
    map.set(end, _2);
  }

  return {
    4: v4,
    6: v6
  } as const;
}

export function innerMerge(nets: IpMeta[]): IpMeta[] {
  const merged = {
    4: [] as IpMeta[],
    6: [] as IpMeta[]
  } as const;

  const maps = mapNets(nets);

  const start = {
    4: -1n,
    6: -1n
  };
  const end = {
    4: -1n,
    6: -1n
  };

  for (const v of ([4, 6] as const)) {
    const numbers: bigint[] = (
      Array.from(maps[v].keys()).sort((a: bigint, b: bigint) => {
        if (a > b) return 1;
        if (a < b) return -1;
        return 0;
      })
    );

    let depth = 0n;

    for (let index = 0, len = numbers.length; index < len; index++) {
      const number = numbers[index];
      const marker = maps[v].get(number)!;

      const marker_0: bigint = marker[0];
      const marker_1: bigint = marker[1];

      if (start[v] === -1n && marker_0) {
        start[v] = number;
      }
      if (marker_1) {
        end[v] = number;
      }

      if (marker_0) depth += marker_0;
      if (marker_1) depth -= marker_1;

      if (index === len - 1) {
        const p2 = subparts(start[v], end[v], v);
        for (let j = 0, len = p2.length; j < len; j++) {
          const $2: IpMeta = p2[j];

          merged[v].push([$2[0], $2[1], v]);
        }
      } else if (marker_1 && depth === 0n && ((numbers[index + 1] - numbers[index]) > 1)) {
        const p1 = subparts(start[v], end[v], v);
        for (let i = 0, len = p1.length; i < len; i++) {
          const $1: IpMeta = p1[i];

          merged[v].push([$1[0], $1[1], v]);
        }
        start[v] = -1n;
        end[v] = -1n;
      }
    }
  }

  return [...merged[4], ...merged[6]];
}

export function mergeToTuples(cidrs: string[]): IpMeta[] {
  const nets_len = cidrs.length;
  const toBeMapped = new Array<IpMeta>(nets_len);

  for (let i = 0; i < nets_len; i++) {
    toBeMapped[i] = parse(cidrs[i]);
  }

  return innerMerge(toBeMapped);
}

export function merge(cidrs: string[]): string[] {
  const merged = mergeToTuples(cidrs);
  const merged_len = merged.length;

  const results = new Array<string>(merged_len);

  for (let i = 0; i < merged_len; i++) {
    results[i] = single_range_to_single_cidr(merged[i]);
  }

  return results;
}
