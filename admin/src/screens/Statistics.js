/**
 * The statistics screen.
 *
 * Lifetime totals for one widget: three tiles, then a reel table and a
 * button table, both sortable by any column. No chart — five numbers a
 * store owner can compare at a glance beat a chart that needs a legend.
 */

import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { posterOf } from '@shared/format';
import { widgets as widgetsApi } from '../api';
import {
	IconChevronDown,
	IconChevronLeft,
	IconEdit,
	IconExternal,
	IconVideo,
} from '../components/icons';
import { Button, IconButton } from '../components/ui/Button';
import { EmptyState, Skeleton } from '../components/ui/Feedback';

const locale = () => document.documentElement.lang || undefined;

const formatNumber = ( value ) =>
	new Intl.NumberFormat( locale() ).format( Number( value ) || 0 );

const formatPercent = ( value ) =>
	new Intl.NumberFormat( locale(), {
		style: 'percent',
		maximumFractionDigits: 2,
	} ).format( ( Number( value ) || 0 ) / 100 );

/**
 * Sort a list by a column, numbers numerically and text by locale.
 *
 * @param {Array}  items     The rows.
 * @param {string} column    The key to sort by.
 * @param {string} direction 'asc' or 'desc'.
 * @return {Array} A sorted copy.
 */
const sortBy = ( items, column, direction ) => {
	const sign = direction === 'asc' ? 1 : -1;
	const collator = new Intl.Collator( locale(), {
		sensitivity: 'base',
		numeric: true,
	} );

	return [ ...items ].sort( ( a, b ) => {
		const left = a[ column ];
		const right = b[ column ];

		if ( typeof left === 'number' && typeof right === 'number' ) {
			return ( left - right ) * sign;
		}

		return (
			collator.compare( String( left || '' ), String( right || '' ) ) *
			sign
		);
	} );
};

const useSort = ( initialColumn, initialDirection = 'desc' ) => {
	const [ sort, setSort ] = useState( {
		column: initialColumn,
		direction: initialDirection,
	} );

	const toggle = ( column ) =>
		setSort( ( current ) =>
			current.column === column
				? {
						column,
						direction: current.direction === 'asc' ? 'desc' : 'asc',
					}
				: {
						column,
						direction:
							column === 'title' ||
							column === 'reelTitle' ||
							column === 'buttonText'
								? 'asc'
								: 'desc',
					}
		);

	return [ sort, toggle ];
};

const SortHeader = ( { column, label, sort, onSort, numeric = false } ) => {
	const active = sort.column === column;
	let ariaSort = 'none';

	if ( active ) {
		ariaSort = sort.direction === 'asc' ? 'ascending' : 'descending';
	}

	return (
		<th
			scope="col"
			aria-sort={ ariaSort }
			className={ numeric ? 'wr-table__num' : '' }
		>
			<button
				type="button"
				className={ `wr-sort${ active ? ' is-active' : '' }${
					active && sort.direction === 'asc' ? ' is-asc' : ''
				}` }
				onClick={ () => onSort( column ) }
			>
				{ label }
				<IconChevronDown size={ 12 } />
			</button>
		</th>
	);
};

const Tile = ( { label, value, hint, loading } ) => (
	<div className="wr-tile">
		<span className="wr-tile__label">{ label }</span>
		{ loading ? (
			<Skeleton width={ 96 } height={ 30 } />
		) : (
			<span className="wr-tile__value">{ value }</span>
		) }
		{ hint && <span className="wr-tile__hint">{ hint }</span> }
	</div>
);

export const Statistics = ( { widgetId, navigate } ) => {
	const [ widget, setWidget ] = useState( null );
	const [ stats, setStats ] = useState( null );
	const [ error, setError ] = useState( '' );
	const [ reelSort, toggleReelSort ] = useSort( 'view_count' );
	const [ buttonSort, toggleButtonSort ] = useSort( 'clickCount' );

	const load = useCallback( async () => {
		setError( '' );

		try {
			const [ full, report ] = await Promise.all( [
				widgetsApi.get( widgetId ),
				widgetsApi.stats( widgetId ),
			] );

			setWidget( full );
			setStats( report );
		} catch ( requestError ) {
			setError( requestError.message );
		}
	}, [ widgetId ] );

	useEffect( () => {
		load();
	}, [ load ] );

	const reels = useMemo(
		() =>
			stats
				? sortBy( stats.reels, reelSort.column, reelSort.direction )
				: [],
		[ stats, reelSort ]
	);
	const buttons = useMemo(
		() =>
			stats
				? sortBy(
						stats.buttons,
						buttonSort.column,
						buttonSort.direction
					)
				: [],
		[ stats, buttonSort ]
	);

	const loading = ! stats && error === '';
	const empty =
		stats && stats.totals.views === 0 && stats.totals.clicks === 0;

	return (
		<>
			<div className="wr-page-head">
				<div className="wr-page-head__titles wr-page-head__titles--with-back">
					<IconButton
						icon={ IconChevronLeft }
						label={ __(
							'Back',
							'productreels-shoppable-video-reels-for-woocommerce'
						) }
						onClick={ () => navigate( '#/widgets' ) }
					/>
					<div>
						<h1 className="wr-page-head__title">
							{ __(
								'Statistics',
								'productreels-shoppable-video-reels-for-woocommerce'
							) }
							{ widget && (
								<span className="wr-page-head__crumb">
									{ widget.name }
								</span>
							) }
						</h1>
						<p className="wr-page-head__sub">
							{ __(
								'Lifetime views and clicks for this widget.',
								'productreels-shoppable-video-reels-for-woocommerce'
							) }
						</p>
					</div>
				</div>
				<div className="wr-page-head__actions">
					<Button
						icon={ IconEdit }
						onClick={ () => navigate( `#/widgets/${ widgetId }` ) }
					>
						{ __(
							'Edit',
							'productreels-shoppable-video-reels-for-woocommerce'
						) }
					</Button>
				</div>
			</div>

			<div className="wr-app__body">
				{ error !== '' && (
					<div className="wr-card wr-error-card">
						<p>{ error }</p>
						<Button onClick={ load }>
							{ __(
								'Continue',
								'productreels-shoppable-video-reels-for-woocommerce'
							) }
						</Button>
					</div>
				) }

				{ error === '' && (
					<div className="wr-tiles">
						<Tile
							label={ __(
								'Total Views',
								'productreels-shoppable-video-reels-for-woocommerce'
							) }
							value={
								stats ? formatNumber( stats.totals.views ) : ''
							}
							loading={ loading }
							hint={ __(
								'Counted after a second of playback.',
								'productreels-shoppable-video-reels-for-woocommerce'
							) }
						/>
						<Tile
							label={ __(
								'Total Clicks',
								'productreels-shoppable-video-reels-for-woocommerce'
							) }
							value={
								stats ? formatNumber( stats.totals.clicks ) : ''
							}
							loading={ loading }
							hint={ __(
								'Buttons and product cards.',
								'productreels-shoppable-video-reels-for-woocommerce'
							) }
						/>
						<Tile
							label={ __(
								'CTR',
								'productreels-shoppable-video-reels-for-woocommerce'
							) }
							value={
								stats ? formatPercent( stats.totals.ctr ) : ''
							}
							loading={ loading }
							hint={ __(
								'Clicks per view.',
								'productreels-shoppable-video-reels-for-woocommerce'
							) }
						/>
					</div>
				) }

				{ error === '' && empty && (
					<div className="wr-card">
						<EmptyState
							title={ __(
								'No stats available for this widget yet.',
								'productreels-shoppable-video-reels-for-woocommerce'
							) }
							text={ __(
								'Place the widget on a page and numbers will start to appear once visitors watch and tap.',
								'productreels-shoppable-video-reels-for-woocommerce'
							) }
							action={
								<Button
									variant="primary"
									icon={ IconEdit }
									onClick={ () =>
										navigate( `#/widgets/${ widgetId }` )
									}
								>
									{ __(
										'Edit',
										'productreels-shoppable-video-reels-for-woocommerce'
									) }
								</Button>
							}
						/>
					</div>
				) }

				{ error === '' && ! empty && (
					<>
						<section className="wr-card wr-table-card">
							<header className="wr-card__head">
								<h2 className="wr-section-label">
									{ __(
										'Reel performance',
										'productreels-shoppable-video-reels-for-woocommerce'
									) }
								</h2>
							</header>
							<table className="wr-table wr-table--stats">
								<thead>
									<tr>
										<th scope="col">
											<span className="wr-screen-reader-text">
												{ __(
													'Thumbnail',
													'productreels-shoppable-video-reels-for-woocommerce'
												) }
											</span>
										</th>
										<SortHeader
											column="title"
											label={ __(
												'Reel Title',
												'productreels-shoppable-video-reels-for-woocommerce'
											) }
											sort={ reelSort }
											onSort={ toggleReelSort }
										/>
										<SortHeader
											column="view_count"
											label={ __(
												'Views',
												'productreels-shoppable-video-reels-for-woocommerce'
											) }
											sort={ reelSort }
											onSort={ toggleReelSort }
											numeric
										/>
										<SortHeader
											column="click_count"
											label={ __(
												'Clicks',
												'productreels-shoppable-video-reels-for-woocommerce'
											) }
											sort={ reelSort }
											onSort={ toggleReelSort }
											numeric
										/>
										<SortHeader
											column="ctr"
											label={ __(
												'CTR',
												'productreels-shoppable-video-reels-for-woocommerce'
											) }
											sort={ reelSort }
											onSort={ toggleReelSort }
											numeric
										/>
									</tr>
								</thead>
								<tbody>
									{ loading
										? [ 0, 1, 2 ].map( ( row ) => (
												<tr
													key={ row }
													className="wr-table__row"
												>
													<td>
														<Skeleton
															width={ 28 }
															height={ 44 }
															radius="6px"
														/>
													</td>
													<td>
														<Skeleton
															width="60%"
															height={ 14 }
														/>
													</td>
													<td>
														<Skeleton
															width={ 40 }
															height={ 14 }
														/>
													</td>
													<td>
														<Skeleton
															width={ 40 }
															height={ 14 }
														/>
													</td>
													<td>
														<Skeleton
															width={ 48 }
															height={ 14 }
														/>
													</td>
												</tr>
											) )
										: reels.map( ( reel ) => {
												const poster = posterOf( reel );

												return (
													<tr
														key={ reel.reel_id }
														className="wr-table__row"
													>
														<td className="wr-table__thumb-cell">
															<span className="wr-table__thumb">
																{ poster ? (
																	<img
																		src={
																			poster
																		}
																		alt=""
																		loading="lazy"
																	/>
																) : (
																	<IconVideo
																		size={
																			14
																		}
																	/>
																) }
															</span>
														</td>
														<td>{ reel.title }</td>
														<td className="wr-table__num">
															{ formatNumber(
																reel.view_count
															) }
														</td>
														<td className="wr-table__num">
															{ formatNumber(
																reel.click_count
															) }
														</td>
														<td className="wr-table__num">
															{ formatPercent(
																reel.ctr
															) }
														</td>
													</tr>
												);
											} ) }
								</tbody>
							</table>
						</section>

						<section className="wr-card wr-table-card">
							<header className="wr-card__head">
								<h2 className="wr-section-label">
									{ __(
										'Button performance',
										'productreels-shoppable-video-reels-for-woocommerce'
									) }
								</h2>
							</header>
							{ ! loading && buttons.length === 0 ? (
								<p className="wr-card__empty">
									{ __(
										'No button has been clicked yet.',
										'productreels-shoppable-video-reels-for-woocommerce'
									) }
								</p>
							) : (
								<table className="wr-table wr-table--stats">
									<thead>
										<tr>
											<SortHeader
												column="reelTitle"
												label={ __(
													'Reel Title',
													'productreels-shoppable-video-reels-for-woocommerce'
												) }
												sort={ buttonSort }
												onSort={ toggleButtonSort }
											/>
											<SortHeader
												column="buttonText"
												label={ __(
													'Button Text',
													'productreels-shoppable-video-reels-for-woocommerce'
												) }
												sort={ buttonSort }
												onSort={ toggleButtonSort }
											/>
											<SortHeader
												column="campaignName"
												label={ __(
													'Campaign Name',
													'productreels-shoppable-video-reels-for-woocommerce'
												) }
												sort={ buttonSort }
												onSort={ toggleButtonSort }
											/>
											<th scope="col">
												{ __(
													'Url',
													'productreels-shoppable-video-reels-for-woocommerce'
												) }
											</th>
											<SortHeader
												column="clickCount"
												label={ __(
													'Clicks',
													'productreels-shoppable-video-reels-for-woocommerce'
												) }
												sort={ buttonSort }
												onSort={ toggleButtonSort }
												numeric
											/>
										</tr>
									</thead>
									<tbody>
										{ loading
											? [ 0, 1 ].map( ( row ) => (
													<tr
														key={ row }
														className="wr-table__row"
													>
														<td>
															<Skeleton
																width="60%"
																height={ 14 }
															/>
														</td>
														<td>
															<Skeleton
																width="50%"
																height={ 14 }
															/>
														</td>
														<td>
															<Skeleton
																width="50%"
																height={ 14 }
															/>
														</td>
														<td>
															<Skeleton
																width="70%"
																height={ 14 }
															/>
														</td>
														<td>
															<Skeleton
																width={ 40 }
																height={ 14 }
															/>
														</td>
													</tr>
												) )
											: buttons.map( ( button ) => (
													<tr
														key={ button.btn_uuid }
														className="wr-table__row"
													>
														<td>
															{ button.reelTitle }
														</td>
														<td>
															{
																button.buttonText
															}
														</td>
														<td className="wr-table__muted">
															{ button.campaignName ||
																'—' }
														</td>
														<td className="wr-table__url">
															{ button.buttonUrl ? (
																<a
																	href={
																		button.buttonUrl
																	}
																	target="_blank"
																	rel="noopener noreferrer"
																>
																	<span>
																		{ button.buttonUrl.replace(
																			/^https?:\/\//,
																			''
																		) }
																	</span>
																	<IconExternal
																		size={
																			12
																		}
																	/>
																</a>
															) : (
																'—'
															) }
														</td>
														<td className="wr-table__num">
															{ formatNumber(
																button.clickCount
															) }
														</td>
													</tr>
												) ) }
									</tbody>
								</table>
							) }
						</section>
					</>
				) }
			</div>
		</>
	);
};
