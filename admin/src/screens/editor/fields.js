/**
 * Small pieces the editor steps share: the device note on a section that
 * edits one device, the per-device style keys, a colour field that keeps
 * 1.0.0's colour format, and a native select.
 */

import { useInstanceId } from '@wordpress/compose';
import { Icon } from '@shared/Icon';
import { ColorField, DEVICES, Field } from '../../components/pr';

/** The stored key for each device, for settings 1.0.0 keeps per device. */
export const RESPONSIVE = {
	size: { desktop: 'size', tablet: 'sizeOnTab', mobile: 'sizeOnMobile' },
	gap: { desktop: 'gap', tablet: 'gapOnTab', mobile: 'gapOnMobile' },
	radius: {
		desktop: 'border.radius',
		tablet: 'border.radiusOnTab',
		mobile: 'border.radiusOnMobile',
	},
};

/**
 * Read a dotted path from the styles.
 *
 * @param {Object} styles The widget styles.
 * @param {string} path   e.g. 'border.radius'.
 * @return {*} The value.
 */
export const read = ( styles, path ) =>
	path
		.split( '.' )
		.reduce(
			( value, key ) =>
				value && typeof value === 'object' ? value[ key ] : undefined,
			styles
		);

/**
 * "Desktop", "Tablet" or "Mobile" with its icon: the section's settings edit
 * the device the stage shows.
 *
 * @param {Object} props        Props.
 * @param {string} props.device The stage's device.
 * @return {Object} The note.
 */
export const DeviceNote = ( { device } ) => {
	const entry = DEVICES[ device ] || DEVICES.desktop;

	return (
		<span className="pr-devicenote">
			<Icon name={ entry.icon } size={ 14 } />
			{ entry.label }
		</span>
	);
};

/* Keys 1.0.0 seeds with a transparent colour; their opacity is part of the
   setting, so they always show it. */
const ALPHA_KEYS = [ 'overlayColor', 'cardBgColor' ];

/**
 * A colour setting. 1.0.0's picker let every colour carry an alpha
 * (#rrggbbaa), so a stored value that has one keeps it, and its opacity
 * shows; the rest stay #rrggbb.
 *
 * @param {Object}   props        Props.
 * @param {string}   props.label  The label.
 * @param {string}   props.path   The style key.
 * @param {Object}   props.styles The widget styles.
 * @param {Function} props.set    Style setter.
 * @param {string}   props.help   Help text.
 * @return {Object} The field.
 */
export const StyleColor = ( { label, path, styles, set, help } ) => {
	const value = read( styles, path ) || '';
	const opacity =
		ALPHA_KEYS.includes( path ) ||
		/^#(?:[0-9a-f]{4}|[0-9a-f]{8})$/i.test( value );

	return (
		<ColorField
			label={ label }
			help={ help }
			value={ value }
			opacity={ opacity }
			onChange={ ( next ) => set( path, next ) }
		/>
	);
};

/**
 * A native select in the design's style, for lists longer than a
 * Segmented holds.
 *
 * @param {Object}   props          Props.
 * @param {string}   props.label    The label.
 * @param {string}   props.help     Help text.
 * @param {string}   props.value    The current value.
 * @param {Array}    props.options  `{ value, label }` pairs.
 * @param {Function} props.onChange Receives the new value.
 * @return {Object} The field.
 */
export const SelectField = ( { label, help, value, options, onChange } ) => {
	const id = useInstanceId( SelectField, 'pr-select' );

	return (
		<Field
			label={ label }
			help={ help }
			htmlFor={ id }
			describedBy={ help ? `${ id }-help` : undefined }
		>
			<span className="pr-selectwrap">
				<select
					id={ id }
					className="pr-select pr-t-body"
					value={ value }
					aria-describedby={ help ? `${ id }-help` : undefined }
					onChange={ ( event ) => onChange( event.target.value ) }
				>
					{ options.map( ( option ) => (
						<option key={ option.value } value={ option.value }>
							{ option.label }
						</option>
					) ) }
				</select>
				<Icon name="chevron-down" size={ 18 } />
			</span>
		</Field>
	);
};
