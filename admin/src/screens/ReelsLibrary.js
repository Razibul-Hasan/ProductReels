/**
 * Reels: the library.
 *
 * A grid of covers (or a list), narrowed by filter chips whose counts come
 * from the server and follow the search. Covers only: video plays in Preview,
 * which opens the real storefront player. Selecting cards raises the bulk
 * bar; deleting a reel removes it from every widget it's in.
 */

import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Player } from '@shared/player/Player';
import { boot, reels as reelsApi } from '../api';
import {
	Button,
	Checkbox,
	ConfirmDialog,
	EmptyState,
	FilterChips,
	FloatingBar,
	Menu,
	Notice,
	PageHeader,
	ReelCard,
	ReelCover,
	SearchField,
	Segmented,
	Skeleton,
	reelLinkCounts,
	reelMenuItems,
	useToasts,
} from '../components/pr';
import { formatNumber } from '../format';
import { useDebounced } from '../hooks/use-debounced';
import { editorServices } from '../preview-services';
import { ReelEditor } from './ReelEditor';

/** How many reels one page of the library holds (as in 1.0.0). */
const PAGE_SIZE = 60;

/** Where this browser remembers grid or list. */
const VIEW_KEY = 'productreels_reels_view';

const FILTERS = {
	all: __( 'All', 'productreels' ),
	products: __( 'Tagged products', 'productreels' ),
	buttons: __( 'With a button', 'productreels' ),
	unused: __( 'Not in a widget', 'productreels' ),
};

const EMPTY_FILTER_TITLES = {
	products: __( 'No reels have tagged products', 'productreels' ),
	buttons: __( 'No reels have a button', 'productreels' ),
	unused: __( 'Every reel is in a widget', 'productreels' ),
};

const readView = () => {
	try {
		return window.localStorage.getItem( VIEW_KEY ) === 'list'
			? 'list'
			: 'grid';
	} catch ( error ) {
		return 'grid';
	}
};

const saveView = ( view ) => {
	try {
		window.localStorage.setItem( VIEW_KEY, view );
	} catch ( error ) {
		// Private window or blocked storage: the choice lasts this visit.
	}
};

const ReelTable = ( {
	items,
	selected,
	onSelect,
	onSelectAll,
	onOpen,
	onPreview,
	onDelete,
} ) => {
	const wrap = useRef( null );
	const shown = items.filter( ( reel ) => selected.includes( reel.id ) );
	const all = items.length > 0 && shown.length === items.length;

	return (
		<div ref={ wrap } className="pr-tablewrap pr-reeltable">
			<table className="pr-table">
				<thead>
					<tr className="pr-t-label">
						<th scope="col" className="pr-reeltable__check">
							<Checkbox
								checked={ all }
								onChange={ onSelectAll }
								aria-label={ __(
									'Select every reel shown',
									'productreels'
								) }
							/>
						</th>
						<th scope="col">
							<span className="pr-sr">
								{ __( 'Cover', 'productreels' ) }
							</span>
						</th>
						<th scope="col">{ __( 'Title', 'productreels' ) }</th>
						<th scope="col" className="num">
							{ __( 'Products', 'productreels' ) }
						</th>
						<th scope="col" className="num">
							{ __( 'Buttons', 'productreels' ) }
						</th>
						<th scope="col" className="num">
							{ __( 'Widgets', 'productreels' ) }
						</th>
						<th scope="col" className="num">
							{ __( 'Views', 'productreels' ) }
						</th>
						<th scope="col">
							<span className="pr-sr">
								{ __( 'Actions', 'productreels' ) }
							</span>
						</th>
					</tr>
				</thead>
				<tbody>
					{ items.map( ( reel ) => {
						const { products, buttons } = reelLinkCounts( reel );

						return (
							<tr
								key={ reel.id }
								data-selected={
									selected.includes( reel.id )
										? 'true'
										: undefined
								}
							>
								<td className="pr-reeltable__check">
									<Checkbox
										checked={ selected.includes( reel.id ) }
										onChange={ ( checked ) =>
											onSelect( reel.id, checked )
										}
										aria-label={ sprintf(
											/* translators: %s: reel title. */
											__( 'Select %s', 'productreels' ),
											reel.title
										) }
									/>
								</td>
								<td>
									<span className="pr-reelrow__thumb">
										<ReelCover reel={ reel } />
									</span>
								</td>
								<td>
									<button
										type="button"
										className="pr-reeltable__title pr-t-body-strong"
										onClick={ () => onOpen( reel ) }
									>
										{ reel.title }
									</button>
								</td>
								<td className="num pr-t-body">
									{ formatNumber( products ) }
								</td>
								<td className="num pr-t-body">
									{ formatNumber( buttons ) }
								</td>
								<td className="num pr-t-body">
									{ formatNumber( reel.widget_count || 0 ) }
								</td>
								<td className="num pr-t-body">
									{ formatNumber( reel.view_count ) }
								</td>
								<td>
									<div className="pr-rowactions">
										<Menu
											label={ sprintf(
												/* translators: %s: reel title. */
												__(
													'More actions for %s',
													'productreels'
												),
												reel.title
											) }
											items={ reelMenuItems( {
												// The menu has just given focus back to its trigger.
												onPreview: () =>
													onPreview(
														reel,
														wrap.current
															?.ownerDocument
															.activeElement
													),
												onOpen: () => onOpen( reel ),
												onDelete: () =>
													onDelete( reel ),
											} ) }
										/>
									</div>
								</td>
							</tr>
						);
					} ) }
				</tbody>
			</table>
		</div>
	);
};

export const ReelsLibrary = () => {
	const toasts = useToasts();
	const [ search, setSearch ] = useState( '' );
	const [ filter, setFilter ] = useState( 'all' );
	const [ view, setView ] = useState( readView );
	const [ items, setItems ] = useState( [] );
	const [ total, setTotal ] = useState( 0 );
	const [ counts, setCounts ] = useState( null );
	const [ libraryTotal, setLibraryTotal ] = useState( null );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState( '' );
	const [ selected, setSelected ] = useState( [] );
	const [ editing, setEditing ] = useState( null );
	const [ previewing, setPreviewing ] = useState( null );
	const [ confirming, setConfirming ] = useState( null );
	const [ deleting, setDeleting ] = useState( false );
	const [ page, setPage ] = useState( 1 );
	const [ pages, setPages ] = useState( 1 );
	const [ loadingMore, setLoadingMore ] = useState( false );
	const latest = useRef( 0 );

	const term = useDebounced( search, 300 );

	const fetchPage = useCallback(
		( number ) =>
			reelsApi.list( {
				search: term,
				filter: filter === 'all' ? undefined : filter,
				page: number,
				per_page: PAGE_SIZE,
				orderby: 'id',
				order: 'DESC',
			} ),
		[ term, filter ]
	);

	const loadCounts = useCallback( async () => {
		const next = await reelsApi.counts( { search: term } );

		setCounts( next );

		if ( term === '' ) {
			setLibraryTotal( next.all );
		}
	}, [ term ] );

	/** Start over from the first page: a new search or filter, or after a change. */
	const load = useCallback( async () => {
		const request = ++latest.current;

		setLoading( true );
		setError( '' );

		try {
			const [ first ] = await Promise.all( [
				fetchPage( 1 ),
				loadCounts(),
			] );

			if ( request !== latest.current ) {
				return;
			}

			setItems( first.items );
			setTotal( first.total );
			setPage( 1 );
			setPages( first.pages );
			setSelected( ( current ) =>
				current.filter( ( id ) =>
					first.items.some( ( reel ) => reel.id === id )
				)
			);
		} catch ( requestError ) {
			if ( request === latest.current ) {
				setError( requestError.message );
			}
		} finally {
			if ( request === latest.current ) {
				setLoading( false );
			}
		}
	}, [ fetchPage, loadCounts ] );

	useEffect( () => {
		load();
	}, [ load ] );

	const loadMore = async () => {
		const next = page + 1;
		const request = latest.current;

		setLoadingMore( true );

		try {
			const more = await fetchPage( next );

			if ( request !== latest.current ) {
				return;
			}

			// A reel added or deleted meanwhile shifts the pages; never
			// show one twice.
			setItems( ( current ) => {
				const seen = new Set( current.map( ( reel ) => reel.id ) );

				return current.concat(
					more.items.filter( ( reel ) => ! seen.has( reel.id ) )
				);
			} );
			setTotal( more.total );
			setPage( next );
			setPages( more.pages );
		} catch ( requestError ) {
			toasts.error( requestError.message );
		} finally {
			setLoadingMore( false );
		}
	};

	const select = ( id, checked ) =>
		setSelected( ( current ) =>
			checked
				? [ ...current.filter( ( entry ) => entry !== id ), id ]
				: current.filter( ( entry ) => entry !== id )
		);

	const selectAll = ( checked ) =>
		setSelected( checked ? items.map( ( reel ) => reel.id ) : [] );

	const changeView = ( next ) => {
		setView( next );
		saveView( next );
	};

	const removeOne = async () => {
		setDeleting( true );

		try {
			await reelsApi.remove( confirming.reel.id );
			setConfirming( null );
			toasts.success( __( 'Reel deleted', 'productreels' ), {
				icon: 'trash',
			} );
			await load();
		} catch ( requestError ) {
			toasts.error( requestError.message );
		} finally {
			setDeleting( false );
		}
	};

	const removeMany = async () => {
		setDeleting( true );

		try {
			const result = await reelsApi.bulkRemove( selected );

			setConfirming( null );
			setSelected( result.failed || [] );

			if ( result.deleted > 0 ) {
				toasts.success(
					sprintf(
						/* translators: %s: number of reels deleted. */
						_n(
							'%s reel deleted',
							'%s reels deleted',
							result.deleted,
							'productreels'
						),
						formatNumber( result.deleted )
					),
					{ icon: 'trash' }
				);
			}

			if ( result.failed?.length > 0 ) {
				toasts.error(
					sprintf(
						/* translators: %s: number of reels that could not be deleted. */
						_n(
							'Couldn’t delete %s reel. It’s still selected.',
							'Couldn’t delete %s reels. They’re still selected.',
							result.failed.length,
							'productreels'
						),
						formatNumber( result.failed.length )
					)
				);
			}

			await load();
		} catch ( requestError ) {
			toasts.error( requestError.message );
		} finally {
			setDeleting( false );
		}
	};

	/**
	 * Open the real player on one reel, with every file and link it has.
	 *
	 * @param {Object}      reel The reel as listed.
	 * @param {HTMLElement} from The control that opened it, for focus return.
	 */
	const preview = async ( reel, from ) => {
		try {
			const full = await reelsApi.get( reel.id );

			setPreviewing( { reel: full, from } );
		} catch ( requestError ) {
			toasts.error( requestError.message );
		}
	};

	const clearSearch = () => setSearch( '' );
	const showAll = () => setFilter( 'all' );
	const hasLibrary = libraryTotal === null || libraryTotal > 0;

	let body;

	if ( error ) {
		body = (
			<Notice
				tone="danger"
				title={ __( 'Couldn’t load your reels.', 'productreels' ) }
				actions={
					<Button size="sm" onClick={ load }>
						{ __( 'Try again', 'productreels' ) }
					</Button>
				}
			>
				{ error }
			</Notice>
		);
	} else if ( loading ) {
		body = (
			<Skeleton
				variant={ view === 'list' ? 'rows' : 'cards' }
				count={ 8 }
				label={ __( 'Loading reels…', 'productreels' ) }
			/>
		);
	} else if ( items.length === 0 && term !== '' ) {
		body = (
			<EmptyState
				panel
				icon="search"
				title={ sprintf(
					/* translators: %s: the search term. */
					__( 'No reels match “%s”', 'productreels' ),
					term
				) }
				description={
					filter === 'all'
						? __(
								'Check the spelling, or try another title.',
								'productreels'
							)
						: sprintf(
								/* translators: %s: the filter that is on, e.g. "With a button". */
								__(
									'Check the spelling, or try another title. The “%s” filter is on.',
									'productreels'
								),
								FILTERS[ filter ]
							)
				}
				actions={
					<>
						<Button icon="x" onClick={ clearSearch }>
							{ __( 'Clear search', 'productreels' ) }
						</Button>
						{ filter !== 'all' && (
							<Button onClick={ showAll }>
								{ __( 'Show all reels', 'productreels' ) }
							</Button>
						) }
					</>
				}
			/>
		);
	} else if ( items.length === 0 && filter !== 'all' && hasLibrary ) {
		body = (
			<EmptyState
				panel
				icon={ filter === 'unused' ? 'success' : 'film' }
				title={ EMPTY_FILTER_TITLES[ filter ] }
				description={ sprintf(
					/* translators: %s: the filter that is on, e.g. "With a button". */
					__( 'The “%s” filter is on.', 'productreels' ),
					FILTERS[ filter ]
				) }
				actions={
					<Button onClick={ showAll }>
						{ __( 'Show all reels', 'productreels' ) }
					</Button>
				}
			/>
		);
	} else if ( items.length === 0 ) {
		body = (
			<EmptyState
				panel
				title={ __( 'No reels yet', 'productreels' ) }
				description={ __(
					'A reel is one vertical video and the products you sell from it.',
					'productreels'
				) }
				actions={
					<Button
						variant="primary"
						icon="plus"
						onClick={ () => setEditing( { id: 0 } ) }
					>
						{ __( 'Add reel', 'productreels' ) }
					</Button>
				}
			/>
		);
	} else {
		body = (
			<>
				{ view === 'list' ? (
					<ReelTable
						items={ items }
						selected={ selected }
						onSelect={ select }
						onSelectAll={ selectAll }
						onOpen={ setEditing }
						onPreview={ preview }
						onDelete={ ( reel ) => setConfirming( { reel } ) }
					/>
				) : (
					<div
						className="pr-reelgrid"
						data-selecting={
							selected.length > 0 ? 'true' : undefined
						}
					>
						{ items.map( ( reel ) => (
							<ReelCard
								key={ reel.id }
								reel={ reel }
								selected={ selected.includes( reel.id ) }
								onSelect={ ( checked ) =>
									select( reel.id, checked )
								}
								onOpen={ () => setEditing( reel ) }
								onPreview={ ( from ) => preview( reel, from ) }
								onDelete={ () => setConfirming( { reel } ) }
							/>
						) ) }
					</div>
				) }

				{ total > PAGE_SIZE && (
					<div className="pr-loadmore">
						{ page < pages && (
							<Button busy={ loadingMore } onClick={ loadMore }>
								{ __( 'Load more', 'productreels' ) }
							</Button>
						) }
						<span
							className="pr-loadmore__text pr-t-small"
							aria-live="polite"
						>
							{ sprintf(
								/* translators: 1: reels shown so far, 2: reels in this list. */
								__( 'Showing %1$s of %2$s', 'productreels' ),
								formatNumber( items.length ),
								formatNumber( total )
							) }
						</span>
					</div>
				) }
			</>
		);
	}

	return (
		<>
			<PageHeader
				title={ __( 'Reels', 'productreels' ) }
				count={ libraryTotal || null }
				description={ __(
					'Each reel is one vertical video and the products it sells. Use it in as many widgets as you like.',
					'productreels'
				) }
				actions={
					<>
						<SearchField
							value={ search }
							onChange={ ( event ) =>
								setSearch( event.target.value )
							}
							onKeyDown={ ( event ) => {
								if ( event.key === 'Escape' && search !== '' ) {
									setSearch( '' );
								}
							} }
							placeholder={ __( 'Search reels', 'productreels' ) }
							width={ 240 }
						/>
						<Button
							variant="primary"
							icon="plus"
							onClick={ () => setEditing( { id: 0 } ) }
						>
							{ __( 'Add reel', 'productreels' ) }
						</Button>
					</>
				}
			/>

			{ hasLibrary && ! error && (
				<div className="pr-libbar">
					<FilterChips
						label={ __( 'Show reels', 'productreels' ) }
						value={ filter }
						onChange={ setFilter }
						items={ Object.keys( FILTERS ).map( ( id ) => ( {
							id,
							label: FILTERS[ id ],
							count: counts ? counts[ id ] : null,
						} ) ) }
					/>
					<Segmented
						iconOnly
						label={ __( 'View', 'productreels' ) }
						value={ view }
						onChange={ changeView }
						options={ [
							{
								value: 'grid',
								label: __( 'Grid', 'productreels' ),
								icon: 'grid',
							},
							{
								value: 'list',
								label: __( 'List', 'productreels' ),
								icon: 'list',
							},
						] }
					/>
				</div>
			) }

			{ body }

			{ selected.length > 0 && (
				<FloatingBar
					text={ sprintf(
						/* translators: %s: number of selected reels. */
						_n(
							'%s reel selected',
							'%s reels selected',
							selected.length,
							'productreels'
						),
						formatNumber( selected.length )
					) }
				>
					<Button
						variant="on-ink"
						size="sm"
						onClick={ () => setSelected( [] ) }
					>
						{ __( 'Clear', 'productreels' ) }
					</Button>
					<Button
						variant="danger"
						size="sm"
						icon="trash"
						onClick={ () => setConfirming( { bulk: true } ) }
					>
						{ __( 'Delete selected', 'productreels' ) }
					</Button>
				</FloatingBar>
			) }

			{ editing && (
				<ReelEditor
					reelId={ editing.id }
					onClose={ () => setEditing( null ) }
					onSaved={ async () => {
						setEditing( null );
						await load();
					} }
				/>
			) }

			{ previewing && (
				<Player
					widget={ {
						id: 0,
						name: previewing.reel.title,
						reels: [ previewing.reel ],
					} }
					styles={ boot.defaults }
					services={ editorServices }
					returnFocusTo={ previewing.from }
					onClose={ () => setPreviewing( null ) }
				/>
			) }

			{ confirming?.bulk && (
				<ConfirmDialog
					title={ sprintf(
						/* translators: %s: number of reels. */
						_n(
							'Delete %s reel?',
							'Delete %s reels?',
							selected.length,
							'productreels'
						),
						formatNumber( selected.length )
					) }
					confirm={ _n(
						'Delete reel',
						'Delete reels',
						selected.length,
						'productreels'
					) }
					busy={ deleting }
					onConfirm={ removeMany }
					onClose={ () => setConfirming( null ) }
				>
					{ _n(
						'It’ll be removed from every widget it’s in. This can’t be undone.',
						'They’ll be removed from every widget they’re in. This can’t be undone.',
						selected.length,
						'productreels'
					) }
				</ConfirmDialog>
			) }

			{ confirming?.reel && (
				<ConfirmDialog
					title={ sprintf(
						/* translators: %s: reel title. */
						__( 'Delete “%s”?', 'productreels' ),
						confirming.reel.title
					) }
					confirm={ __( 'Delete reel', 'productreels' ) }
					busy={ deleting }
					onConfirm={ removeOne }
					onClose={ () => setConfirming( null ) }
				>
					{ __(
						'It’ll be removed from every widget it’s in. This can’t be undone.',
						'productreels'
					) }
				</ConfirmDialog>
			) }
		</>
	);
};
