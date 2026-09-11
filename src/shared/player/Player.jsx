/**
 * The fullscreen player.
 *
 * Rendered through a portal into `.wr-portal-root` on <body>, so no theme's
 * overflow:hidden or stacking context can clip it. It is a dialog in every
 * sense: modal to assistive technology, focus trapped inside and returned on
 * close, Escape closes, the page behind it cannot scroll, and on a phone the
 * back button closes it instead of leaving the page.
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
import { productIdsIn, slotsFor } from '../format';
import { useKeyboardNav } from '../hooks/useKeyboardNav';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useSwipe } from '../hooks/useSwipe';
import { useWheelNav } from '../hooks/useWheelNav';
import { claimPlayback } from '../playback';
import { withDefaults } from '../services';
import { styleVars } from '../styleVars';
import { PlayerNav } from './PlayerNav';
import { PlayerSlide } from './PlayerSlide';
import { Seekbar } from './Seekbar';
import { VolumeControl } from './VolumeControl';

const FOCUSABLE =
	'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

const TOAST_MS = 4000;
const STEP_MS = 320;

/** The one node every player on the page renders into. */
const portalRoot = () => {
	let node = document.querySelector( '.wr-portal-root' );

	if ( ! node ) {
		node = document.createElement( 'div' );
		node.className = 'wr-portal-root';
		document.body.appendChild( node );
	}

	return node;
};

const CloseIcon = () => (
	<svg
		viewBox="0 0 24 24"
		width="22"
		height="22"
		fill="none"
		stroke="currentColor"
		strokeWidth="2.2"
		strokeLinecap="round"
		aria-hidden="true"
	>
		<path d="M18 6 6 18M6 6l12 12" />
	</svg>
);

const SoundIcon = () => (
	<svg
		viewBox="0 0 24 24"
		width="16"
		height="16"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M11 5 6 9H2v6h4l5 4V5Z" fill="currentColor" stroke="none" />
		<path d="M15.5 8.5a5 5 0 0 1 0 7M19 5.5a9 9 0 0 1 0 13" />
	</svg>
);

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
	const [ products, setProducts ] = useState( null );
	const [ toast, setToast ] = useState( null );

	const root = useRef( null );
	const stage = useRef( null );
	const provider = useRef( null );
	const mutedRef = useRef( muted );
	const closed = useRef( false );
	const popped = useRef( false );
	const releaseClaim = useRef( null );
	const stepTimer = useRef( 0 );

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

		onClose();
	}, [ onClose ] );

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

	// null until the lookup has answered; a product missing from the answer
	// (WooCommerce off, product deleted) then renders nothing rather than a
	// skeleton that never resolves.
	useEffect( () => {
		const ids = productIdsIn( widget.reels );

		if ( ids.length === 0 || ! services.hasWoo ) {
			setProducts( {} );

			return undefined;
		}

		let cancelled = false;

		setProducts( null );

		services
			.getProducts( ids )
			.then( ( list ) => {
				if ( cancelled ) {
					return;
				}

				const map = {};

				( list || [] ).forEach( ( product ) => {
					map[ Number( product.id ) ] = product;
				} );

				setProducts( map );
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setProducts( {} );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [ widget.reels, services ] );

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
	useEffect( () => {
		const body = document.body;
		const scrollY = window.scrollY;
		const previous = {
			position: body.style.position,
			top: body.style.top,
			width: body.style.width,
			overflow: body.style.overflow,
		};

		body.style.position = 'fixed';
		body.style.top = `-${ scrollY }px`;
		body.style.width = '100%';
		body.style.overflow = 'hidden';
		body.classList.add( 'wr-player-open' );

		return () => {
			body.style.position = previous.position;
			body.style.top = previous.top;
			body.style.width = previous.width;
			body.style.overflow = previous.overflow;
			body.classList.remove( 'wr-player-open' );
			window.scrollTo( 0, scrollY );
		};
	}, [] );

	// A history entry, so a phone's back button closes the player.
	useEffect( () => {
		const marker = { wooreelsPlayer: widget.id };

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
				window.history.state.wooreelsPlayer === widget.id
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
			const items = Array.from(
				node.querySelectorAll( FOCUSABLE )
			).filter(
				( item ) => item.offsetParent !== null || item === active
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
				__( 'Reel player: %s', 'wooreels' ),
				current.reel.title || widget.name || ''
		  )
		: __( 'Reel player', 'wooreels' );

	return createPortal(
		<div
			ref={ root }
			className={ [
				'wr-player',
				horizontal ? 'wr-player--horizontal' : 'wr-player--vertical',
				mobile ? 'wr-player--mobile' : '',
				swipe.dragging ? 'is-dragging' : '',
				snap || reduced ? 'is-snap' : '',
			]
				.filter( Boolean )
				.join( ' ' ) }
			style={ styleVars( styles ) }
			role="dialog"
			aria-modal="true"
			aria-label={ label }
		>
			<div
				className="wr-player__backdrop"
				aria-hidden="true"
				onPointerDown={ onBackdropPointerDown }
				onClick={ onBackdropClick }
			/>

			<button
				type="button"
				className="wr-player__close"
				aria-label={ __( 'Close', 'wooreels' ) }
				onClick={ requestClose }
			>
				<CloseIcon />
			</button>

			{ many && (
				<span className="wr-player__counter" aria-live="polite">
					{ current.reelIndex + 1 } / { widget.reels.length }
				</span>
			) }

			<div className="wr-player__layout">
				<PlayerNav
					direction={ horizontal ? 'horizontal' : 'vertical' }
					onPrev={ () => step( -1 ) }
					onNext={ () => step( 1 ) }
					hidden={ mobile || ! many }
				/>

				<div
					ref={ stage }
					className="wr-player__stage"
					{ ...swipe.handlers }
				>
					<div
						className="wr-player__track"
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

					{ soundTap && (
						<button
							type="button"
							className="wr-player__sound"
							data-wr-no-swipe=""
							onClick={ toggle }
						>
							<SoundIcon />
							{ __( 'Tap for sound', 'wooreels' ) }
						</button>
					) }

					{ current &&
						current.file &&
						( styles.showSeekbar || styles.showVolumeControl ) && (
							<div className="wr-player__bar" data-wr-no-swipe="">
								{ styles.showSeekbar && (
									<Seekbar
										current={ time }
										duration={ duration }
										onSeek={ seek }
									/>
								) }
								{ styles.showVolumeControl && (
									<VolumeControl
										muted={ muted }
										volume={ volume }
										onToggleMute={ toggleMute }
										onVolume={ changeVolume }
									/>
								) }
							</div>
						) }
				</div>
			</div>

			{ toast && (
				<div
					className={ `wr-player__toast wr-player__toast--${ toast.tone }` }
					role="status"
				>
					{ toast.message }
				</div>
			) }
		</div>,
		portalRoot()
	);
};
