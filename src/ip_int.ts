export function ip2bigint(ip: string): bigint {
  let a = 24n;
  let buf = '';
  let result = 0n;

  for (let i = 0, len = ip.length; i < len; i++) {
    const char = ip.charAt(i);
    if (char === '.') {
      result |= (BigInt(buf) << a);
      a -= 8n;
      buf = '';
    } else {
      buf += char;
    }
  }

  result |= BigInt(buf);

  return result;
}

export function bigint2ip(number: bigint): string {
  const part_0 = number >> 24n;
  const part_1 = number >> 16n & 0xFFn;
  const part_2 = number >> 8n & 0xFFn;
  const part_3 = number & 0xFFn;

  return `${part_0}.${part_1}.${part_2}.${part_3}`;
}
