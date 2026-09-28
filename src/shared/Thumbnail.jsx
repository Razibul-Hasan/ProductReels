/**
 * One reel as it appears before anyone opens it.
 *
 * Shared by the editor preview and the public bundle, so what a store owner
 * styles is literally the component a visitor will see.
 *
 * It is a <button>, not a div with a click handler: it is the thing you press
 * to open a reel, and it needs to be reachable and announceable as such.
 */

import { useEffect, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	compactCount,
	firstFile,
	isNativePlayable,
	posterOf,
	taggedProductId,
} from './format';
import { useInView } from './hooks/useInView';
import { claimPlayback } from './playback';
import { PlayIcon } from './PlayIcon';
import { Stars } from './ProductCard';
import { useWidgetProducts } from './products';
import { ViewsBadge } from './ViewsBadge';

/**
 * The tagged product, on the thumbnail.
 *
 * The same two looks as the player's card, cut down to what fits a
 * thumbnail: image, name, rating and price. Nothing in it is a link — the
 * thumbnail is one button, and pressing it opens the reel — so the card is
 * the product's introduction, not its shop page.
 *
 * @param {Object}  props             Props.
 * @param {Object}  props.product     The product, or undefined while loading.
 * @param {string}  props.variant     'modern' or 'classic'.
 * @param {boolean} props.showRatings Whether to draw the stars.
 * @return {Object} The card.
 */
const ThumbProduct = ( { product, variant, showRatings } ) => (
	<span
		className={ `wr-thumb__product wr-thumb__product--${ variant }${
			product ? '' : ' is-loading'
		}` }
		aria-busy={ product ? undefined : 'true' }
	>
		<span className="wr-thumb__product-img">
			{ product && product.image && (
				<img
					src={ product.image }
					alt=""
					loading="lazy"
					decoding="async"
				/>
			) }
		</span>
		<span className="wr-thumb__product-text">
			{ product ? (
				<>
					<span className="wr-thumb__product-name">
						{ product.name }
					</span>
					<span className="wr-thumb__product-meta">
						{ showRatings && product.rating_count > 0 && (
							<Stars
								rating={ product.rating }
								count={ product.rating_count }
							/>
						) }
						{ /* WooCommerce formats this string itself; it is the same markup the shop page prints. */ }
						<span
							className="wr-thumb__product-price"
							dangerouslySetInnerHTML={ {
								__html: product.price_html || '',
							} }
						/>
					</span>
				</>
			) : (
				<>
					<span className="wr-thumb__product-line" />
					<span className="wr-thumb__product-line wr-thumb__product-line--short" />
				</>
			) }
		</span>
	</span>
);

/**
 * @param {Object}   props            Props.
 * @param {Object}   props.reel       The reel.
 * @param {Object}   props.styles     The widget's styles.
 * @param {Function} props.onOpen     Called with the reel and the button when pressed.
 * @param {number}   props.index      Position in the widget, for the entrance stagger.
 * @param {boolean}  props.decorative A repeat of a thumbnail already on the page —
 *                                    the marquee's extra copies — hidden from
 *                                    assistive technology and the tab order.
 * @return {Object} The thumbnail.
 */
export const Thumbnail = ( {
	reel,
	styles,
	onOpen,
	index = 0,
	decorative = false,
} ) => {
	const video = useRef( null );
	const [ frameRef, inView ] = useInView( { rootMargin: '200px' } );
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
	// A circle has nowhere to put a card; it keeps the caption.
	const showProduct =
		overlay &&
		! circle &&
		!! productId &&
		( products === null || !! product );
	const caption =
		overlay && ! showProduct && styles.showFallbackTitle
			? reel.title || ''
			: '';
	// A circle is a story ring: nothing is written over the footage, so the
	// caption and the view count sit underneath it instead, the way a handle
	// sits under a story. Both appearances end up in the same place.
	const underTitle = circle
		? ( styles.appearance === 'title' ? reel.title : caption ) || ''
		: '';

	// With lazyLoad on, the <video> gets no src at all until it is near the
	// viewport — an off-screen widget should cost nothing but markup.
	const videoSrc =
		! styles.lazyLoad || inView
			? `${ file ? file.url : '' }#t=0.1`
			: undefined;

	const previewable =
		styles.playBehavior === 'hover' && ! styles.disablePreview && playable;

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

	const hoverIn = () => {
		if ( previewable && video.current ) {
			const node = video.current;

			// One video at a time, page-wide: a hover preview yields to the player.
			claimPlayback( () => node.pause() );
			node.play().catch( () => {} );
		}
	};

	const hoverOut = () => {
		if ( previewable && video.current ) {
			video.current.pause();
			video.current.currentTime = 0;
		}
	};

	return (
		<button
			type="button"
			ref={ frameRef }
			className={ [
				'wr-thumb',
				`wr-thumb--${ styles.shape }`,
				`wr-thumb--hover-${ styles.hoverEffect }`,
				`wr-thumb--${ styles.appearance }`,
			].join( ' ' ) }
			style={ {
				'--wr-index': index,
			} }
			aria-label={ sprintf(
				/* translators: %s: reel title. */
				__(
					'Play reel: %s',
					'productreels-shoppable-video-reels-for-woocommerce'
				),
				reel.title ||
					__(
						'Untitled',
						'productreels-shoppable-video-reels-for-woocommerce'
					)
			) }
			aria-hidden={ decorative ? 'true' : undefined }
			tabIndex={ decorative ? -1 : undefined }
			onPointerEnter={ hoverIn }
			onPointerLeave={ hoverOut }
			onClick={ ( event ) =>
				onOpen && onOpen( reel, event.currentTarget )
			}
		>
			<span className="wr-thumb__media">
				<span className="wr-thumb__frame">
					{ playable && (
						<video
							ref={ video }
							className="wr-thumb__video"
							src={ videoSrc }
							poster={ poster || undefined }
							muted
							loop
							playsInline
							preload="metadata"
							tabIndex={ -1 }
							aria-hidden="true"
						/>
					) }
					{ ! playable && poster && (
						<img
							className="wr-thumb__img"
							src={ poster }
							alt=""
							loading="lazy"
							decoding="async"
						/>
					) }
					{ ! playable && ! poster && (
						<span className="wr-thumb__blank" aria-hidden="true" />
					) }
				</span>

				{ styles.showPlayButton && (
					<PlayIcon
						size={ styles.playIconSize }
						color={ styles.playIconColor }
					/>
				) }

				{ showProduct && (
					<span className="wr-thumb__scrim wr-thumb__scrim--product">
						<ThumbProduct
							product={ product }
							variant={ styles.productCardStyle }
							showRatings={ styles.showRatings }
						/>
					</span>
				) }

				{ ! circle && caption !== '' && (
					<span className="wr-thumb__scrim">
						<span className="wr-thumb__caption">{ caption }</span>
					</span>
				) }

				{ ! circle && styles.showViews && (
					<ViewsBadge
						count={ compactCount( reel.view_count ) }
						background={ styles.viewsBgColor }
						color={ styles.viewsTextIconColor }
						shape={ styles.shape }
					/>
				) }
			</span>

			{ ! circle && styles.appearance === 'title' && (
				<span className="wr-thumb__below">{ reel.title }</span>
			) }

			{ circle && ( underTitle !== '' || styles.showViews ) && (
				<span className="wr-thumb__under">
					{ underTitle !== '' && (
						<span className="wr-thumb__below">{ underTitle }</span>
					) }
					{ styles.showViews && (
						<ViewsBadge
							count={ compactCount( reel.view_count ) }
							background={ styles.viewsBgColor }
							color={ styles.viewsTextIconColor }
							shape={ styles.shape }
						/>
					) }
				</span>
			) }
		</button>
	);
};
