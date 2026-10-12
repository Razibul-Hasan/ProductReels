/**
 * Notice and FloatingBar: a state explained in place, and a pending decision
 * that floats over the page.
 *
 * A Notice says what happened and the way out. Confirmations of something the
 * person just did are toasts, not notices.
 *
 * The FloatingBar is fixed to the bottom of the app while it is mounted and
 * leaves a spacer of its own height where it is rendered, so it never covers
 * the last row of the page. While one shows, toasts move up above it.
 */

import { createPortal, useEffect } from '@wordpress/element';
import { Icon } from '@shared/Icon';
import { portalRoot } from './portal';

const cx = ( ...names ) => names.filter( Boolean ).join( ' ' );

const TONE_ICONS = {
	info: 'info',
	warn: 'alert',
	danger: 'alert',
	ok: 'success',
};

export const Notice = ( { tone = 'info', title, children, actions, icon } ) => (
	<div
		className={ cx(
			'pr-notice',
			tone !== 'info' && `pr-notice--${ tone }`
		) }
		role={ tone === 'danger' ? 'alert' : 'status' }
	>
		<Icon name={ icon || TONE_ICONS[ tone ] || 'info' } size={ 18 } />
		<div className="pr-notice__body">
			{ title && <span className="pr-t-body-strong">{ title }</span> }
			{ children && <span className="pr-t-body">{ children }</span> }
			{ actions && <div className="pr-notice__actions">{ actions }</div> }
		</div>
	</div>
);

let floating = 0;

export const FloatingBar = ( { text, dot, children } ) => {
	useEffect( () => {
		const root = portalRoot();

		floating++;
		root.classList.add( 'pr-has-floatbar' );

		return () => {
			floating--;

			if ( floating === 0 ) {
				root.classList.remove( 'pr-has-floatbar' );
			}
		};
	}, [] );

	return (
		<>
			<div className="pr-floatbar-spacer" aria-hidden="true" />
			{ createPortal(
				<div className="pr-floatdock">
					<div className="pr-floatbar" role="status">
						<span className="pr-floatbar__text pr-t-body-strong">
							{ dot && <span className="pr-floatbar__dot" /> }
							{ text }
						</span>
						{ children }
					</div>
				</div>,
				portalRoot()
			) }
		</>
	);
};
