/**
 * YouTube, behind the provider interface.
 *
 * The IFrame API is loaded lazily, the first time a YouTube reel is opened.
 * YouTube offers no timeupdate event, so the clock is polled while playing —
 * four times a second is enough for a seekbar and costs nothing while paused.
 */

import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from '@wordpress/element';
import { loadScript } from './loadScript';

const SDK = 'https://www.youtube.com/iframe_api';

const hasSdk = () =>
	typeof window.YT !== 'undefined' && typeof window.YT.Player === 'function';

export const YouTubePlayer = forwardRef(
	( { file, muted, loop, onTime, onPlayState, onEnded, onReady }, ref ) => {
		const mount = useRef( null );
		const player = useRef( null );
		const ticker = useRef( 0 );
		const [ failed, setFailed ] = useState( false );

		const stopTicking = () => {
			if ( ticker.current ) {
				clearInterval( ticker.current );
				ticker.current = 0;
			}
		};

		const startTicking = () => {
			stopTicking();
			ticker.current = setInterval( () => {
				const yt = player.current;

				if ( yt && typeof yt.getCurrentTime === 'function' ) {
					onTime( yt.getCurrentTime(), yt.getDuration() );
				}
			}, 250 );
		};

		useImperativeHandle(
			ref,
			() => ( {
				play: () => {
					if (
						! player.current ||
						typeof player.current.playVideo !== 'function'
					) {
						return Promise.reject( new Error( 'not ready' ) );
					}

					player.current.playVideo();

					return Promise.resolve();
				},
				pause: () =>
					player.current &&
					player.current.pauseVideo &&
					player.current.pauseVideo(),
				seek: ( seconds ) =>
					player.current &&
					player.current.seekTo &&
					player.current.seekTo( seconds, true ),
				setVolume: ( level ) =>
					player.current &&
					player.current.setVolume &&
					player.current.setVolume( Math.round( level * 100 ) ),
				setMuted: ( value ) => {
					if ( ! player.current || ! player.current.mute ) {
						return;
					}

					if ( value ) {
						player.current.mute();
					} else {
						player.current.unMute();
					}
				},
				getDuration: () =>
					player.current && player.current.getDuration
						? player.current.getDuration()
						: 0,
				getCurrentTime: () =>
					player.current && player.current.getCurrentTime
						? player.current.getCurrentTime()
						: 0,
			} ),
			[]
		);

		useEffect( () => {
			let cancelled = false;

			loadScript( SDK, hasSdk )
				.then( () => {
					if ( cancelled || ! mount.current ) {
						return;
					}

					// The API replaces the mount node with its iframe; give it a child.
					const target = document.createElement( 'div' );

					mount.current.appendChild( target );

					player.current = new window.YT.Player( target, {
						videoId: file.provider_id,
						width: '100%',
						height: '100%',
						playerVars: {
							playsinline: 1,
							rel: 0,
							modestbranding: 1,
							controls: 0,
							disablekb: 1,
							fs: 0,
							iv_load_policy: 3,
							loop: loop ? 1 : 0,
							playlist: loop ? file.provider_id : undefined,
							origin: window.location.origin,
						},
						events: {
							onReady: ( event ) => {
								if ( muted ) {
									event.target.mute();
								} else {
									event.target.unMute();
								}

								onReady();
								onTime( 0, event.target.getDuration() );
							},
							onStateChange: ( event ) => {
								const state = event.data;

								if ( state === window.YT.PlayerState.PLAYING ) {
									onPlayState( true );
									startTicking();
								} else if (
									state === window.YT.PlayerState.PAUSED
								) {
									onPlayState( false );
									stopTicking();
								} else if (
									state === window.YT.PlayerState.ENDED
								) {
									onPlayState( false );
									stopTicking();
									onEnded();
								}
							},
							onError: () => {
								if ( ! cancelled ) {
									setFailed( true );
								}
							},
						},
					} );
				} )
				.catch( () => {
					if ( ! cancelled ) {
						setFailed( true );
					}
				} );

			return () => {
				cancelled = true;
				stopTicking();

				if (
					player.current &&
					typeof player.current.destroy === 'function'
				) {
					player.current.destroy();
				}

				player.current = null;
			};
		}, [ file.provider_id ] ); // eslint-disable-line react-hooks/exhaustive-deps

		useEffect( () => {
			const yt = player.current;

			if ( ! yt || typeof yt.mute !== 'function' ) {
				return;
			}

			if ( muted ) {
				yt.mute();
			} else {
				yt.unMute();
			}
		}, [ muted ] );

		if ( failed ) {
			return (
				<a
					className="wr-player__fallback"
					href={ file.url }
					target="_blank"
					rel="noopener noreferrer"
				>
					{ file.url }
				</a>
			);
		}

		return (
			<div
				ref={ mount }
				className="wr-player__frame wr-player__frame--youtube"
			/>
		);
	}
);
