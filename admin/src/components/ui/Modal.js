/**
 * Modal dialog and the confirm dialog built on it.
 *
 * Focus moves into the panel on open, is trapped while it is there, and is
 * restored to whatever opened it on close. ProductReels never calls the browser's
 * confirm() — a confirmation is part of the interface, and it needs to be able
 * to name what it is about to delete and show a loading state while it does.
 */

import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { IconClose } from '../icons';
import { Button, IconButton } from './Button';

const FOCUSABLE =
	'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const Modal = ( {
	title,
	onClose,
	children,
	footer,
	wide = false,
	size = '',
	labelledBy,
} ) => {
	const panel = useRef( null );
	const returnTo = useRef( null );
	// The latest close handler, read at the moment a key is pressed. Callers
	// pass a fresh function on every render, and an effect keyed on it would
	// re-run on each — moving focus back to the first control every time a
	// field inside the dialog changed a value, mid-keystroke.
	const closeRef = useRef( onClose );

	closeRef.current = onClose;

	useEffect( () => {
		returnTo.current = panel.current
			? panel.current.ownerDocument.activeElement
			: null;

		const first = panel.current?.querySelector( FOCUSABLE );

		( first || panel.current )?.focus();

		const onKeyDown = ( event ) => {
			if ( event.key === 'Escape' ) {
				event.stopPropagation();
				closeRef.current();

				return;
			}

			if ( event.key !== 'Tab' || ! panel.current ) {
				return;
			}

			const items = Array.from(
				panel.current.querySelectorAll( FOCUSABLE )
			);

			if ( items.length === 0 ) {
				return;
			}

			const edge = event.shiftKey
				? items[ 0 ]
				: items[ items.length - 1 ];

			if ( panel.current.ownerDocument.activeElement === edge ) {
				event.preventDefault();
				( event.shiftKey
					? items[ items.length - 1 ]
					: items[ 0 ]
				).focus();
			}
		};

		document.addEventListener( 'keydown', onKeyDown );

		const previousOverflow = document.body.style.overflow;

		document.body.style.overflow = 'hidden';

		return () => {
			document.removeEventListener( 'keydown', onKeyDown );
			document.body.style.overflow = previousOverflow;
			returnTo.current?.focus?.();
		};
	}, [] );

	return (
		<div className="wr-modal-root">
			<div
				className="wr-modal__scrim"
				onClick={ onClose }
				aria-hidden="true"
			/>
			<div
				ref={ panel }
				role="dialog"
				aria-modal="true"
				aria-label={ labelledBy ? undefined : title }
				aria-labelledby={ labelledBy }
				tabIndex={ -1 }
				className={ [
					'wr-modal__panel',
					wide ? 'wr-modal__panel--wide' : '',
					size ? `wr-modal__panel--${ size }` : '',
				]
					.filter( Boolean )
					.join( ' ' ) }
			>
				<div className="wr-modal__head">
					<h2 className="wr-modal__title">{ title }</h2>
					<IconButton
						icon={ IconClose }
						label={ __(
							'Close',
							'productreels'
						) }
						onClick={ onClose }
					/>
				</div>
				<div className="wr-modal__body">{ children }</div>
				{ footer && <div className="wr-modal__foot">{ footer }</div> }
			</div>
		</div>
	);
};

export const ConfirmDialog = ( {
	title,
	children,
	confirmLabel = __(
		'Delete',
		'productreels'
	),
	tone = 'danger',
	busy = false,
	onConfirm,
	onClose,
} ) => (
	<Modal
		title={ title }
		onClose={ busy ? () => {} : onClose }
		footer={
			<>
				<Button variant="ghost" onClick={ onClose } disabled={ busy }>
					{ __(
						'Cancel',
						'productreels'
					) }
				</Button>
				<Button
					variant={ tone }
					onClick={ onConfirm }
					busy={ busy }
					disabled={ busy }
				>
					{ confirmLabel }
				</Button>
			</>
		}
	>
		<p className="wr-confirm__text">{ children }</p>
	</Modal>
);
