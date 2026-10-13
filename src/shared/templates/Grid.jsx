/**
 * Grid — reels wrap into as many columns as the container allows.
 *
 * The column count is never hardcoded: rows fill at the chosen reel width,
 * so the same widget works in a narrow sidebar and a full-width section
 * without the store owner configuring anything twice.
 */

import { Thumbnail } from '../Thumbnail';

export const Grid = ( { reels, styles, onOpen } ) => (
	<div className="prs-grid wr-grid">
		{ reels.map( ( reel, index ) => (
			<Thumbnail
				key={ reel.id }
				reel={ reel }
				styles={ styles }
				onOpen={ onOpen }
				index={ index }
			/>
		) ) }
	</div>
);
