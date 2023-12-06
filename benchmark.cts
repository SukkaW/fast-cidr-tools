(async () => {
  const [
    b,
    { exclude: jsExclude },
    { exclude: wasmExclude },
    { exclude: fastExclude }
  ] = await Promise.all([
    import('benny'),
    import('cidr-tools'),
    import('cidr-tools-wasm'),
    // @ts-expect-error -- no types
    // eslint-disable-next-line import/no-unresolved -- build
    import('./dist/index.mjs')
  ]);

  b.suite(
    'cidr-tools exclude',

    b.add('cidr-tools', () => {
      jsExclude(['0.0.0.0/0'], [
        '0.0.0.0/8',
        '224.0.0.0/4',
        '240.0.0.0/4',
        '10.0.0.0/8',
        '127.0.0.0/8',
        '100.64.0.0/10',
        '172.16.0.0/12',
        '198.18.0.0/15',
        '192.168.0.0/16',
        '169.254.0.0/16',
        '192.0.0.0/24',
        '192.0.2.0/24'
      ]);
    }),

    b.add('cidr-tools-wasm', () => {
      wasmExclude(['0.0.0.0/0'], [
        '0.0.0.0/8',
        '224.0.0.0/4',
        '240.0.0.0/4',
        '10.0.0.0/8',
        '127.0.0.0/8',
        '100.64.0.0/10',
        '172.16.0.0/12',
        '198.18.0.0/15',
        '192.168.0.0/16',
        '169.254.0.0/16',
        '192.0.0.0/24',
        '192.0.2.0/24'
      ]);
    }),

    b.add('fast-cidr-tools-v4', () => {
      fastExclude(['0.0.0.0/0'], [
        '0.0.0.0/8',
        '224.0.0.0/4',
        '240.0.0.0/4',
        '10.0.0.0/8',
        '127.0.0.0/8',
        '100.64.0.0/10',
        '172.16.0.0/12',
        '198.18.0.0/15',
        '192.168.0.0/16',
        '169.254.0.0/16',
        '192.0.0.0/24',
        '192.0.2.0/24'
      ]);
    }),

    b.cycle(),
    b.complete()
  );
})();
