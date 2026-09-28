/**
 * Skeletons, empty states, notices and the collapsible section.
 *
 * The skeletons take the real element's dimensions as props rather than
 * guessing, so a list never jumps when its data arrives. The empty-state
 * artwork is drawn here — a stack of reel frames — because a stock
 * illustration would say nothing about what is missing.
 */

import { useState } from '@wordpress/element';
import { IconChevronRight, IconInfo, IconWarning } from '../icons';

export const Skeleton = ( { width = '100%', height = 12, radius } ) => (
	<span
		className="wr-skeleton"
		style={ {
			display: 'block',
			width: typeof width === 'number' ? `${ width }px` : width,
			height: `${ height }px`,
			borderRadius: radius,
		} }
	/>
);

const EmptyArt = () => (
	<svg
		width="104"
		height="76"
		viewBox="0 0 104 76"
		fill="none"
		aria-hidden="true"
		focusable="false"
	>
		<rect
			x="12.5"
			y="12.5"
			width="30"
			height="51"
			rx="5"
			stroke="currentColor"
			strokeWidth="1.5"
		/>
		<rect
			x="61.5"
			y="12.5"
			width="30"
			height="51"
			rx="5"
			stroke="currentColor"
			strokeWidth="1.5"
		/>
		<rect
			x="37"
			y="4"
			width="30"
			height="68"
			rx="6"
			fill="var(--wr-bg)"
			stroke="currentColor"
			strokeWidth="1.5"
		/>
		<path
			d="M47 28.5v19l15-9.5-15-9.5Z"
			fill="currentColor"
			opacity=".45"
		/>
	</svg>
);

export const EmptyState = ( { title, text, action } ) => (
	<div className="wr-empty">
		<span className="wr-empty__art">
			<EmptyArt />
		</span>
		<h2 className="wr-empty__title">{ title }</h2>
		{ text && <p className="wr-empty__text">{ text }</p> }
		{ action && <span className="wr-empty__cta">{ action }</span> }
	</div>
);

export const Notice = ( { tone = 'info', children } ) => {
	const Icon = tone === 'warning' ? IconWarning : IconInfo;

	return (
		<div className={ `wr-notice wr-notice--${ tone }` }>
			<Icon size={ 16 } />
			<span>{ children }</span>
		</div>
	);
};

export const CollapsibleSection = ( {
	title,
	icon: Icon,
	defaultOpen = false,
	children,
} ) => {
	const [ open, setOpen ] = useState( defaultOpen );

	return (
		<section className="wr-collapse">
			<button
				type="button"
				className="wr-collapse__trigger"
				aria-expanded={ open ? 'true' : 'false' }
				onClick={ () => setOpen( ! open ) }
			>
				<IconChevronRight
					size={ 14 }
					className="wr-collapse__chevron"
				/>
				{ Icon && (
					<span className="wr-collapse__icon">
						<Icon size={ 15 } />
					</span>
				) }
				<span className="wr-section-label">{ title }</span>
			</button>
			{ open && <div className="wr-collapse__body">{ children }</div> }
		</section>
	);
};
