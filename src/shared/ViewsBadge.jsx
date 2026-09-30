/**
 * The view counter that sits on a thumbnail.
 *
 * A circle thumbnail has no corner to tuck this into without clipping it, so
 * there it is a line under the disc, with the title, instead of insetting.
 */

import { __ } from '@wordpress/i18n';

export const ViewsBadge = ( { count, background, color, shape } ) => (
	<span
		className={ `wr-views wr-views--${ shape }` }
		style={ { background, color } }
		title={ __(
			'Views',
			'productreels'
		) }
	>
		<svg
			viewBox="0 0 24 24"
			width="11"
			height="11"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			aria-hidden="true"
		>
			<path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12Z" />
			<circle cx="12" cy="12" r="2.6" />
		</svg>
		{ count }
	</span>
);
