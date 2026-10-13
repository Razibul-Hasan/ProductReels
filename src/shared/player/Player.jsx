/**
 * The fullscreen player: the design's ReelPlayer, in a PlayerTheater room.
 *
 * Rendered through a portal into `.wr-portal-root` on <body>, so no theme's
 * overflow:hidden or stacking context can clip it. It is a dialog in every
 * sense: modal to assistive technology, focus trapped inside and returned on
 * close, Escape closes, the page behind it cannot scroll, and on a phone the
 * back button closes it instead of leaving the page.
 *
 * On a phone the reel is the whole screen. On a wider screen it is a theatre:
 * the current reel centred on the studio colour, its neighbours dimmed on
 * either side, the previous / next buttons between them, the position ("2 of
 * 6") and the close button in the room's top corners.
 *
 * Reels are flattened into slots — one per file — and the stage carries the
 * current slot with its two neighbours, so a swipe reveals what is next
 * before the step commits. Only the active slot owns a provider.
 */

import {
	createPortal,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { formatClock, posterOf, slotsFor, viewCount } from '../format';
import { useKeyboardNav } from '../hooks/useKeyboardNav';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useSwipe } from '../hooks/useSwipe';
import { useWheelNav } from '../hooks/useWheelNav';
import { claimPlayback } from '../playback';
import { useProducts } from '../products';
import { ReelIcon } from '../ReelIcon';
import { withDefaults } from '../services';
import { playerVars } from '../styleVars';
import { PlayerNav } from './PlayerNav';
import { PlayerSlide } from './PlayerSlide';
import { Seekbar } from './Seekbar';
import { VolumeControl } from './VolumeControl';

const FOCUSABLE =
	'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

const TOAST_MS = 4000;
const STEP_MS = 360;
/* How long the closing animation runs before the player unmounts. */
const EXIT_MS = 240;
/* The opening choreography — stage, chrome, foot — is over by then. */
const OPEN_MS = 1000;

/**
 * The one node every player on the page renders into. It sits outside every
 * widget root, so it carries `prs` itself for the design tokens to resolve.
 */
const portalRoot = () => {
	let node = document.querySelector( '.wr-portal-root' );

	if ( ! node ) {
		node = document.createElement( 'div' );
		node.className = 'wr-portal-root prs';
		document.body.appendChild( node );
	}

	return node;
};

/* A neighbour, dimmed beside the stage in the theatre: its poster only. */
const Peek = ( { slot } ) => {
	const poster = slot
		? posterOf( slot.reel ) || ( slot.file && slot.file.poster_url ) || ''
		: '';

	return (
		<div className="prs-room__peek" aria-hidden="true">
			{ poster && <img src={ poster } alt="" decoding="async" /> }
		</div>
	);
};

export const Player = ( {
	widget,
	styles,
	startReel = 0,
	onClose,
	services: given,
	returnFocusTo,
} ) => {
	const services = useMemo( () => withDefaults( given ), [ given ] );
	const slots = useMemo( () => slotsFor( widget.reels ), [ widget.reels ] );
	const count = slots.length;
	const many = count > 1;
	const horizontal = styles.slideDirection !== 'vertical';
	const rtl = document.documentElement.dir === 'rtl';

	const [ cursor, setCursor ] = useState( () => {
		const index = slots.findIndex(
			( slot ) => slot.reelIndex === startReel
		);

		return index < 0 ? 0 : index;
	} );
	const [ shift, setShift ] = useState( 0 );
	const [ snap, setSnap ] = useState( false );
	const [ playing, setPlaying ] = useState( false );
	const [ muted, setMuted ] = useState( ! styles.playWithSound );
	const [ volume, setVolume ] = useState( 1 );
	const [ time, setTime ] = useState( 0 );
	const [ duration, setDuration ] = useState( 0 );
	const [ soundTap, setSoundTap ] = useState( false );
	const [ toast, setToast ] = useState( null );
	// `opening` gates the entrance of things that live inside the slides,
	// which remount on every step; `closing` plays the exit before unmount.
	const [ opening, setOpening ] = useState( true );
	const [ closing, setClosing ] = useState( false );

	const root = useRef( null );
	const stage = useRef( null );
	const provider = useRef( null );
	const mutedRef = useRef( muted );
	const closed = useRef( false );
	const popped = useRef( false );
	const releaseClaim = useRef( null );
	const stepTimer = useRef( 0 );
	const exitTimer = useRef( 0 );

	const mobile = useMediaQuery( '(max-width: 782px)' );
	const reduced = useReducedMotion();

	const wrap = useCallback(
		( index ) => ( ( index % count ) + count ) % count,
		[ count ]
	);
	const current = slots[ cursor ];
	const prevSlot = many ? slots[ wrap( cursor - 1 ) ] : null;
	const nextSlot = many ? slots[ wrap( cursor + 1 ) ] : null;

	mutedRef.current = muted;

	/* ------------------------------------------------------------ closing */

	// The exit is a fade, not a cut: the stage settles back and the room
	// lights up, then the player unmounts. Playback stops at once, so the
	// sound never outlives the picture.
	const requestClose = useCallback( () => {
		if ( closed.current ) {
			return;
		}

		closed.current = true;

		if ( provider.current ) {
			try {
				provider.current.pause();
			} catch ( error ) {
				// Already torn down.
			}
		}

		if ( reduced ) {
			onClose();

			return;
		}

		setClosing( true );
		exitTimer.current = setTimeout( onClose, EXIT_MS );
	}, [ onClose, reduced ] );

	useEffect( () => () => clearTimeout( exitTimer.current ), [] );

	useEffect( () => {
		const timer = setTimeout( () => setOpening( false ), OPEN_MS );

		return () => clearTimeout( timer );
	}, [] );

	/* ---------------------------------------------------------- stepping */

	const commitStep = useCallback(
		( direction ) => {
			setCursor( ( value ) => wrap( value + direction ) );
			setShift( 0 );
			setSnap( true );
			setTime( 0 );
			setDuration( 0 );
			setPlaying( false );
		},
		[ wrap ]
	);

	const step = useCallback(
		( direction ) => {
			if ( ! many ) {
				return;
			}

			if ( reduced ) {
				commitStep( direction );

				return;
			}

			setShift( ( value ) => ( value !== 0 ? value : direction ) );
		},
		[ many, reduced, commitStep ]
	);

	// The step commits on transitionend, with a timer as a safety net for a
	// background tab where transitions do not run.
	useEffect( () => {
		if ( shift === 0 ) {
			return undefined;
		}

		stepTimer.current = setTimeout(
			() => commitStep( shift ),
			STEP_MS + 80
		);

		return () => clearTimeout( stepTimer.current );
	}, [ shift, commitStep ] );

	useEffect( () => {
		if ( ! snap ) {
			return undefined;
		}

		const frame = window.requestAnimationFrame( () => setSnap( false ) );

		return () => window.cancelAnimationFrame( frame );
	}, [ snap ] );

	const onTransitionEnd = ( event ) => {
		if (
			event.target !== event.currentTarget ||
			event.propertyName !== 'transform' ||
			shift === 0
		) {
			return;
		}

		clearTimeout( stepTimer.current );
		commitStep( shift );
	};

	/* ---------------------------------------------------------- playback */

	const play = useCallback( () => {
		const instance = provider.current;

		if ( ! instance ) {
			return;
		}

		releaseClaim.current = claimPlayback( () => instance.pause() );

		instance
			.play()
			.then( () => {
				if ( ! mutedRef.current ) {
					setSoundTap( false );
				}
			} )
			.catch( () => {
				// Unmuted autoplay was refused: fall back to muted playback and
				// offer sound on the first gesture.
				if ( mutedRef.current ) {
					return;
				}

				setMuted( true );
				setSoundTap( true );
				instance.setMuted( true );
				instance.play().catch( () => {} );
			} );
	}, [] );

	const pause = useCallback( () => {
		if ( provider.current ) {
			provider.current.pause();
		}
	}, [] );

	const toggle = useCallback( () => {
		if ( soundTap ) {
			// The first tap after a muted fallback asks for sound, not a pause.
			setSoundTap( false );
			setMuted( false );

			if ( provider.current ) {
				provider.current.setMuted( false );
			}

			return;
		}

		if ( playing ) {
			pause();
		} else {
			play();
		}
	}, [ soundTap, playing, play, pause ] );

	const toggleMute = useCallback( () => {
		const next = ! mutedRef.current;

		setMuted( next );
		setSoundTap( false );

		if ( provider.current ) {
			provider.current.setMuted( next );
		}
	}, [] );

	const changeVolume = useCallback( ( level ) => {
		setVolume( level );

		if ( provider.current ) {
			provider.current.setVolume( level );
			provider.current.setMuted( level === 0 );
		}

		setMuted( level === 0 );
	}, [] );

	const seek = useCallback( ( seconds ) => {
		setTime( seconds );

		if ( provider.current ) {
			provider.current.seek( seconds );
		}
	}, [] );

	const onTime = useCallback( ( seconds, total ) => {
		setTime( seconds );
		setDuration( total );
	}, [] );

	const onPlayState = useCallback( ( value ) => setPlaying( value ), [] );

	const onReady = useCallback( () => {
		if ( provider.current ) {
			provider.current.setVolume( volume );
			provider.current.setMuted( mutedRef.current );
		}

		play();
	}, [ play, volume ] );

	const onEnded = useCallback( () => {
		setPlaying( false );

		if ( ! styles.loop && many ) {
			step( 1 );
		}
	}, [ styles.loop, many, step ] );

	/* ----------------------------------------------------------- tracking */

	useEffect( () => {
		if ( ! playing || ! current ) {
			return undefined;
		}

		// A view is a second of actual playback, not an open.
		const timer = setTimeout(
			() => services.trackView( widget.id, current.reel ),
			1000
		);

		return () => clearTimeout( timer );
	}, [ playing, current, services, widget.id ] );

	/* ----------------------------------------------------------- products */

	const products = useProducts( widget.reels, services );

	/* ------------------------------------------------------------- toast */

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

	/* ---------------------------------------------- dialog housekeeping */

	// Body scroll lock that restores the exact scroll position on close.
	//
	// Nothing on the page may move while it is locked, or the lock shows as
	// a blink on open and again on close. Two things would move it:
	//
	// - Locking takes the scrollbar with it, and the page would reflow into
	//   the width it freed — centred content shifting half a scrollbar
	//   sideways. The body is padded by the scrollbar's width instead.
	// - A fixed body is placed from the viewport, not from <html>, so any
	//   margin on <html> — the admin bar's 32px for a logged-in visitor —
	//   would drop out and the page would jump up by that much. The body is
	//   pinned where it is measured on screen, not at a computed -scrollY.
	useEffect( () => {
		const body = document.body;
		const html = document.documentElement;
		const scrollY = window.scrollY;
		const gap = window.innerWidth - html.clientWidth;
		const bodyStyle = window.getComputedStyle( body );
		// `top` places the margin edge; the measured box is the border edge.
		const top =
			body.getBoundingClientRect().top -
			( parseFloat( bodyStyle.marginTop ) || 0 );
		const previous = {
			position: body.style.position,
			top: body.style.top,
			left: body.style.left,
			right: body.style.right,
			overflow: body.style.overflow,
			paddingRight: body.style.paddingRight,
			scrollBehavior: html.style.scrollBehavior,
		};

		if ( gap > 0 ) {
			const padding = parseFloat( bodyStyle.paddingRight ) || 0;

			body.style.paddingRight = `${ padding + gap }px`;
		}

		body.style.position = 'fixed';
		body.style.top = `${ top }px`;
		// Pinned to both edges rather than given a width: a fixed box would
		// otherwise shrink to its content, and `width: 100%` would put the
		// padding outside the viewport instead of inside the content box.
		body.style.left = '0';
		body.style.right = '0';
		body.style.overflow = 'hidden';
		body.classList.add( 'wr-player-open' );

		return () => {
			// A theme's smooth scrolling would turn the restore into a visible
			// scroll from the top; it is switched off for the one jump.
			html.style.scrollBehavior = 'auto';
			body.style.position = previous.position;
			body.style.top = previous.top;
			body.style.left = previous.left;
			body.style.right = previous.right;
			body.style.overflow = previous.overflow;
			body.style.paddingRight = previous.paddingRight;
			body.classList.remove( 'wr-player-open' );
			window.scrollTo( 0, scrollY );
			html.style.scrollBehavior = previous.scrollBehavior;
		};
	}, [] );

	// A history entry, so a phone's back button closes the player.
	useEffect( () => {
		const marker = { productreelsPlayer: widget.id };

		window.history.pushState( marker, '' );

		const onPop = () => {
			popped.current = true;
			requestClose();
		};

		window.addEventListener( 'popstate', onPop );

		return () => {
			window.removeEventListener( 'popstate', onPop );

			if (
				! popped.current &&
				window.history.state &&
				window.history.state.productreelsPlayer === widget.id
			) {
				window.history.back();
			}
		};
	}, [ widget.id, requestClose ] );

	// Focus in on open, trapped while open, back to the thumbnail on close.
	useEffect( () => {
		const node = root.current;
		const first = node ? node.querySelector( '.wr-player__close' ) : null;

		if ( first ) {
			first.focus();
		}

		const onKeyDown = ( event ) => {
			if ( event.key !== 'Tab' || ! node ) {
				return;
			}

			const active = node.ownerDocument.activeElement;
			// Only what Tab can really reach: not a picture link taken out of
			// the order, nothing in a neighbouring (inert) slide, nothing hidden.
			const items = Array.from(
				node.querySelectorAll( FOCUSABLE )
			).filter(
				( item ) =>
					item.getAttribute( 'tabindex' ) !== '-1' &&
					! item.closest( '[inert]' ) &&
					( item.offsetParent !== null || item === active )
			);

			if ( items.length === 0 ) {
				return;
			}

			const edge = event.shiftKey
				? items[ 0 ]
				: items[ items.length - 1 ];

			if ( active === edge || ! node.contains( active ) ) {
				event.preventDefault();
				( event.shiftKey
					? items[ items.length - 1 ]
					: items[ 0 ]
				).focus();
			}
		};

		document.addEventListener( 'keydown', onKeyDown );

		return () => {
			document.removeEventListener( 'keydown', onKeyDown );

			if ( releaseClaim.current ) {
				releaseClaim.current();
			}

			if ( returnFocusTo && typeof returnFocusTo.focus === 'function' ) {
				returnFocusTo.focus();
			}
		};
	}, [ returnFocusTo ] );

	useKeyboardNav( {
		direction: horizontal ? 'horizontal' : 'vertical',
		onStep: step,
		onToggle: toggle,
		onMute: toggleMute,
		onClose: requestClose,
	} );

	useWheelNav( stage, step, many );

	const swipe = useSwipe( {
		axis: horizontal ? 'x' : 'y',
		onStep: step,
		enabled: shift === 0,
	} );

	/* --------------------------------------------------- click outside */

	const backdropDown = useRef( false );

	const onBackdropPointerDown = ( event ) => {
		backdropDown.current = event.target === event.currentTarget;
	};

	const onBackdropClick = ( event ) => {
		if ( backdropDown.current && event.target === event.currentTarget ) {
			requestClose();
		}

		backdropDown.current = false;
	};

	/* ------------------------------------------------------------ render */

	const dragOffset = swipe.rubber( swipe.offset, ! many );
	const base =
		( horizontal && rtl ? 1 : -1 ) * 100 * ( many ? 1 + shift : 0 );
	const transform = horizontal
		? `translate3d(calc(${ base }% + ${ dragOffset }px), 0, 0)`
		: `translate3d(0, calc(${ base }% + ${ dragOffset }px), 0)`;

	const slideProps = {
		styles,
		muted,
		playing,
		products,
		services,
		onToast: showToast,
		onToggle: toggle,
		onTime,
		onPlayState,
		onEnded,
		onReady,
	};

	const label = current
		? sprintf(
				/* translators: %s: reel title. */
				__( 'Reel player: %s', 'productreels' ),
				current.reel.title || widget.name || ''
			)
		: __( 'Reel player', 'productreels' );

	const hasFile = !! ( current && current.file );
	const showBar = hasFile && styles.showSeekbar;
	// The theatre's neighbours only make sense beside a sideways step.
	const theatre = ! mobile && horizontal && many;
	const position = many
		? sprintf(
				/* translators: 1: the reel's position, 2: how many reels there are. */
				__( '%1$d of %2$d', 'productreels' ),
				current.reelIndex + 1,
				widget.reels.length
			)
		: '';

	const close = (
		<button
			type="button"
			className={ `${
				mobile ? 'prs-iconbtn' : 'prs-navbtn prs-room__close'
			} wr-player__close` }
			aria-label={ __( 'Close player', 'productreels' ) }
			onClick={ requestClose }
		>
			<ReelIcon name="x" size={ mobile ? 18 : 20 } />
		</button>
	);

	const nav = ( which ) =>
		! mobile &&
		many && (
			<PlayerNav
				direction={ horizontal ? 'horizontal' : 'vertical' }
				which={ which }
				onClick={ () => step( which === 'prev' ? -1 : 1 ) }
			/>
		);

	return createPortal(
		<div
			ref={ root }
			className={ [
				'prs-room',
				'wr-player',
				horizontal ? 'is-horizontal' : 'is-vertical',
				mobile ? 'is-mobile' : '',
				theatre ? 'is-theatre' : '',
				current && current.fileCount > 1 ? 'has-files' : '',
				showBar ? '' : 'no-bar',
				swipe.dragging ? 'is-dragging' : '',
				snap || reduced ? 'is-snap' : '',
				opening ? 'is-opening' : '',
				closing ? 'is-closing' : '',
			]
				.filter( Boolean )
				.join( ' ' ) }
			style={ playerVars( styles ) }
			role="dialog"
			aria-modal="true"
			aria-label={ label }
		>
			<div
				className="prs-room__backdrop"
				aria-hidden="true"
				onPointerDown={ onBackdropPointerDown }
				onClick={ onBackdropClick }
			/>

			{ /* The position is spoken on every step; a phone has no room
			     for it on screen, so there it is for assistive technology only. */ }
			{ many && (
				<span
					className={
						mobile ? 'pr-sr' : 'prs-room__count pr-t-label'
					}
					aria-live="polite"
				>
					{ position }
				</span>
			) }

			{ ! mobile && close }

			<div className="prs-room__layout">
				{ theatre && <Peek slot={ prevSlot } /> }
				{ nav( 'prev' ) }

				<div
					ref={ stage }
					className="prs-player prs-room__stage"
					{ ...swipe.handlers }
				>
					<div
						className="prs-player__track"
						style={ { transform } }
						onTransitionEnd={ onTransitionEnd }
					>
						{ prevSlot && (
							<PlayerSlide
								key={ `p-${ wrap( cursor - 1 ) }` }
								slot={ prevSlot }
								active={ false }
								{ ...slideProps }
							/>
						) }
						<PlayerSlide
							key={ `c-${ cursor }` }
							ref={ provider }
							slot={ current }
							active
							{ ...slideProps }
						/>
						{ nextSlot && (
							<PlayerSlide
								key={ `n-${ wrap( cursor + 1 ) }` }
								slot={ nextSlot }
								active={ false }
								{ ...slideProps }
							/>
						) }
					</div>

					{ /* Views on the start side; sound (and, on a phone, close)
					     on the end side, within thumb reach. */ }
					<div className="prs-player__top" data-wr-no-swipe="">
						{ styles.showViews && current && (
							<span className="prs-views pr-t-caption">
								<ReelIcon name="eye" size={ 12 } />
								{ viewCount( current.reel.view_count ) }
							</span>
						) }

						<div className="prs-player__tools">
							{ hasFile && styles.showVolumeControl && (
								<VolumeControl
									muted={ muted }
									volume={ volume }
									onToggleMute={ toggleMute }
									onVolume={ changeVolume }
								/>
							) }
							{ mobile && close }
						</div>
					</div>

					{ soundTap && (
						<button
							type="button"
							className="prs-btn prs-btn--light prs-btn--sm pr-t-body-strong prs-player__sound"
							data-wr-no-swipe=""
							onClick={ toggle }
						>
							<ReelIcon name="volume" size={ 16 } />
							{ __( 'Tap for sound', 'productreels' ) }
						</button>
					) }

					{ showBar && (
						<div className="prs-player__bar" data-wr-no-swipe="">
							<Seekbar
								current={ time }
								duration={ duration }
								onSeek={ seek }
							/>
							{ mobile && (
								<span className="prs-player__time pr-t-caption">
									<span>{ formatClock( time ) }</span>
									<span>{ formatClock( duration ) }</span>
								</span>
							) }
						</div>
					) }
				</div>

				{ nav( 'next' ) }
				{ theatre && <Peek slot={ nextSlot } /> }
			</div>

			{ toast && (
				<div
					className={ `prs-toast prs-toast--${ toast.tone } pr-t-label` }
					role="status"
				>
					{ toast.message }
				</div>
			) }
		</div>,
		portalRoot()
	);
};
