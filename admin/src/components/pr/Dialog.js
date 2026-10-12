/**
 * Dialog and ConfirmDialog: the app's one dialog implementation.
 *
 * Portalled into the `pr-portal` root over a --pr-scrim overlay. On open,
 * focus moves to the first field (or to Cancel in a confirmation), is trapped
 * inside, and goes back to whatever opened the dialog when it closes. Escape,
 * the close button and a click on the scrim cancel. Page scroll is locked
 * while any dialog is open.
 *
 * Dialogs stack (the link dialog opens over the reel editor): only the top one
 * answers Escape and traps focus, and Escape is left to an open popup inside
 * it (a select, a colour picker, a menu) before it closes the dialog.
 *
 * ProductReels never calls the browser's confirm(): a confirmation names what
 * it is about to delete and can show progress while it does.
 */

import { createPortal, useEffect, useRef } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { Icon } from '@shared/Icon';
import { Button, IconButton } from './Button';
import { portalRoot } from './portal';

const cx = ( ...names ) => names.filter( Boolean ).join( ' ' );

const FOCUSABLE =
	'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const FIELD =
	'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])';

// Popovers a dialog's controls open into the portal root, outside the panel.
const POPOVER = '.pr-menu--floating, .pr-colorpop';

const stack = [];

const visible = ( element ) =>
	element.offsetWidth > 0 ||
	element.offsetHeight > 0 ||
	element.getClientRects().length > 0;

export const Dialog = ( {
	title,
	description,
	children,
	footer,
	note,
	noteTone,
	size,
	onClose,
	initialFocus,
	head = true,
	body = true,
	bodyClassName,
	className,
	role = 'dialog',
	labelledBy,
	describedBy,
	dismissible = true,
} ) => {
	const panel = useRef( null );
	const overlayDown = useRef( false );
	const id = useInstanceId( Dialog, 'pr-dialog' );
	// Read at the moment of the key press: callers pass a fresh handler on
	// every render, and an effect keyed on it would re-run and steal focus
	// back to the first field mid-keystroke.
	const closeRef = useRef( onClose );
	const dismissibleRef = useRef( dismissible );

	closeRef.current = onClose;
	dismissibleRef.current = dismissible;

	const cancel = () => {
		if ( dismissibleRef.current ) {
			closeRef.current?.();
		}
	};

	useEffect( () => {
		const node = panel.current;
		const doc = node.ownerDocument;
		const returnTo = doc.activeElement;
		const self = {};

		stack.push( self );

		const focusables = () =>
			Array.from( node.querySelectorAll( FOCUSABLE ) ).filter( visible );

		const start =
			initialFocus?.current ||
			node.querySelector( `.pr-dialog__body ${ FIELD }` ) ||
			Array.from(
				node.querySelectorAll( `.pr-dialog__body :is(${ FOCUSABLE })` )
			).find( visible ) ||
			node.querySelector( `.pr-dialog__foot :is(${ FOCUSABLE })` ) ||
			focusables()[ 0 ] ||
			node;

		start.focus();

		const onKeyDown = ( event ) => {
			if ( stack[ stack.length - 1 ] !== self ) {
				return;
			}

			if ( event.key === 'Escape' ) {
				// An open popup in the dialog takes Escape first.
				if (
					node.querySelector(
						'[aria-haspopup][aria-expanded="true"]'
					)
				) {
					return;
				}

				event.preventDefault();
				cancel();

				return;
			}

			if ( event.key !== 'Tab' || ! node.contains( doc.activeElement ) ) {
				return;
			}

			const items = focusables();

			if ( items.length === 0 ) {
				event.preventDefault();

				return;
			}

			const first = items[ 0 ];
			const last = items[ items.length - 1 ];

			if ( event.shiftKey && doc.activeElement === first ) {
				event.preventDefault();
				last.focus();
			} else if ( ! event.shiftKey && doc.activeElement === last ) {
				event.preventDefault();
				first.focus();
			}
		};

		// Focus that escapes anyway (a click behind, a popover's last field)
		// comes straight back to the panel.
		const onFocusIn = ( event ) => {
			if (
				stack[ stack.length - 1 ] === self &&
				! node.contains( event.target ) &&
				! event.target.closest?.( POPOVER )
			) {
				( focusables()[ 0 ] || node ).focus();
			}
		};

		doc.addEventListener( 'keydown', onKeyDown );
		doc.addEventListener( 'focusin', onFocusIn );

		const previousOverflow = doc.body.style.overflow;

		doc.body.style.overflow = 'hidden';

		return () => {
			doc.removeEventListener( 'keydown', onKeyDown );
			doc.removeEventListener( 'focusin', onFocusIn );
			doc.body.style.overflow = previousOverflow;
			stack.splice( stack.indexOf( self ), 1 );

			if ( returnTo?.isConnected ) {
				returnTo.focus?.();
			}
		};
		// Mount and unmount only; see closeRef above.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const titleId = `${ id }-title`;
	const descriptionId = description ? `${ id }-desc` : undefined;

	return createPortal(
		// The scrim is a mouse convenience; Escape and the close button are
		// the keyboard ways out.
		// eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
		<div
			className="pr-overlay"
			onPointerDown={ ( event ) => {
				overlayDown.current = event.target === event.currentTarget;
			} }
			onClick={ ( event ) => {
				if (
					overlayDown.current &&
					event.target === event.currentTarget
				) {
					cancel();
				}

				overlayDown.current = false;
			} }
		>
			<div
				ref={ panel }
				role={ role }
				aria-modal="true"
				aria-labelledby={ labelledBy || ( head ? titleId : undefined ) }
				aria-label={ ! labelledBy && ! head ? title : undefined }
				aria-describedby={ describedBy || descriptionId }
				tabIndex={ -1 }
				className={ cx(
					'pr-dialog',
					size && `pr-dialog--${ size }`,
					className
				) }
			>
				{ head && (
					<div className="pr-dialog__head">
						<div className="pr-dialog__titles">
							<h2 className="pr-t-title" id={ titleId }>
								{ title }
							</h2>
							{ description && (
								<p className="pr-t-small" id={ descriptionId }>
									{ description }
								</p>
							) }
						</div>
						{ onClose && (
							<IconButton
								icon="x"
								label={ __( 'Close', 'productreels' ) }
								size="md"
								disabled={ ! dismissible }
								onClick={ cancel }
							/>
						) }
					</div>
				) }
				{ body ? (
					<div className={ cx( 'pr-dialog__body', bodyClassName ) }>
						{ children }
					</div>
				) : (
					children
				) }
				{ ( footer || note ) && (
					<div className="pr-dialog__foot">
						{ note && (
							<span
								className={ cx(
									'pr-dialog__note pr-t-small',
									noteTone === 'warn' &&
										'pr-dialog__note--warn'
								) }
							>
								{ noteTone === 'warn' && (
									<Icon name="alert" size={ 15 } />
								) }
								{ note }
							</span>
						) }
						{ footer }
					</div>
				) }
			</div>
		</div>,
		portalRoot()
	);
};

export const ConfirmDialog = ( {
	title,
	children,
	confirm,
	confirmLabel,
	cancelLabel = __( 'Cancel', 'productreels' ),
	tone = 'danger',
	icon = tone === 'danger' ? 'trash' : null,
	busy = false,
	onConfirm,
	onClose,
} ) => {
	const id = useInstanceId( ConfirmDialog, 'pr-confirm' );
	const cancelButton = useRef( null );

	return (
		<Dialog
			role="alertdialog"
			head={ false }
			body={ false }
			labelledBy={ `${ id }-title` }
			describedBy={ children ? `${ id }-text` : undefined }
			initialFocus={ cancelButton }
			dismissible={ ! busy }
			onClose={ onClose }
			footer={
				<>
					<Button
						ref={ cancelButton }
						onClick={ onClose }
						disabled={ busy }
					>
						{ cancelLabel }
					</Button>
					<Button
						variant={ tone }
						icon={ icon }
						busy={ busy }
						onClick={ onConfirm }
					>
						{ confirm ||
							confirmLabel ||
							__( 'Delete', 'productreels' ) }
					</Button>
				</>
			}
		>
			<div className="pr-confirm">
				{ icon && (
					<span
						className={ cx(
							'pr-confirm__icon',
							tone !== 'danger' && 'pr-confirm__icon--brand'
						) }
					>
						<Icon name={ icon } size={ 20 } />
					</span>
				) }
				<div className="pr-confirm__text">
					<h2 className="pr-t-title" id={ `${ id }-title` }>
						{ title }
					</h2>
					{ children && (
						<p className="pr-t-body" id={ `${ id }-text` }>
							{ children }
						</p>
					) }
				</div>
			</div>
		</Dialog>
	);
};
