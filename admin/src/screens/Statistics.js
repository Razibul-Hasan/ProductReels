/**
 * Statistics: one widget's numbers, all time.
 *
 * Three totals, the widget's reels ranked by views and its buttons ranked by
 * clicks. The numbers are 1.0.0's, from GET /widgets/:id/stats: a reel's
 * views are its lifetime views (every widget and the single-reel shortcode),
 * clicks are this widget's own. Both tables still sort on the client by any
 * column, as in 1.0.0; views and clicks rank first by default.
 *
 * The buttons table lists every click counter the widget holds, as 1.0.0
 * did: custom buttons, and product cards (whose clicks are counted too).
 */

import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { widgets as widgetsApi } from '../api';
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
	ShortcodeChip,
	Skeleton,
	SortHeader,
	shortUrl,
} from '../components/pr';
import { formatNumber, formatRate } from '../format';
import { ReelEditor } from './ReelEditor';
import { openStep } from './editor/step-memory';

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
};

const shortcodeOf = ( id ) => `[productreels id="${ id }"]`;

const Totals = ( { totals } ) => {
	const placeholder = <span className="pr-metric__ph" aria-hidden="true" />;

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

const ButtonsTable = ( { buttons, products, sort, onSort } ) => {
	const top = Math.max(
		0,
		...buttons.map( ( button ) => button.clickCount )
	);
	const hasProducts = buttons.some( ( button ) =>
		products.has( button.btn_uuid )
	);

	return (
		<section
			className="pr-tablewrap pr-stats__table pr-stats__buttons"
			aria-labelledby="pr-stats-buttons"
		>
			<TableHead
				id="pr-stats-buttons"
				title={ __( 'Buttons', 'productreels' ) }
				aside={
					hasProducts
						? __(
								'Buttons and product cards across this widget’s reels',
								'productreels'
							)
						: __(
								'Custom buttons across this widget’s reels',
								'productreels'
							)
				}
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
					widgetsApi.stats( widgetId ),
				] );

				setWidget( full );
				setStats( report );
			} catch ( requestError ) {
				if ( ! quiet ) {
					setError( requestError );
				}
			}
		},
		[ widgetId ]
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
	} else if ( stats.totals.views === 0 && stats.totals.clicks === 0 ) {
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
						? sprintf(
								/* translators: %s: widget name. */
								__( '%s, all time.', 'productreels' ),
								widget.name ||
									__( 'Untitled widget', 'productreels' )
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
