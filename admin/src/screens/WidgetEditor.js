/**
 * The widget editor (the studio).
 *
 * A header, a rail of steps, the panel for the open step and a dark stage
 * with the live preview. The stage renders through the shared WidgetRenderer,
 * the same component the public bundle uses. That is deliberate and
 * load-bearing: if the editor owned its own copy of the render logic, the
 * preview would drift from what visitors actually see, and every style
 * control would become a guess.
 *
 * Nothing is written until Save. The editor holds the whole widget in local
 * state, so dragging a reel or nudging a slider is instant and costs no
 * request, and the unsaved-changes guard has something real to protect. A
 * widget started from the Create widget dialog (`#/widgets/draft`) has no
 * database record until its first save, exactly as in 1.0.0.
 */

import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { WidgetRenderer } from '@shared/WidgetRenderer';
import { Player } from '@shared/player/Player';
import { boot, widgets as widgetsApi } from '../api';
import { editorServices } from '../preview-services';
import {
	Button,
	ConfirmDialog,
	DeviceFrame,
	EmptyState,
	LAYOUTS,
	PLACE_STEP,
	STUDIO_STEPS,
	Skeleton,
	Stage,
	StudioHeader,
	StudioPanel,
	StudioRail,
	StudioShell,
	useToasts,
} from '../components/pr';
import { useUnsavedChanges } from '../hooks/use-unsaved-guard';
import { clearDraft, readDraft } from './CreateWidget';
import { AdvancedStep } from './editor/AdvancedStep';
import { CardStep } from './editor/CardStep';
import { LayoutStep } from './editor/LayoutStep';
import { LookStep } from './editor/LookStep';
import { PlaceStep } from './editor/PlaceStep';
import { PlayerStep } from './editor/PlayerStep';
import { ReelsStep } from './editor/ReelsStep';

const PANEL_ID = 'pr-studio-panel';

/** Each step's panel title and one-line description. */
const STEP_TEXT = {
	reels: {
		title: __( 'Reels', 'productreels' ),
		description: __(
			'Drag to set the order they appear in.',
			'productreels'
		),
	},
	layout: {
		title: __( 'Layout', 'productreels' ),
		description: __( 'How reels sit on the page.', 'productreels' ),
	},
	look: {
		title: __( 'Look', 'productreels' ),
		description: __(
			'What visitors see before they press play.',
			'productreels'
		),
	},
	player: {
		title: __( 'Player', 'productreels' ),
		description: __(
			'What opens when a shopper taps a reel.',
			'productreels'
		),
	},
	card: {
		title: __( 'Product card', 'productreels' ),
		description: __( 'How tagged products appear.', 'productreels' ),
	},
	advanced: {
		title: __( 'Advanced', 'productreels' ),
		description: __(
			'Video loading, and a class for your own CSS.',
			'productreels'
		),
	},
	place: {
		title: __( 'Place it', 'productreels' ),
		description: __( 'Put this widget on a page.', 'productreels' ),
	},
};

const STEP_IDS = STUDIO_STEPS.map( ( step ) => step.id ).concat(
	PLACE_STEP.id
);

/* The last step open in each widget, for this browser tab. */

const STEPS_KEY = 'productreels_editor_steps';

const readSteps = () => {
	try {
		return JSON.parse( window.sessionStorage.getItem( STEPS_KEY ) ) || {};
	} catch ( error ) {
		return {};
	}
};

const rememberStep = ( key, step ) => {
	try {
		window.sessionStorage.setItem(
			STEPS_KEY,
			JSON.stringify( { ...readSteps(), [ key ]: step } )
		);
	} catch ( error ) {
		// Storage blocked: the step just isn't remembered.
	}
};

const OPEN_STEP = 'productreels:open-step';

/**
 * Open a step of a saved widget's editor: the "Place it" action on the
 * first-save toast. Goes to the editor if the toast outlived it.
 *
 * @param {number} id   The widget.
 * @param {string} step The step to open.
 */
const openStep = ( id, step ) => {
	rememberStep( String( id ), step );
	document.dispatchEvent(
		new window.CustomEvent( OPEN_STEP, { detail: { id, step } } )
	);

	if ( window.location.hash !== `#/widgets/${ id }` ) {
		window.location.hash = `#/widgets/${ id }`;
	}
};

/**
 * Write a dotted path into a nested object without mutating the original.
 *
 * @param {Object} object The object to copy.
 * @param {string} path   Dotted key path, e.g. 'border.radius'.
 * @param {*}      value  The value to set.
 * @return {Object} A new object with the value written.
 */
const setPath = ( object, path, value ) => {
	const [ head, ...rest ] = path.split( '.' );

	return {
		...object,
		[ head ]:
			rest.length === 0
				? value
				: setPath( object[ head ] || {}, rest.join( '.' ), value ),
	};
};

/**
 * The widget as one string, so "changed" means genuinely different.
 *
 * @param {string} widgetName   The name.
 * @param {Object} widgetStyles The styles.
 * @param {Array}  reels        The reels, in order.
 * @return {string} The snapshot.
 */
const snapshot = ( widgetName, widgetStyles, reels ) =>
	JSON.stringify( {
		widgetName,
		widgetStyles,
		ids: reels.map( ( reel ) => reel.id ),
	} );

/**
 * What a new widget starts from: the defaults, with the layout and shape
 * chosen in the Create widget dialog.
 *
 * @return {{name: string, styles: Object}} The starting point.
 */
const startingPoint = () => {
	const draft = readDraft() || {};
	const styles = { ...boot.defaults };

	if ( LAYOUTS[ draft.template ] ) {
		styles.template = draft.template;
	}

	if ( draft.shape === 'rectangle' || draft.shape === 'circle' ) {
		styles.shape = draft.shape;
	}

	return { name: draft.name || '', styles };
};

export const WidgetEditor = ( { widgetId, navigate } ) => {
	const toasts = useToasts();
	const isNew = ! widgetId;
	const [ start ] = useState( () =>
		isNew ? startingPoint() : { name: '', styles: boot.defaults }
	);
	const stepKey = isNew ? 'draft' : String( widgetId );

	const [ loading, setLoading ] = useState( ! isNew );
	const [ saving, setSaving ] = useState( false );
	const [ name, setName ] = useState( start.name );
	const [ styles, setStyles ] = useState( start.styles );
	const [ attached, setAttached ] = useState( [] );
	const [ savedId, setSavedId ] = useState( widgetId || 0 );
	const [ device, setDevice ] = useState( 'desktop' );
	const [ changed, setChanged ] = useState( false );
	const [ confirming, setConfirming ] = useState( null );
	const [ deleting, setDeleting ] = useState( false );
	const [ playing, setPlaying ] = useState( null );
	const [ step, setStep ] = useState( () => {
		const remembered = readSteps()[ stepKey ];

		return STEP_IDS.includes( remembered ) ? remembered : 'reels';
	} );
	const [ panelOpen, setPanelOpen ] = useState( true );

	const baseline = useRef( snapshot( start.name, start.styles, [] ) );
	const saved = useRef( {
		name: start.name,
		styles: start.styles,
		attached: [],
	} );

	// A widget with no record yet is unsaved by definition.
	const dirty = changed || ! savedId;
	const label = name.trim() || __( 'Untitled widget', 'productreels' );
	const clearUnsaved = useUnsavedChanges( dirty, label );

	/** Take a widget as the server returned it as the saved state. */
	const adopt = useCallback( ( widget ) => {
		setName( widget.name );
		setStyles( widget.styles );
		setAttached( widget.reels );
		setSavedId( widget.id );
		saved.current = {
			name: widget.name,
			styles: widget.styles,
			attached: widget.reels,
		};
		baseline.current = snapshot( widget.name, widget.styles, widget.reels );
		setChanged( false );
	}, [] );

	useEffect( () => {
		if ( isNew ) {
			return undefined;
		}

		let cancelled = false;

		widgetsApi
			.get( widgetId )
			.then( ( widget ) => {
				if ( ! cancelled ) {
					adopt( widget );
				}
			} )
			.catch( ( error ) => toasts.error( error.message ) )
			.finally( () => {
				if ( ! cancelled ) {
					setLoading( false );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [ widgetId, isNew, adopt, toasts ] );

	const markChanged = ( nextName, nextStyles, nextAttached ) =>
		setChanged(
			snapshot( nextName, nextStyles, nextAttached ) !== baseline.current
		);

	/**
	 * Write one style, or several at once.
	 *
	 * Takes a dotted path and a value, or an object of paths to values. The
	 * object form exists because two calls in one event handler both start
	 * from the `styles` this closure captured, so the second silently undoes
	 * the first; a control that must change two keys together hands them
	 * over as one patch.
	 *
	 * @param {string|Object} path  Dotted path, or a { path: value } patch.
	 * @param {*}             value The value, when `path` is a string.
	 */
	const setStyle = ( path, value ) => {
		const patch = typeof path === 'string' ? { [ path ]: value } : path;
		const next = Object.keys( patch ).reduce(
			( acc, key ) => setPath( acc, key, patch[ key ] ),
			styles
		);

		setStyles( next );
		markChanged( name, next, attached );
	};

	const rename = ( value ) => {
		setName( value );
		markChanged( value, styles, attached );
	};

	const updateReels = ( next ) => {
		setAttached( next );
		markChanged( name, styles, next );
	};

	const canSave = ! saving && ! loading && dirty;

	const save = async () => {
		if ( ! canSave ) {
			return;
		}

		const first = ! savedId;

		setSaving( true );

		try {
			const payload = {
				name,
				styles,
				reel_ids: attached.map( ( reel ) => reel.id ),
			};
			const widget = first
				? await widgetsApi.create( payload )
				: await widgetsApi.update( savedId, payload );

			adopt( widget );

			if ( ! first ) {
				toasts.success( __( 'Widget saved', 'productreels' ) );

				return;
			}

			// The widget exists now: it gets its own address, keeps the step
			// that was open, and the toast offers the next thing to do.
			clearDraft();
			rememberStep( String( widget.id ), step );
			clearUnsaved();
			toasts.success( __( 'Widget saved', 'productreels' ), {
				action: {
					label: __( 'Place it', 'productreels' ),
					onClick: () => openStep( widget.id, PLACE_STEP.id ),
				},
			} );
			navigate( `#/widgets/${ widget.id }` );
		} catch ( error ) {
			toasts.error( error.message );
		} finally {
			setSaving( false );
		}
	};

	// Ctrl+S / Cmd+S saves, unless a dialog (the reel sheet) has the screen.
	const saveRef = useRef( save );

	saveRef.current = save;

	useEffect( () => {
		const onKeyDown = ( event ) => {
			if (
				( event.ctrlKey || event.metaKey ) &&
				! event.altKey &&
				! event.shiftKey &&
				event.key.toLowerCase() === 's'
			) {
				event.preventDefault();

				if ( ! document.querySelector( '.pr-overlay' ) ) {
					saveRef.current();
				}
			}
		};

		document.addEventListener( 'keydown', onKeyDown );

		return () => document.removeEventListener( 'keydown', onKeyDown );
	}, [] );

	// The first-save toast's "Place it".
	useEffect( () => {
		const onOpenStep = ( event ) => {
			if ( event.detail?.id === savedId ) {
				setStep( event.detail.step );
				setPanelOpen( true );
			}
		};

		document.addEventListener( OPEN_STEP, onOpenStep );

		return () => document.removeEventListener( OPEN_STEP, onOpenStep );
	}, [ savedId ] );

	/** Put everything back the way it was at the last save. */
	const discard = () => {
		setName( saved.current.name );
		setStyles( saved.current.styles );
		setAttached( saved.current.attached );
		setChanged( false );
		setConfirming( null );
		toasts.success( __( 'Changes discarded', 'productreels' ), {
			icon: 'undo',
		} );
	};

	const removeWidget = async () => {
		setDeleting( true );

		try {
			await widgetsApi.remove( savedId );
			clearUnsaved();
			toasts.success( __( 'Widget deleted', 'productreels' ), {
				icon: 'trash',
			} );
			navigate( '#/widgets' );
		} catch ( error ) {
			toasts.error( error.message );
			setDeleting( false );
			setConfirming( null );
		}
	};

	const duplicateWidget = async () => {
		try {
			const copy = await widgetsApi.duplicate( savedId );

			toasts.success( __( 'Widget duplicated', 'productreels' ), {
				icon: 'duplicate',
			} );
			navigate( `#/widgets/${ copy.id }` );
		} catch ( error ) {
			toasts.error( error.message );
		}
	};

	/**
	 * Open the real player on a reel, exactly as a visitor would see it.
	 *
	 * @param {Object}      reel The reel to start on.
	 * @param {HTMLElement} from The element that opened it, for focus return.
	 */
	const preview = ( reel, from ) => {
		const index = attached.findIndex( ( entry ) => entry.id === reel.id );

		setPlaying( { index: index < 0 ? 0 : index, from: from || null } );
	};

	const selectStep = ( id ) => {
		if ( id === step ) {
			setPanelOpen( ! panelOpen );

			return;
		}

		setStep( id );
		setPanelOpen( true );
		rememberStep( savedId ? String( savedId ) : stepKey, id );
	};

	const menuItems = useMemo(
		() =>
			savedId > 0
				? [
						{
							icon: 'duplicate',
							label: __( 'Duplicate', 'productreels' ),
							hint: changed
								? __( 'Save first', 'productreels' )
								: undefined,
							disabled: changed,
							onSelect: duplicateWidget,
						},
						'-',
						{
							icon: 'trash',
							label: __( 'Delete widget', 'productreels' ),
							danger: true,
							onSelect: () => setConfirming( 'delete' ),
						},
					]
				: [],
		// duplicateWidget only reads savedId.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ savedId, changed ]
	);

	const stepProps = {
		name,
		styles,
		set: setStyle,
		device,
		setDevice,
	};

	let body = null;

	switch ( step ) {
		case 'reels':
			body = (
				<ReelsStep
					attached={ attached }
					setAttached={ updateReels }
					onPreview={ preview }
					ready={ ! loading }
				/>
			);
			break;
		case 'layout':
			body = <LayoutStep { ...stepProps } />;
			break;
		case 'look':
			body = <LookStep { ...stepProps } />;
			break;
		case 'player':
			body = <PlayerStep { ...stepProps } />;
			break;
		case 'card':
			body = <CardStep { ...stepProps } />;
			break;
		case 'advanced':
			body = <AdvancedStep { ...stepProps } />;
			break;
		case 'place':
			body = (
				<PlaceStep
					id={ savedId }
					name={ name }
					onSave={ save }
					saving={ saving }
				/>
			);
			break;
	}

	let stageBody = null;

	if ( loading ) {
		stageBody = <Skeleton variant="cards" count={ 6 } />;
	} else if ( attached.length === 0 ) {
		stageBody = (
			<EmptyState
				panel
				icon="film"
				title={ __( 'Add reels to see your widget', 'productreels' ) }
				description={ __(
					'Pick reels from your library in the Reels step.',
					'productreels'
				) }
				actions={
					step !== 'reels' || ! panelOpen ? (
						<Button
							icon="film"
							onClick={ () => {
								setStep( 'reels' );
								setPanelOpen( true );
							} }
						>
							{ __( 'Choose reels', 'productreels' ) }
						</Button>
					) : null
				}
			/>
		);
	} else {
		stageBody = (
			<WidgetRenderer
				widget={ { id: savedId, name, reels: attached } }
				styles={ styles }
				device={ device }
				inEditor
				onOpen={ preview }
				services={ editorServices }
			/>
		);
	}

	const text = STEP_TEXT[ step ];

	return (
		<>
			<StudioShell
				panelOpen={ panelOpen }
				header={
					<StudioHeader
						name={ name }
						onRename={ rename }
						dirty={ dirty }
						canDiscard={ changed }
						id={ savedId }
						onDiscard={ () =>
							changed ? setConfirming( 'discard' ) : null
						}
						menuItems={ menuItems }
						onSave={ save }
						saving={ saving }
						canSave={ canSave }
					/>
				}
				rail={
					<StudioRail
						current={ step }
						panelOpen={ panelOpen }
						reels={ attached.length }
						panelId={ PANEL_ID }
						onSelect={ selectStep }
					/>
				}
				panel={
					panelOpen && (
						<StudioPanel
							id={ PANEL_ID }
							title={ text.title }
							description={ text.description }
						>
							{ body }
						</StudioPanel>
					)
				}
				stage={
					<Stage device={ device } onDevice={ setDevice }>
						{ /* The empty state sits on the stage at full size; inside
						     the zoomed page it would be too small to read. */ }
						{ ! loading && attached.length === 0 ? (
							<div className="pr-stage__empty">{ stageBody }</div>
						) : (
							<DeviceFrame
								device={ device }
								url={ window.location.host }
							>
								{ stageBody }
							</DeviceFrame>
						) }
					</Stage>
				}
			/>

			{ playing && (
				<Player
					widget={ { id: savedId, name, reels: attached } }
					styles={ styles }
					startReel={ playing.index }
					services={ editorServices }
					returnFocusTo={ playing.from }
					onClose={ () => setPlaying( null ) }
				/>
			) }

			{ confirming === 'discard' && (
				<ConfirmDialog
					title={ __( 'Discard changes?', 'productreels' ) }
					confirm={ __( 'Discard changes', 'productreels' ) }
					cancelLabel={ __( 'Keep editing', 'productreels' ) }
					icon="alert"
					onConfirm={ discard }
					onClose={ () => setConfirming( null ) }
				>
					{ savedId
						? sprintf(
								/* translators: %s: the widget's name. */
								__(
									'Your changes to %s since the last save will be lost.',
									'productreels'
								),
								label
							)
						: __(
								'The widget goes back to the layout and shape you chose when you created it.',
								'productreels'
							) }
				</ConfirmDialog>
			) }

			{ confirming === 'delete' && (
				<ConfirmDialog
					title={ sprintf(
						/* translators: %s: widget name. */
						__( 'Delete “%s”?', 'productreels' ),
						label
					) }
					confirm={ __( 'Delete widget', 'productreels' ) }
					busy={ deleting }
					onConfirm={ removeWidget }
					onClose={ () => setConfirming( null ) }
				>
					{ __(
						'Pages that use its shortcode or block will show nothing. Its reels stay in your library.',
						'productreels'
					) }
				</ConfirmDialog>
			) }
		</>
	);
};
