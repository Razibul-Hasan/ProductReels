/**
 * Widgets: the home screen.
 *
 * Before any widget has a view, the three-step guide. After that: the store's
 * totals, its most-watched reels and every widget in a sortable table. The
 * totals come from GET /overview and are counted exactly as 1.0.0 counted
 * them; the table still loads every widget and sorts on the client, as 1.0.0
 * did, so any column sorts without a round trip.
 */

import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
// wp-date is a core script handle: the build externalises it, nothing to install.
// eslint-disable-next-line import/no-unresolved
import { gmdateI18n, getSettings } from '@wordpress/date';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Icon } from '@shared/Icon';
import {
	overview as overviewApi,
	reels as reelsApi,
	widgets as widgetsApi,
} from '../api';
import {
	Button,
	ConfirmDialog,
	EmptyState,
	LayoutBadge,
	MetricBand,
	Menu,
	Notice,
	PageHeader,
	ReelStack,
	SearchField,
	ShortcodeChip,
	Skeleton,
	SortHeader,
	StepGuide,
	copyText,
	useToasts,
} from '../components/pr';
import { formatNumber, formatRate } from '../format';
import { useDebounced } from '../hooks/use-debounced';
import { ReelEditor } from './ReelEditor';
import { CreateWidgetDialog } from './CreateWidget';

/** How long a duplicated row stays highlighted. */
const HIGHLIGHT_MS = 2400;

/** Top reels show only when at least this many reels have views. */
const TOP_REELS_MIN = 3;

const shortcodeOf = ( id ) => `[productreels id="${ id }"]`;

const ctrOf = ( widget ) =>
	widget.view_total > 0 ? widget.click_total / widget.view_total : 0;

/**
 * A stored date in the site's own date format.
 *
 * The column holds the database's wall-clock time with no zone, so it is
 * read and printed as UTC: the day shown is the day stored, as in 1.0.0.
 *
 * @param {string} value "Y-m-d H:i:s".
 * @return {string} The date.
 */
const formatDate = ( value ) => {
	if ( ! value ) {
		return '';
	}

	const format = getSettings()?.formats?.date || 'F j, Y';

	return gmdateI18n( format, `${ value.replace( ' ', 'T' ) }Z` );
};

/**
 * Every widget matching a search, however many pages the API splits it into.
 *
 * @param {string} search The search term.
 * @return {Promise<{items: Array, total: number}>} Every matching widget.
 */
const loadAll = async ( search ) => {
	const params = { search, per_page: 100, orderby: 'id', order: 'DESC' };
	const first = await widgetsApi.list( { ...params, page: 1 } );
	let items = first.items;

	for ( let page = 2; page <= first.pages; page++ ) {
		const next = await widgetsApi.list( { ...params, page } );

		items = items.concat( next.items );
	}

	return { items, total: first.total };
};

/**
 * The step the guide is on, from the overview: 0 no reels, 1 no widgets,
 * 2 not on a page yet, 3 set up (no guide). `placed` is true once a widget
 * has a view, is found on a page, or the merchant marked the step done.
 *
 * @param {Object} data The overview.
 * @return {number} The step.
 */
const guideStep = ( data ) => {
	if ( data.reels_total === 0 ) {
		return 0;
	}

	if ( data.widgets === 0 ) {
		return 1;
	}

	return data.views > 0 || data.placed ? 3 : 2;
};

const Metrics = ( { data } ) => {
	const placeholder = <span className="pr-metric__ph" aria-hidden="true" />;
	const unused = data ? data.reels_total - data.reels_in_use : 0;
	let reelsHint = __( 'Every reel is in a widget', 'productreels' );

	if ( unused > 0 ) {
		reelsHint = sprintf(
			/* translators: %s: number of reels that are not in any widget. */
			_n(
				'%s reel isn’t in a widget',
				'%s reels aren’t in a widget',
				unused,
				'productreels'
			),
			formatNumber( unused )
		);
	}

	return (
		<MetricBand
			items={ [
				{
					label: __( 'Views', 'productreels' ),
					icon: 'eye',
					value: data ? formatNumber( data.views ) : placeholder,
					hint: __(
						'Counted after one second of playback',
						'productreels'
					),
				},
				{
					label: __( 'Clicks', 'productreels' ),
					icon: 'click',
					value: data ? formatNumber( data.clicks ) : placeholder,
					hint: __( 'Buttons and product cards', 'productreels' ),
				},
				{
					label: __( 'Click rate', 'productreels' ),
					icon: 'percent',
					value: data
						? formatRate( data.clicks, data.views )
						: placeholder,
					hint: __( 'Clicks per view', 'productreels' ),
				},
				{
					label: __( 'Reels in use', 'productreels' ),
					icon: 'film',
					value: data
						? sprintf(
								/* translators: 1: reels in at least one widget, 2: all reels. */
								__( '%1$s of %2$s', 'productreels' ),
								formatNumber( data.reels_in_use ),
								formatNumber( data.reels_total )
							)
						: placeholder,
					hint: data ? reelsHint : '',
				},
			] }
		/>
	);
};

const TopReels = ( { reels, onOpen, onSeeAll } ) => (
	<section className="pr-topreels" aria-labelledby="pr-topreels-title">
		<div className="pr-topreels__head">
			<h2 id="pr-topreels-title" className="pr-t-title">
				{ __( 'Top reels', 'productreels' ) }
			</h2>
			<a
				href="#/reels"
				className="pr-topreels__all pr-t-label"
				onClick={ ( event ) => {
					event.preventDefault();
					onSeeAll();
				} }
			>
				{ __( 'See all reels', 'productreels' ) }
			</a>
		</div>
		<ol className="pr-topreels__list">
			{ reels.map( ( reel, index ) => (
				<li className="pr-topreel" key={ reel.id }>
					<button
						type="button"
						className="prs-tile"
						onClick={ () => onOpen( reel.id ) }
						aria-label={ sprintf(
							/* translators: %s: the name of a reel, widget or button. */
							__( 'Edit %s', 'productreels' ),
							reel.title
						) }
					>
						<span className="prs-tile__media">
							{ reel.thumbnail && (
								<img
									src={ reel.thumbnail }
									alt=""
									loading="lazy"
									decoding="async"
								/>
							) }
						</span>
					</button>
					<span
						className="pr-topreel__rank pr-t-caption"
						aria-hidden="true"
					>
						{ index + 1 }
					</span>
					<span className="pr-topreel__title pr-t-body-strong">
						{ reel.title }
					</span>
					<span className="pr-topreel__meta pr-t-small">
						<span className="pr-topreel__views">
							<Icon name="eye" size={ 13 } />
							<span className="pr-sr">
								{ __( 'Views:', 'productreels' ) }
							</span>
							{ formatNumber( reel.view_count ) }
						</span>
						<span>
							{ sprintf(
								/* translators: %s: click rate, e.g. 9.2%. */
								__( '%s click rate', 'productreels' ),
								formatRate( reel.clicks, reel.view_count )
							) }
						</span>
					</span>
				</li>
			) ) }
		</ol>
	</section>
);

const WidgetTable = ( {
	items,
	sort,
	onSort,
	highlight,
	busyId,
	navigate,
	onDuplicate,
	onCopy,
	onDelete,
} ) => (
	<div className="pr-tablewrap pr-widgettable">
		<table className="pr-table">
			<thead>
				<tr className="pr-t-label">
					<SortHeader
						column="name"
						label={ __( 'Widget', 'productreels' ) }
						sort={ sort }
						onSort={ onSort }
					/>
					<SortHeader
						column="reel_count"
						label={ __( 'Reels', 'productreels' ) }
						sort={ sort }
						onSort={ onSort }
						numeric
					/>
					<th scope="col">{ __( 'Shortcode', 'productreels' ) }</th>
					<SortHeader
						column="view_total"
						label={ __( 'Views', 'productreels' ) }
						sort={ sort }
						onSort={ onSort }
						numeric
					/>
					<SortHeader
						column="click_total"
						label={ __( 'Clicks', 'productreels' ) }
						sort={ sort }
						onSort={ onSort }
						numeric
					/>
					<SortHeader
						column="ctr"
						label={ __( 'Click rate', 'productreels' ) }
						sort={ sort }
						onSort={ onSort }
						numeric
					/>
					<SortHeader
						column="created_at"
						label={ __( 'Created', 'productreels' ) }
						sort={ sort }
						onSort={ onSort }
					/>
					<th scope="col">
						<span className="pr-sr">
							{ __( 'Actions', 'productreels' ) }
						</span>
					</th>
				</tr>
			</thead>
			<tbody>
				{ items.map( ( widget ) => (
					<tr
						key={ widget.id }
						data-highlight={
							highlight === widget.id ? 'true' : undefined
						}
					>
						<td>
							<div className="pr-wname">
								<ReelStack
									posters={
										widget.posters?.length
											? widget.posters
											: [ '' ]
									}
									round={ widget.shape === 'circle' }
								/>
								<div className="pr-wname__text">
									<a
										href={ `#/widgets/${ widget.id }` }
										className="pr-wname__title pr-t-body-strong"
									>
										{ widget.name }
									</a>
									<span className="pr-wname__meta">
										<LayoutBadge
											layout={ widget.template }
										/>
										<span className="pr-t-caption">
											#{ widget.id }
										</span>
									</span>
								</div>
							</div>
						</td>
						<td className="num pr-t-body">
							{ formatNumber( widget.reel_count ) }
						</td>
						<td>
							<ShortcodeChip code={ shortcodeOf( widget.id ) } />
						</td>
						<td className="num pr-t-body">
							{ formatNumber( widget.view_total ) }
						</td>
						<td className="num pr-t-body">
							{ formatNumber( widget.click_total ) }
						</td>
						<td className="num pr-t-body">
							{ formatRate(
								widget.click_total,
								widget.view_total
							) }
						</td>
						<td className="muted pr-t-body">
							{ formatDate( widget.created_at ) }
						</td>
						<td>
							<div className="pr-rowactions">
								<Button
									size="sm"
									icon="pencil"
									onClick={ () =>
										navigate( `#/widgets/${ widget.id }` )
									}
									aria-label={ sprintf(
										/* translators: %s: the name of a reel, widget or button. */
										__( 'Edit %s', 'productreels' ),
										widget.name
									) }
								>
									{ __( 'Edit', 'productreels' ) }
								</Button>
								<Menu
									label={ sprintf(
										/* translators: %s: a reel title or widget name. */
										__(
											'More actions for %s',
											'productreels'
										),
										widget.name
									) }
									items={ [
										{
											icon: 'chart',
											label: __(
												'Statistics',
												'productreels'
											),
											onSelect: () =>
												navigate(
													`#/widgets/${ widget.id }/stats`
												),
										},
										{
											icon: 'duplicate',
											label: __(
												'Duplicate',
												'productreels'
											),
											disabled: busyId === widget.id,
											onSelect: () =>
												onDuplicate( widget ),
										},
										{
											icon: 'copy',
											label: __(
												'Copy shortcode',
												'productreels'
											),
											onSelect: () => onCopy( widget ),
										},
										'-',
										{
											icon: 'trash',
											label: __(
												'Delete widget',
												'productreels'
											),
											danger: true,
											onSelect: () => onDelete( widget ),
										},
									] }
								/>
							</div>
						</td>
					</tr>
				) ) }
			</tbody>
		</table>
	</div>
);

export const WidgetsList = ( { navigate, creating = false } ) => {
	const toasts = useToasts();
	const [ search, setSearch ] = useState( '' );
	const [ items, setItems ] = useState( [] );
	const [ data, setData ] = useState( null );
	const [ covers, setCovers ] = useState( [] );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState( '' );
	const [ confirming, setConfirming ] = useState( null );
	const [ deleting, setDeleting ] = useState( false );
	const [ busyId, setBusyId ] = useState( 0 );
	const [ highlight, setHighlight ] = useState( 0 );
	const [ editingReel, setEditingReel ] = useState( null );
	const [ sort, setSort ] = useState( {
		column: 'created_at',
		direction: 'desc',
	} );

	const term = useDebounced( search, 300 );

	const loadOverview = useCallback( async () => {
		const next = await overviewApi.get();

		setData( next );

		return next;
	}, [] );

	const loadWidgets = useCallback( async () => {
		const page = await loadAll( term );

		setItems( page.items );
	}, [ term ] );

	const reload = useCallback( async () => {
		setLoading( true );
		setError( '' );

		try {
			await Promise.all( [ loadOverview(), loadWidgets() ] );
		} catch ( requestError ) {
			setError( requestError.message );
		} finally {
			setLoading( false );
		}
	}, [ loadOverview, loadWidgets ] );

	// The overview once; the table again on every search.
	useEffect( () => {
		loadOverview().catch( ( requestError ) =>
			setError( requestError.message )
		);
	}, [ loadOverview ] );

	useEffect( () => {
		let cancelled = false;

		setLoading( true );
		loadWidgets()
			.catch( ( requestError ) => {
				if ( ! cancelled ) {
					setError( requestError.message );
				}
			} )
			.finally( () => ! cancelled && setLoading( false ) );

		return () => {
			cancelled = true;
		};
	}, [ loadWidgets ] );

	const step = data ? guideStep( data ) : null;
	const showGuide = step !== null && step < 3;

	// Real covers for the guide's illustrations.
	useEffect( () => {
		if ( ! showGuide || step === 0 ) {
			return;
		}

		reelsApi
			.list( { per_page: 5 } )
			.then( ( page ) =>
				setCovers(
					page.items
						.map(
							( reel ) =>
								reel.thumbnail || reel.file?.poster_url || ''
						)
						.filter( Boolean )
				)
			)
			.catch( () => setCovers( [] ) );
	}, [ showGuide, step ] );

	// On the last step, look again when the merchant comes back from placing
	// the widget in another tab, so the step ticks off without a reload.
	useEffect( () => {
		if ( step !== 2 ) {
			return undefined;
		}

		const recheck = () =>
			document.visibilityState === 'visible' &&
			loadOverview().catch( () => {} );

		document.addEventListener( 'visibilitychange', recheck );

		return () =>
			document.removeEventListener( 'visibilitychange', recheck );
	}, [ step, loadOverview ] );

	const completeGuide = async () => {
		try {
			await overviewApi.completeGuide();
			await loadOverview();
			toasts.success( __( 'You’re all set', 'productreels' ), {
				icon: 'success',
			} );
		} catch ( requestError ) {
			toasts.error( requestError.message );
		}
	};

	useEffect( () => {
		if ( ! highlight ) {
			return undefined;
		}

		const timer = setTimeout( () => setHighlight( 0 ), HIGHLIGHT_MS );

		return () => clearTimeout( timer );
	}, [ highlight ] );

	const sorted = useMemo( () => {
		const sign = sort.direction === 'asc' ? 1 : -1;
		const collator = new Intl.Collator(
			document.documentElement.lang || undefined,
			{ sensitivity: 'base', numeric: true }
		);

		return [ ...items ].sort( ( a, b ) => {
			switch ( sort.column ) {
				case 'name':
					return collator.compare( a.name, b.name ) * sign;
				case 'reel_count':
				case 'view_total':
				case 'click_total':
					return ( a[ sort.column ] - b[ sort.column ] ) * sign;
				case 'ctr':
					return ( ctrOf( a ) - ctrOf( b ) ) * sign;
				default:
					return ( a.id - b.id ) * sign;
			}
		} );
	}, [ items, sort ] );

	const toggleSort = ( column ) =>
		setSort( ( current ) =>
			current.column === column
				? {
						column,
						direction: current.direction === 'asc' ? 'desc' : 'asc',
					}
				: { column, direction: column === 'name' ? 'asc' : 'desc' }
		);

	const copyShortcode = async ( id ) => {
		if ( await copyText( shortcodeOf( id ) ) ) {
			toasts.success( __( 'Shortcode copied', 'productreels' ), {
				icon: 'copy',
			} );
		} else {
			toasts.error(
				__(
					'Couldn’t copy. Select the shortcode and copy it yourself.',
					'productreels'
				)
			);
		}
	};

	const duplicate = async ( widget ) => {
		setBusyId( widget.id );

		try {
			const copy = await widgetsApi.duplicate( widget.id );

			await Promise.all( [ loadOverview(), loadWidgets() ] );
			setHighlight( copy.id );
			toasts.success( __( 'Widget duplicated', 'productreels' ), {
				icon: 'duplicate',
			} );
		} catch ( requestError ) {
			toasts.error( requestError.message );
		} finally {
			setBusyId( 0 );
		}
	};

	const remove = async () => {
		setDeleting( true );

		try {
			await widgetsApi.remove( confirming.id );
			setConfirming( null );
			toasts.success( __( 'Widget deleted', 'productreels' ), {
				icon: 'trash',
			} );
			await Promise.all( [ loadOverview(), loadWidgets() ] );
		} catch ( requestError ) {
			toasts.error( requestError.message );
		} finally {
			setDeleting( false );
		}
	};

	const firstWidgetId = items.length
		? Math.min( ...items.map( ( widget ) => widget.id ) )
		: 0;

	const table = (
		<WidgetTable
			items={ sorted }
			sort={ sort }
			onSort={ toggleSort }
			highlight={ highlight }
			busyId={ busyId }
			navigate={ navigate }
			onDuplicate={ duplicate }
			onCopy={ ( widget ) => copyShortcode( widget.id ) }
			onDelete={ setConfirming }
		/>
	);

	let body;

	if ( error ) {
		body = (
			<Notice
				tone="danger"
				title={ __( 'Couldn’t load your widgets.', 'productreels' ) }
				actions={
					<Button size="sm" onClick={ reload }>
						{ __( 'Try again', 'productreels' ) }
					</Button>
				}
			>
				{ error }
			</Notice>
		);
	} else if ( showGuide ) {
		body = (
			<>
				<StepGuide
					done={ step }
					covers={ covers }
					shortcode={ shortcodeOf( firstWidgetId || 1 ) }
					onAddReel={ () => setEditingReel( 0 ) }
					onCreateWidget={ () => navigate( '#/widgets/new' ) }
					onCopyShortcode={ () => copyShortcode( firstWidgetId ) }
					onMarkDone={ completeGuide }
				/>
				{ /* Widgets without views stay reachable under the guide. */ }
				{ step === 2 && items.length > 0 && table }
			</>
		);
	} else {
		let list = table;

		if ( loading ) {
			list = (
				<Skeleton
					count={ 3 }
					label={ __( 'Loading widgets…', 'productreels' ) }
				/>
			);
		} else if ( items.length === 0 && term !== '' ) {
			list = (
				<EmptyState
					panel
					icon="search"
					title={ sprintf(
						/* translators: %s: the search term. */
						__( 'No widgets match “%s”', 'productreels' ),
						term
					) }
					description={ __(
						'Try another name, or clear the search to see every widget.',
						'productreels'
					) }
					actions={
						<Button icon="x" onClick={ () => setSearch( '' ) }>
							{ __( 'Clear search', 'productreels' ) }
						</Button>
					}
				/>
			);
		}

		body = (
			<>
				<PageHeader
					title={ __( 'Widgets', 'productreels' ) }
					count={ data ? data.widgets : null }
					description={ __(
						'Styled sets of reels you can place on any page.',
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
									if (
										event.key === 'Escape' &&
										search !== ''
									) {
										setSearch( '' );
									}
								} }
								placeholder={ __(
									'Search widgets',
									'productreels'
								) }
								width={ 240 }
							/>
							<Button
								icon="plus"
								onClick={ () => setEditingReel( 0 ) }
							>
								{ __( 'Add reel', 'productreels' ) }
							</Button>
							<Button
								variant="primary"
								icon="plus"
								onClick={ () => navigate( '#/widgets/new' ) }
							>
								{ __( 'Create widget', 'productreels' ) }
							</Button>
						</>
					}
				/>
				<Metrics data={ data } />
				{ data && data.top_reels.length >= TOP_REELS_MIN && (
					<TopReels
						reels={ data.top_reels }
						onOpen={ setEditingReel }
						onSeeAll={ () => navigate( '#/reels' ) }
					/>
				) }
				{ list }
			</>
		);
	}

	return (
		<div className="pr-home">
			{ body }

			{ editingReel !== null && (
				<ReelEditor
					reelId={ editingReel }
					onClose={ () => setEditingReel( null ) }
					onSaved={ () => {
						setEditingReel( null );
						loadOverview().catch( () => {} );
					} }
				/>
			) }

			{ creating && (
				<CreateWidgetDialog
					navigate={ navigate }
					onClose={ () => navigate( '#/widgets' ) }
				/>
			) }

			{ confirming && (
				<ConfirmDialog
					title={ sprintf(
						/* translators: %s: a reel title or widget name. */
						__( 'Delete “%s”?', 'productreels' ),
						confirming.name
					) }
					confirm={ __( 'Delete widget', 'productreels' ) }
					busy={ deleting }
					onConfirm={ remove }
					onClose={ () => setConfirming( null ) }
				>
					{ __(
						'Pages that use its shortcode or block will show nothing. Its reels stay in your library.',
						'productreels'
					) }
				</ConfirmDialog>
			) }
		</div>
	);
};
