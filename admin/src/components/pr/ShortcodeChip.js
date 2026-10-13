/**
 * ShortcodeChip: the shortcode as a copy button.
 *
 * The whole chip copies. The icon turns to a check for two seconds and a toast
 * confirms it, so the result is announced as well as shown.
 */

import { useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon } from '@shared/Icon';
import { useToasts } from './Toast';

/**
 * Copy text: the Clipboard API, or a hidden textarea and execCommand where
 * the API is missing or refused (plain-http admin, older browsers).
 *
 * @param {string}      text    What to copy.
 * @param {HTMLElement} [owner] The control that asked; it gets focus back
 *                              after the fallback's textarea took it.
 * @return {Promise<boolean>} Whether it was copied.
 */
export const copyText = async ( text, owner ) => {
	try {
		await window.navigator.clipboard.writeText( text );

		return true;
	} catch ( error ) {
		const field = document.createElement( 'textarea' );

		field.value = text;
		field.setAttribute( 'readonly', '' );
		field.setAttribute( 'aria-hidden', 'true' );
		field.style.position = 'fixed';
		field.style.opacity = '0';
		document.body.appendChild( field );
		field.select();

		let copied = false;

		try {
			copied = document.execCommand( 'copy' );
		} catch ( fallbackError ) {
			copied = false;
		}

		document.body.removeChild( field );
		owner?.focus();

		return copied;
	}
};

export const ShortcodeChip = ( { code, copied: initial = false, size } ) => {
	const [ copied, setCopied ] = useState( initial );
	const timer = useRef();
	const chip = useRef( null );
	const toasts = useToasts();

	useEffect( () => () => clearTimeout( timer.current ), [] );

	const copy = async () => {
		if ( ! ( await copyText( code, chip.current ) ) ) {
			toasts.error(
				__(
					'Couldn’t copy. Select the shortcode and copy it yourself.',
					'productreels'
				)
			);

			return;
		}

		setCopied( true );
		toasts.success( __( 'Shortcode copied', 'productreels' ), {
			icon: 'copy',
		} );
		clearTimeout( timer.current );
		timer.current = setTimeout( () => setCopied( false ), 2000 );
	};

	return (
		<button
			ref={ chip }
			type="button"
			className={ `pr-shortcode pr-t-code${
				size === 'lg' ? ' pr-shortcode--lg' : ''
			}` }
			data-copied={ copied ? 'true' : 'false' }
			onClick={ copy }
			aria-label={ sprintf(
				/* translators: %s: a shortcode, e.g. [productreels id="12"]. */
				__( 'Copy %s', 'productreels' ),
				code
			) }
		>
			{ code }
			<span className="pr-shortcode__icon">
				<Icon name={ copied ? 'check' : 'copy' } size={ 15 } />
			</span>
		</button>
	);
};
