/**
 * Carousel — a snapping horizontal rail with arrows.
 *
 * Scroll snapping and overflow do the real work, so the rail keeps native
 * touch momentum and never fights the page's own vertical scroll. Pointer drag
 * is layered on top for mouse users, with a movement threshold so that a drag
 * does not also fire the tile's click.
 *
 * The arrows disable themselves at each end rather than wrapping — a rail
 * that silently jumps back to the start is disorienting — and are not drawn
 * at all while every reel fits.
 */

import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ReelIcon } from '../ReelIcon';
import { Thumbnail } from '../Thumbnail';

const DRAG_THRESHOLD = 4;

export const Carousel = ( { reels, styles, onOpen } ) => {
	const rail = useRef( null );
	const drag = useRef( {
		active: false,
		startX: 0,
		startScroll: 0,
		moved: 0,
	} );
	const [ edges, setEdges ] = useState( { start: true, end: false } );
	// Outside arrows hang 20px past the rail; with no room for that before
	// the screen's edge they would widen the page, so they come inside.
	const [ tight, setTight ] = useState( false );

	const measure = useCallback( () => {
		const node = rail.current;

		if ( ! node ) {
			return;
		}

		// scrollLeft is negative in RTL on some engines; compare on magnitude.
		const position = Math.abs( node.scrollLeft );
		const max = node.scrollWidth - node.clientWidth;

		setEdges( { start: position <= 1, end: position >= max - 1 } );

		const box = node.getBoundingClientRect();

		setTight(
			box.left < 24 ||
				document.documentElement.clientWidth - box.right < 24
		);
	}, [] );

	useEffect( () => {
		measure();

		const node = rail.current;

		if ( ! node ) {
			return undefined;
		}

		node.addEventListener( 'scroll', measure, { passive: true } );
		window.addEventListener( 'resize', measure );

		// The rail's own size changes without the window's: the editor's size
		// slider and device toggle, a theme's collapsing sidebar. Whether the
		// arrows show at all follows these measurements, so they must keep up.
		const observer =
			typeof window.ResizeObserver === 'function'
				? new window.ResizeObserver( measure )
				: null;

		if ( observer ) {
			observer.observe( node );
		}

		return () => {
			node.removeEventListener( 'scroll', measure );
			window.removeEventListener( 'resize', measure );

			if ( observer ) {
				observer.disconnect();
			}
		};
	}, [ measure, reels.length ] );

	const page = ( sign ) => {
		const node = rail.current;

		if ( ! node ) {
			return;
		}

		const rtl = window.getComputedStyle( node ).direction === 'rtl';

		node.scrollBy( {
			left: sign * ( rtl ? -1 : 1 ) * node.clientWidth * 0.8,
			behavior: 'smooth',
		} );
	};

	const onPointerDown = ( event ) => {
		// Touch already has momentum scrolling; only take over for a mouse.
		if ( event.pointerType === 'touch' ) {
			return;
		}

		drag.current = {
			active: true,
			startX: event.clientX,
			startScroll: rail.current.scrollLeft,
			moved: 0,
		};
	};

	const onPointerMove = ( event ) => {
		if ( ! drag.current.active ) {
			return;
		}

		const delta = event.clientX - drag.current.startX;

		drag.current.moved = Math.max( drag.current.moved, Math.abs( delta ) );
		rail.current.scrollLeft = drag.current.startScroll - delta;
	};

	const endDrag = () => {
		drag.current.active = false;
	};

	// A drag that travelled must not also count as a click on a thumbnail.
	const onClickCapture = ( event ) => {
		if ( drag.current.moved > DRAG_THRESHOLD ) {
			event.preventDefault();
			event.stopPropagation();
			drag.current.moved = 0;
		}
	};

	const onKeyDown = ( event ) => {
		if ( event.key === 'ArrowRight' ) {
			event.preventDefault();
			page( 1 );
		}

		if ( event.key === 'ArrowLeft' ) {
			event.preventDefault();
			page( -1 );
		}
	};

	// Every reel already in view: nothing to scroll to, so no arrows.
	const fits = edges.start && edges.end;

	const arrow = ( which ) => (
		<button
			type="button"
			className={ `prs-arrow prs-arrow--${ which }` }
			aria-label={
				which === 'prev'
					? __( 'Previous reels', 'productreels' )
					: __( 'Next reels', 'productreels' )
			}
			disabled={ which === 'prev' ? edges.start : edges.end }
			onClick={ () => page( which === 'prev' ? -1 : 1 ) }
		>
			<ReelIcon
				name={ which === 'prev' ? 'chevron-left' : 'chevron-right' }
				size={ 20 }
			/>
		</button>
	);

	return (
		<div
			className={ [
				'prs-carousel',
				'wr-carousel',
				styles.carouselBtnPosition === 'inside'
					? 'prs-carousel--inside'
					: 'prs-carousel--outside',
				styles.shape === 'circle' ? 'prs-carousel--circle' : '',
				tight ? 'is-tight' : '',
			]
				.filter( Boolean )
				.join( ' ' ) }
		>
			{ ! fits && arrow( 'prev' ) }

			{ /* A scroll container that takes keyboard focus for arrow-key paging;
			     no interactive ARIA role describes a scroll region, so the a11y
			     rule is set aside here on purpose. */ }
			{ /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */ }
			<div
				ref={ rail }
				className="prs-carousel__track"
				tabIndex={ fits ? undefined : 0 }
				role="group"
				aria-label={ __( 'Reels', 'productreels' ) }
				onKeyDown={ onKeyDown }
				onPointerDown={ onPointerDown }
				onPointerMove={ onPointerMove }
				onPointerUp={ endDrag }
				onPointerLeave={ endDrag }
				onClickCapture={ onClickCapture }
			>
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

			{ ! fits && arrow( 'next' ) }
		</div>
	);
};
