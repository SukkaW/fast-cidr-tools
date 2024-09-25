import { fastIpVersion } from './version';

export function ip2bigint(ip: string, version?: 4 | 6): bigint {
  const $version = version ?? fastIpVersion(ip);

  if ($version === 4) {
    let a = 24n;
    let buf = '';
    let result = 0n;

    for (let i = 0, len = ip.length; i < len; i++) {
      const char = ip[i];
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

  if ($version === 6) {
    if (ip.includes('.')) {
      ip = ip.split(':').map(part => {
        if (part.includes('.')) {
          const digits = part.split('.').map(str => Number(str).toString(16).padStart(2, '0'));
          return `${digits[0]}${digits[1]}:${digits[2]}${digits[3]}`;
        }
        return part;
      }).join(':');
    }

    if (ip.includes('%')) {
      // let scopeid;
      // eslint-disable-next-line regexp/no-unused-capturing-group, regexp/no-misleading-capturing-group -- used
      ip = /(.+)%(.+)/.exec(ip)![1];
      // res.scopeid = scopeid;
    }

    const parts = ip.split(':');
    const index = parts.indexOf('');

    if (index !== -1) {
      while (parts.length < 8) {
        parts.splice(index, 0, '');
      }
    }

    let number = 0n;
    let exp = 0n;

    const r = parts.map(part => (part === '' ? 0n : BigInt(Number.parseInt(part, 16)))).reverse();
    for (const n of r) {
      number += n * (2n ** exp);
      exp += 16n;
    }

    return number;
  }

  throw new TypeError('Invalid IP address');
}

export function bigint2ip(number: bigint, version: 4 | 6, compress = true): string {
  /** IPv4 */
  if (version === 4) {
    const part_0 = number >> 24n;
    const part_1 = number >> 16n & 0xFFn;
    const part_2 = number >> 8n & 0xFFn;
    const part_3 = number & 0xFFn;

    return `${part_0}.${part_1}.${part_2}.${part_3}`;
  }

  /** IPv6 */

  let step = 112n;
  const stepReduction = 16n;
  let remain = number;
  const parts = [];

  while (step > 0n) {
    const divisor = 2n ** step;
    parts.push(remain / divisor);
    remain = number % divisor;
    step -= stepReduction;
  }
  parts.push(remain);

  const to16 = parts.map(n => n.toString(16));

  if (compress) {
    return compressIPv6(to16);
  }
  return to16.join(':');
}

// take the longest or first sequence of "0" segments and replace it with "::"
function compressIPv6(parts: string[]) {
  let longest: Set<number> | null = null;
  let current: Set<number> | null = null;
  for (let i = 0, len = parts.length; i < len; i++) {
    const part = parts[i];
    if (part === '0') {
      current ??= new Set();
      current.add(i);
    } else if (current) {
      if (!longest || current.size > longest.size) {
        longest = current;
      }
      current = null;
    }
  }
  if ((!longest && current) || (current && longest && current.size > longest.size)) {
    longest = current;
  }

  for (const index of longest || []) {
    parts[index] = ':';
  }

  return parts.filter(Boolean).join(':').replace(/:{2,}/, '::');
}
