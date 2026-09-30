/**
 * The app shell.
 *
 * Owns the route, the unsaved-changes gate and the toast stack. Screens below
 * this point are pure: they receive a navigate function and never touch the
 * address bar themselves.
 */

import { useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { boot } from './api';
import { IconExternal } from './components/icons';
import {
	useDocumentTitle,
	useHashRoute,
	useSubmenuHighlight,
} from './hooks/use-hash-route';
import { UnsavedContext } from './hooks/use-unsaved-guard';
import { ConfirmDialog } from './components/ui/Modal';
import { ToastProvider } from './components/ui/Toasts';
import { ReelsLibrary } from './screens/ReelsLibrary';
import { Settings } from './screens/Settings';
import { Statistics } from './screens/Statistics';
import { WidgetEditor } from './screens/WidgetEditor';
import { WidgetsList } from './screens/WidgetsList';

const DOCS_URL = 'https://bestwebexpert.com/productreels';

const BrandMark = () => (
	<svg
		viewBox="0 0 24 24"
		width="18"
		height="18"
		fill="none"
		aria-hidden="true"
		focusable="false"
	>
		<rect
			x="3"
			y="4"
			width="8"
			height="16"
			rx="2"
			stroke="currentColor"
			strokeWidth="1.6"
			opacity=".45"
		/>
		<rect
			x="9"
			y="2"
			width="12"
			height="20"
			rx="2.5"
			fill="currentColor"
			fillOpacity=".15"
			stroke="currentColor"
			strokeWidth="1.6"
		/>
		<path d="M13.5 8.5v7l5.5-3.5-5.5-3.5Z" fill="currentColor" />
	</svg>
);

/**
 * The bar above every list screen: who this is, where you are, where the
 * other sections are. The editor draws its own header and hides this one.
 *
 * @param {Object}   props          Props.
 * @param {Object}   props.route    The current route.
 * @param {Function} props.navigate Hash navigation.
 * @return {Object} The bar.
 */
const AppBar = ( { route, navigate } ) => {
	const tabs = [
		{
			hash: '#/widgets',
			match: [ 'widgets', 'widget-stats' ],
			label: __(
				'All Widgets',
				'productreels'
			),
		},
		{
			hash: '#/reels',
			match: [ 'reels' ],
			label: __(
				'All Reels',
				'productreels'
			),
		},
		{
			hash: '#/settings',
			match: [ 'settings' ],
			label: __(
				'Settings',
				'productreels'
			),
		},
	];

	return (
		<header className="wr-appbar">
			<button
				type="button"
				className="wr-appbar__brand"
				onClick={ () => navigate( '#/widgets' ) }
			>
				<span className="wr-appbar__mark">
					<BrandMark />
				</span>
				<span className="wr-appbar__name">ProductReels</span>
				<span className="wr-appbar__version">v{ boot.version }</span>
			</button>

			<nav
				className="wr-appbar__tabs"
				aria-label={ __(
					'ProductReels sections',
					'productreels'
				) }
			>
				{ tabs.map( ( tab ) => {
					const current = tab.match.includes( route.name );

					return (
						<button
							key={ tab.hash }
							type="button"
							className={ `wr-appbar__tab${
								current ? ' is-current' : ''
							}` }
							aria-current={ current ? 'page' : undefined }
							onClick={ () => navigate( tab.hash ) }
						>
							{ tab.label }
						</button>
					);
				} ) }
			</nav>

			<div className="wr-appbar__links">
				<a
					className="wr-appbar__link"
					href={ DOCS_URL }
					target="_blank"
					rel="noopener noreferrer"
				>
					{ __(
						'Documentation',
						'productreels'
					) }
					<IconExternal size={ 12 } />
				</a>
			</div>
		</header>
	);
};

const Screen = ( { route, navigate } ) => {
	switch ( route.name ) {
		case 'reels':
			return <ReelsLibrary navigate={ navigate } />;

		case 'widget-new':
			return (
				<WidgetEditor key="new" widgetId={ 0 } navigate={ navigate } />
			);

		case 'widget-edit':
			return (
				<WidgetEditor
					key={ route.id }
					widgetId={ route.id }
					navigate={ navigate }
				/>
			);

		case 'widget-stats':
			return (
				<Statistics
					key={ route.id }
					widgetId={ route.id }
					navigate={ navigate }
				/>
			);

		case 'settings':
			return <Settings />;

		case 'widgets':
		default:
			return <WidgetsList navigate={ navigate } />;
	}
};

const App = () => {
	const dirty = useRef( false );
	const [ , setDirtyState ] = useState( false );
	const { route, navigate, pending, leaveAnyway, stayHere } =
		useHashRoute( dirty );

	useSubmenuHighlight( route );
	useDocumentTitle(
		{
			widgets: __(
				'All Widgets',
				'productreels'
			),
			'widget-new': __(
				'Create Widget',
				'productreels'
			),
			'widget-edit': __(
				'Edit Widget',
				'productreels'
			),
			'widget-stats': __(
				'Statistics',
				'productreels'
			),
			reels: __(
				'All Reels',
				'productreels'
			),
			settings: __(
				'Settings',
				'productreels'
			),
		}[ route.name ]
	);

	const unsaved = useMemo(
		() => ( {
			setDirty: ( value ) => {
				dirty.current = value;
				setDirtyState( value );
			},
		} ),
		[]
	);

	// The widget editor has its own header and locks its panes to the
	// viewport, so it drops the app bar and gets a fixed-height shell.
	const isEditor =
		'widget-new' === route.name || 'widget-edit' === route.name;

	return (
		<ToastProvider>
			<UnsavedContext.Provider value={ unsaved }>
				<div
					className={ isEditor ? 'wr-app wr-app--editor' : 'wr-app' }
				>
					{ ! isEditor && (
						<AppBar route={ route } navigate={ navigate } />
					) }
					<Screen route={ route } navigate={ navigate } />
				</div>

				{ pending && (
					<ConfirmDialog
						title={ __(
							'You have unsaved changes. Leave this page without saving?',
							'productreels'
						) }
						confirmLabel={ __(
							'Continue',
							'productreels'
						) }
						tone="primary"
						onConfirm={ leaveAnyway }
						onClose={ stayHere }
					>
						{ __(
							'Anything you have changed since the last save will be lost.',
							'productreels'
						) }
					</ConfirmDialog>
				) }
			</UnsavedContext.Provider>
		</ToastProvider>
	);
};

export default App;
