import { ip2bigint, bigint2ip } from './ip_int';

export function int2ip(number: bigint): string {
  const part_0 = number >> 24n;
  const part_1 = number >> 16n & 0xFFn;
  const part_2 = number >> 8n & 0xFFn;
  const part_3 = number & 0xFFn;

  return `${part_0}.${part_1}.${part_2}.${part_3}`;
}

export function parse(cidr: string): [bigint, bigint] {
  const splitted = cidr.split('/');
  const ip = splitted[0];

  const bitmask: bigint = splitted.length > 1 ? BigInt(splitted[1]) : 32n;
  const mask_long: bigint = bitmask > 0
    ? 0xFF_FF_FF_FFn << (32n - bitmask)
    : 0n;

  const net_long: bigint = ip2bigint(ip) & mask_long;
  const size = 1n << (32n - bitmask);

  return [
    net_long /** start */,
    net_long + size - 1n /** end */
  ];
}

function mapNets(nets: bigint[][]): Map<bigint, bigint[]> {
  const v4 = new Map<bigint, bigint[]>();

  for (let i = 0, len = nets.length; i < len; i++) {
    const net = nets[i];
    const start: bigint = net[0];
    const end: bigint = net[1];

    const _1 = v4.has(start) ? v4.get(start)! : [0n, 0n];
    if (_1[0]) {
      _1[0] = _1[0] + 1n;
    } else {
      _1[0] = 1n;
    }
    v4.set(start, _1);

    const _2 = v4.has(end) ? v4.get(end)! : [0n, 0n];
    if (_2[1]) {
      _2[1] = _2[1] + 1n;
    } else {
      _2[1] = 1n;
    }
    v4.set(end, _2);
  }

  return v4;
}

const uint64 = new BigUint64Array(1);
const uint32 = new Uint32Array(uint64.buffer);
function clz64(bigint: bigint) {
  uint64[0] = bigint;
  const x = Math.clz32(uint32[1]);
  const y = Math.clz32(uint32[0]);

  return x + (x === 32 ? y : 0);
}

function subparts($start: bigint, $end: bigint): Array<[bigint, bigint]> {
  // special case for when part is length 1
  if (($end - $start) === 1n) {
    if ($end % 2n === 0n) {
      return [[$start, $start], [$end, $end]];
    }
    return [[$start, $end]];
  }

  const size: bigint = $end + 1n - $start; /* diff($end, $start); */

  let biggest: bigint = size === 0n
    ? 0n
    : 2n ** BigInt(64 - clz64(size) - 1);

  if (size === biggest && $start + size === $end) {
    return [[$start, $end]];
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

  let parts: Array<[bigint, bigint]> = [[start, end]];

  // additional subnets on left side
  if (start !== $start) {
    parts = parts.concat(subparts($start, start - 1n));
  }

  // additional subnets on right side
  if (end !== $end) {
    parts = parts.concat(subparts(end + 1n, $end));
  }

  return parts;
}

function popcnt(value: number) {
  value -= value >>> 1 & 0x55_55_55_55;
  value = (value & 0x33_33_33_33) + (value >>> 2 & 0x33_33_33_33);
  return (((value + (value >>> 4)) & 0x0F_0F_0F_0F) * 0x01_01_01_01) >>> 24;
}

function single_range_to_single_cidr(start: bigint, end: bigint): string {
  const ip = bigint2ip(start);
  const x = 32 - popcnt(Number(end - start));
  return `${ip}/${x}`;
}

function inner_merge(nets: Array<[bigint, bigint]>): Array<[bigint, bigint]> {
  const merged: Array<[bigint, bigint]> = [];

  const maps = mapNets(nets);

  let start = -1n;
  let end = -1n;

  const numbers: bigint[] = (
    Array.from(maps.keys()).sort((a: bigint, b: bigint) => {
      if (a > b) return 1;
      if (a < b) return -1;
      return 0;
    })
  );

  let depth = 0n;

  for (let index = 0, len = numbers.length; index < len; index++) {
    const number = numbers[index];
    const marker = maps.get(number)!;

    const marker_0: bigint = marker[0];
    const marker_1: bigint = marker[1];

    if (start === -1n && marker_0) {
      start = number;
    }
    if (marker_1) {
      end = number;
    }

    if (marker_0) depth += marker_0;
    if (marker_1) depth -= marker_1;

    if (index === len - 1) {
      const p2 = subparts(start, end);
      for (let j = 0, len = p2.length; j < len; j++) {
        const $2: bigint[] = p2[j];

        merged.push([$2[0], $2[1]]);
      }
    } else if (marker_1 && depth === 0n && ((numbers[index + 1] - numbers[index]) > 1)) {
      const p1 = subparts(start, end);
      for (let i = 0, len = p1.length; i < len; i++) {
        const $1: bigint[] = p1[i];

        merged.push([$1[0], $1[1]]);
      }
      start = -1n;
      end = -1n;
    }
  }

  return merged;
}

export function merge(nets: string[]): string[] {
  const nets_len = nets.length;
  const toBeMapped = new Array<[bigint, bigint]>(nets_len);

  for (let i = 0; i < nets_len; i++) {
    toBeMapped[i] = parse(nets[i]);
  }

  const merged = inner_merge(toBeMapped);
  const merged_len = merged.length;

  const results = new Array<string>(merged_len);

  for (let i = 0; i < merged_len; i++) {
    results[i] = single_range_to_single_cidr(merged[i][0], merged[i][1]);
  }

  return results;
}

// exclude b from a and return remainder cidrs
function exclude_nets(a: [bigint, bigint], b: [bigint, bigint]): Array<[bigint, bigint]> {
  const a_start = a[0];
  const a_end = a[1];

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

  const remaining: Array<[bigint, bigint]> = [];
  let subpart: bigint[][];
  let j = 0;
  let len2 = 0;

  // aaaa
  //   bbbb
  // aaaa
  //   bb
  if (a_start < b_start && a_end <= b_end) {
    subpart = subparts(a_start, b_start - 1n);
    j = 0;
    len2 = subpart.length;

    for (; j < len2; j++) {
      remaining.push([subpart[j][0], subpart[j][1]]);
    }
  }

  //    aaa
  //   bbb
  //   aaaa
  //   bbb
  if (a_start >= b_start && a_end > b_end) {
    subpart = subparts(b_end + 1n, a_end);
    j = 0;
    len2 = subpart.length;

    for (; j < len2; j++) {
      remaining.push([subpart[j][0], subpart[j][1]]);
    }
  }

  //  aaaa
  //   bb
  if (a_start < b_start && a_end > b_end) {
    subpart = subparts(a_start, b_start - 1n);
    j = 0;
    len2 = subpart.length;
    for (; j < len2; j++) {
      remaining.push([subpart[j][0], subpart[j][1]]);
    }

    subpart = subparts(b_end + 1n, a_end);
    j = 0;
    len2 = subpart.length;
    for (; j < len2; j++) {
      remaining.push([subpart[j][0], subpart[j][1]]);
    }
  }

  return inner_merge(remaining);
}

export function exclude(_basenets: string[], _exclnets: string[], sort = false): string[] {
  const exclnets: string[] = _exclnets.length === 1 ? _exclnets : merge(_exclnets);

  const basenets_len = _basenets.length;
  let basenets_tuple = new Array<[bigint, bigint]>(basenets_len);

  if (basenets_len === 1) {
    basenets_tuple[0] = parse(_basenets[0]);
  } else {
    for (let i = 0; i < basenets_len; i++) {
      basenets_tuple[i] = parse(_basenets[i]);
    }
    basenets_tuple = inner_merge(basenets_tuple);
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
    basenets_tuple.sort((a: bigint[], b: bigint[]) => {
      if (a[0] > b[0]) return 1;
      if (a[0] < b[0]) return -1;
      return 0;
    });
  }

  const result_len = basenets_tuple.length;
  const results = new Array<string>(result_len);
  for (let i = 0; i < result_len; i++) {
    const net = basenets_tuple[i];
    results[i] = single_range_to_single_cidr(net[0], net[1]);
  }
  return results;
}

export const ip_str_to_int = ip2bigint;
export const int_to_ip_str = bigint2ip;
export { ip2bigint, bigint2ip };
