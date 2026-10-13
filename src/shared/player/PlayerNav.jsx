/**
 * The previous or next button beside the stage.
 *
 * One button per call, so the player can put "previous" before the stage and
 * "next" after it: the tab order then follows the room from left to right.
 * Chevrons point along the slide direction — sideways for a horizontal
 * player, up and down for a vertical one — and are mirrored by the
 * stylesheet in RTL so "next" always points towards the end of the reading
 * direction. Their colours and radius are the widget's navigation button
 * settings.
 */

import { __ } from '@wordpress/i18n';
import { ReelIcon } from '../ReelIcon';

const CHEVRONS = {
	horizontal: { prev: 'chevron-left', next: 'chevron-right' },
	vertical: { prev: 'chevron-up', next: 'chevron-down' },
};

export const PlayerNav = ( { direction, which, onClick } ) => (
	<button
		type="button"
		className={ `prs-navbtn prs-room__nav prs-room__nav--${ which }` }
		aria-label={
			which === 'prev'
				? __( 'Previous reel', 'productreels' )
				: __( 'Next reel', 'productreels' )
		}
		data-wr-no-swipe=""
		onClick={ onClick }
	>
		<ReelIcon name={ CHEVRONS[ direction ][ which ] } size={ 22 } />
	</button>
);
