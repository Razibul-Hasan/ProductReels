/**
 * Buttons and icon buttons.
 *
 * An icon-only button always carries a label: it becomes both the accessible
 * name and the tooltip, so the two can never drift apart.
 *
 * The tooltip is portalled out to the app root and positioned from the button's
 * measured rectangle. Rendering it inline looked simpler, but every one of the
 * places these buttons live — a table card, a modal header, a reel card — clips
 * its overflow, and an inline bubble was being sliced off at the edge. The app
 * root rather than the body, so the design tokens still apply to it.
 */

import {
	createPortal,
	useCallback,
	useRef,
	useState,
} from '@wordpress/element';
import { IconSpinner } from '../icons';

export const Button = ( {
	variant = 'secondary',
	size,
	icon: Icon,
	busy = false,
	children,
	className = '',
	type = 'button',
	...rest
} ) => (
	<button
		type={ type }
		className={ [
			'wr-btn',
			`wr-btn--${ variant }`,
			size === 'sm' ? 'wr-btn--sm' : '',
			className,
		]
			.filter( Boolean )
			.join( ' ' ) }
		{ ...rest }
	>
		{ busy && <IconSpinner size={ 14 } /> }
		{ ! busy && Icon && <Icon size={ 14 } /> }
		{ children }
	</button>
);

export const IconButton = ( {
	icon: Icon,
	label,
	tone,
	size = 16,
	className = '',
	...rest
} ) => {
	const [ at, setAt ] = useState( null );
	const button = useRef( null );

	const show = useCallback( () => {
		const rect = button.current?.getBoundingClientRect();

		if ( ! rect ) {
			return;
		}

		// Above the button by default; below it when there is no room above.
		const above = rect.top > 34;

		setAt( {
			left: rect.left + rect.width / 2,
			top: above ? rect.top - 6 : rect.bottom + 6,
			above,
		} );
	}, [] );

	const hide = useCallback( () => setAt( null ), [] );

	return (
		<>
			<button
				ref={ button }
				type="button"
				aria-label={ label }
				className={ [
					'wr-icon-btn',
					tone === 'danger' ? 'wr-icon-btn--danger' : '',
					className,
				]
					.filter( Boolean )
					.join( ' ' ) }
				onPointerEnter={ show }
				onPointerLeave={ hide }
				onFocus={ show }
				onBlur={ hide }
				{ ...rest }
			>
				<Icon size={ size } />
			</button>

			{ at &&
				createPortal(
					<span
						role="tooltip"
						className="wr-tip__bubble"
						style={ {
							left: `${ at.left }px`,
							top: `${ at.top }px`,
							translate: at.above ? '-50% -100%' : '-50% 0',
						} }
					>
						{ label }
					</span>,
					document.getElementById( 'wooreels-admin-app' ) ||
						document.body
				) }
		</>
	);
};
