export function fast_popcnt32(value: bigint | number) {
  // Cast into number and cast back to BigInt is even faster than calculating with BigInt.
  // Amazing how fast the engine optimize Number.
  let v = Number(value);
  v -= v >>> 1 & 0x55_55_55_55;
  v = (v & 0x33_33_33_33) + (v >>> 2 & 0x33_33_33_33);
  return (((v + (v >>> 4)) & 0x0F_0F_0F_0F) * 0x01_01_01_01) >>> 24;
}

/**
 * Prefer intarray over uintarray as prior is 2x faster. v8 internally represent uint as slow double.
 */
const int64_0 = new BigInt64Array(1);
const int32_0 = new Int32Array(int64_0.buffer);
export function fast_popcnt64(value: bigint) {
  /**
   * There are three methods to calculate popcnt of a 64-bit integer:
   *
   * kbit popcnt64 impl: parallel, fast, but can overflow if input exceeds the predefined range
   * hamming non-parallel popcnt: slowest but the most accurate, can only be optimized by precomputed mask lookup table
   * split into two 32bit: almost parallel, fastest since engine optimize Number a lot
   */
  int64_0[0] = value;
  let r = fast_popcnt32(int32_0[0]);
  if (r === 32) {
    r += fast_popcnt32(int32_0[1]);
  }
  return r;
}

const int64_1 = new BigInt64Array(1);
const int32_2 = new Int32Array(int64_1.buffer);
export function clz64(bigint: bigint) {
  int64_1[0] = bigint;
  let r = Math.clz32(int32_2[1]);
  if (r === 32) {
    r += Math.clz32(int32_2[0]);
  }
  return r;
}
