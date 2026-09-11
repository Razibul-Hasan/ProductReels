/**
 * ESLint: the @wordpress/scripts ruleset, plus what this project's layout needs.
 *
 * - `@wordpress/*` and React come from WordPress core script handles (see the
 *   generated *.asset.php), so they are deliberately not in package.json.
 * - `@shared/*` is the webpack alias for src/shared, the render core both
 *   bundles import.
 */
const wpConfig = require( '@wordpress/scripts/config/eslint.config.cjs' );

module.exports = [
	...wpConfig,
	{
		ignores: [ '**/dist/**', '**/node_modules/**', 'build-prompts/**' ],
	},
	{
		files: [ '**/*.{js,jsx}' ],
		settings: {
			'import/core-modules': [
				'@wordpress/api-fetch',
				'@wordpress/block-editor',
				'@wordpress/blocks',
				'@wordpress/components',
				'@wordpress/compose',
				'@wordpress/element',
				'@wordpress/i18n',
				'react',
				'react-dom',
			],
			'import/resolver': {
				node: {
					extensions: [ '.js', '.jsx' ],
				},
			},
		},
		rules: {
			'import/no-unresolved': [ 'error', { ignore: [ '^@shared/' ] } ],
		},
	},
	{
		// A `catch` that deliberately swallows: an unused binding is the point.
		files: [ '**/*.{js,jsx}' ],
		rules: {
			'no-unused-vars': [ 'error', { caughtErrors: 'none' } ],
		},
	},
];
