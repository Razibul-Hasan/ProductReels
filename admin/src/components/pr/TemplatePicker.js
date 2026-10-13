/**
 * TemplatePicker: choose a widget's layout by its shape; OptionCards, the
 * radio group of picture cards it is built on.
 *
 * Five options, each with a small diagram of how reels sit on the page. The
 * `list` variant stacks them in the editor panel; the `tile` variant lays them
 * out as cards in the Create widget dialog. It is a radio group with roving
 * focus: one tab stop, the arrow keys move and choose, Home and End jump.
 *
 * The diagrams are plain spans placed by _pr-studio.scss (`data-layout` and
 * the span's position), so no geometry lives in inline styles.
 */

import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon } from '@shared/Icon';
import { LAYOUTS } from './Badge';
import { isRtl } from './portal';

const cx = ( ...names ) => names.filter( Boolean ).join( ' ' );

/** Each diagram's pieces, in order: '' solid, or the modifier classes. */
const DIAGRAMS = {
	grid: [ '', '', '', 'ghost', 'ghost', 'ghost' ],
	carousel: [ 'ghost', '', '', '', 'ghost', 'round' ],
	marquee: [ 'ghost', '', '', '', 'ghost', 'ghost round' ],
	stacked: [ 'ghost', 'ghost', '' ],
	popup: [ 'page', 'ghost round', 'ghost round', '' ],
};

const MiniDiagram = ( { layout } ) =>
	( DIAGRAMS[ layout ] || [] ).map( ( kinds, index ) => (
		<span
			key={ index }
			className={ cx(
				'pr-mini',
				...kinds
					.split( ' ' )
					.filter( Boolean )
					.map( ( kind ) => `pr-mini--${ kind }` )
			) }
		/>
	) );

/**
 * A radio group of option cards: a small picture, a name and a line saying
 * what it does. TemplatePicker is one; the Product card step's style is
 * another.
 *
 * @param {Object}   props           Props.
 * @param {Array}    props.options   `{ value, label, desc, art }`.
 * @param {string}   props.value     The chosen value.
 * @param {Function} props.onChange  Receives the new value.
 * @param {string}   props.variant   `list` (rows) or `tile` (cards).
 * @param {string}   props.label     The group's accessible name.
 * @param {string}   props.className An extra class on the group.
 * @return {Object} The group.
 */
export const OptionCards = ( {
	options = [],
	value,
	onChange,
	variant = 'list',
	label,
	className,
} ) => {
	const group = useRef( null );
	const values = options.map( ( option ) => option.value );
	const stop = values.includes( value ) ? value : values[ 0 ];

	const onKeyDown = ( event ) => {
		const index = values.indexOf( stop );
		const back = isRtl( group.current ) ? 'ArrowRight' : 'ArrowLeft';
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
		onChange?.( values[ next ] );
		group.current?.querySelectorAll( '[role="radio"]' )[ next ]?.focus();
	};

	return (
		// The radiogroup handles the arrow keys; each radio is a button.
		// eslint-disable-next-line jsx-a11y/interactive-supports-focus
		<div
			ref={ group }
			className={ cx(
				'pr-templates',
				variant === 'tile' && 'pr-templates--tiles',
				className
			) }
			role="radiogroup"
			aria-label={ label }
			onKeyDown={ onKeyDown }
		>
			{ options.map( ( option ) => {
				const on = value === option.value;

				return (
					<button
						key={ option.value }
						type="button"
						role="radio"
						aria-checked={ on ? 'true' : 'false' }
						tabIndex={ option.value === stop ? 0 : -1 }
						className={ cx(
							'pr-template',
							variant === 'tile' && 'pr-template--tile'
						) }
						onClick={ () => onChange?.( option.value ) }
					>
						<span className="pr-template__art" aria-hidden="true">
							{ option.art }
						</span>
						<span className="pr-template__text">
							<span className="pr-t-heading">
								{ option.label }
							</span>
							{ option.desc && (
								<span className="pr-template__desc pr-t-small">
									{ option.desc }
								</span>
							) }
						</span>
						{ on && (
							<span className="pr-template__tick">
								<Icon
									name="check"
									size={ 13 }
									strokeWidth={ 2.5 }
								/>
							</span>
						) }
					</button>
				);
			} ) }
		</div>
	);
};

export const TemplatePicker = ( {
	value,
	onChange,
	layouts = [ 'grid', 'carousel', 'marquee', 'stacked', 'popup' ],
	variant = 'list',
	label = __( 'Layout', 'productreels' ),
} ) => (
	<OptionCards
		value={ value }
		onChange={ onChange }
		variant={ variant }
		label={ label }
		options={ layouts.map( ( id ) => ( {
			value: id,
			label: LAYOUTS[ id ].label,
			desc: LAYOUTS[ id ].desc,
			art: (
				<span className="pr-template__diagram" data-layout={ id }>
					<MiniDiagram layout={ id } />
				</span>
			),
		} ) ) }
	/>
);
