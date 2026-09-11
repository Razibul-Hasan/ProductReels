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
import { boot, reels as reelsApi, widgets as widgetsApi } from '../api';
import { editorServices } from '../preview-services';
import {
	IconCheck,
	IconChevronLeft,
	IconCopy,
	IconDesktop,
	IconDuplicate,
	IconGrip,
	IconMobile,
	IconPlay,
	IconPlus,
	IconTablet,
	IconTrash,
	IconVideo,
} from '../components/icons';
import { Button, IconButton } from '../components/ui/Button';
import { EmptyState, Skeleton } from '../components/ui/Feedback';
import { SearchInput } from '../components/ui/Fields';
import { ConfirmDialog } from '../components/ui/Modal';
import { useToasts } from '../components/ui/Toasts';
import { useDebounced } from '../hooks/use-debounced';
import { useUnsavedChanges } from '../hooks/use-unsaved-guard';
import { StylePanel } from './StylePanel';

const DEVICES = [
	{
		value: 'desktop',
		icon: IconDesktop,
		label: __( 'Desktop', 'wooreels' ),
		width: '100%',
	},
	{
		value: 'tablet',
		icon: IconTablet,
		label: __( 'Tablet', 'wooreels' ),
		width: '768px',
	},
	{
		value: 'mobile',
		icon: IconMobile,
		label: __( 'Mobile', 'wooreels' ),
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
					__( 'Reorder %s', 'wooreels' ),
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
				label={ __( 'Preview', 'wooreels' ) }
				size={ 14 }
				onClick={ ( event ) => onPreview( reel, event.currentTarget ) }
			/>

			<IconButton
				icon={ IconTrash }
				label={ __( 'Delete', 'wooreels' ) }
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
	const [ copied, setCopied ] = useState( false );
	const [ playing, setPlaying ] = useState( null );
	const [ duplicating, setDuplicating ] = useState( false );

	const [ search, setSearch ] = useState( '' );
	const [ available, setAvailable ] = useState( [] );
	const [ picking, setPicking ] = useState( true );
	const [ panelOpen, setPanelOpen ] = useState( false );

	const term = useDebounced( search, 300 );
	const baseline = useRef( '' );

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
	useEffect( () => {
		let cancelled = false;

		setPicking( true );

		reelsApi
			.list( {
				search: term,
				per_page: 60,
				orderby: 'id',
				order: 'DESC',
			} )
			.then( ( page ) => {
				if ( ! cancelled ) {
					setAvailable( page.items );
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setAvailable( [] );
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
	}, [ term ] );

	const markDirty = useCallback(
		( nextName, nextStyles, nextAttached ) => {
			setDirty(
				snapshot( nextName, nextStyles, nextAttached ) !==
					baseline.current
			);
		},
		[ snapshot ]
	);

	const setStyle = ( path, value ) => {
		const next = setPath( styles, path, value );

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
			baseline.current = snapshot(
				widget.name,
				widget.styles,
				widget.reels
			);
			setDirty( false );

			toasts.success(
				isNew && ! savedId
					? __( 'Widget created successfully!', 'wooreels' )
					: __( 'Changes saved successfully!', 'wooreels' )
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

	const removeWidget = async () => {
		try {
			await widgetsApi.remove( savedId );
			setDirty( false );
			toasts.success( __( 'Widget deleted successfully!', 'wooreels' ) );
			navigate( '#/widgets' );
		} catch ( error ) {
			toasts.error( error.message );
			setConfirming( false );
		}
	};

	const copyShortcode = async () => {
		const shortcode = `[wooreels id="${ savedId }"]`;

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
		toasts.success( __( 'Copied!', 'wooreels' ) );
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

			toasts.success( __( 'Widget created successfully!', 'wooreels' ) );
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

	return (
		<>
			<div className="wr-page-head wr-editor-head">
				<div className="wr-editor-head__left">
					<IconButton
						icon={ IconChevronLeft }
						label={ __( 'Back', 'wooreels' ) }
						onClick={ () => navigate( '#/widgets' ) }
					/>
					<input
						type="text"
						className="wr-editor-head__name"
						value={ name }
						placeholder={ __( 'Enter widget title', 'wooreels' ) }
						aria-label={ __( 'Widget Name', 'wooreels' ) }
						onChange={ ( event ) => rename( event.target.value ) }
					/>
				</div>

				<div className="wr-page-head__actions">
					{ savedId > 0 && (
						<button
							type="button"
							className="wr-shortcode"
							onClick={ copyShortcode }
						>
							<code>{ `[wooreels id="${ savedId }"]` }</code>
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
							label={ __( 'Duplicate', 'wooreels' ) }
							disabled={ duplicating || dirty }
							onClick={ duplicateWidget }
						/>
					) }

					{ savedId > 0 && (
						<IconButton
							icon={ IconTrash }
							label={ __( 'Delete', 'wooreels' ) }
							tone="danger"
							onClick={ () => setConfirming( true ) }
						/>
					) }

					<Button
						variant="primary"
						busy={ saving }
						disabled={ saving || ( ! dirty && savedId > 0 ) }
						onClick={ save }
					>
						{ savedId > 0
							? __( 'Update', 'wooreels' )
							: __( 'Save', 'wooreels' ) }
					</Button>
				</div>
			</div>

			<div
				className={ `wr-editor${ panelOpen ? ' is-panel-open' : '' }` }
			>
				<section
					className="wr-editor__pane wr-editor__picker"
					aria-label={ __( 'All Reels', 'wooreels' ) }
				>
					<header className="wr-editor__pane-head">
						<h2 className="wr-editor__pane-title">
							{ __( 'All Reels', 'wooreels' ) }
						</h2>
						<p className="wr-editor__pane-sub">
							{ __(
								'Choose reels to attach in this widget',
								'wooreels'
							) }
						</p>
					</header>

					<div className="wr-editor__pane-tools">
						<SearchInput
							value={ search }
							onChange={ setSearch }
							placeholder={ __( 'Search reels…', 'wooreels' ) }
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
									'wooreels'
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
					</div>
				</section>

				<section
					className="wr-editor__pane wr-editor__preview"
					aria-label={ __( 'Preview', 'wooreels' ) }
				>
					<header className="wr-editor__pane-head wr-editor__preview-head">
						<div>
							<h2 className="wr-editor__pane-title">
								{ __( 'Preview', 'wooreels' ) }
							</h2>
							<p className="wr-editor__pane-sub">
								{ __(
									'This is a representation of how the widget will appear to visitors.',
									'wooreels'
								) }
							</p>
						</div>

						<div
							className="wr-toggle-group"
							role="group"
							aria-label={ __( 'Device', 'wooreels' ) }
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
									'wooreels'
								) }
								text={ __(
									'Select some from the list on the left to get started.',
									'wooreels'
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
								/>
							</div>
						) }
					</div>

					{ attached.length > 0 && (
						<div className="wr-editor__attached">
							<div className="wr-editor__attached-head">
								<h3 className="wr-section-label">
									{ __( 'Attached videos', 'wooreels' ) }
								</h3>
								<span className="wr-editor__pane-sub">
									{ __(
										'These reels will be shown in this reel widget',
										'wooreels'
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
				</section>

				<section
					className="wr-editor__pane wr-editor__style"
					aria-label={ __( 'Customization', 'wooreels' ) }
				>
					<header className="wr-editor__pane-head">
						<h2 className="wr-editor__pane-title">
							{ __( 'Customization', 'wooreels' ) }
						</h2>
						<p className="wr-editor__pane-sub">
							{ __(
								'Customize your widget however you like',
								'wooreels'
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
					{ __( 'Customization', 'wooreels' ) }
				</button>
			</div>

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

			{ confirming && (
				<ConfirmDialog
					title={ __(
						'Are you sure you want to delete this widget?',
						'wooreels'
					) }
					onConfirm={ removeWidget }
					onClose={ () => setConfirming( false ) }
				>
					{ __(
						'This widget and its click statistics will be removed. Its reels stay in your library and keep working in any other widget.',
						'wooreels'
					) }
				</ConfirmDialog>
			) }
		</>
	);
};
