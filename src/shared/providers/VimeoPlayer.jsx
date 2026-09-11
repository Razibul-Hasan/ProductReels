/**
 * Vimeo, behind the provider interface.
 *
 * The Player SDK is fetched the first time a Vimeo reel is actually opened —
 * never on page load — and with `dnt=1` so Vimeo does not track the visitor
 * on the store's behalf.
 */

import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from '@wordpress/element';
import { loadScript } from './loadScript';

const SDK = 'https://player.vimeo.com/api/player.js';

const hasSdk = () =>
	typeof window.Vimeo !== 'undefined' &&
	typeof window.Vimeo.Player === 'function';

export const VimeoPlayer = forwardRef(
	( { file, muted, loop, onTime, onPlayState, onEnded, onReady }, ref ) => {
		const mount = useRef( null );
		const player = useRef( null );
		const [ failed, setFailed ] = useState( false );

		useImperativeHandle(
			ref,
			() => ( {
				play: () =>
					player.current
						? player.current.play()
						: Promise.reject( new Error( 'not ready' ) ),
				pause: () =>
					player.current && player.current.pause().catch( () => {} ),
				seek: ( seconds ) =>
					player.current &&
					player.current.setCurrentTime( seconds ).catch( () => {} ),
				setVolume: ( level ) =>
					player.current &&
					player.current.setVolume( level ).catch( () => {} ),
				setMuted: ( value ) =>
					player.current &&
					player.current.setMuted( value ).catch( () => {} ),
				getDuration: () => player.current?.__duration || 0,
				getCurrentTime: () => player.current?.__time || 0,
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

					const instance = new window.Vimeo.Player( mount.current, {
						id: Number( file.provider_id ),
						dnt: true,
						controls: false,
						autopause: false,
						playsinline: true,
						muted,
						loop,
						title: false,
						byline: false,
						portrait: false,
						responsive: false,
						width: 1080,
						height: 1920,
					} );

					instance.__duration = 0;
					instance.__time = 0;

					instance.on( 'loaded', () => {
						instance.getDuration().then( ( duration ) => {
							instance.__duration = duration;
							onReady();
							onTime( 0, duration );
						} );
					} );
					instance.on( 'timeupdate', ( data ) => {
						instance.__time = data.seconds;
						instance.__duration = data.duration;
						onTime( data.seconds, data.duration );
					} );
					instance.on( 'play', () => onPlayState( true ) );
					instance.on( 'pause', () => onPlayState( false ) );
					instance.on( 'ended', onEnded );

					player.current = instance;
				} )
				.catch( () => {
					if ( ! cancelled ) {
						setFailed( true );
					}
				} );

			return () => {
				cancelled = true;

				if ( player.current ) {
					player.current.destroy().catch( () => {} );
					player.current = null;
				}
			};
			// The instance is bound to one video; a new file means a new instance.
		}, [ file.provider_id ] ); // eslint-disable-line react-hooks/exhaustive-deps

		useEffect( () => {
			if ( player.current ) {
				player.current.setMuted( muted ).catch( () => {} );
			}
		}, [ muted ] );

		useEffect( () => {
			if ( player.current ) {
				player.current.setLoop( loop ).catch( () => {} );
			}
		}, [ loop ] );

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
				className="wr-player__frame wr-player__frame--vimeo"
			/>
		);
	}
);
