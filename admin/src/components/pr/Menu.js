/**
 * Menu: a row's secondary actions behind a `more` IconButton.
 *
 * Opens below its trigger (above it near the bottom of the viewport), aligned
 * to the trigger's end edge. Focus moves to the first item; the arrow keys,
 * Home and End move between items; Enter or Space runs one; Escape or Tab
 * closes the menu and returns focus to the trigger; a click outside closes it.
 *
 * Items: { icon, label, hint, danger, disabled, onSelect } or '-' for a
 * separator. Put the destructive item last, after a separator.
 */

import {
	createPortal,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { Icon } from '@shared/Icon';
import { IconButton } from './Button';
import { isRtl, placePopover, portalRoot } from './portal';

const cx = ( ...names ) => names.filter( Boolean ).join( ' ' );

const ITEM = '[role="menuitem"]:not([disabled])';

export const Menu = ( {
	items = [],
	label = __( 'More actions', 'productreels' ),
	icon = 'more',
	size = 'sm',
	variant,
	align = 'end',
} ) => {
	const [ open, setOpen ] = useState( false );
	const [ place, setPlace ] = useState( null );
	const [ start, setStart ] = useState( 'first' );
	const trigger = useRef( null );
	const menu = useRef( null );
	const id = useInstanceId( Menu, 'pr-menu' );

	const focusItem = ( which ) => {
		const list = Array.from( menu.current?.querySelectorAll( ITEM ) || [] );
		const current = list.indexOf(
			menu.current?.ownerDocument.activeElement
		);
		let next;

		if ( which === 'first' ) {
			next = 0;
		} else if ( which === 'last' ) {
			next = list.length - 1;
		} else {
			next = ( current + which + list.length ) % list.length;
		}

		list[ next ]?.focus();
	};

	const close = ( returnFocus = true ) => {
		setOpen( false );
		setPlace( null );

		if ( returnFocus ) {
			trigger.current?.focus();
		}
	};

	const show = ( from = 'first' ) => {
		setStart( from );
		setOpen( true );
	};

	// Measure, then place; reposition while the page scrolls or resizes.
	useLayoutEffect( () => {
		if ( ! open ) {
			return undefined;
		}

		const position = () => {
			if ( trigger.current && menu.current ) {
				setPlace(
					placePopover(
						trigger.current.getBoundingClientRect(),
						menu.current.getBoundingClientRect(),
						{ align, rtl: isRtl( trigger.current ) }
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
	}, [ open, align ] );

	useEffect( () => {
		if ( open && place ) {
			focusItem( start );
		}
		// Only once it is placed: focusing earlier would scroll to 0,0.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ open, !! place ] );

	useEffect( () => {
		if ( ! open ) {
			return undefined;
		}

		const outside = ( event ) => {
			if (
				! menu.current?.contains( event.target ) &&
				! trigger.current?.contains( event.target )
			) {
				close( false );
			}
		};

		document.addEventListener( 'pointerdown', outside, true );

		return () =>
			document.removeEventListener( 'pointerdown', outside, true );
	}, [ open ] );

	const onMenuKeyDown = ( event ) => {
		const moves = {
			ArrowDown: 1,
			ArrowUp: -1,
			Home: 'first',
			End: 'last',
		};

		if ( event.key in moves ) {
			event.preventDefault();
			focusItem( moves[ event.key ] );
		} else if ( event.key === 'Escape' || event.key === 'Tab' ) {
			// Stop here, so a dialog this menu sits in stays open.
			event.preventDefault();
			event.stopPropagation();
			close();
		}
	};

	return (
		<>
			<IconButton
				ref={ trigger }
				icon={ icon }
				label={ label }
				size={ size }
				variant={ variant }
				aria-haspopup="menu"
				aria-expanded={ open ? 'true' : 'false' }
				aria-controls={ open ? id : undefined }
				onClick={ () => ( open ? close() : show() ) }
				onKeyDown={ ( event ) => {
					if (
						event.key === 'ArrowDown' ||
						event.key === 'ArrowUp'
					) {
						event.preventDefault();
						show( event.key === 'ArrowUp' ? 'last' : 'first' );
					}
				} }
			/>
			{ open &&
				createPortal(
					<div
						ref={ menu }
						id={ id }
						className="pr-menu pr-menu--floating"
						role="menu"
						aria-label={ label }
						tabIndex={ -1 }
						data-flipped={ place?.flipped ? 'true' : undefined }
						style={ {
							top: `${ place ? place.top : 0 }px`,
							left: `${ place ? place.left : 0 }px`,
							visibility: place ? 'visible' : 'hidden',
						} }
						onKeyDown={ onMenuKeyDown }
					>
						{ items.map( ( item, index ) =>
							item === '-' ? (
								<div
									key={ `sep-${ index }` }
									className="pr-menu__sep"
									role="separator"
								/>
							) : (
								<button
									key={ item.label }
									type="button"
									role="menuitem"
									tabIndex={ -1 }
									disabled={ item.disabled }
									className={ cx(
										'pr-menu__item pr-t-body',
										item.danger && 'pr-menu__item--danger'
									) }
									onClick={ () => {
										// Focus goes back first, so a dialog the
										// item opens returns focus to the trigger.
										close();
										item.onSelect?.();
									} }
								>
									{ item.icon && (
										<Icon name={ item.icon } size={ 17 } />
									) }
									{ item.label }
									{ item.hint && (
										<span className="pr-menu__hint pr-t-caption">
											{ item.hint }
										</span>
									) }
								</button>
							)
						) }
					</div>,
					portalRoot()
				) }
		</>
	);
};
