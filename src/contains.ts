import { parse, type IpMeta } from './parse';

export function contains(a: string[], b: string[]) {
  const b_len = b.length;

  const bParsedMap = new Array<IpMeta>(b_len);
  for (let i = 0; i < b_len; i++) {
    bParsedMap[i] = parse(b[i]);
  }

  let numFound = 0;
  for (const a1 of a) {
    const aParsed = parse(a1);
    for (let j = 0; j < b_len; j++) {
      const bParsed = bParsedMap[j];

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

  return numFound === b_len;
}
