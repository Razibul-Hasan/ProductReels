/**
 * The <svg> behind Icon and ReelIcon: one Lucide body from a static map.
 *
 * With a `label` it is an image with that accessible name; without one it is
 * decoration and hidden from assistive technology, so an icon-only button
 * must label the button itself.
 */

/**
 * Icons that point the way the page reads. They get `pr-icon--flip` and
 * mirror in right-to-left languages, so a back arrow still points back and a
 * "next" chevron still points onward; up/down arrows, logos and media never
 * mirror.
 */
const DIRECTIONAL = new Set( [
	'arrow-left',
	'chevron-left',
	'chevron-right',
	'undo',
] );

export const IconSvg = ( {
	markup,
	name,
	size = 18,
	strokeWidth = 1.75,
	fill = 'none',
	className,
	label,
	style,
} ) => (
	<svg
		className={ [
			'pr-icon',
			DIRECTIONAL.has( name ) && 'pr-icon--flip',
			className,
		]
			.filter( Boolean )
			.join( ' ' ) }
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
		// The maps hold static path markup shipped with the plugin, never input.
		dangerouslySetInnerHTML={ { __html: markup || '' } }
	/>
);
