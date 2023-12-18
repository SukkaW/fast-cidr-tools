import { single_range_to_single_cidr } from './lib/range2cidr';
import { subparts } from './lib/subpart';
import { innerMerge, mergeToTuples } from './merge';
import { parse, type IpMeta } from './parse';

// exclude b from a and return remainder cidrs
function excludeNets(a: IpMeta, b: IpMeta): IpMeta[] {
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

const sorter = (a: IpMeta, b: IpMeta) => {
  if (a[0] > b[0]) return 1;
  if (a[0] < b[0]) return -1;
  return 0;
};

export function exclude(_basenets: string[], _exclnets: string[], sort = false): string[] {
  const exclnets = _exclnets.length === 1
    ? [parse(_exclnets[0])]
    : mergeToTuples(_exclnets);

  const basenets = _basenets.length === 1
    ? [parse(_basenets[0])]
    : mergeToTuples(_basenets);

  for (let i = 0, len = exclnets.length; i < len; i++) {
    const excl = exclnets[i];

    let index = 0;
    while (index < basenets.length) {
      const base = basenets[index];
      const remainders = excludeNets(base, excl);
      if (remainders.length !== 1 || remainders[0][0] !== base[0] || remainders[0][1] !== base[1]) {
        for (let j = 0, len = remainders.length; j < len; j++) {
          basenets.push(remainders[j]);
        }
        basenets.splice(index, 1);
      }

      index++;
    }
  }

  if (sort) {
    basenets.sort(sorter);
  }

  const result_len = basenets.length;
  // This is consistently 2x faster than Array#map (under size of 20000, after that it is still faster, just not that much)
  const results = new Array<string>(result_len);
  for (let i = 0; i < result_len; i++) {
    results[i] = single_range_to_single_cidr(basenets[i]);
  }
  return results;
}
