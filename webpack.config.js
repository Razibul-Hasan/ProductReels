/**
 * ProductReels build configuration.
 *
 * Three entry points, deliberately separate: the admin SPA, the public
 * renderer and the block editor script never share a bundle, so a shop page
 * never parses a byte of the editor. Output lands next to each side's PHP, alongside the generated
 * *.asset.php that carries the real WordPress script dependencies — React and
 * every @wordpress/* package come from core handles, never a second copy.
 *
 * ---------------------------------------------------------------------------
 * WARNING — output.clean MUST stay false.
 *
 * @wordpress/scripts ships `output.clean: true`, which is safe only because its
 * own output.path is the throwaway build/ directory. This config points
 * output.path at the plugin root so the bundles can sit in admin/dist and
 * public/dist. With clean left at its default, webpack deletes everything in
 * output.path that it did not emit — which is the entire plugin.
 *
 * Do not remove this key, and do not spread defaultConfig.output after it.
 * ---------------------------------------------------------------------------
 */
const path = require( 'path' );
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

module.exports = {
	...defaultConfig,
	entry: {
		'admin/dist/productreels-admin': path.resolve( __dirname, 'admin/src/index.js' ),
		'public/dist/productreels-public': path.resolve( __dirname, 'public/src/index.js' ),
		'block/dist/productreels-block': path.resolve( __dirname, 'block/src/index.js' ),
	},
	output: {
		...defaultConfig.output,
		path: path.resolve( __dirname ),
		filename: '[name].js',
		// The player is split out of the public bundle; the public entry sets
		// __webpack_public_path__ to the plugin URL so this resolves at runtime.
		chunkFilename: 'public/dist/[name].js?ver=[chunkhash]',
		clean: false,
	},
	resolve: {
		...defaultConfig.resolve,
		alias: {
			...defaultConfig.resolve?.alias,
			// The render core lives outside both bundles because both import it.
			'@shared': path.resolve( __dirname, 'src/shared' ),
		},
	},
};
