/**
 * TemplatePicker: choose a widget's layout by its shape.
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

export const TemplatePicker = ( {
	value,
	onChange,
	layouts = [ 'grid', 'carousel', 'marquee', 'stacked', 'popup' ],
	variant = 'list',
	label = __( 'Layout', 'productreels' ),
} ) => {
	const group = useRef( null );
	const stop = layouts.includes( value ) ? value : layouts[ 0 ];

	const onKeyDown = ( event ) => {
		const index = layouts.indexOf( stop );
		const back = isRtl( group.current ) ? 'ArrowRight' : 'ArrowLeft';
		let next;

		if ( event.key === back || event.key === 'ArrowUp' ) {
			next = ( index - 1 + layouts.length ) % layouts.length;
		} else if (
			event.key === 'ArrowRight' ||
			event.key === 'ArrowLeft' ||
			event.key === 'ArrowDown'
		) {
			next = ( index + 1 ) % layouts.length;
		} else if ( event.key === 'Home' ) {
			next = 0;
		} else if ( event.key === 'End' ) {
			next = layouts.length - 1;
		} else {
			return;
		}

		event.preventDefault();
		onChange?.( layouts[ next ] );
		group.current?.querySelectorAll( '[role="radio"]' )[ next ]?.focus();
	};

	return (
		// The radiogroup handles the arrow keys; each radio is a button.
		// eslint-disable-next-line jsx-a11y/interactive-supports-focus
		<div
			ref={ group }
			className={ cx(
				'pr-templates',
				variant === 'tile' && 'pr-templates--tiles'
			) }
			role="radiogroup"
			aria-label={ label }
			onKeyDown={ onKeyDown }
		>
			{ layouts.map( ( id ) => {
				const layout = LAYOUTS[ id ];
				const on = value === id;

				return (
					<button
						key={ id }
						type="button"
						role="radio"
						aria-checked={ on ? 'true' : 'false' }
						tabIndex={ id === stop ? 0 : -1 }
						className={ cx(
							'pr-template',
							variant === 'tile' && 'pr-template--tile'
						) }
						onClick={ () => onChange?.( id ) }
					>
						<span className="pr-template__art" aria-hidden="true">
							<span
								className="pr-template__diagram"
								data-layout={ id }
							>
								<MiniDiagram layout={ id } />
							</span>
						</span>
						<span className="pr-template__text">
							<span className="pr-t-heading">
								{ layout.label }
							</span>
							<span className="pr-template__desc pr-t-small">
								{ layout.desc }
							</span>
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
