/**
 * The trend chart on Statistics: one measure, one column per day.
 *
 * One series at a time, picked with the switch above it (views, clicks,
 * and with WooCommerce orders and revenue), so two measures of different
 * scale never share an axis. Columns grow from one baseline, at most 24px
 * wide with a 2px gap, rounded only at the top; three hairline gridlines;
 * a tooltip on hover with the day and its value. The same numbers are in a
 * visually hidden table for screen readers.
 *
 * The SVG is drawn at its real pixel width (a ResizeObserver keeps it in
 * step), so the columns' corners and the 1px lines never stretch.
 */

import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Segmented } from '../../components/pr';
import { formatCompact, formatMoney, formatNumber } from '../../format';

const HEIGHT = 168;
const PAD = { top: 12, right: 8, bottom: 24, left: 48 };
const MAX_BAR = 24;
const GAP = 2;
const RADIUS = 4;

/**
 * A round top for the axis: 1, 2 or 5 times a power of ten.
 *
 * @param {number} value The largest value.
 * @return {number} The top of the axis.
 */
const niceMax = ( value ) => {
	if ( value <= 0 ) {
		return 1;
	}

	const power = Math.pow( 10, Math.floor( Math.log10( value ) ) );
	const step = [ 1, 2, 5, 10 ].find( ( n ) => n * power >= value );

	return step * power;
};

/**
 * A column with a rounded top and a square foot on the baseline.
 *
 * @param {number} x      Left edge.
 * @param {number} y      Top edge.
 * @param {number} width  Width.
 * @param {number} height Height.
 * @return {string} The path.
 */
const columnPath = ( x, y, width, height ) => {
	const r = Math.min( RADIUS, width / 2, height );

	return [
		`M${ x },${ y + height }`,
		`V${ y + r }`,
		`Q${ x },${ y } ${ x + r },${ y }`,
		`H${ x + width - r }`,
		`Q${ x + width },${ y } ${ x + width },${ y + r }`,
		`V${ y + height }`,
		'Z',
	].join( ' ' );
};

const dayFormat = () => {
	try {
		return new Intl.DateTimeFormat(
			document.documentElement.lang || undefined,
			{
				month: 'short',
				day: 'numeric',
				timeZone: 'UTC',
			}
		);
	} catch ( error ) {
		return new Intl.DateTimeFormat( undefined, {
			month: 'short',
			day: 'numeric',
			timeZone: 'UTC',
		} );
	}
};

const asDate = ( day ) => new Date( `${ day }T12:00:00Z` );

/**
 * The measures the switch offers.
 *
 * @param {boolean} hasWoo   Whether orders and revenue apply.
 * @param {Object}  currency The store's currency.
 * @return {Array<Object>} { value, label, format, tick }.
 */
const measures = ( hasWoo, currency ) => {
	const list = [
		{
			value: 'views',
			label: __( 'Views', 'productreels' ),
			format: formatNumber,
			tick: formatCompact,
		},
		{
			value: 'clicks',
			label: __( 'Clicks', 'productreels' ),
			format: formatNumber,
			tick: formatCompact,
		},
	];

	if ( hasWoo ) {
		list.push(
			{
				value: 'orders',
				label: __( 'Orders', 'productreels' ),
				format: formatNumber,
				tick: formatCompact,
			},
			{
				value: 'revenue',
				label: __( 'Revenue', 'productreels' ),
				format: ( value ) => formatMoney( value, currency ),
				tick: ( value ) =>
					value >= 1000
						? formatCompact( value )
						: formatMoney( value, { ...currency, decimals: 0 } ),
			}
		);
	}

	return list;
};

export const TrendChart = ( { series, hasWoo, currency } ) => {
	const box = useRef( null );
	const [ width, setWidth ] = useState( 0 );
	const [ measure, setMeasure ] = useState( 'views' );
	const [ hover, setHover ] = useState( null );

	useEffect( () => {
		const node = box.current;

		if ( ! node ) {
			return undefined;
		}

		setWidth( node.clientWidth );

		if ( typeof window.ResizeObserver !== 'function' ) {
			return undefined;
		}

		const observer = new window.ResizeObserver( ( entries ) =>
			setWidth( Math.round( entries[ 0 ].contentRect.width ) )
		);

		observer.observe( node );

		return () => observer.disconnect();
	}, [] );

	const options = useMemo(
		() => measures( hasWoo, currency ),
		[ hasWoo, currency ]
	);
	const current =
		options.find( ( option ) => option.value === measure ) || options[ 0 ];
	const values = series.map(
		( entry ) => Number( entry[ current.value ] ) || 0
	);
	const top = niceMax( Math.max( 0, ...values ) );
	const empty = values.every( ( value ) => value === 0 );
	const days = dayFormat();

	const plotW = Math.max( 0, width - PAD.left - PAD.right );
	const plotH = HEIGHT - PAD.top - PAD.bottom;
	const slot = series.length ? plotW / series.length : 0;
	const barW = Math.max( 1, Math.min( MAX_BAR, slot - GAP ) );
	const y = ( value ) => PAD.top + plotH - ( value / top ) * plotH;

	// First, middle and last day under the axis.
	const labelled = series.length
		? [ 0, Math.floor( ( series.length - 1 ) / 2 ), series.length - 1 ]
		: [];

	const hovered = hover !== null ? series[ hover ] : null;

	return (
		<section className="pr-trend" aria-labelledby="pr-trend-title">
			<div className="pr-trend__head">
				<h2 id="pr-trend-title" className="pr-t-title">
					{ sprintf(
						/* translators: %s: a measure, e.g. "Views". */
						__( '%s per day', 'productreels' ),
						current.label
					) }
				</h2>
				<Segmented
					label={ __( 'Measure', 'productreels' ) }
					value={ current.value }
					onChange={ ( value ) => {
						setMeasure( value );
						setHover( null );
					} }
					options={ options.map( ( { value, label } ) => ( {
						value,
						label,
					} ) ) }
				/>
			</div>

			<div className="pr-trend__plot" ref={ box }>
				{ width > 0 && (
					<svg
						width={ width }
						height={ HEIGHT }
						role="img"
						aria-label={ sprintf(
							/* translators: 1: a measure, e.g. "Views"; 2: number of days. */
							__(
								'%1$s over the last %2$s days',
								'productreels'
							),
							current.label,
							formatNumber( series.length )
						) }
						onMouseLeave={ () => setHover( null ) }
					>
						{ [ 0, top / 2, top ].map( ( tick ) => (
							<g key={ tick }>
								<line
									className="pr-trend__grid"
									x1={ PAD.left }
									x2={ width - PAD.right }
									y1={ Math.round( y( tick ) ) + 0.5 }
									y2={ Math.round( y( tick ) ) + 0.5 }
								/>
								<text
									className="pr-trend__tick pr-t-caption"
									x={ PAD.left - 8 }
									y={ y( tick ) }
									dy="0.32em"
									textAnchor="end"
								>
									{ current.tick( tick ) }
								</text>
							</g>
						) ) }

						{ series.map( ( entry, index ) => {
							const value = values[ index ];
							const x =
								PAD.left + index * slot + ( slot - barW ) / 2;
							const height = PAD.top + plotH - y( value );

							return (
								<g key={ entry.day }>
									{ value > 0 && (
										<path
											className={
												index === hover
													? 'pr-trend__bar is-hover'
													: 'pr-trend__bar'
											}
											d={ columnPath(
												x,
												y( value ),
												barW,
												height
											) }
										/>
									) }
									{ /* The hit area is the whole day's slot, taller than the column. */ }
									<rect
										className="pr-trend__hit"
										x={ PAD.left + index * slot }
										y={ PAD.top }
										width={ slot }
										height={ plotH }
										onMouseEnter={ () => setHover( index ) }
									/>
								</g>
							);
						} ) }

						{ labelled.map( ( index, position ) => (
							<text
								key={ `${ index }-${ position }` }
								className="pr-trend__tick pr-t-caption"
								x={ PAD.left + index * slot + slot / 2 }
								y={ HEIGHT - 6 }
								textAnchor={
									[ 'start', 'middle', 'end' ][ position ]
								}
							>
								{ days.format( asDate( series[ index ].day ) ) }
							</text>
						) ) }
					</svg>
				) }

				{ hovered && (
					<div
						className="pr-trend__tip"
						style={ {
							'--pr-tip-x': `${
								PAD.left + hover * slot + slot / 2
							}px`,
						} }
						aria-hidden="true"
					>
						<span className="pr-t-caption pr-muted">
							{ days.format( asDate( hovered.day ) ) }
						</span>
						<span className="pr-t-body-strong">
							{ current.format( values[ hover ] ) }
						</span>
					</div>
				) }

				{ empty && (
					<p className="pr-trend__empty pr-t-small pr-muted">
						{ __( 'Nothing on these days yet.', 'productreels' ) }
					</p>
				) }
			</div>

			<table className="pr-sr">
				<caption>
					{ sprintf(
						/* translators: %s: a measure, e.g. "Views". */
						__( '%s per day', 'productreels' ),
						current.label
					) }
				</caption>
				<thead>
					<tr>
						<th scope="col">{ __( 'Day', 'productreels' ) }</th>
						<th scope="col">{ current.label }</th>
					</tr>
				</thead>
				<tbody>
					{ series.map( ( entry, index ) => (
						<tr key={ entry.day }>
							<th scope="row">
								{ days.format( asDate( entry.day ) ) }
							</th>
							<td>{ current.format( values[ index ] ) }</td>
						</tr>
					) ) }
				</tbody>
			</table>
		</section>
	);
};
