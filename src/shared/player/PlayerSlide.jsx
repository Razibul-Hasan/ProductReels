/**
 * One reel inside the player.
 *
 * Only the active slide owns a provider; its neighbours show their poster so
 * a swipe reveals what is coming without three videos buffering at once.
 * The tap layer that toggles playback ignores a click that travelled, so the
 * end of a swipe never pauses the reel it just arrived on.
 */

import { forwardRef, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { posterOf } from '../format';
import { providerFor } from '../providers';
import { LinkStack } from './LinkStack';

const BigPlay = () => (
	<span className="wr-player__bigplay" aria-hidden="true">
		<svg viewBox="0 0 48 48" width="64" height="64" fill="none">
			<circle
				cx="24"
				cy="24"
				r="23"
				fill="rgb(0 0 0 / .35)"
				stroke="#fff"
				strokeWidth="1.5"
			/>
			<path d="M19 15.5v17L34 24l-15-8.5Z" fill="#fff" />
		</svg>
	</span>
);

export const PlayerSlide = forwardRef(
	(
		{
			slot,
			active,
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
		},
		providerRef
	) => {
		const down = useRef( null );
		const { reel, file, fileIndex, fileCount } = slot;
		const poster = posterOf( reel ) || ( file && file.poster_url ) || '';
		const Provider = file ? providerFor( file ) : null;
		// Product links only mean something with WooCommerce there to sell them.
		const links = ( reel.links || [] ).filter(
			( link ) => link.btn_type !== 'product' || services.hasWoo
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
				className={ `wr-player__slide${ active ? ' is-active' : '' }` }
				aria-hidden={ active ? undefined : 'true' }
			>
				<div className="wr-player__media">
					{ active && Provider && (
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
					{ ! ( active && Provider ) && poster && (
						<img
							className="wr-player__poster"
							src={ poster }
							alt=""
							decoding="async"
						/>
					) }
					{ ! ( active && Provider ) && ! poster && (
						<span
							className="wr-player__poster wr-player__poster--blank"
							aria-hidden="true"
						/>
					) }
				</div>

				{ active && (
					<button
						type="button"
						className="wr-player__tap"
						aria-label={
							playing
								? __( 'Pause', 'wooreels' )
								: __( 'Play', 'wooreels' )
						}
						onPointerDown={ onPointerDown }
						onClick={ onClick }
					>
						{ ! playing && file && <BigPlay /> }
					</button>
				) }

				{ fileCount > 1 && (
					<div className="wr-player__dots" aria-hidden="true">
						{ Array.from( { length: fileCount } ).map(
							( _, index ) => (
								<span
									key={ index }
									className={ `wr-player__dot${
										index === fileIndex ? ' is-on' : ''
									}` }
								/>
							)
						) }
					</div>
				) }

				{ ( showTitle || showLinks ) && (
					<div className="wr-player__foot">
						{ showTitle && (
							<p className="wr-player__title">{ reel.title }</p>
						) }
						{ showLinks && (
							<LinkStack
								reel={ reel }
								links={ links }
								styles={ styles }
								products={ products }
								services={ services }
								onToast={ onToast }
							/>
						) }
					</div>
				) }
			</div>
		);
	}
);
