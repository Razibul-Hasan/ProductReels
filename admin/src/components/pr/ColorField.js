/**
 * ColorField: a colour setting as swatch, hex and (when the setting stores
 * it) opacity, opening the plugin's colour picker in a popover.
 *
 * It is the same picker 1.0.0 uses (ui/ColorPicker.js): the native colour
 * input as the visual picker and eyedropper, a hex field, an opacity slider
 * and this session's recent colours, which both share. Values stay lowercase
 * #rrggbb, or #rrggbbaa when `opacity` is on, as Productreels_Validator expects.
 */

import {
	createPortal,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { Field } from './Fields';
import { isRtl, placePopover, portalRoot } from './portal';

const recents = [];

/**
 * Remember a colour as recently used, newest first, eight at most.
 *
 * @param {string} value A hex colour.
 */
export const rememberColor = ( value ) => {
	const index = recents.indexOf( value );

	if ( index !== -1 ) {
		recents.splice( index, 1 );
	}

	recents.unshift( value );
	recents.splice( 8 );
};

/**
 * This session's recent colours, newest first.
 *
 * @return {string[]} Hex colours.
 */
export const recentColors = () => recents;

/**
 * Split #rrggbbaa into its solid part and its alpha, tolerating short forms.
 *
 * @param {string} value A hex colour.
 * @return {{rgb: string, alpha: number}} The solid colour and its alpha (0–100).
 */
export const splitColor = ( value ) => {
	const hex = typeof value === 'string' ? value.trim() : '';

	if ( /^#[0-9a-f]{8}$/i.test( hex ) ) {
		return {
			rgb: hex.slice( 0, 7 ),
			alpha: Math.round( ( parseInt( hex.slice( 7 ), 16 ) / 255 ) * 100 ),
		};
	}

	if ( /^#[0-9a-f]{6}$/i.test( hex ) ) {
		return { rgb: hex, alpha: 100 };
	}

	if ( /^#[0-9a-f]{3}$/i.test( hex ) ) {
		const [ , r, g, b ] = hex;

		return { rgb: `#${ r }${ r }${ g }${ g }${ b }${ b }`, alpha: 100 };
	}

	return { rgb: '#000000', alpha: 100 };
};

/**
 * Join a solid colour and an alpha back into hex; opaque stays 6-digit.
 *
 * @param {string} rgb   #rrggbb.
 * @param {number} alpha 0–100.
 * @return {string} #rrggbb or #rrggbbaa.
 */
export const joinColor = ( rgb, alpha ) => {
	if ( alpha >= 100 ) {
		return rgb;
	}

	return (
		rgb +
		Math.round( ( alpha / 100 ) * 255 )
			.toString( 16 )
			.padStart( 2, '0' )
	);
};

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

export const ColorField = ( {
	label,
	value,
	help,
	opacity = false,
	disabled = false,
	onChange,
} ) => {
	const id = useInstanceId( ColorField, 'pr-color' );
	const [ open, setOpen ] = useState( false );
	const [ place, setPlace ] = useState( null );
	const [ draft, setDraft ] = useState( null );
	const trigger = useRef( null );
	const pop = useRef( null );
	const { rgb, alpha } = splitColor( value );

	const commit = ( next ) => {
		setDraft( null );

		if ( next !== value ) {
			onChange?.( next );
		}
	};

	const close = ( returnFocus = true ) => {
		setOpen( false );
		setPlace( null );
		setDraft( null );
		rememberColor( value );

		if ( returnFocus ) {
			trigger.current?.focus();
		}
	};

	useLayoutEffect( () => {
		if ( ! open ) {
			return undefined;
		}

		const position = () => {
			if ( trigger.current && pop.current ) {
				setPlace(
					placePopover(
						trigger.current.getBoundingClientRect(),
						pop.current.getBoundingClientRect(),
						{ align: 'start', rtl: isRtl( trigger.current ) }
					)
				);
			}
		};

		position();
		window.addEventListener( 'resize', position );
		window.addEventListener( 'scroll', position, true );

		return () => {
			window.removeEventListener( 'resize', position );
			window.removeEventListener( 'scroll', position, true );
		};
	}, [ open ] );

	useEffect( () => {
		if ( open && place ) {
			pop.current?.querySelector( 'input[type="text"]' )?.focus();
		}
		// Focus once, when it is first placed.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ open, !! place ] );

	useEffect( () => {
		if ( ! open ) {
			return undefined;
		}

		const outside = ( event ) => {
			if (
				! pop.current?.contains( event.target ) &&
				! trigger.current?.contains( event.target )
			) {
				close( false );
			}
		};

		// Escape from the popover or its trigger closes the popover only; a
		// dialog around the field leaves Escape to it while it is expanded.
		const escape = ( event ) => {
			if (
				event.key === 'Escape' &&
				( pop.current?.contains( event.target ) ||
					trigger.current?.contains( event.target ) )
			) {
				close();
			}
		};

		document.addEventListener( 'pointerdown', outside, true );
		document.addEventListener( 'keydown', escape );

		return () => {
			document.removeEventListener( 'pointerdown', outside, true );
			document.removeEventListener( 'keydown', escape );
		};
		// close() only reads refs and the current value.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ open, value ] );

	const hexShown = ( value || '' ).replace( '#', '' ).slice( 0, 6 );

	return (
		<Field
			label={ label }
			help={ help }
			htmlFor={ id }
			describedBy={ help ? `${ id }-help` : undefined }
		>
			<button
				ref={ trigger }
				id={ id }
				type="button"
				className="pr-color"
				disabled={ disabled }
				aria-haspopup="dialog"
				aria-expanded={ open ? 'true' : 'false' }
				aria-label={ sprintf(
					/* translators: 1: a setting name, e.g. "Title colour", 2: its value, e.g. #ffffff. */
					__( '%1$s: %2$s', 'productreels' ),
					label,
					value
				) }
				aria-describedby={ help ? `${ id }-help` : undefined }
				onClick={ () => ( open ? close() : setOpen( true ) ) }
			>
				<span className="pr-color__swatch">
					<span style={ { background: value } } />
				</span>
				<span className="pr-color__hex pr-t-code">{ hexShown }</span>
				{ opacity && (
					<span className="pr-color__alpha pr-t-small">
						{ alpha }%
					</span>
				) }
			</button>
			{ open &&
				createPortal(
					<div
						ref={ pop }
						className="pr-colorpop"
						role="dialog"
						aria-label={ label }
						style={ {
							top: `${ place ? place.top : 0 }px`,
							left: `${ place ? place.left : 0 }px`,
							visibility: place ? 'visible' : 'hidden',
						} }
					>
						<input
							type="color"
							className="pr-colorpop__native"
							value={ rgb }
							aria-label={ __( 'Pick a colour', 'productreels' ) }
							onChange={ ( event ) =>
								commit(
									opacity
										? joinColor( event.target.value, alpha )
										: event.target.value
								)
							}
						/>
						<div className="pr-colorpop__row">
							<div className="pr-inputwrap pr-colorpop__hex">
								<span
									className="pr-inputwrap__icon pr-t-code"
									aria-hidden="true"
								>
									#
								</span>
								<input
									type="text"
									className="pr-input pr-t-code"
									value={ ( draft ?? value ?? '' ).replace(
										'#',
										''
									) }
									spellCheck="false"
									maxLength={ opacity ? 8 : 6 }
									aria-label={ __(
										'Hex value',
										'productreels'
									) }
									onChange={ ( event ) =>
										setDraft( event.target.value )
									}
									onBlur={ () => {
										const typed = ( draft ?? '' ).trim();

										if (
											draft !== null &&
											HEX.test( typed )
										) {
											const hex = `#${ typed.replace( '#', '' ).toLowerCase() }`;

											commit(
												opacity
													? hex
													: splitColor( hex ).rgb
											);
										} else {
											setDraft( null );
										}
									} }
									onKeyDown={ ( event ) => {
										if ( event.key === 'Enter' ) {
											event.currentTarget.blur();
										}
									} }
								/>
							</div>
							{ opacity && (
								<span className="pr-colorpop__alpha pr-t-small">
									{ alpha }%
								</span>
							) }
						</div>
						{ opacity && (
							<input
								type="range"
								className="pr-slider"
								min="0"
								max="100"
								value={ alpha }
								style={ { '--pr-fill': `${ alpha }%` } }
								aria-label={ __( 'Opacity', 'productreels' ) }
								aria-valuetext={ `${ alpha }%` }
								onChange={ ( event ) =>
									commit(
										joinColor(
											rgb,
											Number( event.target.value )
										)
									)
								}
							/>
						) }
						{ recents.length > 0 && (
							<div className="pr-colorpop__recents">
								{ recents.map( ( colour ) => (
									<button
										key={ colour }
										type="button"
										className="pr-colorpop__recent"
										aria-label={ sprintf(
											/* translators: %s: a colour as hex, e.g. #ffffff. */
											__( 'Use %s', 'productreels' ),
											colour
										) }
										onClick={ () =>
											commit(
												opacity
													? colour
													: splitColor( colour ).rgb
											)
										}
									>
										<span
											style={ { background: colour } }
										/>
									</button>
								) ) }
							</div>
						) }
					</div>,
					portalRoot()
				) }
		</Field>
	);
};
