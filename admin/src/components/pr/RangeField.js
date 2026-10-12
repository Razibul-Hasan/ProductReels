/**
 * RangeField: a slider with its live value, for sizes, gaps, speeds and radii.
 *
 * The value box is editable. On both the slider and the box the arrow keys
 * step by one `step` and Shift+arrow by ten. The filled part of the track is
 * the --pr-fill custom property.
 *
 * A stored value outside min–max (the validator allows wider ranges than the
 * slider shows) is displayed as it is and never clamped on display; only a
 * value the person enters is kept inside min–max.
 */

import { useState } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';

const KEYS = {
	ArrowUp: 1,
	ArrowRight: 1,
	ArrowDown: -1,
	ArrowLeft: -1,
};

export const RangeField = ( {
	label,
	value = 0,
	min = 0,
	max = 100,
	step = 1,
	unit = 'px',
	help,
	onChange,
} ) => {
	const id = useInstanceId( RangeField, 'pr-range' );
	const [ draft, setDraft ] = useState( null );

	const clamp = ( next ) => Math.min( max, Math.max( min, next ) );
	const decimals = ( String( step ).split( '.' )[ 1 ] || '' ).length;
	const round = ( next ) => Number( next.toFixed( decimals ) );
	const fill =
		max > min
			? `${ ( ( clamp( value ) - min ) / ( max - min ) ) * 100 }%`
			: '0%';

	const set = ( next ) => {
		if ( Number.isFinite( next ) && next !== value ) {
			onChange?.( next );
		}
	};

	// Shift+arrow moves ten steps; plain arrows move one (the slider does
	// that natively, the value box needs it too).
	const onKeyDown = ( event ) => {
		const direction = KEYS[ event.key ];

		if (
			! direction ||
			( event.target.type === 'range' && ! event.shiftKey )
		) {
			return;
		}

		event.preventDefault();
		setDraft( null );

		const rtlFlip =
			event.target.type === 'range' &&
			( event.key === 'ArrowLeft' || event.key === 'ArrowRight' ) &&
			window.getComputedStyle( event.target ).direction === 'rtl'
				? -1
				: 1;

		set(
			round(
				clamp(
					value +
						direction * rtlFlip * step * ( event.shiftKey ? 10 : 1 )
				)
			)
		);
	};

	const commit = () => {
		if ( draft !== null ) {
			const next = parseFloat( draft.replace( ',', '.' ) );

			setDraft( null );

			if ( Number.isFinite( next ) ) {
				set( round( clamp( next ) ) );
			}
		}
	};

	return (
		<div className="pr-range">
			<div className="pr-range__head">
				<label className="pr-t-label" htmlFor={ id }>
					{ label }
				</label>
				<span className="pr-range__value pr-t-caption">
					<input
						type="text"
						inputMode="decimal"
						className="pr-range__input"
						value={ draft ?? String( value ) }
						size={ Math.max( 1, String( draft ?? value ).length ) }
						aria-label={ sprintf(
							/* translators: 1: a setting name, e.g. "Gap", 2: a unit, e.g. "px". */
							__( '%1$s in %2$s', 'productreels' ),
							label,
							unit || __( 'units', 'productreels' )
						) }
						onChange={ ( event ) => setDraft( event.target.value ) }
						onBlur={ commit }
						onKeyDown={ ( event ) => {
							if ( event.key === 'Enter' ) {
								commit();
							} else if (
								event.key === 'Escape' &&
								draft !== null
							) {
								event.stopPropagation();
								setDraft( null );
							} else {
								onKeyDown( event );
							}
						} }
					/>
					{ unit && (
						<span className="pr-muted" aria-hidden="true">
							{ unit }
						</span>
					) }
				</span>
			</div>
			<input
				type="range"
				id={ id }
				className="pr-slider"
				min={ min }
				max={ max }
				step={ step }
				value={ clamp( value ) }
				aria-valuetext={
					unit ? `${ value } ${ unit }` : String( value )
				}
				aria-describedby={ help ? `${ id }-help` : undefined }
				style={ { '--pr-fill': fill } }
				onChange={ ( event ) => set( Number( event.target.value ) ) }
				onKeyDown={ onKeyDown }
			/>
			{ help && (
				<p className="pr-field__help pr-t-small" id={ `${ id }-help` }>
					{ help }
				</p>
			) }
		</div>
	);
};
