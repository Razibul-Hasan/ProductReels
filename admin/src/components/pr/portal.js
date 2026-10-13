/**
 * The one portal root for dialogs, menus, popovers, tooltips and toasts.
 *
 * It carries `pr-portal`, so tokens and type apply, and it lives inside
 * #productreels-admin-app rather than on <body>: the app's scoped styles
 * (pr-scoped, the base resets) all sit under that id, so a dialog's contents
 * look the same as the screen behind it. Everything in here is
 * position: fixed, so where it sits in the tree changes nothing on screen.
 *
 * The root also tracks the app's horizontal bounds as --pr-app-start and
 * --pr-app-end, so toasts and floating bars centre on the app rather than on a
 * viewport that includes the WordPress menu.
 */

const ID = 'productreels-portal';

const track = ( root, app ) => {
	const update = () => {
		const rect = app.getBoundingClientRect();
		const width = document.documentElement.clientWidth;
		const rtl = window.getComputedStyle( app ).direction === 'rtl';
		const left = Math.max( 0, rect.left );
		const right = Math.max( 0, width - rect.right );

		root.style.setProperty( '--pr-app-start', `${ rtl ? right : left }px` );
		root.style.setProperty( '--pr-app-end', `${ rtl ? left : right }px` );
	};

	update();
	window.addEventListener( 'resize', update );

	if ( window.ResizeObserver ) {
		new window.ResizeObserver( update ).observe( app );
	}
};

/**
 * The portal root, created on first use.
 *
 * @return {HTMLElement} The `.pr-portal` element.
 */
export const portalRoot = () => {
	let root = document.getElementById( ID );

	if ( root ) {
		return root;
	}

	const app = document.getElementById( 'productreels-admin-app' );

	root = document.createElement( 'div' );
	root.id = ID;
	root.className = 'pr-portal';
	( app || document.body ).appendChild( root );

	if ( app ) {
		track( root, app );
	}

	return root;
};

/**
 * Where a popover goes: below its trigger, or above when there is no room
 * below, aligned to the trigger's end edge (or start edge) and kept inside the
 * viewport.
 *
 * @param {DOMRect} anchor        The trigger's rectangle.
 * @param {Object}  size          The popover's measured { width, height }.
 * @param {Object}  options       Options.
 * @param {string}  options.align 'end' or 'start', in the writing direction.
 * @param {boolean} options.rtl   Whether the page is right to left.
 * @param {number}  options.gap   Space between trigger and popover.
 * @return {{top: number, left: number, flipped: boolean}} Fixed coordinates.
 */
export const placePopover = (
	anchor,
	size,
	{ align = 'end', rtl = false, gap = 6 } = {}
) => {
	const margin = 8;
	const width = document.documentElement.clientWidth;
	const height = window.innerHeight;
	const below = anchor.bottom + gap;
	const flipped =
		below + size.height > height - margin &&
		anchor.top - gap - size.height >= margin;
	// End in LTR and start in RTL both line up the two right edges.
	const rightEdges = ( align === 'end' ) !== rtl;
	const left = rightEdges ? anchor.right - size.width : anchor.left;

	return {
		top: flipped ? anchor.top - gap - size.height : below,
		left: Math.min(
			Math.max( margin, left ),
			Math.max( margin, width - size.width - margin )
		),
		flipped,
	};
};

/**
 * Whether an element is laid out right to left.
 *
 * @param {Element} element Any element.
 * @return {boolean} True for RTL.
 */
export const isRtl = ( element ) =>
	!! element && window.getComputedStyle( element ).direction === 'rtl';
