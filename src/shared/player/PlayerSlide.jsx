/**
 * One reel inside the player.
 *
 * Only the active slide owns a provider; its neighbours show their poster so
 * a swipe reveals what is coming without three videos buffering at once.
 * The tap layer that toggles playback ignores a click that travelled, so the
 * end of a swipe never pauses the reel it just arrived on.
 *
 * `standby` keeps an active slide on its poster, with the play mark, until
 * the first tap: the compact preview uses it so no video (and no provider
 * SDK) loads before someone asks for it.
 */

import { forwardRef, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { posterOf } from '../format';
import { providerFor } from '../providers';
import { ReelIcon } from '../ReelIcon';
import { LinkStack } from './LinkStack';

/* The paused mark: the tile's play disc, larger. */
const BigPlay = () => (
	<span className="prs-play prs-play--lg" aria-hidden="true">
		<ReelIcon name="play" size={ 26 } fill="currentColor" />
	</span>
);

export const PlayerSlide = forwardRef(
	(
		{
			slot,
			active,
			standby = false,
			styles,
			muted,
			playing,
			products,
			services,
			onToast,
			onToggle,
			onTime,
			onPlayState,
			onEnded,
			onReady,
			onOpenProduct,
			hideProducts = false,
		},
		providerRef
	) => {
		const down = useRef( null );
		const { reel, file, fileIndex, fileCount } = slot;
		const poster = posterOf( reel ) || ( file && file.poster_url ) || '';
		const Provider = file ? providerFor( file ) : null;
		const live = active && ! standby && !! Provider;
		// Product links only mean something with WooCommerce there to sell them.
		// While the product panel is docked beside the stage, it is the
		// products; the slide keeps only the custom links.
		const links = ( reel.links || [] ).filter(
			( link ) =>
				link.btn_type !== 'product' ||
				( services.hasWoo && ! hideProducts )
		);
		const showLinks =
			styles.playerAppearance === 'overlay' && links.length > 0;
		const showTitle =
			( styles.playerAppearance === 'title' && !! reel.title ) ||
			( styles.playerAppearance === 'overlay' &&
				! showLinks &&
				styles.showPlayerFallbackTitle &&
				!! reel.title );

		const onPointerDown = ( event ) => {
			down.current = { x: event.clientX, y: event.clientY };
		};

		const onClick = ( event ) => {
			const start = down.current;

			down.current = null;

			if (
				start &&
				( Math.abs( event.clientX - start.x ) > 8 ||
					Math.abs( event.clientY - start.y ) > 8 )
			) {
				return;
			}

			onToggle();
		};

		return (
			<div
				className={ `prs-player__slide${ active ? ' is-active' : '' }` }
				aria-hidden={ active ? undefined : 'true' }
				// A neighbour is only a preview of the next step: nothing in it
				// (its buttons, its product card) can be reached until it is
				// the reel in front.
				inert={ active ? undefined : '' }
			>
				<div className="prs-player__media">
					{ live && (
						<Provider
							ref={ providerRef }
							file={ file }
							poster={ poster }
							muted={ muted }
							loop={ styles.loop }
							onTime={ onTime }
							onPlayState={ onPlayState }
							onEnded={ onEnded }
							onReady={ onReady }
						/>
					) }
					{ ! live && poster && (
						<img
							className="prs-player__poster"
							src={ poster }
							alt=""
							decoding="async"
						/>
					) }
					{ ! live && ! poster && (
						<span
							className="prs-player__poster prs-player__poster--blank"
							aria-hidden="true"
						/>
					) }
				</div>

				{ active && (
					<button
						type="button"
						className="prs-player__tap"
						aria-label={
							playing && ! standby
								? __( 'Pause', 'productreels' )
								: __( 'Play', 'productreels' )
						}
						onPointerDown={ onPointerDown }
						onClick={ onClick }
					>
						{ ( standby || ! playing ) && file && <BigPlay /> }
					</button>
				) }

				{ fileCount > 1 && (
					<div className="prs-player__dots" aria-hidden="true">
						{ Array.from( { length: fileCount } ).map(
							( _, index ) => (
								<span
									key={ index }
									className={ `prs-player__dot${
										index === fileIndex ? ' is-on' : ''
									}` }
								/>
							)
						) }
					</div>
				) }

				{ ( showTitle || showLinks ) && (
					<div className="prs-player__foot">
						{ showTitle && (
							<p className="prs-player__title pr-t-body-strong">
								{ reel.title }
							</p>
						) }
						{ showLinks && (
							<LinkStack
								reel={ reel }
								links={ links }
								styles={ styles }
								products={ products }
								services={ services }
								onToast={ onToast }
								onOpenProduct={ onOpenProduct }
							/>
						) }
					</div>
				) }
			</div>
		);
	}
);
