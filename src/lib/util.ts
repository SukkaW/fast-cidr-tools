export function fast_popcnt32(value: bigint | number) {
  // Cast into number and cast back to BigInt is even faster than calculating with BigInt.
  // Amazing how fast the engine optimize Number.
  let v = Number(value);
  v -= v >>> 1 & 0x55_55_55_55;
  v = (v & 0x33_33_33_33) + (v >>> 2 & 0x33_33_33_33);
  return BigInt((((v + (v >>> 4)) & 0x0F_0F_0F_0F) * 0x01_01_01_01) >>> 24);
}

const uint64_0 = new BigUint64Array(1);
const uint32_0 = new Uint32Array(uint64_0.buffer);
export function fast_popcnt64(value: bigint) {
  /**
   * There are three methods to calculate popcnt of a 64-bit integer:
   *
   * kbit popcnt64 impl: parallel, fast, but can overflow if input exceeds the range
   * hamming non-parallel popcnt: slowest but the most accurate
   * split into two 32bit: almost parallel, fastest as engine optimize Number a lot
   */
  uint64_0[0] = value;
  return fast_popcnt32(uint32_0[0]) + fast_popcnt32(uint32_0[1]);
}

const uint64_1 = new BigUint64Array(1);
const uint32_2 = new Uint32Array(uint64_1.buffer);
export function clz64(bigint: bigint) {
  uint64_1[0] = bigint;
  let r = Math.clz32(uint32_2[1]);
  if (r === 32) {
    r += Math.clz32(uint32_2[0]);
  }
  return r;
}
