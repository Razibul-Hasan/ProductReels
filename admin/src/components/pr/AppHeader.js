/**
 * AppHeader: the ProductReels bar under the WordPress admin bar.
 *
 * Wordmark, version, the three sections and the docs link. The sections are
 * real links to hash routes, so the router (and its unsaved-changes gate)
 * handles them like any other address change, and middle-click opens a tab.
 * The widget editor replaces this bar with its own header.
 */

import { __ } from '@wordpress/i18n';
import { Icon } from '@shared/Icon';

export const SECTIONS = [
	{
		id: 'widgets',
		hash: '#/widgets',
		icon: 'grid',
		label: __( 'Widgets', 'productreels' ),
	},
	{
		id: 'reels',
		hash: '#/reels',
		icon: 'film',
		label: __( 'Reels', 'productreels' ),
	},
	{
		id: 'settings',
		hash: '#/settings',
		icon: 'settings',
		label: __( 'Settings', 'productreels' ),
	},
];

/**
 * @param {Object} props         Props.
 * @param {string} props.current The current section id.
 * @param {string} props.version The plugin version.
 * @param {string} props.logoUrl The logo mark, shown at 28px when set.
 * @param {string} props.docsUrl The documentation URL.
 * @return {Object} The bar.
 */
export const AppHeader = ( { current, version, logoUrl, docsUrl } ) => (
	<header className="pr-appbar">
		<a className="pr-appbar__brand" href="#/widgets">
			{ logoUrl && (
				<img
					className="pr-appbar__mark"
					src={ logoUrl }
					width="28"
					height="28"
					alt=""
				/>
			) }
			<span className="pr-wordmark pr-t-display-sm">ProductReels</span>
			{ version && (
				<span className="pr-version pr-t-caption">v{ version }</span>
			) }
		</a>
		<nav
			className="pr-nav"
			aria-label={ __( 'ProductReels sections', 'productreels' ) }
		>
			{ SECTIONS.map( ( section ) => (
				<a
					key={ section.id }
					href={ section.hash }
					className="pr-navpill pr-t-body-strong"
					aria-current={ current === section.id ? 'page' : undefined }
				>
					<Icon name={ section.icon } size={ 16 } />
					{ section.label }
				</a>
			) ) }
		</nav>
		{ docsUrl && (
			<div className="pr-appbar__end">
				<a
					className="pr-docs pr-t-label"
					href={ docsUrl }
					target="_blank"
					rel="noopener noreferrer"
				>
					{ __( 'Documentation', 'productreels' ) }
					<Icon name="external" size={ 14 } />
					<span className="pr-sr">
						{ __( '(opens in a new tab)', 'productreels' ) }
					</span>
				</a>
			</div>
		) }
	</header>
);
