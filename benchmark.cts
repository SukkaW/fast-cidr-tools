(async () => {
  const [
    { run, bench, group },
    { exclude: jsExclude },
    { exclude: wasmExclude },
    { exclude: fastExclude }
  ] = await Promise.all([
    import('mitata'),
    import('cidr-tools'),
    import('cidr-tools-wasm'),
    // @ts-expect-error -- no types
    import('./dist/index.mjs')
  ]);

  group('cidr-tools#exclude', () => {
    bench('cidr-tools', () => {
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
    });

    bench('cidr-tools-wasm', () => {
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
    });

    bench('fast-cidr-tools', () => {
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
    });
  });

  await run({
    avg: true,
    json: false,
    colors: true,
    min_max: true,
    collect: false,
    percentiles: true
  });
})();
