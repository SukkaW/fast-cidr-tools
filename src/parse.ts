import { bits, long } from './constants';
import { ip2bigint } from './ip_int';
import { fastIpVersion } from './version';

export type IpMeta = [start: bigint, end: bigint, version: 4 | 6];

export function parse(cidr: string): IpMeta {
  const version = fastIpVersion(cidr);

  if (version === 0) {
    throw new TypeError('Invalid IP address');
  }

  const splitted = cidr.split('/');
  const ip = splitted[0];

  const versionedBits = bits[version];

  const bitmask: bigint = splitted.length > 1 ? BigInt(splitted[1]) : versionedBits;
  const mask_long: bigint = bitmask > 0
    ? long[version] << (versionedBits - bitmask)
    : 0n;

  const net_long: bigint = ip2bigint(ip, version) & mask_long;
  const size = 1n << (versionedBits - bitmask);

  return [
    net_long /** start */,
    net_long + size - 1n /** end */,
    version
  ];
}
