export function fastIpVersion(ip: string) {
  return ip.includes(':') ? 6 : (ip.includes('.') ? 4 : 0);
}
