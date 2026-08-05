'use strict';

module.exports = require('eslint-config-sukka').sukka({
  node: {
    enable: true,
    files: ['eslint.config.js']
  }
}, {
  rules: {
    // `foxts/bitwise` helpers are number-only, but this codebase does bitwise
    // math on bigint, where the autofix produces broken code.
    'sukka/prefer-foxts-bitwise': 'off'
  }
});
