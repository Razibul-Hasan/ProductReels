/**
 * Colour picker: swatch trigger, popover, hex field, alpha slider and recents.
 *
 * Stores 8-digit hex (#rrggbbaa) because several defaults are transparent and
 * a widget's card background is routinely alpha. The native colour input is
 * used only inside the popover, as the eyedropper — never as the control
 * itself, which is why it is restyled rather than shown raw.
 *
 * Recent swatches live in this session only. They are a convenience while
 * styling one widget, not a preference worth persisting.
 *
 * 1.1.0: the colour helpers and the recents list live in pr/ColorField.js and
 * are shared with ColorField, the new trigger for this same picker. Part 14
 * removes this file once no screen uses it.
 */

import { useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useDismiss } from '../../hooks/use-dismiss';
import {
	joinColor,
	recentColors,
	rememberColor as remember,
	splitColor,
} from '../pr/ColorField';
import { Field } from './Fields';

const recents = recentColors();

export const ColorPicker = ( {
	label,
	help,
	value,
	onChange,
	disabled = false,
} ) => {
	const [ open, setOpen ] = useState( false );
	const [ draft, setDraft ] = useState( null );
	const ref = useRef( null );

	useDismiss( ref, open, () => {
		setOpen( false );
		setDraft( null );
		remember( value );
	} );

	const { rgb, alpha } = splitColor( value );
	const shown = draft === null ? value : draft;

	const commit = ( next ) => {
		setDraft( null );
		onChange( next );
	};

	return (
		<Field label={ label } help={ help }>
			<div className="wr-color" ref={ ref }>
				<button
					type="button"
					className="wr-color__trigger"
					aria-haspopup="dialog"
					aria-expanded={ open ? 'true' : 'false' }
					aria-label={ `${ label }: ${ value }` }
					disabled={ disabled }
					onClick={ () => setOpen( ! open ) }
				>
					<span className="wr-color__swatch">
						<span
							className="wr-color__swatch-fill"
							style={ { background: value } }
						/>
					</span>
					<span>{ value }</span>
				</button>

				{ open && (
					<div
						className="wr-color__popover"
						role="dialog"
						aria-label={ label }
					>
						<input
							type="color"
							className="wr-color__native"
							value={ rgb }
							aria-label={ __(
								'Pick a colour',
								'productreels'
							) }
							onChange={ ( event ) =>
								commit( joinColor( event.target.value, alpha ) )
							}
						/>

						<input
							type="text"
							className="wr-input"
							value={ shown }
							spellCheck="false"
							aria-label={ __(
								'Hex value',
								'productreels'
							) }
							onChange={ ( event ) =>
								setDraft( event.target.value )
							}
							onBlur={ () => {
								if (
									draft !== null &&
									/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(
										draft.trim()
									)
								) {
									commit( draft.trim().toLowerCase() );
								} else {
									setDraft( null );
								}
							} }
						/>

						<div className="wr-color__alpha">
							<span className="wr-field__help">
								{ __(
									'Opacity',
									'productreels'
								) }
							</span>
							<input
								type="range"
								className="wr-slider__range"
								min="0"
								max="100"
								value={ alpha }
								aria-label={ __(
									'Opacity',
									'productreels'
								) }
								onChange={ ( event ) =>
									commit(
										joinColor(
											rgb,
											Number( event.target.value )
										)
									)
								}
							/>
							<span className="wr-field__help">{ alpha }%</span>
						</div>

						{ recents.length > 0 && (
							<div className="wr-color__recents">
								{ recents.map( ( colour ) => (
									<button
										key={ colour }
										type="button"
										className="wr-color__recent"
										style={ { background: colour } }
										aria-label={ colour }
										onClick={ () => commit( colour ) }
									/>
								) ) }
							</div>
						) }
					</div>
				) }
			</div>
		</Field>
	);
};
