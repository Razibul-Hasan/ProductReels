/**
 * The player, compact and inline: one reel on a 9:16 stage, in the page.
 *
 * Built from the same slide, seekbar and volume control as the fullscreen
 * player, so a tagged product shows its real card and a button its real
 * label, but none of the dialog around them: no portal, no scroll lock, no
 * history entry, no page-wide keys. The reel editor shows it beside the form
 * and hands it a fresh reel object on every change, so it updates live.
 *
 * It never starts by itself and never with sound: the poster and the play
 * mark show until someone presses play, and only then does a provider (a
 * <video>, or a YouTube or Vimeo SDK) load. A reel with several clips plays
 * them in turn. Links inside it do not navigate, so a click in the preview
 * can never take an unsaved edit away.
 */

import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { slotsFor } from '../format';
import { claimPlayback } from '../playback';
import { useProducts } from '../products';
import { withDefaults } from '../services';
import { styleVars } from '../styleVars';
import { PlayerSlide } from './PlayerSlide';
import { Seekbar } from './Seekbar';
import { VolumeControl } from './VolumeControl';

const TOAST_MS = 4000;

export const CompactPlayer = ( { reel, styles, services: given, label } ) => {
	const services = useMemo( () => withDefaults( given ), [ given ] );
	const reels = useMemo( () => [ reel ], [ reel ] );
	const slots = useMemo( () => slotsFor( reels ), [ reels ] );
	const count = slots.length;

	const [ cursor, setCursor ] = useState( 0 );
	const [ started, setStarted ] = useState( false );
	const [ playing, setPlaying ] = useState( false );
	const [ muted, setMuted ] = useState( true );
	const [ volume, setVolume ] = useState( 1 );
	const [ time, setTime ] = useState( 0 );
	const [ duration, setDuration ] = useState( 0 );
	const [ toast, setToast ] = useState( null );

	const provider = useRef( null );
	const mutedRef = useRef( muted );
	const releaseClaim = useRef( null );
	const advancing = useRef( false );

	mutedRef.current = muted;

	const current = slots[ Math.min( cursor, count - 1 ) ];
	const fileKey = current.file
		? current.file.file_uuid || current.file.url
		: '';

	// A different clip in front (reordered, removed, replaced) goes back to
	// its poster: the preview never plays something the form no longer says.
	// The next clip of a reel playing through starts by itself.
	useEffect( () => {
		setStarted( advancing.current );
		advancing.current = false;
		setPlaying( false );
		setTime( 0 );
		setDuration( 0 );
	}, [ fileKey ] );

	useEffect( () => {
		if ( cursor >= count ) {
			setCursor( 0 );
		}
	}, [ cursor, count ] );

	useEffect(
		() => () => {
			if ( releaseClaim.current ) {
				releaseClaim.current();
			}
		},
		[]
	);

	const play = useCallback( () => {
		const instance = provider.current;

		if ( ! instance ) {
			return;
		}

		releaseClaim.current = claimPlayback( () => instance.pause() );
		instance.play().catch( () => {} );
	}, [] );

	const toggle = useCallback( () => {
		if ( ! started ) {
			// The provider mounts now and plays once it is ready.
			setStarted( true );

			return;
		}

		if ( ! provider.current ) {
			return;
		}

		if ( playing ) {
			provider.current.pause();
		} else {
			play();
		}
	}, [ started, playing, play ] );

	const onReady = useCallback( () => {
		if ( provider.current ) {
			provider.current.setVolume( volume );
			provider.current.setMuted( mutedRef.current );
		}

		play();
	}, [ play, volume ] );

	const onTime = useCallback( ( seconds, total ) => {
		setTime( seconds );
		setDuration( total );
	}, [] );

	const onPlayState = useCallback( ( value ) => setPlaying( value ), [] );

	// One clip loops as the widget says; several play through in turn, since
	// the compact stage has no swipe to reach the next one.
	const onEnded = useCallback( () => {
		setPlaying( false );

		if ( count > 1 ) {
			advancing.current = true;
			setCursor( ( value ) => ( value + 1 ) % count );
		}
	}, [ count ] );

	const toggleMute = useCallback( () => {
		const next = ! mutedRef.current;

		setMuted( next );

		if ( provider.current ) {
			provider.current.setMuted( next );
		}
	}, [] );

	const changeVolume = useCallback( ( level ) => {
		setVolume( level );
		setMuted( level === 0 );

		if ( provider.current ) {
			provider.current.setVolume( level );
			provider.current.setMuted( level === 0 );
		}
	}, [] );

	const seek = useCallback( ( seconds ) => {
		setTime( seconds );

		if ( provider.current ) {
			provider.current.seek( seconds );
		}
	}, [] );

	const products = useProducts( reels, services );

	const showToast = useCallback(
		( tone, message ) => setToast( { tone, message, id: Date.now() } ),
		[]
	);

	useEffect( () => {
		if ( ! toast ) {
			return undefined;
		}

		const timer = setTimeout( () => setToast( null ), TOAST_MS );

		return () => clearTimeout( timer );
	}, [ toast ] );

	const hasFile = !! current.file;
	const showBar = hasFile && styles.showSeekbar;

	// The capture handler only stops link navigation; every control inside
	// keeps its own keyboard handling.
	return (
		<div
			className={ [
				'wr-player-compact',
				'prs',
				current.fileCount > 1 ? 'wr-player--files' : '',
				showBar ? '' : 'wr-player--no-bar',
			]
				.filter( Boolean )
				.join( ' ' ) }
			style={ styleVars( styles ) }
			role="group"
			aria-label={ label }
			onClickCapture={ ( event ) => {
				if ( event.target.closest?.( 'a[href]' ) ) {
					event.preventDefault();
				}
			} }
		>
			<div className="wr-player-compact__stage">
				<PlayerSlide
					key={ `${ cursor }-${ fileKey }` }
					ref={ provider }
					slot={ current }
					active
					standby={ ! started }
					styles={ { ...styles, loop: styles.loop && count < 2 } }
					muted={ muted }
					playing={ playing }
					products={ products }
					services={ services }
					onToast={ showToast }
					onToggle={ toggle }
					onTime={ onTime }
					onPlayState={ onPlayState }
					onEnded={ onEnded }
					onReady={ onReady }
				/>

				{ hasFile && styles.showVolumeControl && (
					<div className="wr-player__head">
						<div className="wr-player__tools">
							<VolumeControl
								muted={ muted }
								volume={ volume }
								onToggleMute={ toggleMute }
								onVolume={ changeVolume }
							/>
						</div>
					</div>
				) }

				{ showBar && (
					<div className="wr-player__bar">
						<Seekbar
							current={ time }
							duration={ duration }
							onSeek={ seek }
						/>
					</div>
				) }

				{ toast && (
					<div
						className={ `wr-player__toast wr-player__toast--${ toast.tone }` }
						role="status"
					>
						{ toast.message }
					</div>
				) }
			</div>
		</div>
	);
};
