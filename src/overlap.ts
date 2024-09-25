import { parse, type IpMeta } from './parse';

export function overlap(a: string[], b: string[]) {
  const b_len = b.length;

  const bParsedMap = new Array<IpMeta>(b_len);
  for (let i = 0; i < b_len; i++) {
    bParsedMap[i] = parse(b[i]);
  }

  for (let a_i = 0, a_len = a.length; a_i < a_len; a_i++) {
    const a1 = a[a_i];
    const aParsed = parse(a1);

    for (let j = 0; j < b_len; j++) {
      const bParsed = bParsedMap[j];

      // version mismatch
      if (aParsed[2] !== bParsed[2]) {
        continue;
      }

      //    aaa
      // bbb
      if (aParsed[0] > bParsed[1]) continue; // a starts after b

      // aaa
      //    bbb
      if (bParsed[0] > aParsed[1]) continue; // b starts after a

      return true;
    }
  }

  return false;
}
