/**
 * One icon from the design's Lucide set (see icons.js).
 *
 * Shared by the admin app and the storefront. With a `label` it is an image
 * with that accessible name; without one it is decoration and hidden from
 * assistive technology, so an icon-only button must label the button itself.
 */

import { ICONS } from './icons';

export const iconNames = Object.keys( ICONS );

export const Icon = ( {
	name,
	size = 18,
	strokeWidth = 1.75,
	fill = 'none',
	className,
	label,
	style,
} ) => (
	<svg
		className={ [ 'pr-icon', className ].filter( Boolean ).join( ' ' ) }
		width={ size }
		height={ size }
		viewBox="0 0 24 24"
		fill={ fill }
		stroke="currentColor"
		strokeWidth={ strokeWidth }
		strokeLinecap="round"
		strokeLinejoin="round"
		role={ label ? 'img' : undefined }
		aria-label={ label }
		aria-hidden={ label ? undefined : 'true' }
		focusable="false"
		style={ style }
		// ICONS holds static path markup shipped with the plugin, never input.
		dangerouslySetInnerHTML={ { __html: ICONS[ name ] || '' } }
	/>
);

export default Icon;
