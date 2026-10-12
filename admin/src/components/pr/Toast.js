/**
 * Toasts: brief confirmations of something the person just did.
 *
 * Ink pills, bottom centre of the app, five seconds each. Every timer pauses
 * while a toast is hovered or holds focus, so one being read (or about to be
 * undone) never vanishes mid-sentence. A loading toast has no timer; whoever
 * created it resolves it.
 *
 * The API is the 1.0.0 one, so every existing call keeps working:
 * toast( message, variant ), success(), error(), loading(), resolve( id,
 * message, variant ) and dismiss( id ). Each of them also takes an options
 * object last: { icon, action: { label, onClick } }.
 */

import {
	createContext,
	createPortal,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon } from '@shared/Icon';
import { Button } from './Button';
import { portalRoot } from './portal';

const DURATION = 5000;

const ICONS = {
	success: 'success',
	error: 'alert',
	loading: 'loader',
};

const cx = ( ...names ) => names.filter( Boolean ).join( ' ' );

export const Toast = ( {
	icon = 'success',
	children,
	action,
	busy = false,
	role = 'status',
	...rest
} ) => (
	<div
		className={ cx( 'pr-toast', ! action && 'pr-toast--plain' ) }
		role={ role }
		{ ...rest }
	>
		<Icon name={ icon } size={ 18 } className={ busy ? 'pr-spin' : '' } />
		<span className="pr-t-body">{ children }</span>
		{ action && (
			<Button variant="on-ink" size="sm" onClick={ action.onClick }>
				{ action.label }
			</Button>
		) }
	</div>
);

const ToastContext = createContext( null );

let nextId = 0;

export const ToastProvider = ( { children } ) => {
	const [ toasts, setToasts ] = useState( [] );
	const timers = useRef( new Map() );
	const held = useRef( false );

	const dismiss = useCallback( ( id ) => {
		clearTimeout( timers.current.get( id ) );
		timers.current.delete( id );
		setToasts( ( current ) =>
			current.filter( ( toast ) => toast.id !== id )
		);
	}, [] );

	const schedule = useCallback(
		( id ) => {
			clearTimeout( timers.current.get( id ) );

			if ( ! held.current ) {
				timers.current.set(
					id,
					setTimeout( () => dismiss( id ), DURATION )
				);
			}
		},
		[ dismiss ]
	);

	const push = useCallback(
		( message, variant = 'success', options = {} ) => {
			const id = ++nextId;

			setToasts( ( current ) => [
				...current,
				{ id, message, variant, ...options },
			] );

			if ( variant !== 'loading' ) {
				schedule( id );
			}

			return id;
		},
		[ schedule ]
	);

	const resolve = useCallback(
		( id, message, variant = 'success', options = {} ) => {
			setToasts( ( current ) =>
				current.map( ( toast ) =>
					toast.id === id
						? { id, message, variant, ...options }
						: toast
				)
			);
			schedule( id );
		},
		[ schedule ]
	);

	const hold = useCallback( () => {
		held.current = true;
		timers.current.forEach( ( timer ) => clearTimeout( timer ) );
		timers.current.clear();
	}, [] );

	const release = useCallback( () => {
		held.current = false;
		setToasts( ( current ) => {
			current
				.filter( ( toast ) => toast.variant !== 'loading' )
				.forEach( ( toast ) => schedule( toast.id ) );

			return current;
		} );
	}, [ schedule ] );

	const value = useMemo(
		() => ( {
			toast: push,
			success: ( message, options ) =>
				push( message, 'success', options ),
			error: ( message, options ) => push( message, 'error', options ),
			loading: ( message, options ) =>
				push( message, 'loading', options ),
			resolve,
			dismiss,
		} ),
		[ push, resolve, dismiss ]
	);

	return (
		<ToastContext.Provider value={ value }>
			{ children }
			{ createPortal(
				<div
					className="pr-toasts"
					role="region"
					aria-label={ __( 'Notifications', 'productreels' ) }
				>
					{ toasts.map( ( toast ) => (
						<Toast
							key={ toast.id }
							icon={
								toast.icon ||
								ICONS[ toast.variant ] ||
								'success'
							}
							busy={ toast.variant === 'loading' }
							role={
								toast.variant === 'error' ? 'alert' : 'status'
							}
							action={
								toast.action && {
									label: toast.action.label,
									onClick: () => {
										// The pointer and focus leave with
										// the toast, so release the hold here.
										dismiss( toast.id );
										release();
										toast.action.onClick?.();
									},
								}
							}
							onPointerEnter={ hold }
							onPointerLeave={ release }
							onFocus={ hold }
							onBlur={ ( event ) => {
								if (
									! event.currentTarget.contains(
										event.relatedTarget
									)
								) {
									release();
								}
							} }
						>
							{ toast.message }
						</Toast>
					) ) }
				</div>,
				portalRoot()
			) }
		</ToastContext.Provider>
	);
};

export const useToasts = () => {
	const context = useContext( ToastContext );

	if ( ! context ) {
		throw new Error( 'useToasts must be used inside a ToastProvider.' );
	}

	return context;
};
