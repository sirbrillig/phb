module.exports = {
	env: { commonjs: true, es6: true, node: true, jest: true },
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/eslint-recommended',
		'plugin:@typescript-eslint/recommended',
	],
	globals: { Atomics: 'readonly', SharedArrayBuffer: 'readonly' },
	parser: '@typescript-eslint/parser',
	parserOptions: { ecmaVersion: 2018, project: './tsconfig.json' },
	plugins: ['@typescript-eslint'],
	root: true,
};
