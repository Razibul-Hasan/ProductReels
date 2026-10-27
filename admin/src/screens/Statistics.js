/**
 * Statistics: one widget's numbers, all time or for the last 7, 30 or 90 days.
 *
 * The totals, the widget's reels ranked by views and its buttons ranked by
 * clicks. All time is 1.0.0's numbers, from GET /widgets/:id/stats: a reel's
 * views are its lifetime views (every widget and the single-reel shortcode),
 * clicks are this widget's own. A day range counts this widget's views and
 * clicks on those days only, and adds a per-day trend chart. Both tables
 * still sort on the client by any column, as in 1.0.0; views and clicks rank
 * first by default.
 *
 * With WooCommerce, orders and revenue join the totals and the reels table:
 * paid orders with a product added to the cart from one of the reels.
 *
 * The buttons table lists every click counter the widget holds, as 1.0.0
 * did: custom buttons, and product cards (whose clicks are counted too).
 * Button clicks aren't dated, so it is all time whatever the range.
 */

import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { boot, widgets as widgetsApi } from '../api';
import {
	Badge,
	BarCell,
	Button,
	EmptyState,
	MetricBand,
	Notice,
	PLACE_STEP,
	PageHeader,
	ReelCover,
	Segmented,
	ShortcodeChip,
	Skeleton,
	SortHeader,
	shortUrl,
} from '../components/pr';
import { formatMoney, formatNumber, formatRate } from '../format';
import { ReelEditor } from './ReelEditor';
import { openStep } from './editor/step-memory';
import { TrendChart } from './stats/TrendChart';

/** Sales numbers need WooCommerce. */
const hasWoo = !! boot.hasWoo;
const currency = boot.currency || {};

const RANGES = () => [
	{ value: 'all', label: __( 'All time', 'productreels' ) },
	{ value: '90', label: __( '90 days', 'productreels' ) },
	{ value: '30', label: __( '30 days', 'productreels' ) },
	{ value: '7', label: __( '7 days', 'productreels' ) },
];

/**
 * The page description for a range.
 *
 * @param {string} name  The widget's name.
 * @param {string} range `all` or a number of days.
 * @return {string} The description.
 */
const rangeText = ( name, range ) =>
	range === 'all'
		? sprintf(
				/* translators: %s: widget name. */
				__( '%s, all time.', 'productreels' ),
				name
			)
		: sprintf(
				/* translators: 1: widget name; 2: number of days. */
				__( '%1$s, last %2$s days.', 'productreels' ),
				name,
				formatNumber( Number( range ) )
			);

/**
 * Whether a day range reaches back before dated numbers were kept.
 *
 * @param {string} range `all` or a number of days.
 * @param {string} since First dated day, Y-m-d.
 * @return {boolean} Whether it does.
 */
const startsBeforeSince = ( range, since ) => {
	if ( range === 'all' || ! since ) {
		return false;
	}

	const start = new Date();

	start.setDate( start.getDate() - ( Number( range ) - 1 ) );

	return start.toISOString().slice( 0, 10 ) < since;
};

const collator = () =>
	new Intl.Collator( document.documentElement.lang || undefined, {
		sensitivity: 'base',
		numeric: true,
	} );

/**
 * A sorted copy: numbers numerically, text by the admin's locale.
 *
 * @param {Array}  items          The rows.
 * @param {Object} sort           The sort.
 * @param {string} sort.column    The key to sort by.
 * @param {string} sort.direction 'asc' or 'desc'.
 * @return {Array} The rows in order.
 */
const sortRows = ( items, { column, direction } ) => {
	const sign = direction === 'asc' ? 1 : -1;
	const compare = collator().compare;

	return [ ...items ].sort( ( a, b ) => {
		const left = a[ column ];
		const right = b[ column ];

		if ( typeof left === 'number' && typeof right === 'number' ) {
			return ( left - right ) * sign;
		}

		return compare( String( left || '' ), String( right || '' ) ) * sign;
	} );
};

const TEXT_COLUMNS = [ 'title', 'buttonText', 'campaignName' ];

const useSort = ( initial ) => {
	const [ sort, setSort ] = useState( {
		column: initial,
		direction: 'desc',
	} );

	const toggle = ( column ) =>
		setSort( ( current ) => {
			if ( current.column === column ) {
				return {
					column,
					direction: current.direction === 'asc' ? 'desc' : 'asc',
				};
			}

			return {
				column,
				direction: TEXT_COLUMNS.includes( column ) ? 'asc' : 'desc',
			};
		} );

	return [ sort, toggle ];
};

const REEL_SORT_TEXT = {
	title: __( 'Sorted by title', 'productreels' ),
	view_count: __( 'Sorted by views', 'productreels' ),
	click_count: __( 'Sorted by clicks', 'productreels' ),
	ctr: __( 'Sorted by click rate', 'productreels' ),
	orders: __( 'Sorted by orders', 'productreels' ),
	revenue: __( 'Sorted by revenue', 'productreels' ),
};

const shortcodeOf = ( id ) => `[productreels id="${ id }"]`;

const Totals = ( { totals } ) => {
	const placeholder = <span className="pr-metric__ph" aria-hidden="true" />;
	const sales = hasWoo
		? [
				{
					label: __( 'Orders', 'productreels' ),
					icon: 'cart',
					value: totals
						? formatNumber( totals.orders || 0 )
						: placeholder,
					hint: __(
						'Paid, with a product added from a reel',
						'productreels'
					),
				},
				{
					label: __( 'Revenue', 'productreels' ),
					icon: 'tag',
					value: totals
						? formatMoney( totals.revenue || 0, currency )
						: placeholder,
					hint: __(
						'Those products’ order lines, before tax',
						'productreels'
					),
				},
			]
		: [];

	return (
		<MetricBand
			items={ [
				{
					label: __( 'Views', 'productreels' ),
					icon: 'eye',
					value: totals ? formatNumber( totals.views ) : placeholder,
					hint: __(
						'Counted after one second of playback',
						'productreels'
					),
				},
				{
					label: __( 'Clicks', 'productreels' ),
					icon: 'click',
					value: totals ? formatNumber( totals.clicks ) : placeholder,
					hint: __( 'Buttons and product cards', 'productreels' ),
				},
				{
					label: __( 'Click rate', 'productreels' ),
					icon: 'percent',
					value: totals
						? formatRate( totals.clicks, totals.views )
						: placeholder,
					hint: __( 'Clicks per view', 'productreels' ),
				},
				...sales,
			] }
		/>
	);
};

const TableHead = ( { id, title, aside } ) => (
	<div className="pr-tablehead">
		<h2 id={ id } className="pr-t-title">
			{ title }
		</h2>
		{ aside && <span className="pr-t-small pr-muted">{ aside }</span> }
	</div>
);

const ReelsTable = ( { reels, covers, sort, onSort, onOpen } ) => {
	const top = Math.max( 0, ...reels.map( ( reel ) => reel.view_count ) );

	return (
		<section
			className="pr-tablewrap pr-stats__table pr-stats__reels"
			aria-labelledby="pr-stats-reels"
		>
			<TableHead
				id="pr-stats-reels"
				title={ __( 'Reels', 'productreels' ) }
				aside={ REEL_SORT_TEXT[ sort.column ] }
			/>
			<table className="pr-table">
				<thead>
					<tr className="pr-t-label">
						<SortHeader
							column="title"
							label={ __( 'Reel', 'productreels' ) }
							sort={ sort }
							onSort={ onSort }
						/>
						<SortHeader
							column="view_count"
							label={ __( 'Views', 'productreels' ) }
							sort={ sort }
							onSort={ onSort }
							numeric
						/>
						<SortHeader
							column="click_count"
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
						{ hasWoo && (
							<>
								<SortHeader
									column="orders"
									label={ __( 'Orders', 'productreels' ) }
									sort={ sort }
									onSort={ onSort }
									numeric
								/>
								<SortHeader
									column="revenue"
									label={ __( 'Revenue', 'productreels' ) }
									sort={ sort }
									onSort={ onSort }
									numeric
								/>
							</>
						) }
					</tr>
				</thead>
				<tbody>
					{ reels.map( ( reel ) => (
						<tr key={ reel.reel_id }>
							<td>
								<div className="pr-wname">
									<span className="pr-reelrow__thumb">
										<ReelCover
											reel={ {
												thumbnail: reel.thumbnail,
												file: covers[ reel.reel_id ],
											} }
										/>
									</span>
									<button
										type="button"
										className="pr-stats__open pr-t-body-strong"
										onClick={ () => onOpen( reel.reel_id ) }
									>
										{ reel.title }
									</button>
								</div>
							</td>
							<td className="num">
								<BarCell
									value={ reel.view_count }
									max={ top }
								/>
							</td>
							<td className="num pr-t-body">
								{ formatNumber( reel.click_count ) }
							</td>
							<td className="num pr-t-body">
								{ formatRate(
									reel.click_count,
									reel.view_count
								) }
							</td>
							{ hasWoo && (
								<>
									<td className="num pr-t-body">
										{ formatNumber( reel.orders || 0 ) }
									</td>
									<td className="num pr-t-body">
										{ formatMoney(
											reel.revenue || 0,
											currency
										) }
									</td>
								</>
							) }
						</tr>
					) ) }
				</tbody>
			</table>
		</section>
	);
};

/**
 * Which reel a counter sits on, so two "Shop now" buttons can be told apart.
 *
 * @param {Object}  button    A stats button row.
 * @param {boolean} isProduct Whether it is a product card.
 * @return {string} The caption.
 */
const whereText = ( button, isProduct ) =>
	isProduct
		? sprintf(
				/* translators: %s: reel title. */
				__( 'Product card in %s', 'productreels' ),
				button.reelTitle
			)
		: sprintf(
				/* translators: %s: reel title. */
				__( 'In %s', 'productreels' ),
				button.reelTitle
			);

const ButtonsTable = ( { buttons, products, sort, onSort, allTime } ) => {
	const top = Math.max(
		0,
		...buttons.map( ( button ) => button.clickCount )
	);
	const hasProducts = buttons.some( ( button ) =>
		products.has( button.btn_uuid )
	);

	let aside = hasProducts
		? __(
				'Buttons and product cards across this widget’s reels',
				'productreels'
			)
		: __( 'Custom buttons across this widget’s reels', 'productreels' );

	if ( allTime ) {
		aside = __(
			'All time: button clicks aren’t counted by day',
			'productreels'
		);
	}

	return (
		<section
			className="pr-tablewrap pr-stats__table pr-stats__buttons"
			aria-labelledby="pr-stats-buttons"
		>
			<TableHead
				id="pr-stats-buttons"
				title={ __( 'Buttons', 'productreels' ) }
				aside={ aside }
			/>
			<table className="pr-table">
				<thead>
					<tr className="pr-t-label">
						<SortHeader
							column="buttonText"
							label={ __( 'Button text', 'productreels' ) }
							sort={ sort }
							onSort={ onSort }
						/>
						<SortHeader
							column="campaignName"
							label={ __( 'Campaign', 'productreels' ) }
							sort={ sort }
							onSort={ onSort }
						/>
						<th scope="col">{ __( 'Link', 'productreels' ) }</th>
						<SortHeader
							column="clickCount"
							label={ __( 'Clicks', 'productreels' ) }
							sort={ sort }
							onSort={ onSort }
							numeric
						/>
					</tr>
				</thead>
				<tbody>
					{ buttons.map( ( button ) => (
						<tr key={ button.btn_uuid }>
							<td>
								<span className="pr-stats__button">
									<span className="pr-t-body-strong">
										{ button.buttonText }
									</span>
									{ button.reelTitle && (
										<span className="pr-t-caption pr-muted">
											{ whereText(
												button,
												products.has( button.btn_uuid )
											) }
										</span>
									) }
								</span>
							</td>
							<td>
								{ button.campaignName ? (
									<Badge tone="brand">
										{ button.campaignName }
									</Badge>
								) : (
									<span className="pr-t-body pr-muted">
										{ __( 'No campaign', 'productreels' ) }
									</span>
								) }
							</td>
							<td className="pr-t-body">
								{ button.buttonUrl ? (
									<a
										className="pr-stats__link"
										href={ button.buttonUrl }
										title={ button.buttonUrl }
										target="_blank"
										rel="noopener noreferrer"
									>
										{ shortUrl( button.buttonUrl ) }
										<span className="pr-sr">
											{ __(
												'(opens in a new tab)',
												'productreels'
											) }
										</span>
									</a>
								) : (
									<span className="pr-muted">—</span>
								) }
							</td>
							<td className="num">
								<BarCell
									value={ button.clickCount }
									max={ top }
								/>
							</td>
						</tr>
					) ) }
				</tbody>
			</table>
		</section>
	);
};

const Loading = () => (
	<section className="pr-tablewrap pr-stats__table pr-stats__reels">
		<TableHead title={ __( 'Reels', 'productreels' ) } />
		<Skeleton
			count={ 4 }
			label={ __( 'Loading statistics…', 'productreels' ) }
		/>
	</section>
);

export const Statistics = ( { widgetId, navigate } ) => {
	const [ widget, setWidget ] = useState( null );
	const [ stats, setStats ] = useState( null );
	const [ error, setError ] = useState( null );
	const [ editingReel, setEditingReel ] = useState( null );
	const [ range, setRange ] = useState( 'all' );
	const [ reelSort, toggleReelSort ] = useSort( 'view_count' );
	const [ buttonSort, toggleButtonSort ] = useSort( 'clickCount' );

	const load = useCallback(
		async ( { quiet = false } = {} ) => {
			if ( ! quiet ) {
				setError( null );
				setStats( null );
			}

			try {
				const [ full, report ] = await Promise.all( [
					widgetsApi.get( widgetId ),
					widgetsApi.stats( widgetId, { range } ),
				] );

				setWidget( full );
				setStats( report );
			} catch ( requestError ) {
				if ( ! quiet ) {
					setError( requestError );
				}
			}
		},
		[ widgetId, range ]
	);

	useEffect( () => {
		load();
	}, [ load ] );

	// Covers and link types come from the widget's own reels: the stats rows
	// carry only the stored thumbnail, and click rows don't store a type.
	const { covers, products } = useMemo( () => {
		const files = {};
		const productIds = new Set();

		( widget?.reels || [] ).forEach( ( reel ) => {
			files[ reel.id ] = reel.files?.[ 0 ] || null;
			( reel.links || [] ).forEach( ( link ) => {
				if ( link.btn_type === 'product' ) {
					productIds.add( link.btn_uuid );
				}
			} );
		} );

		return { covers: files, products: productIds };
	}, [ widget ] );

	const reels = useMemo(
		() => ( stats ? sortRows( stats.reels, reelSort ) : [] ),
		[ stats, reelSort ]
	);
	const buttons = useMemo(
		() => ( stats ? sortRows( stats.buttons, buttonSort ) : [] ),
		[ stats, buttonSort ]
	);

	const notFound = error?.status === 404;
	const editWidget = () => navigate( `#/widgets/${ widgetId }` );

	let body;

	if ( error ) {
		body = (
			<Notice
				tone="danger"
				title={
					notFound
						? __( 'This widget no longer exists.', 'productreels' )
						: __( 'Couldn’t load the statistics.', 'productreels' )
				}
				actions={
					notFound ? (
						<Button
							size="sm"
							onClick={ () => navigate( '#/widgets' ) }
						>
							{ __( 'Back to widgets', 'productreels' ) }
						</Button>
					) : (
						<Button size="sm" onClick={ () => load() }>
							{ __( 'Try again', 'productreels' ) }
						</Button>
					)
				}
			>
				{ notFound ? null : error.message }
			</Notice>
		);
	} else if ( ! stats ) {
		body = (
			<>
				<Totals totals={ null } />
				<Loading />
			</>
		);
	} else if (
		range === 'all' &&
		stats.totals.views === 0 &&
		stats.totals.clicks === 0 &&
		! stats.totals.orders
	) {
		body = (
			<EmptyState
				panel
				icon="chart"
				title={ __( 'No stats yet', 'productreels' ) }
				description={ __(
					'Place the widget on a page. Numbers appear once visitors watch and tap.',
					'productreels'
				) }
				actions={
					<>
						<Button
							variant="primary"
							icon={ PLACE_STEP.icon }
							onClick={ () =>
								openStep( widgetId, PLACE_STEP.id )
							}
						>
							{ PLACE_STEP.label }
						</Button>
						<Button icon="pencil" onClick={ editWidget }>
							{ __( 'Edit widget', 'productreels' ) }
						</Button>
					</>
				}
			/>
		);
	} else {
		body = (
			<>
				<Totals totals={ stats.totals } />
				{ range !== 'all' && (
					<TrendChart
						series={ stats.series || [] }
						hasWoo={ hasWoo }
						currency={ currency }
					/>
				) }
				{ reels.length > 0 && (
					<ReelsTable
						reels={ reels }
						covers={ covers }
						sort={ reelSort }
						onSort={ toggleReelSort }
						onOpen={ setEditingReel }
					/>
				) }
				{ buttons.length > 0 ? (
					<ButtonsTable
						buttons={ buttons }
						products={ products }
						sort={ buttonSort }
						onSort={ toggleButtonSort }
						allTime={ range !== 'all' }
					/>
				) : (
					<p className="pr-stats__none pr-t-body pr-muted">
						{ __(
							'No button or product card has been clicked yet.',
							'productreels'
						) }
					</p>
				) }
			</>
		);
	}

	return (
		<div className="pr-stats">
			<PageHeader
				title={ __( 'Statistics', 'productreels' ) }
				back={ __( 'Back to widgets', 'productreels' ) }
				onBack={ () => navigate( '#/widgets' ) }
				description={
					widget
						? rangeText(
								widget.name ||
									__( 'Untitled widget', 'productreels' ),
								range
							)
						: // Hold the line while loading, so the page doesn't jump.
							! error && '\u00a0'
				}
				actions={
					notFound ? null : (
						<>
							<ShortcodeChip code={ shortcodeOf( widgetId ) } />
							<Button icon="pencil" onClick={ editWidget }>
								{ __( 'Edit widget', 'productreels' ) }
							</Button>
						</>
					)
				}
			/>

			{ ! notFound && (
				<div className="pr-stats__range">
					<Segmented
						label={ __( 'Date range', 'productreels' ) }
						value={ range }
						onChange={ setRange }
						options={ RANGES() }
					/>
					{ stats && startsBeforeSince( range, stats.since ) && (
						<span className="pr-t-small pr-muted">
							{ sprintf(
								/* translators: %s: a date. */
								__(
									'Daily numbers start on %s, when this update was installed.',
									'productreels'
								),
								new Intl.DateTimeFormat(
									document.documentElement.lang || undefined,
									{ dateStyle: 'medium', timeZone: 'UTC' }
								).format(
									new Date( `${ stats.since }T12:00:00Z` )
								)
							) }
						</span>
					) }
				</div>
			) }

			{ body }

			{ editingReel !== null && (
				<ReelEditor
					reelId={ editingReel }
					onClose={ () => setEditingReel( null ) }
					onSaved={ () => {
						setEditingReel( null );
						load( { quiet: true } );
					} }
				/>
			) }
		</div>
	);
};
