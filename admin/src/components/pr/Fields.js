/**
 * Field, TextField, SearchField, Checkbox, Switch and Toggle.
 *
 * Text inputs pass native attributes straight through (value, onChange,
 * onBlur…), so `onChange` receives the event. Checkbox, Switch and Toggle call
 * `onChange` with the new boolean. Help and error text are tied to their input
 * with aria-describedby, so a screen reader hears them with the field.
 */

import { useState } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { Icon } from '@shared/Icon';

const cx = ( ...names ) => names.filter( Boolean ).join( ' ' );

export const Field = ( {
	label,
	help,
	error,
	htmlFor,
	describedBy,
	aside,
	children,
} ) => (
	<div className="pr-field">
		{ label && (
			<label className="pr-field__label pr-t-label" htmlFor={ htmlFor }>
				<span>{ label }</span>
				{ aside }
			</label>
		) }
		{ children }
		{ error && (
			<p className="pr-field__error pr-t-small" id={ describedBy }>
				<Icon name="alert" size={ 15 } />
				{ error }
			</p>
		) }
		{ ! error && help && (
			<p className="pr-field__help pr-t-small" id={ describedBy }>
				{ help }
			</p>
		) }
	</div>
);

export const TextField = ( {
	label,
	help,
	error,
	icon,
	suffix,
	multiline,
	aside,
	id: givenId,
	className,
	...rest
} ) => {
	const instance = useInstanceId( TextField, 'pr-field' );
	const id = givenId || instance;
	const describedBy = error || help ? `${ id }-help` : undefined;
	const props = {
		id,
		className: cx( 'pr-input pr-t-body', className ),
		'aria-invalid': error ? 'true' : undefined,
		'aria-describedby': describedBy,
		...rest,
	};
	const input = multiline ? (
		<textarea { ...props } />
	) : (
		<input { ...props } />
	);

	return (
		<Field
			label={ label }
			help={ help }
			error={ error }
			htmlFor={ id }
			describedBy={ describedBy }
			aside={ aside }
		>
			{ icon || suffix ? (
				<div
					className={ cx(
						'pr-inputwrap',
						icon && 'pr-inputwrap--icon',
						suffix && 'pr-inputwrap--suffix'
					) }
				>
					{ icon && (
						<Icon
							name={ icon }
							size={ 18 }
							className="pr-inputwrap__icon"
						/>
					) }
					{ input }
					{ suffix && (
						<span
							className="pr-inputwrap__suffix pr-t-small"
							aria-hidden="true"
						>
							{ suffix }
						</span>
					) }
				</div>
			) : (
				input
			) }
		</Field>
	);
};

export const SearchField = ( {
	placeholder = __( 'Search', 'productreels' ),
	label,
	width,
	...rest
} ) => (
	<div
		className="pr-inputwrap pr-inputwrap--icon"
		style={ width ? { width } : undefined }
	>
		<Icon name="search" size={ 18 } className="pr-inputwrap__icon" />
		<input
			type="search"
			className="pr-input pr-t-body"
			placeholder={ placeholder }
			aria-label={ label || placeholder }
			{ ...rest }
		/>
	</div>
);

export const Checkbox = ( {
	label,
	checked,
	defaultChecked,
	onChange,
	className,
	disabled,
	...rest
} ) => {
	const [ own, setOwn ] = useState( defaultChecked ?? !! checked );
	const id = useInstanceId( Checkbox, 'pr-check' );
	const box = (
		<input
			id={ id }
			type="checkbox"
			className={ cx( 'pr-check', ! label && className ) }
			checked={ checked ?? own }
			disabled={ disabled }
			aria-label={ label ? undefined : __( 'Select', 'productreels' ) }
			onChange={ ( event ) => {
				setOwn( event.target.checked );
				onChange?.( event.target.checked );
			} }
			{ ...rest }
		/>
	);

	if ( ! label ) {
		return box;
	}

	return (
		<label
			className={ cx( 'pr-checkline pr-t-body', className ) }
			htmlFor={ id }
		>
			{ box }
			{ label }
		</label>
	);
};

export const Switch = ( {
	checked,
	defaultChecked,
	onChange,
	label,
	describedBy,
	tone,
	disabled,
	id,
} ) => {
	const [ own, setOwn ] = useState( defaultChecked ?? !! checked );
	const on = checked ?? own;

	return (
		<button
			type="button"
			role="switch"
			id={ id }
			aria-checked={ on ? 'true' : 'false' }
			aria-label={ label }
			aria-describedby={ describedBy }
			disabled={ disabled }
			className={ cx(
				'pr-switch',
				tone === 'danger' && 'pr-switch--danger'
			) }
			onClick={ () => {
				setOwn( ! on );
				onChange?.( ! on );
			} }
		/>
	);
};

export const Toggle = ( {
	label,
	description,
	defaultChecked,
	checked,
	tone,
	disabled,
	onChange,
} ) => {
	const id = useInstanceId( Toggle, 'pr-toggle' );

	return (
		<div className="pr-toggle">
			<div className="pr-toggle__text">
				<span className="pr-t-label">{ label }</span>
				{ description && (
					<span
						className="pr-toggle__desc pr-t-small"
						id={ `${ id }-desc` }
					>
						{ description }
					</span>
				) }
			</div>
			<Switch
				label={ label }
				describedBy={ description ? `${ id }-desc` : undefined }
				defaultChecked={ defaultChecked }
				checked={ checked }
				tone={ tone }
				disabled={ disabled }
				onChange={ onChange }
			/>
		</div>
	);
};
