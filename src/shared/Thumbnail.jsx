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
	thumbnailCaption,
} from './format';
import { useInView } from './hooks/useInView';
import { claimPlayback } from './playback';
import { PlayIcon } from './PlayIcon';
import { ViewsBadge } from './ViewsBadge';

export const Thumbnail = ( { reel, styles, onOpen, index = 0 } ) => {
	const video = useRef( null );
	const [ frameRef, inView ] = useInView( { rootMargin: '200px' } );

	const file = firstFile( reel );
	const poster = posterOf( reel );
	const playable = isNativePlayable( file );
	const caption = thumbnailCaption( reel, styles.showFallbackTitle );

	// With lazyLoad on, the <video> gets no src at all until it is near the
	// viewport — an off-screen widget should cost nothing but markup.
	const videoSrc =
		! styles.lazyLoad || inView
			? `${ file ? file.url : '' }#t=0.1`
			: undefined;

	const previewable =
		styles.playBehavior === 'hover' && ! styles.disablePreview && playable;

	useEffect( () => {
		if (
			! video.current ||
			styles.playBehavior !== 'autoplay' ||
			styles.disablePreview
		) {
			return;
		}

		if ( inView ) {
			video.current.play().catch( () => {} );
		} else {
			video.current.pause();
		}
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
				__( 'Play reel: %s', 'wooreels' ),
				reel.title || __( 'Untitled', 'wooreels' )
			) }
			onPointerEnter={ hoverIn }
			onPointerLeave={ hoverOut }
			onClick={ ( event ) =>
				onOpen && onOpen( reel, event.currentTarget )
			}
		>
			<span className="wr-thumb__media">
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

			{ styles.appearance === 'overlay' && caption !== '' && (
				<span className="wr-thumb__scrim">
					<span className="wr-thumb__caption">{ caption }</span>
				</span>
			) }

			{ styles.showViews && (
				<ViewsBadge
					count={ compactCount( reel.view_count ) }
					background={ styles.viewsBgColor }
					color={ styles.viewsTextIconColor }
					shape={ styles.shape }
				/>
			) }

			{ styles.appearance === 'title' && (
				<span className="wr-thumb__below">{ reel.title }</span>
			) }
		</button>
	);
};
