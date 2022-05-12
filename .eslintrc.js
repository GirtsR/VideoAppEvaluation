module.exports = {
  'env': {
    'browser': true,
    'amd': true,
    'node': true,
    'es2022': true
  },
  'extends': 'eslint:recommended',
  'globals': {
    'Atomics': 'readonly',
    'SharedArrayBuffer': 'readonly'
  },
  'parserOptions': {
    'sourceType': 'module'
  },
  'rules': {}
};
