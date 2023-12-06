export const bits = {
  4: 32n,
  6: 128n
} as const;

export const long = {
  // (2n ** 32n) - 1n
  4: 0xFF_FF_FF_FFn,
  // (2n ** 128n) - 1n
  6: 0xFF_FF_FF_FF_FF_FF_FF_FF_FF_FF_FF_FF_FF_FF_FF_FFn
} as const;
