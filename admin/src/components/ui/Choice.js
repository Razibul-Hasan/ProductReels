/**
 * The four ways this app asks someone to pick one of a small set: a listbox, a
 * tab strip, an icon toggle group and visual option cards.
 *
 * There is no native <select> anywhere in WooReels. Every one of these is
 * keyboard operable and announces its own state.
 */

import { useRef, useState } from '@wordpress/element';
import { useDismiss } from '../../hooks/use-dismiss';
import { IconCheck, IconChevronDown } from '../icons';
import { Field } from './Fields';

export const Select = ( { label, help, value, options, onChange } ) => {
	const [ open, setOpen ] = useState( false );
	const ref = useRef( null );

	useDismiss( ref, open, () => setOpen( false ) );

	const current = options.find( ( option ) => option.value === value );

	const move = ( step ) => {
		const index = options.findIndex( ( option ) => option.value === value );
		const next =
			options[
				Math.min( options.length - 1, Math.max( 0, index + step ) )
			];

		if ( next ) {
			onChange( next.value );
		}
	};

	return (
		<Field label={ label } help={ help }>
			<div className="wr-select" ref={ ref }>
				<button
					type="button"
					className="wr-select__trigger"
					aria-haspopup="listbox"
					aria-expanded={ open ? 'true' : 'false' }
					onClick={ () => setOpen( ! open ) }
					onKeyDown={ ( event ) => {
						if ( event.key === 'ArrowDown' ) {
							event.preventDefault();
							move( 1 );
						}

						if ( event.key === 'ArrowUp' ) {
							event.preventDefault();
							move( -1 );
						}
					} }
				>
					<span>{ current ? current.label : '' }</span>
					<IconChevronDown size={ 14 } />
				</button>
				{ open && (
					<div
						className="wr-select__menu"
						role="listbox"
						tabIndex={ -1 }
					>
						{ options.map( ( option ) => (
							<button
								key={ option.value }
								type="button"
								role="option"
								aria-selected={
									option.value === value ? 'true' : 'false'
								}
								data-active={
									option.value === value ? 'true' : 'false'
								}
								className="wr-select__option"
								onClick={ () => {
									onChange( option.value );
									setOpen( false );
								} }
							>
								<span>{ option.label }</span>
								{ option.value === value && (
									<IconCheck size={ 14 } />
								) }
							</button>
						) ) }
					</div>
				) }
			</div>
		</Field>
	);
};

export const Tabs = ( { value, tabs, onChange, label } ) => (
	<div className="wr-tabs" role="tablist" aria-label={ label }>
		{ tabs.map( ( tab ) => (
			<button
				key={ tab.value }
				type="button"
				role="tab"
				aria-selected={ tab.value === value ? 'true' : 'false' }
				className="wr-tabs__tab"
				onClick={ () => onChange( tab.value ) }
			>
				{ tab.label }
			</button>
		) ) }
	</div>
);

export const IconToggleGroup = ( {
	label,
	help,
	value,
	options,
	onChange,
} ) => (
	<Field label={ label } help={ help }>
		<div className="wr-toggle-group" role="group" aria-label={ label }>
			{ options.map( ( option ) => {
				const Icon = option.icon;

				return (
					<button
						key={ option.value }
						type="button"
						aria-pressed={
							option.value === value ? 'true' : 'false'
						}
						aria-label={ option.label }
						className="wr-toggle-group__item"
						onClick={ () => onChange( option.value ) }
					>
						{ Icon && <Icon size={ 14 } /> }
						{ option.showLabel !== false && (
							<span>{ option.label }</span>
						) }
					</button>
				);
			} ) }
		</div>
	</Field>
);

export const VisualOptionCards = ( {
	label,
	help,
	value,
	options,
	onChange,
} ) => (
	<Field label={ label } help={ help }>
		<div className="wr-option-cards" role="group" aria-label={ label }>
			{ options.map( ( option ) => (
				<button
					key={ option.value }
					type="button"
					aria-pressed={ option.value === value ? 'true' : 'false' }
					className="wr-option-card"
					onClick={ () => onChange( option.value ) }
				>
					<span className="wr-option-card__preview">
						{ option.preview }
					</span>
					<span className="wr-option-card__label">
						{ option.label }
					</span>
					{ option.help && (
						<span className="wr-option-card__help">
							{ option.help }
						</span>
					) }
				</button>
			) ) }
		</div>
	</Field>
);
