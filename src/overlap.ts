import { parse, type IpMeta } from './parse';

export function overlap(a: string[], b: string[]) {
  const b_len = b.length;

  const bParsedMap = new Array<IpMeta>(b_len);
  for (let i = 0; i < b_len; i++) {
    bParsedMap[i] = parse(b[i]);
  }

  for (const a1 of a) {
    const aParsed = parse(a1);
    for (let j = 0; j < b_len; j++) {
      const bParsed = bParsedMap[j];

      // version mismatch
      if (aParsed[2] !== bParsed[2]) {
        continue;
      }

      //    aaa
      // bbb
      if (aParsed[0] > bParsed[1]) return false; // a starts after b

      // aaa
      //    bbb
      if (bParsed[0] > aParsed[1]) return false; // b starts after a

      return true;
    }
  }

  return false;
}
