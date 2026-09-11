/**
 * The play affordance drawn over a thumbnail.
 *
 * Sized and coloured from the style object, so it is one component rather than
 * a sprinkle of inline SVG across the templates.
 */

export const PlayIcon = ( { size = 40, color = '#ffffff' } ) => (
	<span
		className="wr-thumb__play"
		style={ { width: size, height: size, color } }
		aria-hidden="true"
	>
		<svg viewBox="0 0 48 48" width={ size } height={ size } fill="none">
			<circle cx="24" cy="24" r="23" fill="currentColor" opacity=".22" />
			<circle
				cx="24"
				cy="24"
				r="23"
				stroke="currentColor"
				strokeWidth="1.5"
				opacity=".9"
			/>
			<path d="M19 15.5v17L34 24l-15-8.5Z" fill="currentColor" />
		</svg>
	</span>
);
