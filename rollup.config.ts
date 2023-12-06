import { defineConfig } from 'rollup';
import { swc } from 'rollup-plugin-swc3';
import { dts } from 'rollup-plugin-dts';

export default defineConfig([
  {
    input: 'src/index.ts',
    output: [
      { file: 'dist/index.cjs', format: 'cjs' },
      { file: 'dist/index.mjs', format: 'esm' }
    ],
    plugins: [
      swc({
        minify: true,
        jsc: {
          minify: {
            compress: true,
            mangle: true,
            module: true
          }
        }
      })
    ]
  },
  {
    input: 'src/index.ts',
    output: { file: 'dist/index.d.ts', format: 'esm' },
    plugins: [
      dts()
    ]
  }
]);
