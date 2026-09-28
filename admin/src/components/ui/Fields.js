/**
 * Text input, search input, switch and checkbox.
 *
 * The switch and the checkbox are buttons with ARIA state rather than real
 * inputs, because wp-admin styles native controls heavily and fighting that is
 * worse than owning the behaviour outright. Both are keyboard operable the way
 * their native counterparts are.
 */

import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { IconCheck, IconClose, IconSearch } from '../icons';

export const Field = ( { label, help, error, htmlFor, children } ) => (
	<div className="wr-field">
		{ label && (
			<label className="wr-field__label" htmlFor={ htmlFor }>
				{ label }
			</label>
		) }
		{ children }
		{ error ? (
			<span className="wr-field__error">{ error }</span>
		) : (
			help && <span className="wr-field__help">{ help }</span>
		) }
	</div>
);

export const TextField = ( {
	label,
	help,
	error,
	value,
	onChange,
	type = 'text',
	...rest
} ) => {
	const id = useInstanceId( TextField, 'wr-input' );

	return (
		<Field label={ label } help={ help } error={ error } htmlFor={ id }>
			<input
				id={ id }
				type={ type }
				className={ `wr-input${ error ? ' wr-input--invalid' : '' }` }
				value={ value }
				aria-invalid={ error ? 'true' : undefined }
				onChange={ ( event ) => onChange( event.target.value ) }
				{ ...rest }
			/>
		</Field>
	);
};

export const SearchInput = ( { value, onChange, placeholder, label } ) => (
	<div className="wr-search">
		<IconSearch size={ 15 } className="wr-search__icon" />
		<input
			type="search"
			className="wr-search__input"
			value={ value }
			placeholder={ placeholder }
			aria-label={ label || placeholder }
			onChange={ ( event ) => onChange( event.target.value ) }
		/>
		{ value !== '' && (
			<button
				type="button"
				className="wr-search__clear"
				aria-label={ __(
					'Clear',
					'productreels-shoppable-video-reels-for-woocommerce'
				) }
				onClick={ () => onChange( '' ) }
			>
				<IconClose size={ 14 } />
			</button>
		) }
	</div>
);

export const Switch = ( {
	checked,
	onChange,
	label,
	help,
	disabled = false,
} ) => (
	<div className="wr-switch-row">
		<span className="wr-switch-row__text">
			<span className="wr-field__label">{ label }</span>
			{ help && <span className="wr-field__help">{ help }</span> }
		</span>
		<button
			type="button"
			role="switch"
			aria-checked={ checked ? 'true' : 'false' }
			aria-label={ label }
			className="wr-switch"
			disabled={ disabled }
			onClick={ () => onChange( ! checked ) }
		/>
	</div>
);

export const Checkbox = ( { checked, onChange, label } ) => (
	<button
		type="button"
		role="checkbox"
		aria-checked={ checked ? 'true' : 'false' }
		aria-label={ label }
		className="wr-check"
		onClick={ ( event ) => {
			event.stopPropagation();
			onChange( ! checked );
		} }
	>
		{ checked && <IconCheck size={ 12 } /> }
	</button>
);
