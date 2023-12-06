export function fast_popcnt(value: bigint) {
  let v = Number(value);
  v -= v >>> 1 & 0x55_55_55_55;
  v = (v & 0x33_33_33_33) + (v >>> 2 & 0x33_33_33_33);
  return BigInt((((v + (v >>> 4)) & 0x0F_0F_0F_0F) * 0x01_01_01_01) >>> 24);
}

export function popcnt(v: bigint) {
  let c = 0n;
  for (; v; c++) {
    v &= v - 1n; // clear the least significant bit set
  }
  return c;
}

const uint64 = new BigUint64Array(1);
const uint32 = new Uint32Array(uint64.buffer);
export function clz64(bigint: bigint) {
  uint64[0] = bigint;
  const x = Math.clz32(uint32[1]);
  const y = Math.clz32(uint32[0]);
  return x + (x === 32 ? y : 0);
}
