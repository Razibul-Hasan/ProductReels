/**
 * Reels step: the widget's reels in page order, and the library to add from.
 *
 * Order changes by drag (dnd-kit, the library 1.0.0 uses) or by keyboard on
 * a row's grip, with every move announced politely: "Weekend look moved to
 * position 2 of 5." The library below is the whole reel library, newest
 * first, 24 at a time; tapping a reel adds it to the end of the widget or
 * takes it out. "Add new reel" opens the reel sheet, and the reel it saves
 * joins this widget straight away.
 *
 * With WooCommerce, a switch on top chooses where the reels come from: the
 * ones picked here, or the reels tagged with the product being viewed. In
 * the second case the picked reels are the fallback for a product with
 * none, and for pages that aren't a product's.
 */

import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
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
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { boot, reels as reelsApi } from '../../api';
import { formatNumber } from '../../format';
import {
	Button,
	IconButton,
	PanelSection,
	ReelPicker,
	ReelRow,
	SearchField,
	Segmented,
	useToasts,
} from '../../components/pr';
import { useDebounced } from '../../hooks/use-debounced';
import { ReelEditor } from '../ReelEditor';

/** How many reels the library fetches per page (1.0.0's PICKER_PAGE). */
const PICKER_PAGE = 24;

/**
 * Where the widget's reels come from. Product tags need WooCommerce, so the
 * switch only shows with it.
 *
 * @param {Object}   props        Props.
 * @param {Object}   props.styles The widget's styles.
 * @param {Function} props.set    Style setter.
 * @return {Object|null} The section.
 */
const SourceSection = ( { styles, set } ) => {
	if ( ! boot.hasWoo ) {
		return null;
	}

	const source = styles.reelSource === 'product' ? 'product' : 'chosen';

	return (
		<PanelSection title={ __( 'Reels to show', 'productreels' ) }>
			<Segmented
				block
				label={ __( 'Reels to show', 'productreels' ) }
				value={ source }
				onChange={ ( value ) => set( 'reelSource', value ) }
				options={ [
					{
						value: 'chosen',
						label: __( 'Reels you pick', 'productreels' ),
					},
					{
						value: 'product',
						label: __( 'Current product’s reels', 'productreels' ),
					},
				] }
			/>
			<p className="pr-t-small pr-muted">
				{ source === 'product'
					? __(
							'On a product page, shows the reels tagged with that product. The reels you pick below show where a product has none, and on other pages.',
							'productreels'
						)
					: __(
							'Shows the reels you pick below, in this order, wherever the widget is placed.',
							'productreels'
						) }
			</p>
		</PanelSection>
	);
};

export const ReelsStep = ( {
	attached,
	setAttached,
	onPreview,
	styles,
	set,
	ready = true,
} ) => {
	const toasts = useToasts();
	const [ search, setSearch ] = useState( '' );
	const [ library, setLibrary ] = useState( [] );
	const [ total, setTotal ] = useState( 0 );
	const [ page, setPage ] = useState( 1 );
	const [ pages, setPages ] = useState( 1 );
	const [ picking, setPicking ] = useState( true );
	const [ failed, setFailed ] = useState( false );
	const [ loadingMore, setLoadingMore ] = useState( false );
	const [ creating, setCreating ] = useState( false );
	const [ version, setVersion ] = useState( 0 );
	const term = useDebounced( search, 300 );
	const searchField = useRef( null );
	const rows = useRef( null );
	const focusAfterRemove = useRef( null );

	const sensors = useSensors(
		useSensor( PointerSensor, { activationConstraint: { distance: 4 } } ),
		useSensor( KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		} )
	);

	const fetchPage = useCallback(
		( number ) =>
			reelsApi.list( {
				search: term,
				page: number,
				per_page: PICKER_PAGE,
				orderby: 'id',
				order: 'DESC',
			} ),
		[ term ]
	);

	useEffect( () => {
		let cancelled = false;

		setPicking( true );
		setFailed( false );

		fetchPage( 1 )
			.then( ( result ) => {
				if ( ! cancelled ) {
					setLibrary( result.items );
					setTotal( result.total );
					setPage( 1 );
					setPages( result.pages );
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setLibrary( [] );
					setFailed( true );
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
	}, [ fetchPage, version ] );

	// An empty widget starts in the library search.
	useEffect( () => {
		if ( ready && attached.length === 0 ) {
			searchField.current?.focus();
		}
		// Only when the step opens, or once the widget has loaded.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ ready ] );

	// After a remove, focus stays in the list: the row that took its place,
	// or the one above; the library search once the list is empty.
	useEffect( () => {
		const index = focusAfterRemove.current;

		if ( index === null ) {
			return;
		}

		focusAfterRemove.current = null;

		const buttons = rows.current?.querySelectorAll( '.pr-reelrow__remove' );

		if ( buttons?.length ) {
			buttons[ Math.min( index, buttons.length - 1 ) ].focus();
		} else {
			searchField.current?.focus();
		}
	}, [ attached ] );

	const loadMore = async () => {
		const next = page + 1;

		setLoadingMore( true );

		try {
			const result = await fetchPage( next );

			setLibrary( ( current ) => {
				const seen = new Set( current.map( ( reel ) => reel.id ) );

				return current.concat(
					result.items.filter( ( reel ) => ! seen.has( reel.id ) )
				);
			} );
			setPage( next );
			setPages( result.pages );
			setTotal( result.total );
		} catch ( error ) {
			toasts.error( error.message );
		} finally {
			setLoadingMore( false );
		}
	};

	const ids = attached.map( ( reel ) => reel.id );

	const toggle = ( reel ) =>
		setAttached(
			ids.includes( reel.id )
				? attached.filter( ( entry ) => entry.id !== reel.id )
				: [ ...attached, reel ]
		);

	const remove = ( reel ) => {
		focusAfterRemove.current = ids.indexOf( reel.id );
		setAttached( attached.filter( ( entry ) => entry.id !== reel.id ) );
	};

	const onDragEnd = ( { active, over } ) => {
		if ( ! over || active.id === over.id ) {
			return;
		}

		setAttached(
			arrayMove(
				attached,
				ids.indexOf( active.id ),
				ids.indexOf( over.id )
			)
		);
	};

	const titleOf = ( id ) =>
		attached.find( ( reel ) => reel.id === id )?.title || '';
	const position = ( id ) => ids.indexOf( id ) + 1;

	// dnd-kit reports "over" on every frame, the lifted reel itself first;
	// only a new position is worth saying.
	const lastOver = useRef( null );

	const announcements = {
		onDragStart: ( { active } ) => {
			lastOver.current = active.id;

			return sprintf(
				/* translators: 1: reel title, 2: its position, 3: how many reels. */
				__(
					'Picked up %1$s, position %2$d of %3$d. Use the arrow keys to move it, Space to drop it, Escape to cancel.',
					'productreels'
				),
				titleOf( active.id ),
				position( active.id ),
				ids.length
			);
		},
		onDragOver: ( { active, over } ) => {
			if ( ! over || over.id === lastOver.current ) {
				return undefined;
			}

			lastOver.current = over.id;

			return sprintf(
				/* translators: 1: reel title, 2: its new position, 3: how many reels. */
				__( '%1$s moved to position %2$d of %3$d.', 'productreels' ),
				titleOf( active.id ),
				position( over.id ),
				ids.length
			);
		},
		onDragEnd: ( { active, over } ) =>
			sprintf(
				/* translators: 1: reel title, 2: its position, 3: how many reels. */
				__( '%1$s dropped at position %2$d of %3$d.', 'productreels' ),
				titleOf( active.id ),
				position( over ? over.id : active.id ),
				ids.length
			),
		onDragCancel: ( { active } ) =>
			sprintf(
				/* translators: 1: reel title, 2: its position, 3: how many reels. */
				__(
					'Moving %1$s was cancelled. It is back at position %2$d of %3$d.',
					'productreels'
				),
				titleOf( active.id ),
				position( active.id ),
				ids.length
			),
	};

	let libraryBody;

	if ( picking ) {
		libraryBody = (
			<div className="pr-pickgrid" aria-busy="true">
				{ [ 0, 1, 2, 3, 4, 5 ].map( ( index ) => (
					<span key={ index } className="pr-pick pr-pick--skeleton">
						<span className="pr-pick__media" />
						<span className="pr-pick__line" />
					</span>
				) ) }
			</div>
		);
	} else if ( failed ) {
		libraryBody = (
			<div className="pr-libnote">
				<p className="pr-t-small">
					{ __( 'Couldn’t load your reels.', 'productreels' ) }
				</p>
				<Button size="sm" onClick={ () => setVersion( version + 1 ) }>
					{ __( 'Try again', 'productreels' ) }
				</Button>
			</div>
		);
	} else if ( library.length === 0 ) {
		libraryBody = term ? (
			<div className="pr-libnote">
				<p className="pr-t-small">
					{ sprintf(
						/* translators: %s: what was searched for. */
						__( 'No reels match “%s”.', 'productreels' ),
						term
					) }
				</p>
				<Button size="sm" icon="x" onClick={ () => setSearch( '' ) }>
					{ __( 'Clear search', 'productreels' ) }
				</Button>
			</div>
		) : (
			<div className="pr-libnote">
				<p className="pr-t-small">
					{ __(
						'Your library is empty. Add a reel to get started.',
						'productreels'
					) }
				</p>
				<Button
					size="sm"
					icon="plus"
					onClick={ () => setCreating( true ) }
				>
					{ __( 'Add reel', 'productreels' ) }
				</Button>
			</div>
		);
	} else {
		libraryBody = (
			<>
				<ReelPicker
					reels={ library }
					added={ ids }
					onToggle={ toggle }
				/>
				{ page < pages && (
					<div className="pr-libmore">
						<span className="pr-t-small pr-muted">
							{ sprintf(
								/* translators: 1: how many are shown, 2: how many there are in all. */
								__( 'Showing %1$s of %2$s', 'productreels' ),
								formatNumber( library.length ),
								formatNumber( total )
							) }
						</span>
						<Button
							size="sm"
							busy={ loadingMore }
							onClick={ loadMore }
						>
							{ __( 'Load more', 'productreels' ) }
						</Button>
					</div>
				) }
			</>
		);
	}

	return (
		<>
			<SourceSection styles={ styles } set={ set } />

			{ attached.length > 0 && (
				<PanelSection>
					<DndContext
						sensors={ sensors }
						collisionDetection={ closestCenter }
						onDragEnd={ onDragEnd }
						accessibility={ {
							announcements,
							screenReaderInstructions: {
								draggable: __(
									'To reorder, press Space or Enter on the grip, move the reel with the arrow keys, and press Space to drop it. Escape cancels.',
									'productreels'
								),
							},
						} }
					>
						<SortableContext
							items={ ids }
							strategy={ verticalListSortingStrategy }
						>
							<div
								ref={ rows }
								className="pr-reelrows"
								role="list"
								aria-label={ sprintf(
									/* translators: %s: number of reels. */
									_n(
										'%s reel in this widget',
										'%s reels in this widget',
										ids.length,
										'productreels'
									),
									formatNumber( ids.length )
								) }
							>
								{ attached.map( ( reel ) => (
									<div role="listitem" key={ reel.id }>
										<ReelRow
											reel={ reel }
											onPreview={ onPreview }
											onRemove={ remove }
										/>
									</div>
								) ) }
							</div>
						</SortableContext>
					</DndContext>
				</PanelSection>
			) }

			<PanelSection
				title={ __( 'Add from your library', 'productreels' ) }
				aside={ __( 'Tap to add', 'productreels' ) }
			>
				<div className="pr-libtools">
					<SearchField
						ref={ searchField }
						placeholder={ __( 'Search reels', 'productreels' ) }
						value={ search }
						onChange={ ( event ) =>
							setSearch( event.target.value )
						}
						onKeyDown={ ( event ) => {
							if ( event.key === 'Escape' && search ) {
								event.stopPropagation();
								setSearch( '' );
							}
						} }
					/>
					<IconButton
						icon="plus"
						label={ __( 'Add new reel', 'productreels' ) }
						size="md"
						variant="outline"
						onClick={ () => setCreating( true ) }
					/>
				</div>
				{ libraryBody }
			</PanelSection>

			{ creating && (
				<ReelEditor
					reelId={ 0 }
					onClose={ () => setCreating( false ) }
					onSaved={ ( reel ) => {
						setCreating( false );

						// A reel made from here joins the widget straight away,
						// and shows up in the library.
						if ( reel && reel.id ) {
							setAttached( [ ...attached, reel ] );
							setVersion( version + 1 );
						}
					} }
				/>
			) }
		</>
	);
};
