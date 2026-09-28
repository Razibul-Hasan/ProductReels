/**
 * The widget editor — reel picker, live preview, style panel.
 *
 * The centre pane renders through the shared WidgetRenderer, the same component
 * the public bundle uses. That is deliberate and load-bearing: if the editor
 * owned its own copy of the render logic, the preview would drift from what
 * visitors actually see, and every style control would become a guess.
 *
 * Nothing is written until Save. The editor holds the whole widget in local
 * state, so dragging a reel or nudging a slider is instant and costs no
 * request, and the unsaved-changes guard has something real to protect.
 */

import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	DndContext,
	KeyboardSensor,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import {
	SortableContext,
	arrayMove,
	rectSortingStrategy,
	sortableKeyboardCoordinates,
	useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WidgetRenderer } from '@shared/WidgetRenderer';
import { posterOf } from '@shared/format';
import { Player } from '@shared/player/Player';
import { useMediaQuery } from '@shared/hooks/useMediaQuery';
import { boot, reels as reelsApi, widgets as widgetsApi } from '../api';
import { editorServices } from '../preview-services';
import {
	IconCheck,
	IconChevronLeft,
	IconChevronRight,
	IconCopy,
	IconDesktop,
	IconDuplicate,
	IconGear,
	IconGrip,
	IconMobile,
	IconPanel,
	IconPlay,
	IconPlus,
	IconSave,
	IconTablet,
	IconTrash,
	IconUndo,
	IconVideo,
} from '../components/icons';
import { Button, IconButton } from '../components/ui/Button';
import { EmptyState, Skeleton } from '../components/ui/Feedback';
import { SearchInput } from '../components/ui/Fields';
import { ConfirmDialog } from '../components/ui/Modal';
import { useToasts } from '../components/ui/Toasts';
import { useDebounced } from '../hooks/use-debounced';
import { useUnsavedChanges } from '../hooks/use-unsaved-guard';
import { ReelEditor } from './ReelEditor';
import { StylePanel } from './StylePanel';
import { TitleAppearanceDialog } from './TitleAppearanceDialog';

/** How many reels the picker fetches per page. */
const PICKER_PAGE = 24;

const DEVICES = [
	{
		value: 'desktop',
		icon: IconDesktop,
		label: __(
			'Desktop',
			'productreels-shoppable-video-reels-for-woocommerce'
		),
		width: '100%',
	},
	{
		value: 'tablet',
		icon: IconTablet,
		label: __(
			'Tablet',
			'productreels-shoppable-video-reels-for-woocommerce'
		),
		width: '768px',
	},
	{
		value: 'mobile',
		icon: IconMobile,
		label: __(
			'Mobile',
			'productreels-shoppable-video-reels-for-woocommerce'
		),
		width: '390px',
	},
];

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

const PickerCard = ( { reel, onAdd } ) => {
	const poster = posterOf( reel );

	return (
		<button
			type="button"
			className="wr-pick"
			onClick={ () => onAdd( reel ) }
		>
			<span className="wr-pick__frame">
				{ poster ? (
					<img
						src={ poster }
						alt=""
						loading="lazy"
						decoding="async"
					/>
				) : (
					<span className="wr-pick__blank">
						<IconVideo size={ 18 } />
					</span>
				) }
				<span className="wr-pick__add">
					<IconPlus size={ 14 } />
				</span>
			</span>
			<span className="wr-pick__title">{ reel.title }</span>
		</button>
	);
};

const SortableReel = ( { reel, onRemove, onPreview } ) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable( { id: reel.id } );
	const poster = posterOf( reel );

	return (
		<li
			ref={ setNodeRef }
			className={ `wr-attached${ isDragging ? ' is-dragging' : '' }` }
			style={ {
				transform: CSS.Transform.toString( transform ),
				transition,
			} }
		>
			<button
				type="button"
				className="wr-attached__grip"
				aria-label={ sprintf(
					/* translators: %s: reel title. */
					__(
						'Reorder %s',
						'productreels-shoppable-video-reels-for-woocommerce'
					),
					reel.title
				) }
				{ ...attributes }
				{ ...listeners }
			>
				<IconGrip size={ 14 } />
			</button>

			<span className="wr-attached__frame">
				{ poster ? (
					<img src={ poster } alt="" loading="lazy" />
				) : (
					<span className="wr-pick__blank">
						<IconVideo size={ 15 } />
					</span>
				) }
			</span>

			<span className="wr-attached__title">{ reel.title }</span>

			<IconButton
				icon={ IconPlay }
				label={ __(
					'Preview',
					'productreels-shoppable-video-reels-for-woocommerce'
				) }
				size={ 14 }
				onClick={ ( event ) => onPreview( reel, event.currentTarget ) }
			/>

			<IconButton
				icon={ IconTrash }
				label={ __(
					'Delete',
					'productreels-shoppable-video-reels-for-woocommerce'
				) }
				tone="danger"
				size={ 14 }
				onClick={ () => onRemove( reel.id ) }
			/>
		</li>
	);
};

export const WidgetEditor = ( { widgetId, navigate } ) => {
	const toasts = useToasts();
	const isNew = ! widgetId;

	const [ loading, setLoading ] = useState( ! isNew );
	const [ saving, setSaving ] = useState( false );
	const [ name, setName ] = useState( '' );
	const [ styles, setStyles ] = useState( () => boot.defaults );
	const [ attached, setAttached ] = useState( [] );
	const [ savedId, setSavedId ] = useState( widgetId || 0 );
	const [ device, setDevice ] = useState( 'desktop' );
	const [ dirty, setDirty ] = useState( false );
	const [ confirming, setConfirming ] = useState( false );
	const [ titleOpen, setTitleOpen ] = useState( false );
	const [ copied, setCopied ] = useState( false );
	const [ playing, setPlaying ] = useState( null );
	const [ duplicating, setDuplicating ] = useState( false );

	const [ search, setSearch ] = useState( '' );
	const [ available, setAvailable ] = useState( [] );
	const [ picking, setPicking ] = useState( true );
	const [ pickerPage, setPickerPage ] = useState( 1 );
	const [ pickerPages, setPickerPages ] = useState( 1 );
	const [ loadingMore, setLoadingMore ] = useState( false );
	const [ creating, setCreating ] = useState( false );
	const [ panelOpen, setPanelOpen ] = useState( false );
	const [ panelHidden, setPanelHidden ] = useState( false );

	const term = useDebounced( search, 300 );
	const baseline = useRef( '' );
	const saved = useRef( { name: '', styles: boot.defaults, attached: [] } );
	const narrow = useMediaQuery( '(max-width: 1180px)' );

	useUnsavedChanges( dirty );

	const sensors = useSensors(
		useSensor( PointerSensor, { activationConstraint: { distance: 4 } } ),
		// Space lifts, arrows move, space drops — the whole editor stays keyboard operable.
		useSensor( KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		} )
	);

	/** Remember the saved shape, so "dirty" means genuinely different. */
	const snapshot = useCallback(
		( widgetName, widgetStyles, reels ) =>
			JSON.stringify( {
				widgetName,
				widgetStyles,
				ids: reels.map( ( reel ) => reel.id ),
			} ),
		[]
	);

	useEffect( () => {
		if ( isNew ) {
			baseline.current = snapshot( '', boot.defaults, [] );

			return undefined;
		}

		let cancelled = false;

		widgetsApi
			.get( widgetId )
			.then( ( widget ) => {
				if ( cancelled ) {
					return;
				}

				setName( widget.name );
				setStyles( widget.styles );
				setAttached( widget.reels );
				setSavedId( widget.id );
				saved.current = {
					name: widget.name,
					styles: widget.styles,
					attached: widget.reels,
				};
				baseline.current = snapshot(
					widget.name,
					widget.styles,
					widget.reels
				);
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
	}, [ widgetId, isNew, snapshot, toasts ] );

	// Anything the picker offers must not already be in the widget.
	const loadPicker = useCallback(
		( page ) => {
			return reelsApi.list( {
				search: term,
				page,
				per_page: PICKER_PAGE,
				orderby: 'id',
				order: 'DESC',
			} );
		},
		[ term ]
	);

	useEffect( () => {
		let cancelled = false;

		setPicking( true );

		loadPicker( 1 )
			.then( ( page ) => {
				if ( ! cancelled ) {
					setAvailable( page.items );
					setPickerPage( 1 );
					setPickerPages( page.pages );
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setAvailable( [] );
					setPickerPages( 1 );
				}
			} )
			.finally( () => {
				if ( ! cancelled ) {
					setPicking( false );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [ loadPicker ] );

	const loadMore = async () => {
		const next = pickerPage + 1;

		setLoadingMore( true );

		try {
			const page = await loadPicker( next );

			setAvailable( ( current ) => {
				const seen = new Set( current.map( ( reel ) => reel.id ) );

				return current.concat(
					page.items.filter( ( reel ) => ! seen.has( reel.id ) )
				);
			} );
			setPickerPage( next );
			setPickerPages( page.pages );
		} catch ( error ) {
			toasts.error( error.message );
		} finally {
			setLoadingMore( false );
		}
	};

	const markDirty = useCallback(
		( nextName, nextStyles, nextAttached ) => {
			setDirty(
				snapshot( nextName, nextStyles, nextAttached ) !==
					baseline.current
			);
		},
		[ snapshot ]
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
		markDirty( name, next, attached );
	};

	const rename = ( value ) => {
		setName( value );
		markDirty( value, styles, attached );
	};

	const add = ( reel ) => {
		const next = [ ...attached, reel ];

		setAttached( next );
		markDirty( name, styles, next );
	};

	const remove = ( id ) => {
		const next = attached.filter( ( reel ) => reel.id !== id );

		setAttached( next );
		markDirty( name, styles, next );
	};

	const onDragEnd = ( event ) => {
		const { active, over } = event;

		if ( ! over || active.id === over.id ) {
			return;
		}

		const from = attached.findIndex( ( reel ) => reel.id === active.id );
		const to = attached.findIndex( ( reel ) => reel.id === over.id );
		const next = arrayMove( attached, from, to );

		setAttached( next );
		markDirty( name, styles, next );
	};

	const save = async () => {
		setSaving( true );

		try {
			const payload = {
				name,
				styles,
				reel_ids: attached.map( ( reel ) => reel.id ),
			};
			const widget =
				isNew && ! savedId
					? await widgetsApi.create( payload )
					: await widgetsApi.update( savedId, payload );

			setName( widget.name );
			setStyles( widget.styles );
			setAttached( widget.reels );
			setSavedId( widget.id );
			saved.current = {
				name: widget.name,
				styles: widget.styles,
				attached: widget.reels,
			};
			baseline.current = snapshot(
				widget.name,
				widget.styles,
				widget.reels
			);
			setDirty( false );

			toasts.success(
				isNew && ! savedId
					? __(
							'Widget created successfully!',
							'productreels-shoppable-video-reels-for-woocommerce'
						)
					: __(
							'Changes saved successfully!',
							'productreels-shoppable-video-reels-for-woocommerce'
						)
			);

			if ( isNew && ! savedId ) {
				navigate( `#/widgets/${ widget.id }` );
			}
		} catch ( error ) {
			toasts.error( error.message );
		} finally {
			setSaving( false );
		}
	};

	/** Put everything back the way it was at the last save. */
	const discard = () => {
		setName( saved.current.name );
		setStyles( saved.current.styles );
		setAttached( saved.current.attached );
		setDirty( false );
	};

	/**
	 * A reel created from inside the editor joins the widget straight away —
	 * that is why someone reached for "Add Reel" here rather than in the library.
	 *
	 * @param {Object} reel The reel the editor just created.
	 */
	const onReelCreated = ( reel ) => {
		setCreating( false );

		if ( reel && reel.id ) {
			add( reel );
		}
	};

	const removeWidget = async () => {
		try {
			await widgetsApi.remove( savedId );
			setDirty( false );
			toasts.success(
				__(
					'Widget deleted successfully!',
					'productreels-shoppable-video-reels-for-woocommerce'
				)
			);
			navigate( '#/widgets' );
		} catch ( error ) {
			toasts.error( error.message );
			setConfirming( false );
		}
	};

	const copyShortcode = async () => {
		const shortcode = `[productreels id="${ savedId }"]`;

		try {
			await window.navigator.clipboard.writeText( shortcode );
		} catch ( error ) {
			const field = document.createElement( 'textarea' );

			field.value = shortcode;
			document.body.appendChild( field );
			field.select();
			document.execCommand( 'copy' );
			document.body.removeChild( field );
		}

		setCopied( true );
		toasts.success(
			__(
				'Copied!',
				'productreels-shoppable-video-reels-for-woocommerce'
			)
		);
		setTimeout( () => setCopied( false ), 1600 );
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

	const duplicateWidget = async () => {
		setDuplicating( true );

		try {
			const copy = await widgetsApi.duplicate( savedId );

			toasts.success(
				__(
					'Widget created successfully!',
					'productreels-shoppable-video-reels-for-woocommerce'
				)
			);
			navigate( `#/widgets/${ copy.id }` );
		} catch ( error ) {
			toasts.error( error.message );
		} finally {
			setDuplicating( false );
		}
	};

	const attachedIds = useMemo(
		() => attached.map( ( reel ) => reel.id ),
		[ attached ]
	);
	const offerable = available.filter(
		( reel ) => ! attachedIds.includes( reel.id )
	);
	const previewWidth = DEVICES.find(
		( entry ) => entry.value === device
	).width;
	const titleHidden = 'hidden' === styles.widgetTitle.alignment;

	return (
		<>
			<div className="wr-page-head wr-editor-head">
				<div className="wr-editor-head__left">
					<IconButton
						icon={ IconChevronLeft }
						label={ __(
							'Back',
							'productreels-shoppable-video-reels-for-woocommerce'
						) }
						onClick={ () => navigate( '#/widgets' ) }
					/>
					<nav
						className="wr-crumbs"
						aria-label={ __(
							'Breadcrumb',
							'productreels-shoppable-video-reels-for-woocommerce'
						) }
					>
						<button
							type="button"
							className="wr-crumbs__link"
							onClick={ () => navigate( '#/widgets' ) }
						>
							{ __(
								'All Widgets',
								'productreels-shoppable-video-reels-for-woocommerce'
							) }
						</button>
						<IconChevronRight size={ 12 } />
						<span className="wr-crumbs__current">
							{ savedId > 0
								? name ||
									__(
										'Untitled widget',
										'productreels-shoppable-video-reels-for-woocommerce'
									)
								: __(
										'Create Widget',
										'productreels-shoppable-video-reels-for-woocommerce'
									) }
						</span>
					</nav>
				</div>

				<div className="wr-editor-head__title">
					<input
						type="text"
						className="wr-editor-head__name"
						value={ name }
						placeholder={ __(
							'Enter widget title',
							'productreels-shoppable-video-reels-for-woocommerce'
						) }
						aria-label={ __(
							'Widget Name',
							'productreels-shoppable-video-reels-for-woocommerce'
						) }
						onChange={ ( event ) => rename( event.target.value ) }
					/>
					<IconButton
						icon={ IconGear }
						label={
							titleHidden
								? __(
										'Title appearance (not shown on the page)',
										'productreels-shoppable-video-reels-for-woocommerce'
									)
								: __(
										'Title appearance',
										'productreels-shoppable-video-reels-for-woocommerce'
									)
						}
						className="wr-editor-head__title-btn"
						data-hidden={ titleHidden ? 'true' : 'false' }
						size={ 15 }
						onClick={ () => setTitleOpen( true ) }
					/>
				</div>

				<div className="wr-page-head__actions">
					{ dirty && (
						<IconButton
							icon={ IconUndo }
							label={ __(
								'Discard changes',
								'productreels-shoppable-video-reels-for-woocommerce'
							) }
							onClick={ discard }
						/>
					) }

					{ savedId > 0 && (
						<button
							type="button"
							className="wr-shortcode"
							onClick={ copyShortcode }
						>
							<code>{ `[productreels id="${ savedId }"]` }</code>
							{ copied ? (
								<IconCheck size={ 13 } />
							) : (
								<IconCopy size={ 13 } />
							) }
						</button>
					) }

					{ savedId > 0 && (
						<IconButton
							icon={ IconDuplicate }
							label={ __(
								'Duplicate',
								'productreels-shoppable-video-reels-for-woocommerce'
							) }
							disabled={ duplicating || dirty }
							onClick={ duplicateWidget }
						/>
					) }

					{ savedId > 0 && (
						<IconButton
							icon={ IconTrash }
							label={ __(
								'Delete',
								'productreels-shoppable-video-reels-for-woocommerce'
							) }
							tone="danger"
							onClick={ () => setConfirming( true ) }
						/>
					) }

					<IconButton
						icon={ IconPanel }
						label={
							( narrow ? panelOpen : ! panelHidden )
								? __(
										'Hide customization',
										'productreels-shoppable-video-reels-for-woocommerce'
									)
								: __(
										'Show customization',
										'productreels-shoppable-video-reels-for-woocommerce'
									)
						}
						aria-pressed={
							( narrow ? panelOpen : ! panelHidden )
								? 'true'
								: 'false'
						}
						onClick={ () =>
							narrow
								? setPanelOpen( ! panelOpen )
								: setPanelHidden( ! panelHidden )
						}
					/>

					<Button
						variant="primary"
						icon={ IconSave }
						busy={ saving }
						disabled={ saving || ( ! dirty && savedId > 0 ) }
						onClick={ save }
					>
						{ savedId > 0
							? __(
									'Update',
									'productreels-shoppable-video-reels-for-woocommerce'
								)
							: __(
									'Save',
									'productreels-shoppable-video-reels-for-woocommerce'
								) }
					</Button>
				</div>
			</div>

			<div
				className={ [
					'wr-editor',
					panelOpen ? 'is-panel-open' : '',
					panelHidden ? 'is-panel-hidden' : '',
				]
					.filter( Boolean )
					.join( ' ' ) }
			>
				<section
					className="wr-editor__pane wr-editor__picker"
					aria-label={ __(
						'All Reels',
						'productreels-shoppable-video-reels-for-woocommerce'
					) }
				>
					<header className="wr-editor__pane-head">
						<h2 className="wr-editor__pane-title">
							{ __(
								'All Reels',
								'productreels-shoppable-video-reels-for-woocommerce'
							) }
						</h2>
						<p className="wr-editor__pane-sub">
							{ __(
								'Choose reels to attach in this widget',
								'productreels-shoppable-video-reels-for-woocommerce'
							) }
						</p>
					</header>

					<div className="wr-editor__pane-tools">
						<Button
							className="wr-editor__add-reel"
							icon={ IconPlus }
							onClick={ () => setCreating( true ) }
						>
							{ __(
								'Add Reel',
								'productreels-shoppable-video-reels-for-woocommerce'
							) }
						</Button>
						<SearchInput
							value={ search }
							onChange={ setSearch }
							placeholder={ __(
								'Search reels…',
								'productreels-shoppable-video-reels-for-woocommerce'
							) }
						/>
					</div>

					<div className="wr-editor__pane-body">
						{ picking && (
							<div className="wr-pick-grid">
								{ [ 0, 1, 2, 3 ].map( ( card ) => (
									<div key={ card } className="wr-pick">
										<div className="wr-pick__frame wr-skeleton" />
										<Skeleton width="80%" height={ 11 } />
									</div>
								) ) }
							</div>
						) }

						{ ! picking && offerable.length === 0 && (
							<p className="wr-editor__empty">
								{ __(
									'No reels are available to add.',
									'productreels-shoppable-video-reels-for-woocommerce'
								) }
							</p>
						) }

						{ ! picking && offerable.length > 0 && (
							<div className="wr-pick-grid">
								{ offerable.map( ( reel ) => (
									<PickerCard
										key={ reel.id }
										reel={ reel }
										onAdd={ add }
									/>
								) ) }
							</div>
						) }

						{ ! picking && pickerPage < pickerPages && (
							<div className="wr-editor__more">
								<Button
									size="sm"
									busy={ loadingMore }
									disabled={ loadingMore }
									onClick={ loadMore }
								>
									{ __(
										'Load more',
										'productreels-shoppable-video-reels-for-woocommerce'
									) }
								</Button>
							</div>
						) }
					</div>
				</section>

				<section
					className="wr-editor__pane wr-editor__preview"
					aria-label={ __(
						'Preview',
						'productreels-shoppable-video-reels-for-woocommerce'
					) }
				>
					<header className="wr-editor__pane-head wr-editor__preview-head">
						<div>
							<h2 className="wr-editor__pane-title">
								{ __(
									'Preview',
									'productreels-shoppable-video-reels-for-woocommerce'
								) }
							</h2>
							<p className="wr-editor__pane-sub">
								{ __(
									'This is a representation of how the widget will appear to visitors.',
									'productreels-shoppable-video-reels-for-woocommerce'
								) }
							</p>
						</div>

						<div
							className="wr-toggle-group"
							role="group"
							aria-label={ __(
								'Device',
								'productreels-shoppable-video-reels-for-woocommerce'
							) }
						>
							{ DEVICES.map( ( entry ) => {
								const Icon = entry.icon;

								return (
									<button
										key={ entry.value }
										type="button"
										aria-pressed={
											entry.value === device
												? 'true'
												: 'false'
										}
										aria-label={ entry.label }
										className="wr-toggle-group__item"
										onClick={ () =>
											setDevice( entry.value )
										}
									>
										<Icon size={ 14 } />
									</button>
								);
							} ) }
						</div>
					</header>

					<div className="wr-editor__preview-body">
						<div className="wr-editor__stage">
							{ loading && (
								<div
									className="wr-editor__stage-inner"
									style={ { width: previewWidth } }
								>
									<Skeleton height={ 260 } radius="10px" />
								</div>
							) }

							{ ! loading && attached.length === 0 && (
								<EmptyState
									title={ __(
										'No reels have been added to this widget yet.',
										'productreels-shoppable-video-reels-for-woocommerce'
									) }
									text={ __(
										'Select some from the list on the left to get started.',
										'productreels-shoppable-video-reels-for-woocommerce'
									) }
								/>
							) }

							{ ! loading && attached.length > 0 && (
								<div
									className="wr-editor__stage-inner"
									style={ { width: previewWidth } }
								>
									<WidgetRenderer
										widget={ {
											id: savedId,
											name,
											reels: attached,
										} }
										styles={ styles }
										device={ device }
										inEditor
										onOpen={ preview }
										services={ editorServices }
									/>
								</div>
							) }
						</div>

						{ attached.length > 0 && (
							<div className="wr-editor__attached">
								<div className="wr-editor__attached-head">
									<h3 className="wr-section-label">
										{ __(
											'Attached videos',
											'productreels-shoppable-video-reels-for-woocommerce'
										) }
									</h3>
									<span className="wr-editor__pane-sub">
										{ __(
											'These reels will be shown in this reel widget',
											'productreels-shoppable-video-reels-for-woocommerce'
										) }
									</span>
								</div>

								<DndContext
									sensors={ sensors }
									collisionDetection={ closestCenter }
									onDragEnd={ onDragEnd }
								>
									<SortableContext
										items={ attachedIds }
										strategy={ rectSortingStrategy }
									>
										<ul className="wr-attached-list">
											{ attached.map( ( reel ) => (
												<SortableReel
													key={ reel.id }
													reel={ reel }
													onRemove={ remove }
													onPreview={ preview }
												/>
											) ) }
										</ul>
									</SortableContext>
								</DndContext>
							</div>
						) }
					</div>
				</section>

				<section
					className="wr-editor__pane wr-editor__style"
					aria-label={ __(
						'Customization',
						'productreels-shoppable-video-reels-for-woocommerce'
					) }
				>
					<header className="wr-editor__pane-head">
						<h2 className="wr-editor__pane-title">
							{ __(
								'Customization',
								'productreels-shoppable-video-reels-for-woocommerce'
							) }
						</h2>
						<p className="wr-editor__pane-sub">
							{ __(
								'Customize your widget however you like',
								'productreels-shoppable-video-reels-for-woocommerce'
							) }
						</p>
					</header>

					<div className="wr-editor__pane-body">
						<StylePanel
							styles={ styles }
							set={ setStyle }
							device={ device }
							setDevice={ setDevice }
						/>
					</div>
				</section>

				<button
					type="button"
					className="wr-editor__panel-toggle"
					aria-expanded={ panelOpen ? 'true' : 'false' }
					onClick={ () => setPanelOpen( ! panelOpen ) }
				>
					{ __(
						'Customization',
						'productreels-shoppable-video-reels-for-woocommerce'
					) }
				</button>
			</div>

			{ creating && (
				<ReelEditor
					reelId={ 0 }
					onClose={ () => setCreating( false ) }
					onSaved={ onReelCreated }
				/>
			) }

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

			{ titleOpen && (
				<TitleAppearanceDialog
					name={ name }
					styles={ styles }
					set={ setStyle }
					onClose={ () => setTitleOpen( false ) }
				/>
			) }

			{ confirming && (
				<ConfirmDialog
					title={ __(
						'Are you sure you want to delete this widget?',
						'productreels-shoppable-video-reels-for-woocommerce'
					) }
					onConfirm={ removeWidget }
					onClose={ () => setConfirming( false ) }
				>
					{ __(
						'This widget and its click statistics will be removed. Its reels stay in your library and keep working in any other widget.',
						'productreels-shoppable-video-reels-for-woocommerce'
					) }
				</ConfirmDialog>
			) }
		</>
	);
};
