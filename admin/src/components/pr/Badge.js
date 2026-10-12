/**
 * Badge, LayoutBadge and Count: short, non-interactive labels.
 *
 * A status badge always carries a word; colour alone never means anything.
 * LAYOUTS is the one map of layout names, icons and descriptions, shared by
 * the badge, the layout picker and the create-widget dialog.
 */

import { __ } from '@wordpress/i18n';
import { Icon } from '@shared/Icon';
import { formatNumber } from '../../format';

const cx = ( ...names ) => names.filter( Boolean ).join( ' ' );

export const LAYOUTS = {
	grid: {
		label: __( 'Grid', 'productreels' ),
		icon: 'grid',
		desc: __( 'Rows of reels that wrap', 'productreels' ),
	},
	carousel: {
		label: __( 'Carousel', 'productreels' ),
		icon: 'carousel',
		desc: __( 'One row people swipe through', 'productreels' ),
	},
	marquee: {
		label: __( 'Marquee', 'productreels' ),
		icon: 'marquee',
		desc: __( 'A row that scrolls by itself', 'productreels' ),
	},
	stacked: {
		label: __( 'Stacked', 'productreels' ),
		icon: 'stacked',
		desc: __( 'A fanned deck of cards', 'productreels' ),
	},
	popup: {
		label: __( 'Popup', 'productreels' ),
		icon: 'popup',
		desc: __( 'Floats in a corner of the page', 'productreels' ),
	},
};

export const Badge = ( {
	tone = 'neutral',
	icon,
	dot,
	children,
	className,
} ) => (
	<span
		className={ cx(
			'pr-badge',
			tone !== 'neutral' && `pr-badge--${ tone }`,
			'pr-t-caption',
			className
		) }
	>
		{ dot && <span className="pr-badge__dot" /> }
		{ icon && <Icon name={ icon } size={ 14 } /> }
		{ children }
	</span>
);

export const LayoutBadge = ( { layout = 'grid' } ) => {
	const entry = LAYOUTS[ layout ] || LAYOUTS.grid;

	return <Badge icon={ entry.icon }>{ entry.label }</Badge>;
};

export const Count = ( { children } ) => (
	<span className="pr-count pr-t-caption">{ formatNumber( children ) }</span>
);
