import { bits } from './constants';
import { ip2bigint, bigint2ip } from './ip_int';
import { parse, type IpMeta } from './parse';

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
    if (_1[0]) {
      _1[0] = _1[0] + 1n;
    } else {
      _1[0] = 1n;
    }
    map.set(start, _1);

    const _2: IpMeta = map.has(end) ? map.get(end)! : [0n, 0n, v];
    if (_2[1]) {
      _2[1] = _2[1] + 1n;
    } else {
      _2[1] = 1n;
    }
    map.set(end, _2);
  }

  return {
    4: v4,
    6: v6
  } as const;
}

const uint64 = new BigUint64Array(1);
const uint32 = new Uint32Array(uint64.buffer);
function clz64(bigint: bigint) {
  uint64[0] = bigint;
  const x = Math.clz32(uint32[1]);
  const y = Math.clz32(uint32[0]);
  return x + (x === 32 ? y : 0);
}

function subparts($start: bigint, $end: bigint, version: 4 | 6): IpMeta[] {
  // special case for when part is length 1
  if (($end - $start) === 1n) {
    if ($end % 2n === 0n) {
      return [[$start, $start, version], [$end, $end, version]];
    }
    return [[$start, $end, version]];
  }

  const size: bigint = $end + 1n - $start; /* diff($end, $start); */
  const power = BigInt(64 - clz64(size) - 1);

  let biggest: bigint = size === 0n
    ? 0n
    : 2n ** (power === -1n ? 128n : power);

  if (size === biggest && $start + size === $end) {
    return [[$start, $end, version]];
  }

  let start: bigint, end: bigint;
  if ($start % biggest === 0n) {
    // start is matching on the size-defined boundary - ex: 0-12, use 0-8
    start = $start;
    end = start + biggest - 1n;
  } else {
    start = ($end / biggest) * biggest;

    // start is not matching on the size-defined boundary - 4-16, use 8-16
    if ((start + biggest - 1n) > $end) {
      // divide will floor to nearest integer
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

function fast_popcnt(value: bigint) {
  let v = Number(value);
  v -= v >>> 1 & 0x55_55_55_55;
  v = (v & 0x33_33_33_33) + (v >>> 2 & 0x33_33_33_33);
  return BigInt((((v + (v >>> 4)) & 0x0F_0F_0F_0F) * 0x01_01_01_01) >>> 24);
}

function popcnt(v: bigint) {
  let c = 0n;
  for (; v; c++) {
    v &= v - 1n; // clear the least significant bit set
  }
  return c;
}

function single_range_to_single_cidr(input: [start: bigint, end: bigint, version: 4 | 6]): string {
  const v = input[2];

  const ip = bigint2ip(input[0], v);

  const x = bits[v] - (
    v === 4 ? fast_popcnt(input[1] - input[0]) : popcnt(input[1] - input[0])
  );
  return `${ip}/${x}`;
}

function innerMerge(nets: IpMeta[]): IpMeta[] {
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

export function merge(nets: string[]): string[] {
  const nets_len = nets.length;
  const toBeMapped = new Array<IpMeta>(nets_len);

  for (let i = 0; i < nets_len; i++) {
    toBeMapped[i] = parse(nets[i]);
  }

  const merged = innerMerge(toBeMapped);

  const merged_len = merged.length;

  const results = new Array<string>(merged_len);

  for (let i = 0; i < merged_len; i++) {
    results[i] = single_range_to_single_cidr(merged[i]);
  }

  return results;
}

// exclude b from a and return remainder cidrs
function exclude_nets(a: IpMeta, b: IpMeta): IpMeta[] {
  const a_start = a[0];
  const a_end = a[1];

  const v = a[2];

  if (v !== b[2]) {
    return [a];
  }

  const b_start = b[0];
  const b_end = b[1];

  // compareTo returns negative if left is less than right

  //       aaa
  //   bbb
  //   aaa
  //       bbb
  if (a_start > b_end || a_end < b_start) {
    return [a];
  }

  //   aaa
  //   bbb
  if (a_start === b_start && a_end === b_end) {
    return [];
  }

  //   aa
  //  bbbb
  if (a_start > b_start && a_end < b_end) {
    return [];
  }

  const remaining: IpMeta[] = [];
  let subpart: IpMeta[];
  let j = 0;
  let len2 = 0;

  // aaaa
  //   bbbb
  // aaaa
  //   bb
  if (a_start < b_start && a_end <= b_end) {
    subpart = subparts(a_start, b_start - 1n, a[2]);
    j = 0;
    len2 = subpart.length;

    for (; j < len2; j++) {
      remaining.push([subpart[j][0], subpart[j][1], v]);
    }
  }

  //    aaa
  //   bbb
  //   aaaa
  //   bbb
  if (a_start >= b_start && a_end > b_end) {
    subpart = subparts(b_end + 1n, a_end, v);
    j = 0;
    len2 = subpart.length;

    for (; j < len2; j++) {
      remaining.push([subpart[j][0], subpart[j][1], v]);
    }
  }

  //  aaaa
  //   bb
  if (a_start < b_start && a_end > b_end) {
    subpart = subparts(a_start, b_start - 1n, v);
    j = 0;
    len2 = subpart.length;
    for (; j < len2; j++) {
      remaining.push([subpart[j][0], subpart[j][1], v]);
    }

    subpart = subparts(b_end + 1n, a_end, v);
    j = 0;
    len2 = subpart.length;
    for (; j < len2; j++) {
      remaining.push([subpart[j][0], subpart[j][1], v]);
    }
  }

  return innerMerge(remaining);
}

export function exclude(_basenets: string[], _exclnets: string[], sort = false): string[] {
  const exclnets: string[] = _exclnets.length === 1 ? _exclnets : merge(_exclnets);

  const basenets_len = _basenets.length;
  let basenets_tuple = new Array<IpMeta>(basenets_len);

  for (let i = 0; i < basenets_len; i++) {
    basenets_tuple[i] = parse(_basenets[i]);
  }
  if (basenets_len > 1) {
    basenets_tuple = innerMerge(basenets_tuple);
  }

  for (let i = 0, len = exclnets.length; i < len; i++) {
    const exclcidr = exclnets[i];
    const excl = parse(exclcidr);

    let index = 0;
    while (index < basenets_tuple.length) {
      const base = basenets_tuple[index];
      const remainders = exclude_nets(base, excl);
      if (remainders.length !== 1 || remainders[0][0] !== base[0] || remainders[0][1] !== base[1]) {
        for (let j = 0, len = remainders.length; j < len; j++) {
          basenets_tuple.push(remainders[j]);
        }

        basenets_tuple.splice(index, 1);
      }

      index++;
    }
  }

  if (sort) {
    basenets_tuple.sort((a: IpMeta, b: IpMeta) => {
      if (a[0] > b[0]) return 1;
      if (a[0] < b[0]) return -1;
      return 0;
    });
  }

  const result_len = basenets_tuple.length;
  const results = new Array<string>(result_len);
  for (let i = 0; i < result_len; i++) {
    const net = basenets_tuple[i];
    results[i] = single_range_to_single_cidr(net);
  }
  return results;
}

export function contains(a: string[], b: string[]) {
  const numExpected = b.length;

  let numFound = 0;
  for (const a1 of a) {
    const aParsed = parse(a1);
    for (const b1 of b) {
      const bParsed = parse(b1);

      // version mismatch
      if (aParsed[2] !== bParsed[2]) {
        continue;
      }

      //  aaa
      // bbbb
      // (a starts after b)
      if (bParsed[0] < aParsed[0]) {
        continue; // not contained
      }

      // aaa
      // bbbb
      // (b starts after a)
      if (bParsed[1] > aParsed[1]) {
        continue; // not contained
      }

      numFound++;
    }
  }

  return numFound === numExpected;
}

export const ip_str_to_int = ip2bigint;
export const int_to_ip_str = bigint2ip;
export { ip2bigint, bigint2ip, parse, type IpMeta };
