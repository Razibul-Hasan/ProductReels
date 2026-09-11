/**
 * A plain <video>, behind the provider interface.
 *
 * playsInline and its WebKit-prefixed twin keep iOS from hijacking playback
 * into its own fullscreen player, which would tear the visitor out of the
 * reel UI the moment they tapped play.
 */

import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
} from '@wordpress/element';

export const NativeVideo = forwardRef(
	(
		{
			file,
			poster,
			muted,
			loop,
			onTime,
			onPlayState,
			onEnded,
			onReady,
			tracks = [],
		},
		ref
	) => {
		const video = useRef( null );

		useImperativeHandle(
			ref,
			() => ( {
				play: () =>
					video.current
						? video.current.play()
						: Promise.reject( new Error( 'no video' ) ),
				pause: () => video.current && video.current.pause(),
				seek: ( seconds ) => {
					if ( video.current ) {
						video.current.currentTime = seconds;
					}
				},
				setVolume: ( level ) => {
					if ( video.current ) {
						video.current.volume = Math.min(
							1,
							Math.max( 0, level )
						);
					}
				},
				setMuted: ( value ) => {
					if ( video.current ) {
						video.current.muted = value;
					}
				},
				getDuration: () =>
					video.current && Number.isFinite( video.current.duration )
						? video.current.duration
						: 0,
				getCurrentTime: () =>
					video.current ? video.current.currentTime : 0,
			} ),
			[]
		);

		// React does not reliably reflect `muted` as an attribute; the property
		// is what the autoplay policy actually looks at.
		useEffect( () => {
			if ( video.current ) {
				video.current.muted = muted;
			}
		}, [ muted ] );

		// The WebKit-prefixed twin of playsInline, for older iOS. React has no
		// prop for it, so it is set on the node directly.
		useEffect( () => {
			if ( video.current ) {
				video.current.setAttribute( 'webkit-playsinline', 'true' );
			}
		}, [] );

		useEffect( () => {
			const node = video.current;

			if ( ! node ) {
				return undefined;
			}

			const time = () =>
				onTime(
					node.currentTime,
					Number.isFinite( node.duration ) ? node.duration : 0
				);
			const playing = () => onPlayState( true );
			const paused = () => onPlayState( false );
			const ready = () => {
				onReady();
				time();
			};

			node.addEventListener( 'timeupdate', time );
			node.addEventListener( 'durationchange', time );
			node.addEventListener( 'loadedmetadata', ready );
			node.addEventListener( 'play', playing );
			node.addEventListener( 'playing', playing );
			node.addEventListener( 'pause', paused );
			node.addEventListener( 'ended', onEnded );

			if ( node.readyState >= 1 ) {
				ready();
			}

			return () => {
				node.removeEventListener( 'timeupdate', time );
				node.removeEventListener( 'durationchange', time );
				node.removeEventListener( 'loadedmetadata', ready );
				node.removeEventListener( 'play', playing );
				node.removeEventListener( 'playing', playing );
				node.removeEventListener( 'pause', paused );
				node.removeEventListener( 'ended', onEnded );
			};
		}, [ onTime, onPlayState, onEnded, onReady, file.url ] );

		return (
			<video
				ref={ video }
				className="wr-player__video"
				src={ file.url }
				poster={ poster || undefined }
				loop={ loop }
				muted={ muted }
				playsInline
				preload="metadata"
				crossOrigin={ tracks.length ? 'anonymous' : undefined }
			>
				{ tracks.map( ( track ) => (
					<track
						key={ track.src }
						kind={ track.kind || 'captions' }
						src={ track.src }
						srcLang={ track.lang }
						label={ track.label }
						default={ track.default }
					/>
				) ) }
			</video>
		);
	}
);
