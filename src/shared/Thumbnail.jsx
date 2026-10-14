/**
 * One reel as it appears before anyone opens it: the design's ReelTile.
 *
 * Shared by the editor preview and the public bundle, so what a store owner
 * styles is literally the component a visitor will see.
 *
 * It is one <button>: the thing you press to open a reel, reachable and
 * announced as such. Everything inside it — the view count, the play mark,
 * the product card — is a picture of the reel, never a second control.
 */

import { useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	firstFile,
	isNativePlayable,
	posterOf,
	taggedProductId,
	viewCount,
} from './format';
import { useInView } from './hooks/useInView';
import { claimPlayback } from './playback';
import { TileCard } from './ProductCard';
import { useWidgetProducts } from './products';
import { VimeoPlayer } from './providers/VimeoPlayer';
import { YouTubePlayer } from './providers/YouTubePlayer';
import { ReelIcon } from './ReelIcon';

const Views = ( { count, className = '' } ) => (
	<span className={ `prs-views pr-t-caption ${ className }` }>
		<ReelIcon name="eye" size={ 12 } />
		{ viewCount( count ) }
	</span>
);

const noop = () => {};

/**
 * A YouTube or Vimeo reel previewing on its tile, through the player's own
 * provider: muted, looping, no controls. It plays while `playing` is true —
 * from the moment it is ready — and otherwise waits at the start, so a
 * hover preview loads once and is instant the next time.
 * It is footage only — inert and hidden from assistive technology — so the
 * tile's button stays the one thing to press.
 *
 * @param {Object}   props             Props.
 * @param {Object}   props.file        The YouTube or Vimeo file.
 * @param {boolean}  props.playing     Whether it should be playing.
 * @param {Function} props.onPlayState Called with whether it is playing.
 */
const EmbedPreview = ( { file, playing, onPlayState } ) => {
	const player = useRef( null );
	const ready = useRef( false );
	// The provider binds its callbacks once, so `onReady` reads this ref.
	const wanted = useRef( playing );
	const Provider = file.source === 'vimeo' ? VimeoPlayer : YouTubePlayer;

	wanted.current = playing;

	useEffect( () => {
		const instance = player.current;

		if ( ! ready.current || ! instance ) {
			return;
		}

		if ( playing ) {
			instance.play().catch( noop );
		} else {
			instance.pause();
			instance.seek( 0 );
		}
	}, [ playing ] );

	return (
		<span className="prs-tile__embed" aria-hidden="true" inert="">
			<Provider
				ref={ player }
				file={ file }
				muted
				loop
				noCookie
				onTime={ noop }
				onEnded={ noop }
				onPlayState={ onPlayState }
				onReady={ () => {
					ready.current = true;

					if ( wanted.current && player.current ) {
						player.current.play().catch( noop );
					}
				} }
			/>
		</span>
	);
};

/**
 * @param {Object}   props            Props.
 * @param {Object}   props.reel       The reel.
 * @param {Object}   props.styles     The widget's styles.
 * @param {Function} props.onOpen     Called with the reel and the button when pressed.
 * @param {number}   props.index      Position in the widget, for the entrance stagger.
 * @param {boolean}  props.decorative A repeat of a tile already on the page —
 *                                    the marquee's extra copies — hidden from
 *                                    assistive technology and the tab order.
 * @param {boolean}  props.plain      Footage only: a card at the back of a
 *                                    deck, which shows no badge, play mark,
 *                                    title or product.
 * @return {Object} The tile.
 */
export const Thumbnail = ( {
	reel,
	styles,
	onOpen,
	index = 0,
	decorative = false,
	plain = false,
} ) => {
	const video = useRef( null );
	const [ frameRef, inView ] = useInView( { rootMargin: '200px' } );
	// Whether a preview is running, which is when the cover steps aside.
	const [ live, setLive ] = useState( false );
	// A hover preview: whether the pointer is on the tile now, and whether it
	// ever was (its footage, or its YouTube or Vimeo player, stays loaded after).
	const [ hovering, setHovering ] = useState( false );
	const [ hovered, setHovered ] = useState( false );
	const products = useWidgetProducts();

	const file = firstFile( reel );
	const poster = posterOf( reel );
	const playable = isNativePlayable( file );
	const overlay = styles.appearance === 'overlay';
	const circle = styles.shape === 'circle';

	// A tagged product owns the overlay; the title is for reels without one.
	// `products` is null until the lookup answers, and the card shows its
	// skeleton meanwhile rather than flashing the title first.
	const productId = taggedProductId( reel );
	const product = productId && products ? products[ productId ] : undefined;
	// A circle has nowhere to put a card; it keeps the title.
	const showProduct =
		! plain &&
		overlay &&
		! circle &&
		!! productId &&
		( products === null || !! product );
	const caption =
		! plain && overlay && ! showProduct && styles.showFallbackTitle
			? reel.title || ''
			: '';
	// A circle is a story ring: nothing is written over the footage, so the
	// title and the view count sit underneath it instead, the way a handle
	// sits under a story. Both appearances end up in the same place.
	const label =
		circle && ! plain
			? ( styles.appearance === 'title' ? reel.title : caption ) || ''
			: '';
	const below =
		! circle && ! plain && styles.appearance === 'title'
			? reel.title || ''
			: '';
	const views = styles.showViews && ! plain;

	const hover = styles.playBehavior === 'hover' && ! styles.disablePreview;
	const previewable = hover && playable;

	// With lazyLoad on, the <video> gets no src at all until it is near the
	// viewport — an off-screen widget should cost nothing but markup. A hover
	// preview behind a cover waits longer still, for the first hover: nobody
	// asked for the footage yet, and a page load that fetches every reel's
	// file is what download managers pounce on.
	const wantsSrc =
		previewable && poster ? hovered : ! styles.lazyLoad || inView;
	const videoSrc = wantsSrc ? `${ file ? file.url : '' }#t=0.1` : undefined;
	const autoplay =
		styles.playBehavior === 'autoplay' && ! styles.disablePreview;
	const embedded =
		!! file &&
		!! file.provider_id &&
		( file.source === 'youtube' || file.source === 'vimeo' );
	const embedHover = hover && embedded;
	// The cover is the picture. A <video> is only there to preview (on hover
	// or in view), or to stand in with its first frame for a reel without a
	// cover; a tile that only opens the player never loads any footage.
	const withVideo = playable && ( previewable || autoplay || ! poster );
	// YouTube and Vimeo have no <video> to play, so their own player stands
	// in — mounted only when it is needed (the tile near the viewport for
	// autoplay, the first hover for a hover preview), because each one loads
	// the provider's whole player.
	const withEmbed =
		embedded && ( ( autoplay && inView ) || ( embedHover && hovered ) );

	useEffect( () => {
		const node = video.current;

		if (
			! node ||
			styles.playBehavior !== 'autoplay' ||
			styles.disablePreview
		) {
			return undefined;
		}

		if ( inView ) {
			node.play().catch( () => {} );
		} else {
			node.pause();
		}

		// Leaving autoplay — the editor switching the option, or an unmount —
		// must stop what autoplay started, or the reel keeps running under a
		// setting that says it should not.
		return () => node.pause();
	}, [ inView, styles.playBehavior, styles.disablePreview ] );

	// A <video> hover preview follows `hovering`. An effect rather than the
	// pointer handlers, because the first hover only now gives it a src.
	useEffect( () => {
		const node = video.current;

		if ( ! node || ! previewable ) {
			return;
		}

		if ( hovering ) {
			node.play().catch( noop );
		} else {
			node.pause();

			if ( node.readyState > 0 ) {
				node.currentTime = 0;
			}
		}
	}, [ hovering, previewable, videoSrc ] );

	const hoverIn = () => {
		if ( embedHover || previewable ) {
			// One video at a time, page-wide: a hover preview yields to the player.
			claimPlayback( () => setHovering( false ) );
			setHovered( true );
			setHovering( true );
		}
	};

	const hoverOut = () => setHovering( false );

	return (
		<button
			type="button"
			ref={ frameRef }
			className={ [
				'prs-tile',
				circle ? 'prs-tile--circle' : '',
				styles.hoverEffect && styles.hoverEffect !== 'none'
					? `prs-tile--${ styles.hoverEffect }`
					: '',
				'wr-thumb',
			]
				.filter( Boolean )
				.join( ' ' ) }
			style={ { '--prs-index': index } }
			aria-label={ sprintf(
				/* translators: %s: reel title. */
				__( 'Play reel: %s', 'productreels' ),
				reel.title || __( 'Untitled', 'productreels' )
			) }
			aria-hidden={ decorative ? 'true' : undefined }
			tabIndex={ decorative ? -1 : undefined }
			onPointerEnter={ hoverIn }
			onPointerLeave={ hoverOut }
			onClick={ ( event ) =>
				onOpen && onOpen( reel, event.currentTarget )
			}
		>
			<span className="prs-tile__media">
				<span className="prs-tile__frame">
					{ withVideo && (
						<video
							ref={ video }
							src={ videoSrc }
							muted
							loop
							playsInline
							preload="metadata"
							tabIndex={ -1 }
							aria-hidden="true"
							onPlaying={ () => setLive( true ) }
							onPause={ () => setLive( false ) }
						/>
					) }
					{ withEmbed && (
						<EmbedPreview
							file={ file }
							playing={ autoplay || hovering }
							onPlayState={ setLive }
						/>
					) }
					{ poster && (
						<img
							className={ live ? 'is-hidden' : undefined }
							src={ poster }
							alt=""
							loading="lazy"
							decoding="async"
						/>
					) }
				</span>

				{ ( showProduct || caption !== '' ) && ! circle && (
					<span className="prs-tile__scrim" />
				) }

				{ views && ! circle && (
					<Views
						count={ reel.view_count }
						className="prs-tile__views"
					/>
				) }

				{ styles.showPlayButton && ! plain && (
					<span className="prs-play" aria-hidden="true">
						<ReelIcon name="play" fill="currentColor" />
					</span>
				) }

				{ showProduct && (
					<span className="prs-tile__card">
						<TileCard
							product={ product }
							showRatings={ styles.showRatings }
						/>
					</span>
				) }

				{ ! circle && caption !== '' && (
					<span className="prs-tile__title pr-t-body-strong">
						{ caption }
					</span>
				) }
			</span>

			{ below !== '' && (
				<span className="prs-tile__below pr-t-body-strong">
					{ below }
				</span>
			) }

			{ circle && ( label !== '' || views ) && (
				<span className="prs-tile__label">
					{ label !== '' && (
						<span className="pr-t-label">{ label }</span>
					) }
					{ views && <Views count={ reel.view_count } /> }
				</span>
			) }
		</button>
	);
};
