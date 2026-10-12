/**
 * FilterChips, Tabs and Segmented: three ways to pick one of a few.
 *
 * FilterChips narrow a list. Tabs change what you are looking at. Segmented
 * sets a value that gets saved. Tabs and Segmented are single tab stops with
 * roving focus: the arrow keys move between options (and choose them), Home
 * and End jump to the ends, and left and right follow the writing direction.
 */

import { useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon } from '@shared/Icon';
import { formatNumber } from '../../format';
import { isRtl } from './portal';

const cx = ( ...names ) => names.filter( Boolean ).join( ' ' );

/**
 * Keyboard handler for a row of options with roving focus.
 *
 * @param {Object}   container Ref to the element holding the options.
 * @param {string}   selector  Selector for the options.
 * @param {Array}    values    The option values, in order.
 * @param {*}        current   The current value.
 * @param {Function} choose    Called with the value to move to.
 * @return {Function} An onKeyDown handler.
 */
const rovingKeys =
	( container, selector, values, current, choose ) => ( event ) => {
		const index = values.indexOf( current );
		const back = isRtl( container.current ) ? 'ArrowRight' : 'ArrowLeft';
		let next;

		if ( event.key === back || event.key === 'ArrowUp' ) {
			next = ( index - 1 + values.length ) % values.length;
		} else if (
			event.key === 'ArrowRight' ||
			event.key === 'ArrowLeft' ||
			event.key === 'ArrowDown'
		) {
			next = ( index + 1 ) % values.length;
		} else if ( event.key === 'Home' ) {
			next = 0;
		} else if ( event.key === 'End' ) {
			next = values.length - 1;
		} else {
			return;
		}

		event.preventDefault();
		choose( values[ next ] );
		container.current?.querySelectorAll( selector )[ next ]?.focus();
	};

export const FilterChips = ( { items = [], value, onChange, label } ) => (
	<div
		className="pr-rowh"
		role="group"
		aria-label={ label || __( 'Filter', 'productreels' ) }
	>
		{ items.map( ( item ) => (
			<button
				key={ item.id }
				type="button"
				className="pr-chip pr-t-label"
				aria-pressed={ value === item.id ? 'true' : 'false' }
				onClick={ () => onChange?.( item.id ) }
			>
				{ item.label }
				{ item.count !== null && item.count !== undefined && (
					<span className="pr-chip__n">
						{ formatNumber( item.count ) }
					</span>
				) }
			</button>
		) ) }
	</div>
);

export const Tabs = ( { items = [], value, onChange, label, idPrefix } ) => {
	const list = useRef( null );
	const ids = items.map( ( item ) => item.id );
	// One tab stop, even before anything is selected.
	const stop = ids.includes( value ) ? value : ids[ 0 ];

	return (
		// The tablist handles the arrow keys; each tab is still a button.
		// eslint-disable-next-line jsx-a11y/interactive-supports-focus
		<div
			ref={ list }
			className="pr-tabs"
			role="tablist"
			aria-label={ label }
			onKeyDown={ rovingKeys( list, '[role="tab"]', ids, value, ( id ) =>
				onChange?.( id )
			) }
		>
			{ items.map( ( item ) => {
				const selected = value === item.id;

				return (
					<button
						key={ item.id }
						type="button"
						role="tab"
						id={
							idPrefix
								? `${ idPrefix }-tab-${ item.id }`
								: undefined
						}
						aria-controls={
							idPrefix
								? `${ idPrefix }-panel-${ item.id }`
								: undefined
						}
						aria-selected={ selected ? 'true' : 'false' }
						tabIndex={ item.id === stop ? 0 : -1 }
						className="pr-tab pr-t-body-strong"
						onClick={ () => onChange?.( item.id ) }
					>
						{ item.icon && <Icon name={ item.icon } size={ 16 } /> }
						{ item.label }
					</button>
				);
			} ) }
		</div>
	);
};

export const Segmented = ( {
	options = [],
	value,
	defaultValue,
	onChange,
	block,
	variant,
	iconOnly,
	label,
} ) => {
	const group = useRef( null );
	const values = options.map( ( option ) => option.value ?? option.id );
	const [ own, setOwn ] = useState( defaultValue ?? values[ 0 ] );
	const current = value ?? own;
	const stop = values.includes( current ) ? current : values[ 0 ];

	const choose = ( next ) => {
		setOwn( next );

		if ( next !== current ) {
			onChange?.( next );
		}
	};

	return (
		// The radiogroup handles the arrow keys; each radio is a button.
		// eslint-disable-next-line jsx-a11y/interactive-supports-focus
		<div
			ref={ group }
			role="radiogroup"
			aria-label={ label }
			className={ cx(
				'pr-seg',
				block && 'pr-seg--block',
				variant === 'studio' && 'pr-seg--studio',
				iconOnly && 'pr-seg--icons'
			) }
			onKeyDown={ rovingKeys(
				group,
				'[role="radio"]',
				values,
				current,
				choose
			) }
		>
			{ options.map( ( option, index ) => {
				const checked = current === values[ index ];

				return (
					<button
						key={ values[ index ] }
						type="button"
						role="radio"
						aria-checked={ checked ? 'true' : 'false' }
						aria-label={ iconOnly ? option.label : undefined }
						title={ iconOnly ? option.label : undefined }
						tabIndex={ values[ index ] === stop ? 0 : -1 }
						className="pr-seg__item pr-t-label"
						onClick={ () => choose( values[ index ] ) }
					>
						{ option.icon && (
							<Icon name={ option.icon } size={ 16 } />
						) }
						{ ! iconOnly && option.label }
					</button>
				);
			} ) }
		</div>
	);
};
