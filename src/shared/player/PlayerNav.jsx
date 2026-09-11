/**
 * The previous / next buttons beside the stage.
 *
 * Chevrons point along the slide direction — sideways for a horizontal
 * player, up and down for a vertical one — and are mirrored by the
 * stylesheet in RTL so "next" always points towards the end of the reading
 * direction.
 */

import { __ } from '@wordpress/i18n';

const Chevron = ( { direction, which } ) => {
	const horizontal = direction === 'horizontal';
	let path;

	if ( horizontal ) {
		path = which === 'prev' ? 'm15 5-7 7 7 7' : 'm9 5 7 7-7 7';
	} else {
		path = which === 'prev' ? 'm5 15 7-7 7 7' : 'm5 9 7 7 7-7';
	}

	return (
		<svg
			viewBox="0 0 24 24"
			width="22"
			height="22"
			fill="none"
			stroke="currentColor"
			strokeWidth="2.2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d={ path } />
		</svg>
	);
};

export const PlayerNav = ( { direction, onPrev, onNext, hidden } ) => {
	if ( hidden ) {
		return null;
	}

	return (
		<>
			<button
				type="button"
				className="wr-player__nav wr-player__nav--prev"
				aria-label={ __( 'Previous', 'wooreels' ) }
				data-wr-no-swipe=""
				onClick={ onPrev }
			>
				<Chevron direction={ direction } which="prev" />
			</button>
			<button
				type="button"
				className="wr-player__nav wr-player__nav--next"
				aria-label={ __( 'Next', 'wooreels' ) }
				data-wr-no-swipe=""
				onClick={ onNext }
			>
				<Chevron direction={ direction } which="next" />
			</button>
		</>
	);
};
