/**
 * Stacked — a deck of reels, only the front one interactive.
 *
 * The cards behind are decoration: they are aria-hidden and cannot be tabbed
 * to, so a keyboard or screen-reader user meets one reel at a time rather than
 * a pile of identical buttons.
 */

import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Thumbnail } from '../Thumbnail';
import { useReducedMotion } from '../hooks/useReducedMotion';

export const Stacked = ( { reels, styles, onOpen } ) => {
	const [ front, setFront ] = useState( 0 );
	const reduced = useReducedMotion();

	const { depth, offset, scale } = styles.stacked;
	const visible = Math.min( depth, reels.length );

	const advance = ( step ) =>
		setFront(
			( current ) => ( current + step + reels.length ) % reels.length
		);

	const onPointerUp = ( event ) => {
		const travel =
			event.clientX -
			( event.currentTarget.dataset.startX || event.clientX );

		if ( Math.abs( travel ) > 40 ) {
			advance( travel < 0 ? 1 : -1 );
		}
	};

	return (
		<div
			className={ `wr-stacked${ reduced ? ' is-static' : '' }` }
			onPointerDown={ ( event ) => {
				event.currentTarget.dataset.startX = event.clientX;
			} }
			onPointerUp={ onPointerUp }
		>
			<div className="wr-stacked__deck">
				{ Array.from( { length: visible } ).map( ( _, layer ) => {
					const reel = reels[ ( front + layer ) % reels.length ];
					const isFront = layer === 0;

					return (
						<div
							key={ `${ reel.id }-${ layer }` }
							className="wr-stacked__card"
							aria-hidden={ isFront ? undefined : 'true' }
							inert={ isFront ? undefined : '' }
							style={ {
								translate: `0 ${ layer * offset }px`,
								scale: String( Math.pow( scale, layer ) ),
								zIndex: visible - layer,
								opacity: 1 - layer * 0.18,
							} }
						>
							<Thumbnail
								reel={ reel }
								styles={ styles }
								onOpen={ isFront ? onOpen : undefined }
								index={ layer }
							/>
						</div>
					);
				} ) }
			</div>

			{ reels.length > 1 && (
				<div className="wr-stacked__nav">
					<button
						type="button"
						className="wr-nav"
						aria-label={ __( 'Previous', 'wooreels' ) }
						onClick={ () => advance( -1 ) }
					>
						<svg
							viewBox="0 0 24 24"
							width="16"
							height="16"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							aria-hidden="true"
						>
							<path d="m15 5-7 7 7 7" />
						</svg>
					</button>
					<span className="wr-stacked__count">
						{ front + 1 } / { reels.length }
					</span>
					<button
						type="button"
						className="wr-nav"
						aria-label={ __( 'Next', 'wooreels' ) }
						onClick={ () => advance( 1 ) }
					>
						<svg
							viewBox="0 0 24 24"
							width="16"
							height="16"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							aria-hidden="true"
						>
							<path d="m9 5 7 7-7 7" />
						</svg>
					</button>
				</div>
			) }
		</div>
	);
};
