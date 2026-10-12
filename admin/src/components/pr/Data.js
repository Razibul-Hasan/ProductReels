/**
 * MetricBand, BarCell, ReelStack, EmptyState and Skeleton: numbers, posters
 * and the states a list is in before it has content.
 *
 * Every list has four non-content states: empty and no-results use
 * EmptyState, loading uses Skeleton, errors use a danger Notice.
 */

import { __ } from '@wordpress/i18n';
import { Icon } from '@shared/Icon';
import { formatNumber } from '../../format';

const cx = ( ...names ) => names.filter( Boolean ).join( ' ' );

/**
 * Pass values already formatted ("12,480", "8.3%"), via formatNumber().
 *
 * @param {Object} props       Props.
 * @param {Array}  props.items { label, value, hint, icon }.
 */
export const MetricBand = ( { items = [] } ) => (
	<div className="pr-metrics" role="list">
		{ items.map( ( item ) => (
			<div className="pr-metric" role="listitem" key={ item.label }>
				<span className="pr-metric__label pr-t-label">
					{ item.icon && <Icon name={ item.icon } size={ 16 } /> }
					{ item.label }
				</span>
				<span className="pr-metric__value pr-t-metric">
					{ item.value }
				</span>
				{ item.hint && (
					<span className="pr-metric__hint pr-t-small">
						{ item.hint }
					</span>
				) }
			</div>
		) ) }
	</div>
);

export const BarCell = ( { value, max, label } ) => {
	const share = max ? Math.max( 4, Math.round( ( value / max ) * 100 ) ) : 0;

	return (
		<span className="pr-bar">
			<span className="pr-bar__track" aria-hidden="true">
				<span
					className="pr-bar__fill"
					style={ { width: `${ share }%` } }
				/>
			</span>
			<span className="pr-bar__value pr-t-body">
				{ label ?? formatNumber( value ) }
			</span>
		</span>
	);
};

/**
 * Up to three of a widget's reels, overlapped, in the widget's own order.
 *
 * @param {Object}   props         Props.
 * @param {string[]} props.posters Poster URLs; an empty string draws a blank frame.
 * @param {boolean}  props.round   Circles, for circle-shaped widgets.
 * @param {number}   props.max     How many to show.
 */
export const ReelStack = ( { posters = [], round, max = 3 } ) => (
	<span
		className={ cx( 'pr-stack', round && 'pr-stack--round' ) }
		aria-hidden="true"
	>
		{ posters.slice( 0, max ).map( ( poster, index ) => (
			<span
				className="pr-stack__item"
				key={ index }
				style={ { zIndex: max - index } }
			>
				{ poster && <img src={ poster } alt="" loading="lazy" /> }
			</span>
		) ) }
	</span>
);

export const EmptyState = ( {
	title,
	description,
	actions,
	icon = 'play',
	panel,
} ) => (
	<div className={ cx( 'pr-empty', panel && 'pr-empty--panel' ) }>
		<div className="pr-empty__art" aria-hidden="true">
			<span />
			<span>
				<Icon name={ icon } size={ 20 } />
			</span>
			<span />
		</div>
		<h3 className="pr-t-title">{ title }</h3>
		{ description && (
			<p className="pr-empty__desc pr-t-body">{ description }</p>
		) }
		{ actions && <div className="pr-empty__actions">{ actions }</div> }
	</div>
);

/**
 * Loading placeholders in --pr-surface-sunken: table rows or 9:16 cards.
 *
 * @param {Object} props         Props.
 * @param {string} props.variant 'rows' or 'cards'.
 * @param {number} props.count   How many.
 * @param {string} props.label   What is loading, for screen readers.
 */
export const Skeleton = ( {
	variant = 'rows',
	count = variant === 'cards' ? 8 : 4,
	label = __( 'Loading…', 'productreels' ),
} ) => (
	<div
		className={ `pr-skeleton pr-skeleton--${ variant }` }
		aria-busy="true"
		aria-live="polite"
	>
		<span className="pr-sr">{ label }</span>
		{ Array.from( { length: count }, ( unused, index ) =>
			variant === 'cards' ? (
				<span
					className="pr-skeleton__card"
					key={ index }
					aria-hidden="true"
				>
					<span className="pr-skeleton__media" />
					<span className="pr-skeleton__line" />
					<span className="pr-skeleton__line pr-skeleton__line--short" />
				</span>
			) : (
				<span
					className="pr-skeleton__row"
					key={ index }
					aria-hidden="true"
				>
					<span className="pr-skeleton__thumb" />
					<span className="pr-skeleton__lines">
						<span className="pr-skeleton__line" />
						<span className="pr-skeleton__line pr-skeleton__line--short" />
					</span>
				</span>
			)
		) }
	</div>
);
