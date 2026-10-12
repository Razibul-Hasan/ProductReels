/**
 * Button and IconButton.
 *
 * A Button says what it does: a verb and the thing. An IconButton has no text,
 * so its `label` is required and does double duty as the accessible name and
 * the tooltip; the two can never drift apart. The tooltip is portalled and
 * fixed, because rows, cards and dialogs all clip their overflow.
 */

import {
	createPortal,
	forwardRef,
	useCallback,
	useRef,
	useState,
} from '@wordpress/element';
import { Icon } from '@shared/Icon';
import { portalRoot } from './portal';

const cx = ( ...names ) => names.filter( Boolean ).join( ' ' );

/**
 * Point a forwarded ref and a local ref at the same node.
 *
 * @param {...(Function|Object)} refs Refs to set.
 * @return {Function} A callback ref.
 */
export const mergeRefs =
	( ...refs ) =>
	( node ) =>
		refs.forEach( ( ref ) => {
			if ( typeof ref === 'function' ) {
				ref( node );
			} else if ( ref ) {
				ref.current = node;
			}
		} );

export const Button = forwardRef(
	(
		{
			variant = 'secondary',
			size = 'md',
			icon,
			iconRight,
			block,
			busy = false,
			children,
			className,
			type = 'button',
			disabled,
			...rest
		},
		ref
	) => {
		const iconSize = size === 'sm' ? 16 : 18;

		return (
			<button
				ref={ ref }
				type={ type }
				className={ cx(
					'pr-btn',
					`pr-btn--${ variant }`,
					size !== 'md' && `pr-btn--${ size }`,
					block && 'pr-btn--block',
					'pr-t-body-strong',
					className
				) }
				disabled={ disabled || busy }
				aria-busy={ busy ? 'true' : undefined }
				{ ...rest }
			>
				{ busy && (
					<Icon name="loader" size={ iconSize } className="pr-spin" />
				) }
				{ ! busy && icon && <Icon name={ icon } size={ iconSize } /> }
				{ children !== null && children !== undefined && (
					<span>{ children }</span>
				) }
				{ iconRight && <Icon name={ iconRight } size={ iconSize } /> }
			</button>
		);
	}
);

export const IconButton = forwardRef(
	(
		{
			icon,
			label,
			size = 'sm',
			variant,
			iconSize,
			className,
			onPointerEnter,
			onPointerLeave,
			onFocus,
			onBlur,
			...rest
		},
		ref
	) => {
		const [ tip, setTip ] = useState( null );
		const button = useRef( null );

		const show = useCallback( () => {
			const rect = button.current?.getBoundingClientRect();

			if ( rect ) {
				// Above the button, or below it when the top edge is too close.
				const above = rect.top > 40;

				setTip( {
					left: rect.left + rect.width / 2,
					top: above ? rect.top - 6 : rect.bottom + 6,
					above,
				} );
			}
		}, [] );

		const hide = useCallback( () => setTip( null ), [] );

		return (
			<>
				<button
					ref={ mergeRefs( button, ref ) }
					type="button"
					aria-label={ label }
					className={ cx(
						'pr-iconbtn',
						size === 'md' && 'pr-iconbtn--md',
						variant && `pr-iconbtn--${ variant }`,
						className
					) }
					onPointerEnter={ ( event ) => {
						show();
						onPointerEnter?.( event );
					} }
					onPointerLeave={ ( event ) => {
						hide();
						onPointerLeave?.( event );
					} }
					onFocus={ ( event ) => {
						// Only keyboard focus asks for the tooltip: a dialog
						// focusing its close button on open should not pop it.
						if ( event.currentTarget.matches( ':focus-visible' ) ) {
							show();
						}
						onFocus?.( event );
					} }
					onBlur={ ( event ) => {
						hide();
						onBlur?.( event );
					} }
					{ ...rest }
				>
					<Icon
						name={ icon }
						size={ iconSize || ( size === 'md' ? 20 : 18 ) }
					/>
				</button>
				{ tip &&
					createPortal(
						<span
							role="tooltip"
							className="pr-tip pr-t-caption"
							style={ {
								left: `${ tip.left }px`,
								top: `${ tip.top }px`,
								translate: tip.above ? '-50% -100%' : '-50% 0',
							} }
						>
							{ label }
						</span>,
						portalRoot()
					) }
			</>
		);
	}
);
