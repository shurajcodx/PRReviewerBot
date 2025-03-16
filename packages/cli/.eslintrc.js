module.exports = {
  extends: ['../../.eslintrc.js'],
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    // Allow console usage in CLI package
    'no-console': 'off',
  },
};
