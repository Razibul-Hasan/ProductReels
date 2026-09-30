/**
 * The toast stack.
 *
 * Bottom right, stacked oldest first, four seconds each, and the timer pauses
 * while the pointer is over the stack — a toast someone is reading should not
 * vanish mid-sentence. A loading toast has no timer at all; whoever created it
 * resolves it.
 */

import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { IconCheck, IconClose, IconSpinner, IconWarning } from '../icons';

const ToastContext = createContext( null );

let nextId = 0;

const ICONS = {
	success: IconCheck,
	error: IconWarning,
	loading: IconSpinner,
};

export const ToastProvider = ( { children } ) => {
	const [ toasts, setToasts ] = useState( [] );
	const timers = useRef( new Map() );

	const dismiss = useCallback( ( id ) => {
		const timer = timers.current.get( id );

		if ( timer ) {
			clearTimeout( timer );
			timers.current.delete( id );
		}

		setToasts( ( current ) =>
			current.filter( ( toast ) => toast.id !== id )
		);
	}, [] );

	const schedule = useCallback(
		( id ) => {
			timers.current.set(
				id,
				setTimeout( () => dismiss( id ), 4000 )
			);
		},
		[ dismiss ]
	);

	const push = useCallback(
		( message, variant = 'success' ) => {
			const id = ++nextId;

			setToasts( ( current ) => [
				...current,
				{ id, message, variant },
			] );

			if ( variant !== 'loading' ) {
				schedule( id );
			}

			return id;
		},
		[ schedule ]
	);

	const resolve = useCallback(
		( id, message, variant = 'success' ) => {
			setToasts( ( current ) =>
				current.map( ( toast ) =>
					toast.id === id ? { ...toast, message, variant } : toast
				)
			);

			schedule( id );
		},
		[ schedule ]
	);

	const pause = useCallback( () => {
		timers.current.forEach( ( timer ) => clearTimeout( timer ) );
		timers.current.clear();
	}, [] );

	const resume = useCallback( () => {
		setToasts( ( current ) => {
			current.forEach( ( toast ) => {
				if (
					toast.variant !== 'loading' &&
					! timers.current.has( toast.id )
				) {
					schedule( toast.id );
				}
			} );

			return current;
		} );
	}, [ schedule ] );

	const value = useMemo(
		() => ( {
			toast: push,
			success: ( message ) => push( message, 'success' ),
			error: ( message ) => push( message, 'error' ),
			loading: ( message ) => push( message, 'loading' ),
			resolve,
			dismiss,
		} ),
		[ push, resolve, dismiss ]
	);

	return (
		<ToastContext.Provider value={ value }>
			{ children }
			<div
				className="wr-toasts"
				role="region"
				aria-label={ __(
					'Notifications',
					'productreels'
				) }
			>
				{ toasts.map( ( toast ) => {
					const Icon = ICONS[ toast.variant ] || IconCheck;

					return (
						<div
							key={ toast.id }
							className={ `wr-toast wr-toast--${ toast.variant }` }
							role={
								toast.variant === 'error' ? 'alert' : 'status'
							}
							onPointerEnter={ pause }
							onPointerLeave={ resume }
						>
							<span className="wr-toast__icon">
								<Icon size={ 15 } />
							</span>
							<span className="wr-toast__message">
								{ toast.message }
							</span>
							<button
								type="button"
								className="wr-icon-btn"
								style={ { width: 20, height: 20 } }
								aria-label={ __(
									'Dismiss',
									'productreels'
								) }
								onClick={ () => dismiss( toast.id ) }
							>
								<IconClose size={ 12 } />
							</button>
						</div>
					);
				} ) }
			</div>
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
