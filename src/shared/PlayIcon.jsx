/**
 * The play affordance drawn over a thumbnail.
 *
 * Sized and coloured from the style object, so it is one component rather than
 * a sprinkle of inline SVG across the templates. The SVG is the tint, the
 * ring and the triangle; the stylesheet turns the span behind it into a
 * frosted disc, so the mark sits on the footage like a lens.
 */

export const PlayIcon = ( { size = 40, color = '#ffffff' } ) => (
	<span
		className="wr-thumb__play"
		style={ { width: size, height: size, color } }
		aria-hidden="true"
	>
		<svg viewBox="0 0 48 48" width={ size } height={ size } fill="none">
			<circle cx="24" cy="24" r="24" fill="currentColor" opacity=".18" />
			<circle
				cx="24"
				cy="24"
				r="23.25"
				stroke="currentColor"
				strokeWidth="1.5"
				opacity=".55"
			/>
			<path
				d="M19.5 16.2v15.6a1 1 0 0 0 1.52.86l12.7-7.8a1 1 0 0 0 0-1.72l-12.7-7.8a1 1 0 0 0-1.52.86Z"
				fill="currentColor"
			/>
		</svg>
	</span>
);
