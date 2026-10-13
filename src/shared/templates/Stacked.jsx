/**
 * Stacked — a fanned deck of reels, only the front one interactive.
 *
 * The front reel sits in the middle; the ones behind fan out to either side,
 * each a step further out (the widget's offset), tilted and a little smaller
 * (its scale). They are decoration: footage only, aria-hidden and out of the
 * tab order, so a keyboard or screen-reader user meets one reel at a time
 * rather than a pile of identical buttons, and only the front reel shows its
 * badges and card.
 *
 * A step is choreographed rather than swapped. `front` counts steps without
 * wrapping, so every card in the deck is keyed by its place in that count:
 * a card that stays keeps its element and the stylesheet eases it one place
 * forward or back, the card that wraps round mounts afresh and surfaces or
 * returns, and the one that goes is kept on as a clone just long enough to be
 * thrown off or sink away. The front card follows the pointer while it is
 * held, so a throw starts from wherever the finger let go.
 */

import { useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ReelIcon } from '../ReelIcon';
import { Thumbnail } from '../Thumbnail';
import { useReducedMotion } from '../hooks/useReducedMotion';

/* Travel that turns a drag into a step. */
const SWIPE = 40;
/* Travel past which a release is no longer a tap on the card. */
const TAP = 10;
/* Degrees of tilt per pixel of travel, and the most a card tilts. */
const TILT = 0.045;
const TILT_MAX = 7;
/* The fan: degrees each step out from the front card turns. */
const FAN_TILT = 5;

export const Stacked = ( { reels, styles, onOpen } ) => {
	const [ front, setFront ] = useState( 0 );
	const [ arrival, setArrival ] = useState( null );
	const [ leaving, setLeaving ] = useState( [] );
	const deck = useRef( null );
	const gesture = useRef( null );
	const swiped = useRef( false );
	const reduced = useReducedMotion();

	const { depth, offset, scale } = styles.stacked;
	const total = reels.length;
	const visible = Math.min( depth, total );

	const at = ( pos ) => reels[ ( ( pos % total ) + total ) % total ];

	/**
	 * Step the deck, remembering who goes and who arrives.
	 *
	 * @param {number} step  1 for the next reel, -1 for the previous.
	 * @param {number} fromX Where the front card was let go, in px of travel.
	 */
	const advance = ( step, fromX = 0 ) => {
		const stamp = Date.now();

		if ( step > 0 ) {
			// The front card is thrown off; a new one surfaces at the back.
			setLeaving( ( current ) => [
				...current.slice( -2 ),
				{
					key: `throw-${ front }-${ stamp }`,
					reel: at( front ),
					layer: 0,
					kind: 'throw',
					fromX,
				},
			] );
			setArrival( { pos: front + visible, kind: 'surface' } );
		} else {
			// The previous card returns to the front; the last one sinks away.
			setLeaving( ( current ) => [
				...current.slice( -2 ),
				{
					key: `sink-${ front + visible - 1 }-${ stamp }`,
					reel: at( front + visible - 1 ),
					layer: visible - 1,
					kind: 'sink',
					fromX: 0,
				},
			] );
			setArrival( { pos: front - 1, kind: 'return' } );
		}

		setFront( front + step );
	};

	const settle = ( key ) =>
		setLeaving( ( current ) =>
			current.filter( ( entry ) => entry.key !== key )
		);

	/* The follow is written straight onto the deck: a pointer move must not
	   re-render three thumbnails sixty times a second. */
	const follow = ( x ) => {
		const node = deck.current;

		if ( ! node ) {
			return;
		}

		const tilt = Math.max( -TILT_MAX, Math.min( TILT_MAX, x * TILT ) );

		node.style.setProperty( '--prs-drag-x', `${ x }px` );
		node.style.setProperty( '--prs-drag-r', `${ tilt }deg` );

		if ( x === 0 ) {
			node.removeAttribute( 'data-dragging' );
		} else {
			node.setAttribute( 'data-dragging', '' );
		}
	};

	const onPointerDown = ( event ) => {
		swiped.current = false;
		gesture.current = {
			id: event.pointerId,
			startX: event.clientX,
			moved: false,
		};
	};

	const onPointerMove = ( event ) => {
		const held = gesture.current;

		if ( ! held || event.pointerId !== held.id ) {
			return;
		}

		const x = event.clientX - held.startX;

		if ( ! held.moved && Math.abs( x ) < 4 ) {
			return;
		}

		held.moved = true;
		follow( x );
	};

	const onPointerUp = ( event ) => {
		const held = gesture.current;

		if ( ! held || event.pointerId !== held.id ) {
			return;
		}

		gesture.current = null;

		const x = event.clientX - held.startX;

		swiped.current = Math.abs( x ) > TAP;
		follow( 0 );

		if ( total > 1 && Math.abs( x ) > SWIPE ) {
			advance( x < 0 ? 1 : -1, x );
		}
	};

	const onPointerCancel = () => {
		gesture.current = null;
		follow( 0 );
	};

	/* A mouse still clicks after a drag; that click was not a tap. */
	const onClickCapture = ( event ) => {
		if ( swiped.current ) {
			swiped.current = false;
			event.preventDefault();
			event.stopPropagation();
		}
	};

	/* Layer 1 fans to the start side, 2 to the end, 3 further to the start… */
	const place = ( layer ) => {
		const out = Math.ceil( layer / 2 );
		const side = layer % 2 ? -1 : 1;

		return {
			'--prs-layer': layer,
			'--prs-card-x': `${ side * out * offset }px`,
			'--prs-card-r': `${ side * out * FAN_TILT }deg`,
			'--prs-card-s': String( Math.pow( scale, out ) ),
			zIndex: visible - layer,
		};
	};

	const count = ( ( front % total ) + total ) % total;

	return (
		<div
			className={ `prs-stack wr-stacked${ reduced ? ' is-static' : '' }` }
		>
			{ /* The deck is as wide as the front card plus the fan on each
			     side, so the outermost cards never hang over the content
			     beside the widget. */ }
			<div
				ref={ deck }
				className="prs-deck"
				style={ {
					'--prs-fan': `${ Math.ceil( ( visible - 1 ) / 2 ) * offset }px`,
				} }
				onPointerDown={ onPointerDown }
				onPointerMove={ onPointerMove }
				onPointerUp={ onPointerUp }
				onPointerCancel={ onPointerCancel }
				onPointerLeave={ onPointerCancel }
				onClickCapture={ onClickCapture }
			>
				{ Array.from( { length: visible } ).map( ( _, layer ) => {
					const pos = front + layer;
					const reel = at( pos );
					const isFront = layer === 0;
					const arriving =
						arrival && arrival.pos === pos
							? ` is-${ arrival.kind }`
							: '';

					return (
						<div
							key={ pos }
							className={ `prs-deck__card${
								isFront ? ' is-front' : ''
							}${ arriving }` }
							aria-hidden={ isFront ? undefined : 'true' }
							inert={ isFront ? undefined : '' }
							style={ place( layer ) }
						>
							<Thumbnail
								reel={ reel }
								styles={ styles }
								onOpen={ isFront ? onOpen : undefined }
								index={ layer }
								plain={ ! isFront }
							/>
						</div>
					);
				} ) }

				{ leaving.map( ( entry ) => (
					<div
						key={ entry.key }
						className={ `prs-deck__card is-${ entry.kind }` }
						aria-hidden="true"
						inert=""
						style={ {
							...place( entry.layer ),
							zIndex: visible + 1,
							'--prs-from-x': `${ entry.fromX }px`,
							'--prs-from-r': `${ Math.max(
								-TILT_MAX,
								Math.min( TILT_MAX, entry.fromX * TILT )
							) }deg`,
						} }
						onAnimationEnd={ ( event ) => {
							if ( event.target === event.currentTarget ) {
								settle( entry.key );
							}
						} }
					>
						<Thumbnail
							reel={ entry.reel }
							styles={ styles }
							index={ entry.layer }
							plain={ entry.layer !== 0 }
						/>
					</div>
				) ) }
			</div>

			{ total > 1 && (
				<div className="prs-stack__nav">
					<button
						type="button"
						className="prs-arrow prs-arrow--sm"
						aria-label={ __( 'Previous reel', 'productreels' ) }
						onClick={ () => advance( -1 ) }
					>
						<ReelIcon name="chevron-left" size={ 18 } />
					</button>
					<span className="prs-stack__count pr-t-caption">
						{ count + 1 } / { total }
					</span>
					<button
						type="button"
						className="prs-arrow prs-arrow--sm"
						aria-label={ __( 'Next reel', 'productreels' ) }
						onClick={ () => advance( 1 ) }
					>
						<ReelIcon name="chevron-right" size={ 18 } />
					</button>
				</div>
			) }
		</div>
	);
};
