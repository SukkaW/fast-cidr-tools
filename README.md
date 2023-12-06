# fast-cidr-tools

Tools to work with IPv4 and IPv6 CIDR, but 20x faster than [cidr-tools](https://www.npmjs.com/package/cidr-tools), and is **not** Pure ESM (publish both CommonJS and ESM).

Requires [BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt#browser_compatibility) supports.

## Usage

```tsx
import { merge, exclude, contains } from 'fast-cidr-tools';

merge(['1.0.0.0/24'], ['1.0.1.0/24']); //=> ['1.0.0.0/23']
exclude(['::1/127'], ['::1/128']) //=> ['::/128']
contains(['1.0.0.0/24', '2.0.0.0/24'], ['1.0.0.1']) //=> true
```

## Performance

`fast-cidr-tools` is very fast, and is specfically optimized for IPv4. In some specific cases, it can be 20x faster than `cidr-tools`. `fast-cidr-tools` acheive this performance by:

- Doing less things.
  - `cidr-tools` will cast input to an array if it is string (`cidrTools.merge('1.0.0.0/24', '1.0.1.0/24')`). `fast-cidr-tools` only supports array input.
  - `cidr-tools` sort the return value of `merge` and `exclude` by default. `fast-cidr-tools`'s sort is opt-in.
- Avoid unnecessary string operations.
  - how `cidr-tools` and `fast-cidr-tools` calculate "biggest power of two":
    ```tsx
    // cidr-tools
    function biggestPowerOfTwo(num) {
      if (num === 0n) return 0n;
      return 2n ** BigInt(String(num.toString(2).length - 1));
    }

    // fast-cidr-tools
    const uint64 = new BigUint64Array(1);
    const uint32 = new Uint32Array(uint64.buffer);
    function clz64(bigint: bigint) {
      uint64[0] = bigint;
      let r = Math.clz32(uint32[1]);
      if (r === 32) {
        r += Math.clz32(uint32[0]);
      }
      return r;
    }

    function biggestPowerOfTwo(num: bigint) {
      if (num === 0n) return 0n;
      const power = BigInt(64 - clz64(size) - 1);
      return 2n ** (power === -1n ? 128n : power);
    }
    ```
  - how `cidr-tools` and `fast-cidr-tools` calculate the prefix of a CIDR:
    ```tsx
    // cidr-tools
    const zeroes = (part.end + 1n - part.start).toString(2);
    const prefix = bits[v] - (zeroes.match(/0/g) || []).length;

    // fast-cidr-tools
    function fast_popcnt(value: bigint) {
      let v = Number(value);
      v -= v >>> 1 & 0x55_55_55_55;
      v = (v & 0x33_33_33_33) + (v >>> 2 & 0x33_33_33_33);
      return BigInt((((v + (v >>> 4)) & 0x0F_0F_0F_0F) * 0x01_01_01_01) >>> 24);
    }
    function popcnt(v: bigint) {
      let c = 0n;
      for (; v; c++) {
        v &= v - 1n; // clear the least significant bit set
      }
      return c;
    }
    const prefix = bits[v] - (v === 4 ? fast_popcnt(end - start) : popcnt(end - start));
    ```
- Use a more compact internal data structure. Compare how `cidr-tools` and `fast-cidr-tools` represent a CIDR internally:
  ```tsx
  // cidr-tools
  parse("::/64"); //=> { cidr: "::/64", version: 6, prefix: "64", start: 0n, end: 18446744073709551615n }

  // fast-cidr-tools
  parse("::/64"); //=> [0n, 18446744073709551615n, 6]
  ```
